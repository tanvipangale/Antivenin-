"""Quick report: how many facilities are missing a phone number, by source."""
from pathlib import Path
import sys

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from config.database import supabase
from config.settings import TABLE_NAME

PAGE_SIZE = 1000


def fetch_all_rows():
    """Supabase caps a single response at 1000 rows — page through everything."""
    rows = []
    start = 0
    while True:
        resp = (
            supabase.table(TABLE_NAME)
            .select("source, phone, mobile")
            .range(start, start + PAGE_SIZE - 1)
            .execute()
        )
        batch = resp.data or []
        rows.extend(batch)
        if len(batch) < PAGE_SIZE:
            break
        start += PAGE_SIZE
    return rows


rows = fetch_all_rows()

by_source = {}
for r in rows:
    s = r.get("source") or "Unknown"
    has_phone = bool(r.get("phone") or r.get("mobile"))
    d = by_source.setdefault(s, {"total": 0, "with_phone": 0})
    d["total"] += 1
    d["with_phone"] += has_phone

print(f"Total facilities scanned: {len(rows):,}\n")
print(f"{'Source':<20}{'Total':>10}{'With phone':>14}{'Coverage':>12}")
for source, d in by_source.items():
    pct = d["with_phone"] / d["total"] * 100 if d["total"] else 0
    print(f"{source:<20}{d['total']:>10}{d['with_phone']:>14}{pct:>11.0f}%")