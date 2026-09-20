"""
Import the Rural Health Statistics facility directory
(geocode_health_centre.csv) — Sub-Centres, PHCs, CHCs, Sub-District
Hospitals, District Hospitals — into the same healthcare_facilities
table everything else lives in.

This file has no unique ID column, so source_id is generated here
from a stable hash of (state, district, subdistrict, name, lat, long)
— re-running this script on the same file will upsert, not duplicate.

Usage:
    python scripts/import_rural_health.py
"""

import hashlib
from pathlib import Path
import sys

import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from config.settings import RAW_DATA, TABLE_NAME, UPLOAD_BATCH_SIZE
from engine.cleaner import HealthcareCleaner
from engine.uploader import SupabaseUploader
from mappings.rural_health import FACILITY_TYPE_MAP

# ============================================================
# SETTINGS
# ============================================================

SOURCE_NAME = "Rural Health Statistics (PHC/CHC/Sub-Centre) Directory"

INPUT_FILE = (
    Path(RAW_DATA)
    / "rural_health"
    / "geocode_health_centre.csv"
)

# Set this to True for the first test.
TEST_MODE = False
TEST_LIMIT = 200


def make_source_id(row: pd.Series) -> str:
    """
    Stable ID from fields that shouldn't change between re-downloads.

    Facility Type is included because co-located facilities (e.g. a PHC
    and a Sub-Centre in the same village) can share the same name and
    coordinates — without it, one would silently overwrite the other.
    """
    key = "|".join(
        str(row.get(col, "")).strip().lower()
        for col in [
            "State Name", "District Name", "Subdistrict Name",
            "Facility Name", "Facility Type", "Latitude", "Longitude",
        ]
    )
    return "rhs-" + hashlib.md5(key.encode("utf-8")).hexdigest()[:16]


def build_records(df: pd.DataFrame) -> list[dict]:
    records = []

    for _, row in df.iterrows():
        # Skip the handful of malformed rows (ActiveFlag_C should be "Y")
        if str(row.get("ActiveFlag_C", "")).strip() != "Y":
            continue

        facility_code = str(row.get("Facility Type", "")).strip().lower()
        readable_type = FACILITY_TYPE_MAP.get(facility_code, facility_code or None)

        location_type = row.get("Location Type")
        location_type = None if pd.isna(location_type) else str(location_type).strip()

        # Preserve both the Rural/Urban flag AND the original facility
        # code in "category", since facility_type itself may get
        # further collapsed (e.g. "District Hospital" -> "Hospital")
        # by the cleaner's normalize_facility_type step.
        category_parts = [p for p in [location_type, readable_type] if p]
        category = " — ".join(category_parts) if category_parts else None

        records.append({
            "source": SOURCE_NAME,
            "source_id": make_source_id(row),
            "name": row.get("Facility Name"),
            "facility_type": readable_type,
            "category": category,
            "address": row.get("Facility Address"),
            "state": row.get("State Name"),
            "district": row.get("District Name"),
            "subdistrict": row.get("Subdistrict Name"),
            "latitude": row.get("Latitude"),
            "longitude": row.get("Longitude"),
        })

    return records


def main() -> None:
    print("=" * 60)
    print("ANTIVENIN - RURAL HEALTH CENTRE IMPORT")
    print("=" * 60)

    if not INPUT_FILE.exists():
        raise FileNotFoundError(
            f"\nCSV file not found:\n{INPUT_FILE}\n\n"
            "Make sure geocode_health_centre.csv is inside:\n"
            "data/raw/rural_health/\n"
        )

    print(f"\nInput file:\n{INPUT_FILE}")

    print("\nReading CSV...")
    df = pd.read_csv(INPUT_FILE, low_memory=False)
    print(f"Rows read: {len(df):,}")

    if TEST_MODE:
        print(f"\nTEST MODE is ON. Only the first {TEST_LIMIT} rows will be processed.")
        df = df.head(TEST_LIMIT)

    print("\nBuilding records...")
    records = build_records(df)
    print(f"Records built (after dropping malformed rows): {len(records):,}")

    if not records:
        print("No records found. Nothing to upload.")
        return

    print("\nCleaning records...")
    cleaner = HealthcareCleaner(source=SOURCE_NAME)
    cleaned_records = cleaner.clean_many(records)
    print(f"Records after cleaning: {len(cleaned_records):,}")

    if not cleaned_records:
        print("No valid records remain after cleaning.")
        return

    # Deduplicate by (source, source_id). A handful of rows in the source
    # CSV are exact duplicates (same facility listed twice) — the cleaner
    # correctly gives them identical source_ids, but Postgres's upsert
    # can't touch the same row twice within a single batch, so we drop
    # extras here rather than let the upload fail partway through.
    seen_ids = set()
    deduped_records = []
    for record in cleaned_records:
        key = (record.get("source"), record.get("source_id"))
        if key in seen_ids:
            continue
        seen_ids.add(key)
        deduped_records.append(record)

    duplicates_dropped = len(cleaned_records) - len(deduped_records)
    if duplicates_dropped:
        print(f"Dropped {duplicates_dropped:,} duplicate rows (same facility listed twice in source CSV)")
    cleaned_records = deduped_records

    print("\nSample cleaned record:")
    print("-" * 60)
    for key, value in cleaned_records[0].items():
        print(f"{key}: {value}")
    print("-" * 60)

    answer = input(
        "\nUpload these records to Supabase? "
        "Type YES to continue: "
    ).strip()

    if answer != "YES":
        print("\nUpload cancelled.")
        return

    print("\nUploading to Supabase...")
    uploader = SupabaseUploader(table_name=TABLE_NAME, batch_size=UPLOAD_BATCH_SIZE)
    inserted = uploader.upload(cleaned_records)

    print("\n" + "=" * 60)
    print("IMPORT COMPLETE")
    print("=" * 60)
    print(f"Records processed : {len(cleaned_records):,}")
    print(f"Records inserted  : {inserted:,}")
    print(f"Supabase table    : {TABLE_NAME}")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nImport cancelled by user.")
    except Exception as exc:
        print("\n" + "=" * 60)
        print("IMPORT FAILED")
        print("=" * 60)
        print(f"{type(exc).__name__}: {exc}")
        raise