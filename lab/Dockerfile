# Kahagayo lab: standard-library Python, so the image needs no package downloads.
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    KAHAGAYO_DB=/data/kahagayo.db \
    PORT=8000

WORKDIR /srv/lab
COPY app ./app
COPY tests ./tests
COPY sample-data ./sample-data

# Run as a normal user, keep the database on a volume.
RUN useradd --create-home --uid 10001 lab && mkdir -p /data && chown lab:lab /data
USER lab
VOLUME ["/data"]
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/health').status==200 else 1)"

CMD ["python", "-m", "app.main"]
