import math
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
DEFAULT_DATABASE = f"sqlite:///{BASE_DIR / 'wina_bwangu.db'}"
DEFAULT_CORS_ORIGINS = (
    "http://localhost:5500,http://127.0.0.1:5500,"
    "http://localhost:8080,http://127.0.0.1:8080,"
    "http://localhost:8000,http://127.0.0.1:8000,null"
)


def _tax_rate_from_env():
    raw_value = os.environ.get("TAX_RATE", "0.10")
    try:
        value = float(raw_value)
    except ValueError as exc:
        raise ValueError("TAX_RATE must be a number between 0 and 1") from exc
    if not math.isfinite(value) or not 0 <= value <= 1:
        raise ValueError("TAX_RATE must be a number between 0 and 1")
    return value


class Config:
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL", DEFAULT_DATABASE)
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    TAX_RATE = _tax_rate_from_env()
    CORS_ORIGINS = [
        origin.strip()
        for origin in os.environ.get("CORS_ORIGINS", DEFAULT_CORS_ORIGINS).split(",")
        if origin.strip()
    ]
