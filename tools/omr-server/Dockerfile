FROM python:3.10-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       libglib2.0-0 libgl1 libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY server.py .

ENV HOST=0.0.0.0 \
    PORT=8787 \
    OMR_TIMEOUT=900 \
    OMR_MAX_PAGES=8

EXPOSE 8787

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8787"]
