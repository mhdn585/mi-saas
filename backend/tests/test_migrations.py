import pytest
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.engine import make_url
from sqlalchemy.exc import IntegrityError

from tests.conftest import TEST_DATABASE_URL, _alembic_config, _ensure_database

MIG_DB = "cretienda_mig_test"


@pytest.fixture
def scratch_url():
    base = make_url(TEST_DATABASE_URL)
    url = base.set(database=MIG_DB).render_as_string(hide_password=False)
    maint = create_engine(base.set(database="postgres"), isolation_level="AUTOCOMMIT")
    with maint.connect() as conn:
        conn.exec_driver_sql(f'DROP DATABASE IF EXISTS "{MIG_DB}" WITH (FORCE)')
        conn.exec_driver_sql(f'CREATE DATABASE "{MIG_DB}" OWNER "{base.username}"')
    maint.dispose()
    yield url
    drop = create_engine(base.set(database="postgres"), isolation_level="AUTOCOMMIT")
    with drop.connect() as conn:
        conn.exec_driver_sql(f'DROP DATABASE IF EXISTS "{MIG_DB}" WITH (FORCE)')
    drop.dispose()


def test_upgrade_downgrade_cycle(scratch_url):
    _ensure_database(scratch_url)
    cfg = _alembic_config(scratch_url)
    from alembic import command

    engine = create_engine(scratch_url)
    try:
        command.upgrade(cfg, "head")
        names = set(inspect(engine).get_table_names())
        assert {"stores", "products", "media_assets", "product_images", "users",
               "saved_palettes"} <= names

        command.downgrade(cfg, "0003")
        names = set(inspect(engine).get_table_names())
        columns = {c["name"] for c in inspect(engine).get_columns("stores")}
        assert "saved_palettes" not in names
        assert "users" not in names
        assert "stores" in names
        assert "theme" not in columns
        assert "logo_config" not in columns
        assert "owner_id" not in columns

        command.downgrade(cfg, "base")
        names = set(inspect(engine).get_table_names())
        assert names == {"alembic_version"}

        command.upgrade(cfg, "head")
        names = set(inspect(engine).get_table_names())
        assert {"stores", "products", "media_assets", "product_images", "users",
               "saved_palettes"} <= names

        # constraints e índices sobreviven el ciclo
        with engine.connect() as conn:
            conn.execute(
                text(
                    "INSERT INTO stores (id, name, description, currency, "
                    "created_at, updated_at) VALUES "
                    "('s1', 'ok', '', 'USD', 1, 1)"
                )
            )
            with pytest.raises(IntegrityError):
                conn.execute(
                    text(
                        "INSERT INTO stores (id, name, description, currency, "
                        "created_at, updated_at) VALUES "
                        "('s2', '', '', 'USD', 1, 1)"
                    )
                )
    finally:
        engine.dispose()
