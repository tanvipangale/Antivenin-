from pathlib import Path
import sys

# Make the project root importable when this script is run directly.
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from config.settings import RAW_DATA, TABLE_NAME, UPLOAD_BATCH_SIZE
from engine.importer import UniversalImporter
from engine.cleaner import HealthcareCleaner
from engine.uploader import SupabaseUploader
from mappings.government import COLUMN_MAPPING


# SETTINGS

SOURCE_NAME = "Government National Hospital Directory"

INPUT_FILE = (
    Path(RAW_DATA)
    / "government"
    / "hospital_directory.csv"
)

TEST_MODE = False
TEST_LIMIT = 100

# MAIN IMPORT PROCESS

def main() -> None:
    print("=" * 60)
    print("ANTIVENIN - GOVERNMENT HOSPITAL IMPORT")
    print("=" * 60)

    # 1. Check input file

    if not INPUT_FILE.exists():
        raise FileNotFoundError(
            f"\nCSV file not found:\n{INPUT_FILE}\n\n"
            "Make sure hospital_directory.csv is inside:\n"
            "data/raw/government/\n"
        )

    print(f"\nInput file:\n{INPUT_FILE}")

    # 2. Create importer

    importer = UniversalImporter(COLUMN_MAPPING)

    print("\nReading CSV...")
    records = importer.process(str(INPUT_FILE))

    print(f"Rows read: {len(records):,}")

    if not records:
        print("No records found. Nothing to upload.")
        return

    # 3. Test mode

    if TEST_MODE:
        print(
            f"\nTEST MODE is ON."
            f"\nOnly the first {TEST_LIMIT} records will be processed."
        )
        records = records[:TEST_LIMIT]

    # 4. Clean records

    print("\nCleaning records...")

    cleaner = HealthcareCleaner(source=SOURCE_NAME)

    cleaned_records = cleaner.clean_many(records)

    print(f"Records after cleaning: {len(cleaned_records):,}")

    if not cleaned_records:
        print("No valid records remain after cleaning.")
        return

    # 5. Show a sample before uploading

    print("\nSample cleaned record:")
    print("-" * 60)

    sample = cleaned_records[0]

    for key, value in sample.items():
        print(f"{key}: {value}")

    print("-" * 60)

    # 6. Upload

    answer = input(
        "\nUpload these records to Supabase? "
        "Type YES to continue: "
    ).strip()

    if answer != "YES":
        print("\nUpload cancelled.")
        return

    print("\nUploading to Supabase...")

    uploader = SupabaseUploader(
        table_name=TABLE_NAME,
        batch_size=UPLOAD_BATCH_SIZE,
    )

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