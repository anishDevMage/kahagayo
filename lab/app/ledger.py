"""Month arithmetic. Everything is integer satang until it leaves the API."""
from __future__ import annotations

import calendar
from collections import defaultdict
from datetime import date


def baht(satang: int) -> float:
    return satang / 100


def month_summary(rows: list[dict], month: str, today: date | None = None) -> dict:
    y, m = (int(p) for p in month.split("-"))
    days = calendar.monthrange(y, m)[1]
    today = today or date.today()
    if (today.year, today.month) == (y, m):
        elapsed = today.day
    elif (today.year, today.month) > (y, m):
        elapsed = days
    else:
        elapsed = 0

    spent = sum(r["amount_satang"] for r in rows if r["type"] == "expense")
    received = sum(r["amount_satang"] for r in rows if r["type"] == "income")
    moved = sum(r["amount_satang"] for r in rows if r["type"] == "transfer")

    by_cat: dict[str, int] = defaultdict(int)
    by_acct: dict[str, int] = defaultdict(int)
    per_day = [0] * days
    for r in rows:
        if r["type"] != "expense":
            continue
        by_cat[r["category"] or "other"] += r["amount_satang"]
        by_acct[r["account"]] += r["amount_satang"]
        per_day[int(r["date"][8:10]) - 1] += r["amount_satang"]

    def ranked(d: dict[str, int]) -> list[dict]:
        return [{"key": k, "baht": baht(v), "share": round(v / spent, 4) if spent else 0}
                for k, v in sorted(d.items(), key=lambda kv: -kv[1])]

    return {
        "month": month,
        "days": days,
        "elapsed": elapsed,
        "spent": baht(spent),
        "received": baht(received),
        "moved_between_accounts": baht(moved),
        "daily_average": round(baht(spent) / elapsed, 2) if elapsed else 0,
        "on_pace_for": round(baht(spent) / elapsed * days) if (elapsed >= 3 and elapsed < days) else None,
        "by_category": ranked(by_cat),
        "by_account": ranked(by_acct),
        "per_day": [baht(v) for v in per_day],
    }
