"""
Bulk-import clinics, doctors' offices, and pharmacies from OpenStreetMap
into the same healthcare_facilities table hospitals already live in.

Run once per region you want covered (state-by-state keeps each query
fast and reliable — see AREAS below). Re-run periodically to refresh.

Usage:
    python scripts/import_osm_facilities.py
"""
from pathlib import Path
import sys
import time
import requests

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from config.settings import TABLE_NAME, UPLOAD_BATCH_SIZE
from engine.cleaner import HealthcareCleaner
from engine.uploader import SupabaseUploader

OVERPASS_URL = "https://overpass-api.de/api/interpreter"
AMENITIES = "clinic|doctors|pharmacy|health_centre"

# Add/remove states as needed. Splitting by state keeps each Overpass
# query small enough to reliably finish instead of timing out.
AREAS = {
    "Maharashtra": "Maharashtra",
    # "Karnataka": "Karnataka",
    # "Delhi": "Delhi",
}

TYPE_MAP = {"clinic": "Clinic", "doctors": "Doctor", "pharmacy": "Pharmacy", "health_centre": "Health Centre"}


def fetch_area(area_name: str) -> list[dict]:
    query = f"""
    [out:json][timeout:180];
    area["name"="{area_name}"]["boundary"="administrative"]->.a;
    nwr["amenity"~"{AMENITIES}"](area.a);
    out center tags;
    """
    resp = requests.post(
        OVERPASS_URL,
        data={"data": query},
        headers={"User-Agent": "Antivenin-Database-Importer/1.0 (contact: youremail@example.com)"},
        timeout=200,
    )
    if not resp.ok:
        print(f"Overpass returned {resp.status_code}:\n{resp.text[:500]}")
    resp.raise_for_status()
    return resp.json().get("elements", [])


def to_records(elements: list[dict], area_name: str) -> list[dict]:
    records = []
    for el in elements:
        tags = el.get("tags", {})
        lat = el.get("lat") or el.get("center", {}).get("lat")
        lng = el.get("lon") or el.get("center", {}).get("lon")
        if lat is None or lng is None:
            continue

        address_parts = [
            tags.get("addr:housenumber"), tags.get("addr:street") or tags.get("addr:place"),
            tags.get("addr:suburb"),
            tags.get("addr:city") or tags.get("addr:town") or tags.get("addr:village"),
        ]
        address = ", ".join(filter(None, address_parts)) or tags.get("addr:full")

        phone = tags.get("phone") or tags.get("contact:phone") or tags.get("contact:mobile") or tags.get("mobile")
        if phone:
            phone = phone.split(";")[0].strip()  # OSM sometimes lists multiple numbers separated by ;

        records.append({
            "source": "OpenStreetMap",
            "source_id": f"osm-{el['type']}-{el['id']}",
            "name": tags.get("name", "Unnamed facility"),
            "facility_type": TYPE_MAP.get(tags.get("amenity"), "Clinic"),
            "address": address,
            "state": area_name,
            "district": tags.get("addr:district"),
            "town": tags.get("addr:city") or tags.get("addr:town"),
            "pincode": tags.get("addr:postcode"),
            "latitude": lat,
            "longitude": lng,
            "phone": phone,
            "email": tags.get("email"),
            "website": tags.get("website") or tags.get("contact:website"),
        })
    return records


def main():
    print("=" * 60)
    print("ANTIVENIN - OSM CLINIC/DOCTOR/PHARMACY IMPORT")
    print("=" * 60)

    uploader = SupabaseUploader(table_name=TABLE_NAME, batch_size=UPLOAD_BATCH_SIZE)
    total_inserted = 0

    for area_key, area_name in AREAS.items():
        print(f"\nFetching {area_key} from Overpass...")
        elements = fetch_area(area_name)
        print(f"Raw elements: {len(elements):,}")

        records = to_records(elements, area_key)
        print(f"Records with usable coordinates: {len(records):,}")
        if not records:
            continue

        cleaned = HealthcareCleaner(source="OpenStreetMap").clean_many(records)
        print(f"Records after cleaning: {len(cleaned):,}")

        inserted = uploader.upload(cleaned)
        total_inserted += inserted
        print(f"Inserted for {area_key}: {inserted:,}")

        time.sleep(2)  # be polite to the free public Overpass instance

    print("\n" + "=" * 60)
    print(f"DONE — total records inserted: {total_inserted:,}")
    print("=" * 60)


if __name__ == "__main__":
    main()