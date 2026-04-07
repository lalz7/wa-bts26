from pathlib import Path
import os


BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = Path(
    os.environ.get("WA_BTS26_DATA_DIR", str(BASE_DIR))
).resolve()

STORAGE_DIR = DATA_DIR / "storage"
EXCEL_DIR = STORAGE_DIR / "excel"
INVOICES_DIR = STORAGE_DIR / "invoices"
DATABASE_FILE = DATA_DIR / "database.db"


def ensure_data_dirs():

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    STORAGE_DIR.mkdir(parents=True, exist_ok=True)
    EXCEL_DIR.mkdir(parents=True, exist_ok=True)
    INVOICES_DIR.mkdir(parents=True, exist_ok=True)
