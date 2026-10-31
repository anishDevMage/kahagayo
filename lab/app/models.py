"""Validates a Kahagayo export. Standard library only.

Money is kept as integer satang (1 baht = 100 satang) so sums never drift.
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any, Optional

DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
TYPES = ("expense", "income", "transfer")
FORMATS = ("kahagayo", "baht-book")  # "baht-book" = exports made before the rename


class InvalidExport(ValueError):
    pass


@dataclass
class Account:
    id: str
    name: str
    code: str = ""


@dataclass
class Transaction:
    id: str
    date: str
    type: str
    amount_satang: int
    account: str
    time: Optional[str] = None
    currency: str = "THB"
    category: Optional[str] = None
    to_account: Optional[str] = None
    note: str = ""
    merchant: Optional[str] = None
    source: str = "manual"
    raw: Optional[str] = None
    created_at: Optional[str] = None


def _str(d: dict, key: str, required: bool = False) -> Optional[str]:
    v = d.get(key)
    if v is None or v == "":
        if required:
            raise InvalidExport(f"missing {key}")
        return None
    if not isinstance(v, str):
        raise InvalidExport(f"{key} must be text")
    return v


def parse_transaction(d: Any, i: int) -> Transaction:
    if not isinstance(d, dict):
        raise InvalidExport(f"transaction {i} is not an object")
    try:
        tid = _str(d, "id", True)
        date = _str(d, "date", True)
        if not DATE_RE.match(date):
            raise InvalidExport("date must be YYYY-MM-DD")
        ttype = _str(d, "type", True)
        if ttype not in TYPES:
            raise InvalidExport("type must be expense, income or transfer")
        amount = d.get("amount")
        if isinstance(amount, bool) or not isinstance(amount, (int, float)) or amount <= 0:
            raise InvalidExport("amount must be a number above zero")
        return Transaction(
            id=tid, date=date, type=ttype, amount_satang=int(round(amount * 100)),
            account=_str(d, "account", True), time=_str(d, "time"),
            currency=_str(d, "currency") or "THB", category=_str(d, "category"),
            to_account=_str(d, "toAccount"), note=_str(d, "note") or "",
            merchant=_str(d, "merchant"), source=_str(d, "source") or "manual",
            raw=_str(d, "raw"), created_at=_str(d, "createdAt"),
        )
    except InvalidExport as e:
        raise InvalidExport(f"transaction {i}: {e}") from None


def parse_export(doc: Any) -> tuple[list[Account], list[Transaction]]:
    if not isinstance(doc, dict):
        raise InvalidExport("the file must be a JSON object")
    if doc.get("format") not in FORMATS:
        raise InvalidExport("not a Kahagayo export (format must be \"kahagayo\")")
    txs = doc.get("transactions")
    if not isinstance(txs, list):
        raise InvalidExport("transactions must be a list")
    accounts = []
    for a in doc.get("accounts") or []:
        if isinstance(a, dict) and a.get("id") and a.get("name"):
            accounts.append(Account(id=str(a["id"]), name=str(a["name"]), code=str(a.get("code") or "")))
    return accounts, [parse_transaction(t, i) for i, t in enumerate(txs)]
