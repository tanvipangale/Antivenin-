import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# ==========================
# SUPABASE CONFIG
# ==========================

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# ==========================
# DIRECTORIES
# ==========================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

RAW_DATA = os.path.join(BASE_DIR, "data", "raw")
PROCESSED_DATA = os.path.join(BASE_DIR, "data", "processed")
EXPORT_DATA = os.path.join(BASE_DIR, "data", "exports")
LOGS = os.path.join(BASE_DIR, "logs")

# ==========================
# BATCH SETTINGS
# ==========================

UPLOAD_BATCH_SIZE = 500

# ==========================
# DEFAULT TABLE
# ==========================

TABLE_NAME = "healthcare_facilities"

# ==========================
# SUPPORTED FILE TYPES
# ==========================

SUPPORTED_FILES = [
    ".csv",
    ".xlsx",
    ".xls"
]