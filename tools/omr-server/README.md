# KINS OMR Bridge (oemer)

Wraps [oemer](https://github.com/BreezeWhite/oemer) (MIT) — deep-learning
Optical Music Recognition — behind a tiny HTTP API so the KINS metronome can
turn **PDF sheet music into MusicXML** → exact bar-by-bar cards with
automatic time signatures.

## Why not Vercel?

oemer needs PyTorch + ~350 MB model weights and 30–120 s CPU inference per
page. Vercel serverless caps functions at 250 MB / 60 s — impossible. This
bridge is a long-running container instead.

## Run locally (device-local, nothing leaves your machine)

```powershell
cd tools/omr-server
py -3.10 -m venv .venv
.venv\Scripts\pip install -r requirements.txt
.venv\Scripts\uvicorn server:app --host 127.0.0.1 --port 8787
# first use: warm the model cache (~350 MB download, one time)
curl http://127.0.0.1:8787/warmup
```

The website auto-detects the bridge at `http://localhost:8787` (health check,
1.5 s timeout). With the bridge running, uploaded PDFs get full OMR →
MusicXML → bar cards + automatic per-bar time signatures. Without it, the
site falls back to pixel barline slicing (visual bars only, manual time
signatures).

## Host it (optional — for everyone, not just you)

Any container host works. **Not Vercel serverless.**

| Host | How |
|---|---|
| Fly.io | `fly launch --no-deploy && fly deploy` (needs 2 GB RAM machine) |
| Railway | New service → repo root `tools/omr-server`, Dockerfile auto-detected |
| Render | New Web Service → Docker → root `tools/omr-server` |
| VPS | `docker build -t kins-omr . && docker run -p 8787:8787 kins-omr` |

Then set an env var on the **website** (Vercel project settings):

```
PUBLIC_OMR_BRIDGE_URL=https://your-bridge.example.com
```

Privacy note: a hosted bridge receives uploaded PDFs. Localhost mode keeps
everything on-device — that is the default.

## API

| Endpoint | Description |
|---|---|
| `GET /health` | liveness probe |
| `GET /warmup` | download model weights up front |
| `POST /omr` | multipart `file` (pdf/png/jpg) → `{status, count, pages: [MusicXML strings]}` |

Env knobs: `OMR_TIMEOUT` (s, default 900), `OMR_MAX_PAGES` (default 8),
`PDF_RENDER_SCALE` (default 3.0), `HOST`, `PORT`.
