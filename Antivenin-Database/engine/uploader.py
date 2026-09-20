from typing import (
    Any,
    Dict,
    Iterable,
    List
)

from config.database import supabase

from config.settings import (
    TABLE_NAME,
    UPLOAD_BATCH_SIZE
)

# DATABASE FIELDS

ALLOWED_FIELDS = {

    "source",
    "source_id",

    "name",

    "facility_type",
    "category",
    "medicine_system",

    "address",

    "state",
    "district",
    "subdistrict",
    "town",
    "subtown",
    "village",
    "pincode",

    "latitude",
    "longitude",

    "phone",
    "mobile",
    "emergency_phone",
    "ambulance_phone",
    "bloodbank_phone",
    "tollfree",
    "helpline",

    "email",
    "secondary_email",
    "website",

    "specialties",
    "facilities",
    "accreditation",

    "total_beds",
    "emergency_services",

    "established_year",
    "number_doctors",
    "tariff_range",
}

# UPLOADER

class SupabaseUploader:
    """
    Upload healthcare records to Supabase in batches.

    Uses UPSERT on:
        source + source_id

    Therefore rerunning the same government dataset
    should update existing records instead of creating
    duplicates.
    """

    def __init__(
        self,
        table_name: str = TABLE_NAME,
        batch_size: int = UPLOAD_BATCH_SIZE
    ):

        self.table_name = table_name

        self.batch_size = max(
            1,
            int(batch_size)
        )

    # PREPARE RECORD

    @staticmethod
    def prepare_record(
        record: Dict[str, Any]
    ) -> Dict[str, Any]:

        prepared = {}


        for key, value in record.items():

            if key not in ALLOWED_FIELDS:
                continue

            # Phone-like fields MUST remain strings

            if key in {

                "phone",
                "mobile",
                "emergency_phone",
                "ambulance_phone",
                "bloodbank_phone",
                "tollfree",
                "helpline",
                "pincode",

            }:

                if value is not None:

                    value = str(value)


            prepared[key] = value


        return prepared

    # PREPARE BATCH

    @staticmethod
    def prepare_batch(
        records: List[
            Dict[str, Any]
        ]
    ) -> List[
        Dict[str, Any]
    ]:

        prepared = []


        for record in records:

            row = (
                SupabaseUploader
                .prepare_record(record)
            )

            # Required fields

            if not row.get("source"):
                continue


            if (
                row.get("source_id")
                is None
            ):

                continue


            if not row.get("name"):
                continue


            prepared.append(row)


        return prepared


    # ========================================================
    # UPLOAD ONE BATCH
    # ========================================================

    def upload_batch(
        self,
        records: List[
            Dict[str, Any]
        ]
    ) -> int:

        if not records:
            return 0


        payload = (
            self.prepare_batch(
                records
            )
        )


        if not payload:
            return 0


        response = (

            supabase

            .table(
                self.table_name
            )

            .upsert(
                payload,

                on_conflict=(
                    "source,source_id"
                )
            )

            .execute()

        )


        return len(
            response.data or []
        )

     # UPLOAD ALL

    def upload(
        self,
        records: Iterable[
            Dict[str, Any]
        ]
    ) -> int:

        batch = []

        total_processed = 0


        for record in records:

            batch.append(record)


            if (
                len(batch)
                >= self.batch_size
            ):

                inserted = (
                    self.upload_batch(
                        batch
                    )
                )


                total_processed += inserted


                print(
                    f"Uploaded "
                    f"{total_processed:,} records..."
                )


                batch.clear()


        # Remaining records

        if batch:

            inserted = (
                self.upload_batch(
                    batch
                )
            )


            total_processed += inserted


        return total_processed

# CONVENIENCE FUNCTION

def upload_records(
    records: Iterable[
        Dict[str, Any]
    ],
    table_name: str = TABLE_NAME,
    batch_size: int = UPLOAD_BATCH_SIZE
) -> int:

    uploader = SupabaseUploader(
        table_name=table_name,
        batch_size=batch_size
    )


    return uploader.upload(
        records
    )


# DIRECT EXECUTION

if __name__ == "__main__":

    print(
        "uploader.py is a library module."
    )

    print(
        "Run scripts/import_government.py "
        "to perform an import."
    )