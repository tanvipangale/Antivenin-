import re
from typing import Any, Dict, Iterable, List, Optional

import pandas as pd

STANDARD_FIELDS = {
    "source", "source_id", "name",
    "facility_type", "category", "medicine_system",
    "address",
    "state", "district", "subdistrict", "town", "subtown", "village", "pincode",
    "latitude", "longitude",
    "phone", "mobile", "emergency_phone", "ambulance_phone", "bloodbank_phone",
    "tollfree", "helpline",
    "email", "secondary_email", "website",
    "specialties", "facilities", "accreditation",
    "total_beds", "emergency_services",
    "established_year", "number_doctors", "tariff_range",
}


class HealthcareCleaner:
    """Cleans standardized healthcare records before uploading them to Supabase."""

    def __init__(self, source: str = "unknown"):
        self.source = source

    # ---- text ----

    @staticmethod
    def clean_text(value: Any) -> Optional[str]:
        if value is None:
            return None
        try:
            if pd.isna(value):
                return None
        except (TypeError, ValueError):
            pass

        text = str(value).strip()
        if text.lower() in {"", "nan", "none", "null", "na", "n/a", "-", "--"}:
            return None
        if text == "0":  # government dataset uses 0 for unavailable TEXT values
            return None

        return re.sub(r"\s+", " ", text) or None

    # ---- phone ----

    @staticmethod
    def clean_phone(value: Any) -> Optional[str]:
        text = HealthcareCleaner.clean_text(value)
        if not text:
            return None

        cleaned_parts = []
        for part in re.split(r"\s*(?:,|;|\||/)\s*", text):
            part = part.strip()
            if not part:
                continue
            plus = part.startswith("+")
            digits = re.sub(r"\D", "", part)
            if not digits or set(digits) == {"0"}:  # skip empty / lone-zero "numbers"
                continue
            cleaned_parts.append(f"+{digits}" if plus else digits)

        return ", ".join(dict.fromkeys(cleaned_parts)) or None  # de-dupe, keep order

    # ---- email / website / pincode ----

    @staticmethod
    def clean_email(value: Any) -> Optional[str]:
        text = HealthcareCleaner.clean_text(value)
        if not text:
            return None
        return re.sub(r"\s*(?:,|;|\|)\s*", ", ", text).lower()

    @staticmethod
    def clean_website(value: Any) -> Optional[str]:
        text = HealthcareCleaner.clean_text(value)
        if not text:
            return None
        lowered = text.lower()
        if lowered.startswith(("http://", "https://")):
            return text
        if lowered.startswith("www."):
            return "https://" + text
        return text

    @staticmethod
    def clean_pincode(value: Any) -> Optional[str]:
        text = HealthcareCleaner.clean_text(value)
        if not text:
            return None
        # Indian PIN = 6 digits, but keep unexpected values rather than
        # silently destroying source information.
        return re.sub(r"\D", "", text) or None

    # ---- coordinates ----

    @staticmethod
    def clean_coordinate(value: Any) -> Optional[float]:
        if value is None:
            return None
        try:
            number = float(str(value).strip())
        except (TypeError, ValueError):
            return None
        return None if pd.isna(number) else number

    @staticmethod
    def split_coordinates(value: Any) -> tuple[Optional[float], Optional[float]]:
        text = HealthcareCleaner.clean_text(value)
        if not text:
            return None, None
        match = re.match(
            r"^\s*([-+]?\d+(?:\.\d+)?)\s*[,;]\s*([-+]?\d+(?:\.\d+)?)\s*$", text
        )
        if not match:
            return None, None
        return (
            HealthcareCleaner.clean_coordinate(match.group(1)),
            HealthcareCleaner.clean_coordinate(match.group(2)),
        )

    # Rough (generous) bounding boxes per state: (min_lat, max_lat, min_lng, max_lng).
    # Deliberately loose — the goal is only to catch coordinates that are
    # wildly wrong (a different state entirely). Add more states as you
    # import their data.
    STATE_BOUNDS = {
        "maharashtra": (15.6, 22.1, 72.6, 80.9),
        "delhi": (28.4, 28.9, 76.8, 77.4),
        "jharkhand": (21.9, 25.4, 83.3, 87.6),
        "karnataka": (11.5, 18.5, 74.0, 78.6),
        "tamil nadu": (8.0, 13.6, 76.2, 80.4),
        "gujarat": (20.1, 24.7, 68.1, 74.5),
        "west bengal": (21.5, 27.3, 85.8, 89.9),
        "uttar pradesh": (23.8, 30.5, 77.0, 84.7),
        "rajasthan": (23.0, 30.2, 69.5, 78.3),
        "kerala": (8.2, 12.8, 74.8, 77.5),
        "punjab": (29.5, 32.5, 73.8, 76.9),
        "telangana": (15.8, 19.9, 77.2, 81.3),
        "andhra pradesh": (12.6, 19.9, 76.7, 84.8),
        "bihar": (24.3, 27.5, 83.3, 88.1),
        "madhya pradesh": (21.0, 26.9, 74.0, 82.8),
        "haryana": (27.6, 30.9, 74.5, 77.6),
        "odisha": (17.8, 22.6, 81.3, 87.5),
        "assam": (24.1, 28.2, 89.7, 96.0),
        "chhattisgarh": (17.8, 24.1, 80.2, 84.4),
        "uttarakhand": (28.7, 31.5, 77.5, 81.1),
        "jammu and kashmir": (32.3, 37.1, 73.7, 80.3),
        "himachal pradesh": (30.4, 33.3, 75.6, 79.1),
        "goa": (14.9, 15.8, 73.7, 74.3),
    }

    # Real values found in Hospital_Care_Type: mostly '0' (93% of rows —
    # this file IS a hospital directory, most entries just never had a
    # sub-type filled in), plus a handful of genuine variants.
    FACILITY_TYPE_ALIASES = {
        "0": "Hospital",
        "hospital": "Hospital",
        "nursing home": "Hospital",
        "dispensary": "Health Centre",
        "community health centre": "Health Centre",
        "primary health centre": "Health Centre",
        "clinic": "Clinic",
        "poly clinic": "Clinic",
    }

    @classmethod
    def normalize_facility_type(cls, value: Optional[str], source: Optional[str]) -> Optional[str]:
        is_hospital_directory = source == "Government National Hospital Directory"
        if not value:
            return "Hospital" if is_hospital_directory else value

        key = value.strip().lower()
        if key in cls.FACILITY_TYPE_ALIASES:
            return cls.FACILITY_TYPE_ALIASES[key]

        # Combined values like "Medical College / Institute, Hospital" or
        # "Hospital, Clinic" — if "hospital" appears anywhere, it's a hospital.
        if "hospital" in key or "medical college" in key:
            return "Hospital"
        if "clinic" in key:
            return "Clinic"
        if "centre" in key or "center" in key:
            return "Health Centre"
        return "Hospital" if is_hospital_directory else value

    @classmethod
    def coordinates_match_state(cls, latitude: float, longitude: float, state: Optional[str]) -> bool:
        if not state:
            return True  # no state to check against — let it through
        bounds = cls.STATE_BOUNDS.get(state.strip().lower())
        if not bounds:
            return True  # state not in our list yet — don't reject, just skip the check
        min_lat, max_lat, min_lng, max_lng = bounds
        return min_lat <= latitude <= max_lat and min_lng <= longitude <= max_lng

    @staticmethod
    def validate_coordinates(
        latitude: Optional[float], longitude: Optional[float]
    ) -> tuple[Optional[float], Optional[float]]:
        if latitude is None or longitude is None:
            return None, None
        if not (-90 <= latitude <= 90) or not (-180 <= longitude <= 180):
            return None, None
        return latitude, longitude

    # ---- integers ----

    @staticmethod
    def clean_integer(value: Any) -> Optional[int]:
        text = HealthcareCleaner.clean_text(value)
        if not text:
            return None
        match = re.search(r"-?\d+(?:\.\d+)?", text)
        if not match:
            return None
        try:
            return int(float(match.group(0)))
        except ValueError:
            return None

    @staticmethod
    def clean_bounded_integer(value: Any, min_value: int, max_value: int) -> Optional[int]:
        """clean_integer(), then reject the result if it falls outside a
        sane range (protects against corrupted source data)."""
        number = HealthcareCleaner.clean_integer(value)
        if number is not None and not (min_value <= number <= max_value):
            return None
        return number

    # ---- emergency services ----

    @staticmethod
    def normalize_emergency(value: Any) -> Optional[str]:
        text = HealthcareCleaner.clean_text(value)
        if not text:
            return None
        lowered = text.lower()
        if lowered in {"yes", "y", "true", "1", "available", "24x7", "24/7"}:
            return "Yes"
        if lowered in {"no", "n", "false", "0", "not available"}:
            return "No"
        return text

    # ---- one record ----

    def clean_record(self, record: Dict[str, Any]) -> Dict[str, Any]:
        # Keep only database fields
        cleaned = {
            key: self.clean_text(value)
            for key, value in record.items()
            if key in STANDARD_FIELDS
        }

        cleaned["source"] = self.clean_text(cleaned.get("source")) or self.source
        cleaned["name"] = self.clean_text(cleaned.get("name"))

        text_fields = [
            "facility_type", "category", "medicine_system",
            "address", "location",
            "state", "district", "subdistrict", "town", "subtown", "village",
            "specialties", "facilities", "accreditation",
        ]
        for field in text_fields:
            cleaned[field] = self.clean_text(cleaned.get(field))

        cleaned["facility_type"] = self.normalize_facility_type(cleaned.get("facility_type"), self.source)

        phone_fields = [
            "phone", "mobile", "emergency_phone", "ambulance_phone",
            "bloodbank_phone", "tollfree", "helpline",
        ]
        for field in phone_fields:
            cleaned[field] = self.clean_phone(cleaned.get(field))

        cleaned["email"] = self.clean_email(cleaned.get("email"))
        cleaned["secondary_email"] = self.clean_email(cleaned.get("secondary_email"))
        cleaned["website"] = self.clean_website(cleaned.get("website"))
        cleaned["pincode"] = self.clean_pincode(cleaned.get("pincode"))

        # ----- coordinates -----
        latitude = self.clean_coordinate(cleaned.get("latitude"))
        longitude = self.clean_coordinate(cleaned.get("longitude"))
        if latitude is None or longitude is None:
            # importer didn't produce coordinates — try the original raw value
            latitude, longitude = self.split_coordinates(record.get("Location_Coordinates"))
        latitude, longitude = self.validate_coordinates(latitude, longitude)

        # Reject coordinates that don't plausibly match the row's own
        # claimed state (e.g. a "Delhi" address with Mumbai-area
        # coordinates) — better to have no coordinates than a wrong one
        # that quietly shows up as "9 km away" when it's actually 1000+.
        if latitude is not None and longitude is not None:
            if not self.coordinates_match_state(latitude, longitude, cleaned.get("state")):
                latitude, longitude = None, None
        cleaned["latitude"] = latitude
        cleaned["longitude"] = longitude

        # ----- bounded numeric fields -----
        cleaned["total_beds"] = self.clean_bounded_integer(cleaned.get("total_beds"), 0, 100_000)
        cleaned["established_year"] = self.clean_bounded_integer(cleaned.get("established_year"), 1800, 2100)
        cleaned["number_doctors"] = self.clean_bounded_integer(cleaned.get("number_doctors"), 0, 100_000)

        cleaned["emergency_services"] = self.normalize_emergency(cleaned.get("emergency_services"))

        # Source ID kept as text because it may not always be numeric across datasets.
        cleaned["source_id"] = self.clean_text(cleaned.get("source_id"))

        return cleaned

    def clean_many(
        self, records: Iterable[Dict[str, Any]], remove_empty_names: bool = True
    ) -> List[Dict[str, Any]]:
        cleaned_records = []
        for record in records:
            cleaned = self.clean_record(record)
            if remove_empty_names and not cleaned.get("name"):
                continue
            cleaned_records.append(cleaned)
        return cleaned_records
    