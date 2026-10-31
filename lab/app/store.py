"""SQLite storage for imported transactions."""
from __future__ import annotations

import sqlite3
from pathlib import Path

from .models import Account, Transaction

SCHEMA = """
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, code TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL, time TEXT,
  type TEXT NOT NULL CHECK (type IN ('expense','income','transfer')),
  amount_satang INTEGER NOT NULL CHECK (amount_satang > 0),
  currency TEXT NOT NULL DEFAULT 'THB',
  category TEXT, account TEXT NOT NULL, to_account TEXT,
  note TEXT NOT NULL DEFAULT '', merchant TEXT,
  source TEXT NOT NULL DEFAULT 'manual', raw TEXT, created_at TEXT
);
CREATE INDEX IF NOT EXISTS tx_date ON transactions(date);
"""


class Store:
    def __init__(self, path: str | Path):
        self.path = str(path)
        if self.path != ":memory:":
            Path(self.path).parent.mkdir(parents=True, exist_ok=True)
        self.db = sqlite3.connect(self.path, check_same_thread=False)
        self.db.row_factory = sqlite3.Row
        self.db.executescript(SCHEMA)

    def upsert(self, accounts: list[Account], txns: list[Transaction]) -> int:
        with self.db:
            self.db.executemany(
                "INSERT INTO accounts(id,name,code) VALUES(?,?,?) "
                "ON CONFLICT(id) DO UPDATE SET name=excluded.name, code=excluded.code",
                [(a.id, a.name, a.code) for a in accounts],
            )
            self.db.executemany(
                """INSERT INTO transactions
                   (id,date,time,type,amount_satang,currency,category,account,to_account,note,merchant,source,raw,created_at)
                   VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                   ON CONFLICT(id) DO UPDATE SET date=excluded.date, time=excluded.time, type=excluded.type,
                     amount_satang=excluded.amount_satang, currency=excluded.currency, category=excluded.category,
                     account=excluded.account, to_account=excluded.to_account, note=excluded.note,
                     merchant=excluded.merchant, source=excluded.source, raw=excluded.raw, created_at=excluded.created_at""",
                [
                    (t.id, t.date, t.time, t.type, t.amount_satang, t.currency, t.category, t.account,
                     t.to_account, t.note, t.merchant, t.source, t.raw, t.created_at)
                    for t in txns
                ],
            )
        return len(txns)

    def transactions(self, month: str | None = None) -> list[dict]:
        if month:
            rows = self.db.execute(
                "SELECT * FROM transactions WHERE date LIKE ? ORDER BY date, time", (month + "-%",)
            )
        else:
            rows = self.db.execute("SELECT * FROM transactions ORDER BY date, time")
        return [dict(r) for r in rows]

    def accounts(self) -> list[dict]:
        return [dict(r) for r in self.db.execute("SELECT * FROM accounts ORDER BY id")]

    def count(self) -> int:
        return self.db.execute("SELECT COUNT(*) FROM transactions").fetchone()[0]
