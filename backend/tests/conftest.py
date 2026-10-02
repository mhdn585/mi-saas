import os
import uuid
from pathlib import Path

import pytest
from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BACKEND_DIR / ".env")

from alembic import command  # noqa: E402
from alembic.config import Config as AlembicConfig  # noqa: E402
from sqlalchemy import create_engine, text  # noqa: E402
from sqlalchemy.engine import make_url  # noqa: E402

from app import create_app  # noqa: E402
from app.config import TestConfig  # noqa: E402
from app.extensions import db  # noqa: E402

TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL", "")


def _alembic_config(url: str) -> AlembicConfig:
    cfg = AlembicConfig(str(BACKEND_DIR / "alembic.ini"))
    cfg.set_main_option("script_location", str(BACKEND_DIR / "migrations"))
    cfg.set_main_option("sqlalchemy.url", url)
    return cfg


def _ensure_database(url: str) -> None:
    """Crea la base de test si no existe (usa la DB 'postgres' de mantenimiento)."""
    target = make_url(url)
    maint = target.set(database="postgres")
    engine = create_engine(maint, isolation_level="AUTOCOMMIT")
    with engine.connect() as conn:
        exists = conn.execute(
            text("SELECT 1 FROM pg_database WHERE datname = :name"),
            {"name": target.database},
        ).scalar()
        if not exists:
            conn.exec_driver_sql(
                f'CREATE DATABASE "{target.database}" OWNER "{target.username}"'
            )
    engine.dispose()


@pytest.fixture(scope="session")
def migrated_test_db() -> str:
    if not TEST_DATABASE_URL:
        raise RuntimeError(
            "Falta TEST_DATABASE_URL en backend/.env "
            "(ej. postgresql+psycopg2://cretienda:...@127.0.0.1:5432/cretienda_test)"
        )
    _ensure_database(TEST_DATABASE_URL)
    command.upgrade(_alembic_config(TEST_DATABASE_URL), "head")
    return TEST_DATABASE_URL


@pytest.fixture
def app(migrated_test_db, tmp_path):
    config = TestConfig()
    config.SQLALCHEMY_DATABASE_URI = migrated_test_db
    app = create_app(config)
    app.config["MEDIA_FOLDER"] = str(tmp_path / "media")
    yield app
    with app.app_context():
        db.session.remove()
        db.session.execute(
            text(
                "TRUNCATE TABLE users, media_assets, product_images, products, "
                "stores RESTART IDENTITY CASCADE"
            )
        )
        db.session.commit()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def register_user(client):
    """Crea una cuenta nueva vía la API y devuelve {user, token}."""

    def _register(**overrides):
        payload = {
            "name": "Usuaria Test",
            "email": f"user-{uuid.uuid4().hex}@example.test",
            "password": "contra-sena-123",
        }
        payload.update(overrides)
        resp = client.post("/api/v1/auth/register", json=payload)
        assert resp.status_code == 201, resp.get_json()
        return resp.get_json()

    return _register


@pytest.fixture
def auth_token(register_user):
    return register_user()["token"]


@pytest.fixture
def auth_client(client, auth_token):
    """Test-client que envía Authorization: Bearer por defecto."""
    auth_headers = {"Authorization": f"Bearer {auth_token}"}

    class _AuthClient:
        def __getattr__(self, name):
            attr = getattr(client, name)
            if name not in ("get", "post", "patch", "delete", "put", "open"):
                return attr

            def with_auth(*args, **kwargs):
                kwargs["headers"] = {
                    **auth_headers,
                    **(kwargs.get("headers") or {}),
                }
                return attr(*args, **kwargs)

            return with_auth

    return _AuthClient()


@pytest.fixture
def make_store(auth_client):
    def _make(**overrides):
        payload = {
            "name": "Tienda Test",
            "description": "Una tienda de prueba",
            "currency": "USD",
            "logo": None,
        }
        payload.update(overrides)
        resp = auth_client.post("/api/v1/stores", json=payload)
        assert resp.status_code == 201
        return resp.get_json()

    return _make


@pytest.fixture
def upload_image(auth_client):
    """Sube una imagen de prueba real y devuelve su payload {url, filename}."""

    def _upload(color=(200, 30, 30), size=(60, 60)):
        import io

        from PIL import Image

        buf = io.BytesIO()
        Image.new("RGB", size, color).save(buf, "PNG")
        buf.seek(0)
        resp = auth_client.post(
            "/api/v1/media",
            data={"file": (buf, "test.png")},
            content_type="multipart/form-data",
        )
        assert resp.status_code == 201
        return resp.get_json()

    return _upload
