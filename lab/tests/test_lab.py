"""Run with:  python -m unittest discover -s tests   (from the lab folder)"""
import json
import threading
import unittest
import urllib.request
from datetime import date
from http.server import ThreadingHTTPServer
from pathlib import Path

from app.ledger import month_summary
from app.main import ApiError, handle, make_handler
from app.store import Store

SAMPLE_BYTES = (Path(__file__).parent.parent / "sample-data" / "example-export.json").read_bytes()
SAMPLE = json.loads(SAMPLE_BYTES)


def call(store, method, path, query=None, body=None):
    return handle(store, method, path, query or {}, body)


class LabTests(unittest.TestCase):
    def setUp(self):
        self.store = Store(":memory:")

    def test_import_and_summary(self):
        status, out = call(self.store, "POST", "/import", body=SAMPLE_BYTES)
        self.assertEqual(status, 200)
        self.assertEqual(out["imported"], len(SAMPLE["transactions"]))
        _, s = call(self.store, "GET", "/months/2026-11/summary")
        # 45.50 + 85 + 120 + 389 = 639.50 spent; the 500 top-up is a transfer, not spending
        self.assertEqual(s["spent"], 639.5)
        self.assertEqual(s["received"], 15000)
        self.assertEqual(s["moved_between_accounts"], 500)
        self.assertEqual(s["by_category"][0]["key"], "groceries")

    def test_reimport_is_idempotent(self):
        call(self.store, "POST", "/import", body=SAMPLE_BYTES)
        _, out = call(self.store, "POST", "/import", body=SAMPLE_BYTES)
        self.assertEqual(out["total"], len(SAMPLE["transactions"]))

    def test_rejects_other_formats_and_bad_rows(self):
        with self.assertRaises(ApiError) as e:
            call(self.store, "POST", "/import", body=json.dumps(dict(SAMPLE, format="other")).encode())
        self.assertEqual(e.exception.status, 422)
        bad = dict(SAMPLE, transactions=[dict(SAMPLE["transactions"][0], amount=-5)])
        with self.assertRaises(ApiError):
            call(self.store, "POST", "/import", body=json.dumps(bad).encode())

    def test_graph(self):
        call(self.store, "POST", "/import", body=SAMPLE_BYTES)
        _, rel = call(self.store, "GET", "/graph/related", {"node": ["merchant:7-eleven"]})
        self.assertEqual(rel["transactions"], 1)
        self.assertEqual(rel["baht"], 389)
        self.assertTrue(any(n["id"] == "category:groceries" for n in rel["neighbours"]))
        _, st = call(self.store, "GET", "/graph/stats")
        self.assertEqual(st["edges_by_type"]["TO"], 1)

    def test_pace_needs_three_days(self):
        rows = [{"type": "expense", "amount_satang": 10000, "category": "food", "account": "cash", "date": "2026-11-01"}]
        self.assertIsNone(month_summary(rows, "2026-11", today=date(2026, 11, 2))["on_pace_for"])
        self.assertEqual(month_summary(rows, "2026-11", today=date(2026, 11, 3))["on_pace_for"], 1000)

    def test_http_server_end_to_end(self):
        server = ThreadingHTTPServer(("127.0.0.1", 0), make_handler(self.store))
        threading.Thread(target=server.serve_forever, daemon=True).start()
        base = f"http://127.0.0.1:{server.server_address[1]}"
        try:
            req = urllib.request.Request(base + "/import", data=SAMPLE_BYTES, method="POST",
                                         headers={"Content-Type": "application/json"})
            self.assertEqual(json.load(urllib.request.urlopen(req))["imported"], 6)
            health = json.load(urllib.request.urlopen(base + "/health"))
            self.assertEqual(health["transactions"], 6)
        finally:
            server.shutdown()


if __name__ == "__main__":
    unittest.main()
