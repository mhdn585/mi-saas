import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
INSTANCE_DIR = BASE_DIR / "instance"
MEDIA_DIR = BASE_DIR / "media"

APP_NAME = "CreaTienda"
DEFAULT_CURRENCY = "USD"
LOW_STOCK_THRESHOLD = 5

# Auth: límites de contraseña compartidos por config y schemas.
PASSWORD_MIN_LENGTH = 8
# bcrypt solo consume los primeros 72 bytes: límite explícito.
PASSWORD_MAX_LENGTH = 72

CURRENCIES = [
    "USD",
    "EUR",
    "MXN",
    "COP",
    "ARS",
    "CLP",
    "PEN",
    "BOB",
    "UYU",
    "VES",
    "DOP",
    "CRC",
    "GTQ",
    "PAB",
]


def _resolve_db_url(raw: str) -> str:
    """Resolve relative SQLite paths against BASE_DIR so the app is CWD-independent."""
    prefix = "sqlite:///"
    if raw.startswith(prefix) and not raw.startswith("sqlite:////"):
        relative = raw[len(prefix):]
        if relative not in ("", ":memory:"):
            absolute = (BASE_DIR / relative).resolve()
            absolute.parent.mkdir(parents=True, exist_ok=True)
            return f"sqlite:///{absolute}"
    return raw


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me")
    SQLALCHEMY_DATABASE_URI = _resolve_db_url(
        os.environ.get("DATABASE_URL", f"sqlite:///{INSTANCE_DIR / 'app.db'}")
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}
    FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "http://127.0.0.1:5173")
    MEDIA_FOLDER = os.environ.get("MEDIA_FOLDER", str(MEDIA_DIR))
    MAX_UPLOAD_MB = int(os.environ.get("MAX_UPLOAD_MB", "5"))
    MAX_CONTENT_LENGTH = (MAX_UPLOAD_MB + 5) * 1024 * 1024
    JSON_AS_ASCII = False
    # Auth
    BCRYPT_COST = int(os.environ.get("BCRYPT_COST", "12"))
    JWT_EXPIRES_HOURS = int(os.environ.get("JWT_EXPIRES_HOURS", "168"))
    PASSWORD_MIN_LENGTH = 8
    PASSWORD_MAX_LENGTH = 72  # bcrypt ignora bytes más allá de 72


class DevConfig(Config):
    DEBUG = True
    ENV = "development"


class ProdConfig(Config):
    DEBUG = False
    ENV = "production"
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_size": 5,
        "max_overflow": 10,
    }


class TestConfig(Config):
    TESTING = True
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get("TEST_DATABASE_URL", "")
    SQLALCHEMY_ENGINE_OPTIONS = {}
    MAX_CONTENT_LENGTH = None
    MEDIA_FOLDER = str(BASE_DIR / "instance" / "media_test")
