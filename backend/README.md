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

### Auth (público)
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/auth/register` | Crear cuenta (`name`, `email`, `password`) → `{ user, token }` 201; email duplicado → 409 |
| POST | `/auth/login` | `email` + `password` → `{ user, token }`; mal → 401 genérico |
| GET | `/auth/me` | Usuario de la sesión (Bearer token) |

La contraseña se guarda como **hash bcrypt (cost 12)**; nunca se expone ni se loguea.
El token es un **JWT HS256** (clave derivada de `SECRET_KEY` con SHA-256) que expira en
`JWT_EXPIRES_HOURS` (168 h por defecto). Las rutas protegidas exigen header
`Authorization: Bearer <token>`.

### Stores
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/stores` | Lista de **mis** tiendas (login) |
| POST | `/stores` | Crear tienda a nombre del usuario logueado |
| GET | `/stores/<id>` | Obtener tienda — **público** (lo usa el storefront) |
| PATCH | `/stores/<id>` | Actualizar (parcial) — solo el dueño |
| DELETE | `/stores/<id>` | Eliminar (cascada: productos, paletas e imágenes → huérfanas) — solo el dueño |

### Products
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/stores/<sid>/products` | Anónimo: solo publicados · Dueño: todos (`search`, `published`, `page`, `per_page`) |
| POST | `/stores/<sid>/products` | Crear producto (máx. 12 imágenes, URLs ya subidas) — login |
| GET | `/stores/<sid>/products/<pid>` | Obtener (publicado o del dueño) |
| GET | `/products/<pid>` | Obtener por id (lookup de carrito; privado solo para el dueño) |
| PATCH | `/products/<pid>` | Actualizar — solo el dueño |
| DELETE | `/products/<pid>` | Eliminar (assets sin uso pasan a `orphan`) — solo el dueño |

### Palettes (todo requiere sesión + propiedad)
`GET/POST /stores/<sid>/palettes` · `PATCH/DELETE /stores/<sid>/palettes/<pid>`

### Media
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/media` | Subir imagen (multipart `file`) → `{ url, filename }` + registro `media_asset` — login |
| GET | `/media/<filename>` | Servir imagen (público) |
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
flask --app run.py user create ana@correo.com     # crea una cuenta por consola
flask --app run.py user claim-orphan-stores ana@correo.com   # asigna las tiendas sin dueño (pre-auth)
```

## Seguridad de datos
- Credenciales solo por `.env` (nunca hardcodear)
- Contraseñas: hash **bcrypt** cost 12 (con límite de 72 bytes); verificación en tiempo
  constante; errores de login genéricos (401) que no revelan si el email existe
- Sesiones: JWT HS256 firmado con `SECRET_KEY` derivada (SHA-256), exp configurable
- Cada tienda pertenece a un usuario (`stores.owner_id`); los recursos ajenos responden 404
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
├── cli.py               # flask media cleanup · flask user create/claim-orphan-stores
├── config.py            # config desde .env (dev/test/prod) + parámetros de auth
├── extensions.py        # db (naming convention), cors, PRAGMA FK sqlite
├── errors.py            # handlers JSON (incluye 401 UnauthorizedError)
├── api/v1/              # blueprints auth/stores/products/palettes/media
├── models/              # User, Store, Product, MediaAsset, ProductImage, SavedPalette
├── repositories/        # Repository[T] abstracto (+ StoreRepository.find_by_owner)
├── schemas/             # marshmallow (auth: Register/Login)
├── services/            # negocio: auth (bcrypt+JWT), productos, tiendas, paletas, media
└── utils/               # paginación + guardas de sesión (login_required/optional_user)
```
