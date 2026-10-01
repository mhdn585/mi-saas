# CreaTienda — Backend (Flask + PostgreSQL)

API REST en Python/Flask para el SaaS CreaTienda. Arquitectura modular en capas
(**rutas → servicios → repositorios → modelos**) con persistencia en **PostgreSQL**
vía SQLAlchemy y esquema **versionado con Alembic**. Espejo del prototipo frontend
(Stores, Products, Media).

## Requisitos
- Python 3.11+ (probado en 3.13)
- `pip`, `venv`
- PostgreSQL 14+ (probado en 17)

## Puesta en marcha

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt

# 1) Crear rol y bases (una vez, como usuario postgres):
#    sudo -u postgres psql -c "CREATE ROLE cretienda LOGIN PASSWORD '...' CREATEDB;"
#    sudo -u postgres createdb -O cretienda cretienda_dev
#    sudo -u postgres createdb -O cretienda cretienda_test

# 2) Configurar .env (usa el .env.example como plantilla):
cp .env.example .env   # pon tus DATABASE_URL / TEST_DATABASE_URL y SECRET_KEY

# 3) Aplicar esquema y correr:
alembic upgrade head   # (en dev, run.py lo hace solo)
python run.py          # http://127.0.0.1:8000
```

## Migraciones (Alembic)

El esquema **solo** cambia vía migraciones; nunca a mano ni con `db.create_all()`.

```bash
alembic upgrade head          # aplicar pendentes
alembic downgrade -1          # revertir la última
alembic revision --autogenerate -m "descripcion"   # tras editar modelos
```

Hay una `naming convention` global en `app/extensions.py` (ix_/uq_/ck_/fk_/pk_) para
que los nombres sean estables y el autogenerate genere diffs limpios. **Revisá siempre**
la migración generada antes de aplicarla. En desarrollo, `run.py` ejecuta
`alembic upgrade head` automáticamente al arrancar.

## Desarrollo

```bash
ruff check .                 # lint
pytest                       # tests (usan PostgreSQL en TEST_DATABASE_URL,
                             # crean las tablas con las migraciones y
                             # truncan entre tests)
```

## Endpoints (`/api/v1`)

### Stores
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/stores` | Lista de tiendas |
| POST | `/stores` | Crear tienda (`name`, `description`, `currency`, `logo`) |
| GET | `/stores/<id>` | Obtener tienda |
| PATCH | `/stores/<id>` | Actualizar (parcial) |
| DELETE | `/stores/<id>` | Eliminar (cascada: productos e imágenes → huérfanas) |

### Products
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/stores/<sid>/products` | Listar (query: `search`, `published`, `page`, `per_page`) |
| POST | `/stores/<sid>/products` | Crear producto (máx. 12 imágenes, URLs ya subidas) |
| GET | `/stores/<sid>/products/<pid>` | Obtener (valida store_id) |
| GET | `/products/<pid>` | Obtener por id (lookup de carrito) |
| PATCH | `/products/<pid>` | Actualizar (parcial: `published`, `stock`, `images`, etc.) |
| DELETE | `/products/<pid>` | Eliminar (sus assets sin uso pasan a `orphan`) |

### Media
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/media` | Subir imagen (multipart `file`) → `{ url, filename }` + registro `media_asset` |
| GET | `/media/<filename>` | Servir imagen |
| GET | `/health` | Estado del servicio |

**Regla estricta de imágenes**: los `images`/`logo` de productos y tiendas deben ser
URLs previamente subidas por `POST /media` (existen en `media_assets`); cualquier otra
devuelve 422.

## Integridad y borrado seguro

- Checks en base: `price >= 0`, `stock >= 0`, nombre no vacío, moneda en whitelist,
  `position >= 0`, `size_bytes >= 0`, `status IN ('active','orphan','deleted')`.
- FKs: `products→stores` CASCADE; `product_images→products` CASCADE;
  `product_images→media_assets` **RESTRICT**; `stores.logo_asset_id→media_assets` SET NULL.
- Borrar una entidad nunca borra archivos físicos en uso: los assets quedan `orphan`
  y se limpian explícitamente:

```bash
flask --app run.py media cleanup --grace-days 7   # borra archivos huérfanos antiguos
```

## Seguridad de datos
- Credenciales solo por `.env` (nunca hardcodear)
- Validación doble: marshmallow + constraints en base
- CORS bloqueado a `FRONTEND_ORIGIN`
- Imágenes validadas con Pillow (MIME real, no extensión), re-encodeadas a JPEG
- Nombres de archivo UUID + protección contra path traversal
- Errores JSON uniformes; sin traces en producción

## Backups (PostgreSQL)

```bash
pg_dump -Fc cretienda_dev > backups/cretienda-$(date +%F).dump
pg_restore -d cretienda_dev --clean backups/cretienda-XXXX.dump
```
Programar diario en producción y **probar el restore** periódicamente.

## Estructura
```
alembic.ini              # config Alembic
migrations/              # env.py + versions/ (0001→0003)
app/
├── __init__.py          # create_app() factory (sin create_all)
├── cli.py               # flask media cleanup
├── config.py            # config desde .env (dev/test/prod)
├── extensions.py        # db (naming convention), cors, PRAGMA FK sqlite
├── errors.py            # handlers JSON
├── api/v1/              # blueprints stores/products/media
├── models/              # Store, Product, MediaAsset, ProductImage
├── repositories/        # Repository[T] abstracto
├── schemas/             # marshmallow
├── services/            # negocio: productos, tiendas, media (assets + huérfanos)
└── utils/               # paginación
```
