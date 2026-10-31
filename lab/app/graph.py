"""Builds the spending graph from structured fields only (no LLM calls).

Nodes: tx, merchant, category, account, day, week, month.
Edges: PAID_TO, IN_CATEGORY, FROM, TO, ON, IN_WEEK, IN_MONTH.
WITH / PART_OF / CONTAINS (people, events, receipt items) come later and need an LLM.
"""
from __future__ import annotations

import re
from collections import Counter, defaultdict
from datetime import date


def _slug(s: str) -> str:
    s = re.sub(r"[^\w]+", "-", s.strip().lower(), flags=re.UNICODE).strip("-")
    return s or "unknown"


def merchant_of(row: dict) -> str | None:
    if row.get("merchant"):
        return row["merchant"].strip()
    note = (row.get("note") or "").strip()
    if not note or row["type"] == "transfer":
        return None
    # "7-Eleven: milk, eggs" -> "7-Eleven"
    return note.split(":")[0].strip() or None


def build_graph(rows: list[dict]) -> dict:
    nodes: dict[str, dict] = {}
    edges: list[dict] = []

    def node(nid: str, ntype: str, label: str) -> str:
        nodes.setdefault(nid, {"id": nid, "type": ntype, "label": label})
        return nid

    def edge(src: str, dst: str, etype: str, tx: str, satang: int) -> None:
        edges.append({"source": src, "target": dst, "type": etype, "tx": tx, "baht": satang / 100})

    for r in rows:
        tx = node("tx:" + r["id"], "tx", f'{r["note"] or r["type"]} {r["amount_satang"] / 100:g}')
        amt = r["amount_satang"]
        d = date.fromisoformat(r["date"])
        day = node("day:" + r["date"], "day", r["date"])
        iso = d.isocalendar()
        week = node(f"week:{iso.year}-W{iso.week:02d}", "week", f"{iso.year}-W{iso.week:02d}")
        month = node("month:" + r["date"][:7], "month", r["date"][:7])
        edge(tx, day, "ON", r["id"], amt)
        edge(day, week, "IN_WEEK", r["id"], amt)
        edge(day, month, "IN_MONTH", r["id"], amt)
        edge(tx, node("account:" + r["account"], "account", r["account"]), "FROM", r["id"], amt)
        if r["type"] == "transfer":
            if r.get("to_account"):
                edge(tx, node("account:" + r["to_account"], "account", r["to_account"]), "TO", r["id"], amt)
            continue
        if r.get("category"):
            edge(tx, node("category:" + r["category"], "category", r["category"]), "IN_CATEGORY", r["id"], amt)
        m = merchant_of(r)
        if m:
            edge(tx, node("merchant:" + _slug(m), "merchant", m), "PAID_TO", r["id"], amt)

    # The day/week/month edges repeat per transaction; keep one of each.
    seen, unique = set(), []
    for e in edges:
        key = (e["source"], e["target"], e["type"]) if e["type"] in ("IN_WEEK", "IN_MONTH") else None
        if key and key in seen:
            continue
        if key:
            seen.add(key)
        unique.append(e)
    return {"nodes": list(nodes.values()), "edges": unique}


def related(graph: dict, node_id: str) -> dict:
    """What a merchant, category or account connects to: the 'local search' starting point."""
    tx_ids = {e["source"] for e in graph["edges"] if e["target"] == node_id and e["source"].startswith("tx:")}
    if not tx_ids:
        return {"node": node_id, "transactions": 0, "baht": 0, "neighbours": []}
    total = sum(e["baht"] for e in graph["edges"] if e["target"] == node_id and e["source"] in tx_ids)
    neigh: dict[str, float] = defaultdict(float)
    for e in graph["edges"]:
        if e["source"] in tx_ids and e["target"] != node_id and e["type"] in ("PAID_TO", "IN_CATEGORY", "FROM", "ON"):
            neigh[e["target"]] += e["baht"]
    labels = {n["id"]: n for n in graph["nodes"]}
    ranked = sorted(neigh.items(), key=lambda kv: -kv[1])[:15]
    return {
        "node": node_id,
        "transactions": len(tx_ids),
        "baht": round(total, 2),
        "neighbours": [{"id": k, "type": labels[k]["type"], "label": labels[k]["label"], "baht": round(v, 2)} for k, v in ranked],
    }


def stats(graph: dict) -> dict:
    return {
        "nodes": len(graph["nodes"]),
        "edges": len(graph["edges"]),
        "nodes_by_type": dict(Counter(n["type"] for n in graph["nodes"])),
        "edges_by_type": dict(Counter(e["type"] for e in graph["edges"])),
    }
