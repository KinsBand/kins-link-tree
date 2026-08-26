"""KINS OMR bridge — wraps BreezeWhite/oemer (MIT) behind a tiny HTTP API.

Local-first: bind to 127.0.0.1 by default so sheet files never leave the
machine. For a hosted deployment (Fly.io / Railway / Render / VPS), set
HOST=0.0.0.0 and put it behind TLS; the site then points PUBLIC_OMR_BRIDGE_URL
at it.

Endpoints:
  GET  /health  -> liveness probe (used by the website to detect the bridge)
  POST /omr     -> multipart file (pdf/png/jpg) => {"status","pages":[MusicXML]}
  GET  /warmup  -> forces model weights download (~350 MB, first run only)
"""

import io
import os
import shutil
import subprocess
import sys
import tempfile

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

OMR_TIMEOUT = int(os.environ.get("OMR_TIMEOUT", "900"))
OMR_MAX_PAGES = int(os.environ.get("OMR_MAX_PAGES", "8"))
PDF_RENDER_SCALE = float(os.environ.get("PDF_RENDER_SCALE", "3.0"))

app = FastAPI(title="KINS OMR bridge", docs_url=None, redoc_url=None)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


def _omr_command():
    bin_path = shutil.which("oemer")
    if bin_path:
        return [bin_path]
    return [sys.executable, "-m", "oemer"]


def _run_omr(input_path: str, out_dir: str) -> None:
    cmd = _omr_command() + ["-o", out_dir, input_path]
    proc = subprocess.run(cmd, capture_output=True, text=True, timeout=OMR_TIMEOUT)
    if proc.returncode != 0:
        tail = (proc.stderr or proc.stdout or "oemer failed").strip()[-800:]
        raise RuntimeError(tail)


def _collect_xml(out_dir: str):
    import glob

    files = sorted(glob.glob(os.path.join(out_dir, "*.xml")))
    pages = []
    for path in files:
        with open(path, "r", encoding="utf-8", errors="replace") as fh:
            pages.append(fh.read())
    return pages


def _pdf_to_pngs(data: bytes, td: str):
    import pypdfium2 as pdfium

    pdf = pdfium.PdfDocument(io.BytesIO(data))
    count = min(len(pdf), OMR_MAX_PAGES)
    paths = []
    for i in range(count):
        page = pdf[i]
        bitmap = page.render(scale=PDF_RENDER_SCALE)
        pil = bitmap.to_pil()
        path = os.path.join(td, f"page-{i:02d}.png")
        pil.save(path)
        paths.append(path)
    return paths


@app.get("/health")
def health():
    return {"status": "ok", "engine": "oemer"}


@app.get("/warmup")
def warmup():
    """Force model weights download so the first real request is fast."""
    try:
        from PIL import Image

        with tempfile.TemporaryDirectory() as td:
            img = os.path.join(td, "warmup.png")
            Image.new("RGB", (400, 600), "white").save(img)
            _run_omr(img, os.path.join(td, "out"))
    except Exception as exc:  # noqa: BLE001
        return JSONResponse({"status": "error", "message": str(exc)[-500:]}, status_code=500)
    return {"status": "ok", "message": "models downloaded"}


@app.post("/omr")
async def omr(file: UploadFile = File(...)):
    data = await file.read()
    if not data:
        return JSONResponse({"status": "error", "message": "empty file"}, status_code=400)

    name = (file.filename or "").lower()
    is_pdf = name.endswith(".pdf") or data[:4] == b"%PDF"

    with tempfile.TemporaryDirectory() as td:
        inputs = []
        if is_pdf:
            try:
                inputs = _pdf_to_pngs(data, td)
            except Exception as exc:  # noqa: BLE001
                return JSONResponse({"status": "error", "message": f"pdf render failed: {exc}"}, status_code=400)
            if not inputs:
                return JSONResponse({"status": "error", "message": "no readable pages"}, status_code=400)
        else:
            ext = ".png"
            for candidate in (".png", ".jpg", ".jpeg"):
                if name.endswith(candidate):
                    ext = candidate
                    break
            src = os.path.join(td, f"input{ext}")
            with open(src, "wb") as fh:
                fh.write(data)
            inputs = [src]

        pages = []
        try:
            for input_path in inputs:
                out_dir = os.path.join(td, "out-" + os.path.basename(input_path))
                os.makedirs(out_dir, exist_ok=True)
                _run_omr(input_path, out_dir)
                pages.extend(_collect_xml(out_dir))
        except subprocess.TimeoutExpired:
            return JSONResponse({"status": "error", "message": "OMR timed out"}, status_code=504)
        except RuntimeError as exc:
            return JSONResponse({"status": "error", "message": str(exc)}, status_code=500)

        if not pages:
            return JSONResponse(
                {"status": "error", "message": "oemer produced no MusicXML — is this readable sheet music?"},
                status_code=422,
            )
        return {"status": "success", "count": len(pages), "pages": pages}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=os.environ.get("HOST", "127.0.0.1"), port=int(os.environ.get("PORT", "8787")))
