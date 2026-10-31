"""Kahagayo lab: a small JSON API for trying ledger and graph queries on your laptop.

Standard library only, so it runs anywhere Python 3.11+ runs.

  python -m app.main                 # http://localhost:8000
  docker compose up lab              # same, in a container

Endpoints
  GET  /health
  POST /import                       body: a Kahagayo JSON export
  GET  /transactions?month=2026-11
  GET  /months/2026-11/summary
  GET  /graph/stats?month=2026-11
  GET  /graph/related?node=merchant:7-eleven
"""
from __future__ import annotations

import json
import os
import re
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

from . import graph as g
from .ledger import month_summary
from .models import InvalidExport, parse_export
from .store import Store

MONTH_RE = re.compile(r"^\d{4}-\d{2}$")
MAX_BODY = 20 * 1024 * 1024


class ApiError(Exception):
    def __init__(self, status: int, message: str):
        super().__init__(message)
        self.status = status


def handle(store: Store, method: str, path: str, query: dict, body: bytes | None) -> tuple[int, object]:
    """Pure request router: easy to test without a socket."""
    month = (query.get("month") or [None])[0]
    if month is not None and not MONTH_RE.match(month):
        raise ApiError(400, "Use a month like 2026-11.")

    if method == "GET" and path == "/health":
        return 200, {"ok": True, "transactions": store.count()}

    if method == "POST" and path == "/import":
        try:
            doc = json.loads(body or b"")
        except json.JSONDecodeError:
            raise ApiError(400, "The body must be JSON.")
        try:
            accounts, txns = parse_export(doc)
        except InvalidExport as e:
            raise ApiError(422, str(e))
        n = store.upsert(accounts, txns)
        return 200, {"imported": n, "total": store.count()}

    if method == "GET" and path == "/transactions":
        return 200, store.transactions(month)

    m = re.fullmatch(r"/months/([^/]+)/summary", path)
    if method == "GET" and m:
        if not MONTH_RE.match(m.group(1)):
            raise ApiError(400, "Use a month like 2026-11.")
        return 200, month_summary(store.transactions(m.group(1)), m.group(1))

    if method == "GET" and path == "/graph/stats":
        return 200, g.stats(g.build_graph(store.transactions(month)))

    if method == "GET" and path == "/graph/related":
        node = (query.get("node") or [""])[0]
        if not node:
            raise ApiError(400, "Pass ?node=, for example merchant:7-eleven or category:food.")
        return 200, g.related(g.build_graph(store.transactions(month)), node)

    raise ApiError(404, "No such endpoint. Try GET /health.")


def make_handler(store: Store):
    class Handler(BaseHTTPRequestHandler):
        server_version = "KahagayoLab/0.1"

        def _go(self, method: str) -> None:
            url = urlparse(self.path)
            body = None
            if method == "POST":
                length = int(self.headers.get("Content-Length") or 0)
                if length > MAX_BODY:
                    return self._send(413, {"error": "The file is larger than 20 MB."})
                body = self.rfile.read(length)
            try:
                status, payload = handle(store, method, url.path.rstrip("/") or "/", parse_qs(url.query), body)
            except ApiError as e:
                status, payload = e.status, {"error": str(e)}
            self._send(status, payload)

        def _send(self, status: int, payload: object) -> None:
            data = json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)

        def do_GET(self) -> None:  # noqa: N802
            self._go("GET")

        def do_POST(self) -> None:  # noqa: N802
            self._go("POST")

    return Handler


def main() -> None:
    store = Store(os.environ.get("KAHAGAYO_DB", "data/kahagayo.db"))
    port = int(os.environ.get("PORT", "8000"))
    server = ThreadingHTTPServer(("0.0.0.0", port), make_handler(store))
    print(f"Kahagayo lab on http://localhost:{port}  (database: {store.path})", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
