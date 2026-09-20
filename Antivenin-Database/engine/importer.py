import pandas as pd

from pathlib import Path
from typing import Dict, List

from config.settings import SUPPORTED_FILES


class UniversalImporter:
    """
    Universal importer for healthcare datasets.

    Responsibilities:
    - Load CSV/XLS/XLSX
    - Normalize column names
    - Clean basic missing values
    - Extract latitude/longitude
    - Convert numeric coordinate values
    """

    def __init__(
        self,
        mapping: Dict[str, str]
    ):

        self.mapping = {
            key.lower().strip(): value
            for key, value in mapping.items()
        }


    # LOAD

    def load(
        self,
        filepath: str
    ) -> pd.DataFrame:

        path = Path(filepath)

        if not path.exists():

            raise FileNotFoundError(
                f"File not found: {filepath}"
            )


        extension = path.suffix.lower()

        if extension not in SUPPORTED_FILES:

            raise ValueError(
                f"Unsupported file type: {extension}"
            )


        print(
            f"Loading file: {path.name}"
        )


        # CSV

        if extension == ".csv":

            try:

                df = pd.read_csv(
                    path,
                    encoding="utf-8-sig",
                    low_memory=False
                )

            except UnicodeDecodeError:

                print(
                    "UTF-8 decoding failed. "
                    "Trying latin-1..."
                )

                df = pd.read_csv(
                    path,
                    encoding="latin-1",
                    low_memory=False
                )

        # Excel

        else:

            df = pd.read_excel(path)


        print(
            f"Rows loaded: {len(df):,}"
        )

        print(
            f"Columns found: {len(df.columns)}"
        )


        return df

    # NORMALIZE COLUMNS

    def normalize_columns(
        self,
        df: pd.DataFrame
    ) -> pd.DataFrame:

        rename = {}


        for column in df.columns:

            clean = (
                str(column)
                .strip()
                .lower()
            )


            if clean in self.mapping:

                rename[column] = (
                    self.mapping[clean]
                )


        return df.rename(
            columns=rename
        )

    # CLEAN VALUE

    @staticmethod
    def clean_value(value):

        if value is None:
            return None


        try:

            if pd.isna(value):
                return None

        except (TypeError, ValueError):

            pass


        value = str(value).strip()


        if not value:
            return None


        # Government dataset uses these to represent unavailable data.

        if value.lower() in {
            "na",
            "n/a",
            "nan",
            "null",
            "none",
            "not available",
            "-",
            "--"
        }:

            return None

        return value

    # SPLIT COORDINATES

    @staticmethod
    def split_coordinates(
        value
    ):

        if value is None:
            return None, None


        try:

            text = str(value).strip()


            if not text:
                return None, None


            parts = text.split(",")


            if len(parts) != 2:
                return None, None


            latitude = float(
                parts[0].strip()
            )

            longitude = float(
                parts[1].strip()
            )


            # Global coordinate validation

            if not (
                -90 <= latitude <= 90
                and
                -180 <= longitude <= 180
            ):

                return None, None


            return latitude, longitude


        except (
            ValueError,
            TypeError
        ):

            return None, None

    # PROCESS

    def process(
        self,
        filepath: str
    ) -> List[dict]:

        df = self.load(filepath)


        df = self.normalize_columns(df)


        records = []


        print(
            "\nProcessing records..."
        )


        for index, row in df.iterrows():

            record = {}

            # Clean mapped columns

            for column in df.columns:

                record[column] = (
                    self.clean_value(
                        row[column]
                    )
                )

            # Coordinates

            coordinate_value = (
                record.get(
                    "Location_Coordinates"
                )
            )


            latitude, longitude = (
                self.split_coordinates(
                    coordinate_value
                )
            )


            record["latitude"] = latitude
            record["longitude"] = longitude

            # Source

            record["source"] = (
                "Government National Hospital Directory"
            )


            records.append(record)

            # Progress

            if (
                len(records) % 5000 == 0
            ):

                print(
                    f"Processed "
                    f"{len(records):,} records..."
                )


        print(
            f"Finished processing "
            f"{len(records):,} records."
        )


        return records

# TEST

if __name__ == "__main__":

    from mappings.government import (
        COLUMN_MAPPING
    )


    importer = UniversalImporter(
        COLUMN_MAPPING
    )


    data = importer.process(
        "data/raw/government/hospital_directory.csv"
    )


    print(
        f"\nImported {len(data):,} records"
    )


    if data:

        print(
            "\nFirst record:"
        )

        for key, value in data[0].items():

            print(
                f"{key}: {value}"
            )