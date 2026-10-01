import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

from alembic import command  # noqa: E402
from alembic.config import Config as AlembicConfig  # noqa: E402

from app import create_app  # noqa: E402
from app.config import DevConfig, ProdConfig  # noqa: E402

BASE_DIR = Path(__file__).resolve().parent


def run_migrations() -> None:
    """Aplica las migraciones pendiente antes de servir (flujo de desarrollo)."""
    cfg = AlembicConfig(str(BASE_DIR / "alembic.ini"))
    cfg.set_main_option("script_location", str(BASE_DIR / "migrations"))
    command.upgrade(cfg, "head")


env = os.environ.get("FLASK_ENV", "development")
configs = {"development": DevConfig, "production": ProdConfig}
config = configs.get(env, DevConfig)

if config is DevConfig:
    run_migrations()

app = create_app(config)

if __name__ == "__main__":
    app.run(
        host=os.environ.get("HOST", "127.0.0.1"),
        port=int(os.environ.get("PORT", "8000")),
    )
