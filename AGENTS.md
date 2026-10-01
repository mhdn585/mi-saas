# CreaTienda — AGENTS.md

Proyecto SaaS único con dos partes en el mismo repo. Todo (código, comentarios, docs,
commits) está en **español**.

- Raíz: frontend React 18 + TypeScript + Vite + Tailwind + Zustand (`src/`).
- `backend/`: API REST Flask + SQLAlchemy sobre **PostgreSQL** (esquema versionado con
  Alembic) que **es la fuente de verdad de stores, productos y media**. El frontend ya NO
  usa localStorage para datos de dominio; solo el carrito (`cartStore`) y el tema
  (`uiStore`) siguen en localStorage.

## Comandos

Desarrollo (recomendado, una sola terminal):
- `python3 app.py` (raíz) → levanta backend (:8000) + frontend (:5173) con logs combinados
  y apagado limpio con Ctrl+C. Solo stdlib; detecta dependencias faltantes con instrucciones.

Frontend (raíz):
- `npm run dev` → Vite en http://127.0.0.1:5173 con proxy `/api` y `/media` → `http://127.0.0.1:8000` (no tocar CORS en dev).
- `npm run build` (corre `tsc --noEmit && vite build`) · `npm run typecheck` para solo tipos.
- No hay linter ni tests de frontend; `tsc` es estricto (`noUnusedLocals`/`noUnusedParameters`): el código muerto rompe el build.

Backend (`cd backend`, Python 3.11+ y PostgreSQL 14+):
- Setup: `python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt -r requirements-dev.txt && cp .env.example .env`; además hacen falta el rol `cretienda` (con `CREATEDB`) y las BDs `cretienda_dev` + `cretienda_test` (ver `backend/README.md`).
- Correr: `python run.py` → http://127.0.0.1:8000 (`FLASK_ENV` elige `DevConfig`/`ProdConfig`). En dev ejecuta `alembic upgrade head` solo al arrancar.
- `ruff check .` (line-length 100) · `pytest` · un archivo: `pytest tests/test_stores.py`.
- Migraciones con Alembic (`backend/migrations/`): cambiar modelos → `alembic revision --autogenerate -m "..."` → revisar → `alembic upgrade head`. **Nunca** `db.create_all()` ni SQL manual. Hay naming convention global en `app/extensions.py`.
- Tests: corren contra PostgreSQL (`TEST_DATABASE_URL`), aplican las migraciones y truncan entre tests; fixtures `app`/`client`/`make_store`/`upload_image` de `backend/tests/conftest.py`.

## Arquitectura frontend (no obvia por nombres de carpeta)

- Los datos de dominio fluyen: páginas → stores Zustand (`src/store/`) → repositorios async
  (`src/data/repositories/`) → `src/data/api/client.ts` → Flask `/api/v1`.
- `App.tsx` hace el bootstrap: carga todas las tiendas al montar. Cada layout
  (`StoreDashboardLayout`, `StorefrontLayout`) dispara `loadForStore(storeId)` de
  `productsStore`. Páginas y layouts deben distinguir "cargando" de "no encontrado".
- Las mutaciones son `async` y **lanzan `ApiError`**: las páginas hacen `try/catch` +
  `showToast`. No asumir retorno síncrono.
- Productos: se traen con `per_page=200` (máximo del backend); búsqueda/filtros quedan en
  cliente. Eliminar una tienda hace cascade de productos en el servidor (DELETE `/stores/<id>`);
  localmente hay que limpiar productos y carrito de esa tienda.
- Imágenes: se suben a `POST /media` (multipart `file`) y se guarda la `url` devuelta
  (`/media/<uuid>.jpg`) absolutizada con `mediaUrl()` del client; ya NO se guardan dataURL
  en el navegador. El backend valida con Pillow, re-encodea a JPEG y **registra cada archivo
  en `media_assets`**. Los `images`/`logo` de productos/tiendas son estrictos: solo URLs ya
  subidas existen (si no, 422); las imágenes viven normalizadas en `product_images`
  (orden por `position`, la de position 0 es la portada). Borrar entidad NO borra archivos:
  los assets sin referencias pasan a `orphan` y se limpian con
  `flask --app run.py media cleanup --grace-days N`.
- Rutas: TODA página debe registrarse en `src/app/routes.tsx`. Panel merchant bajo
  `/stores/:storeId/...`, tienda pública bajo `/shop/:storeId`.
- Alias `@/` → `src/`, declarado en `vite.config.ts` Y `tsconfig.json`.
- Tema claro/oscuro: tokens CSS en `src/index.css` (`--bg`, `--fg`, `--line`, `--surface`,
  `--muted`, `--accent`) con sus utilidades Tailwind (`bg-bg`, `text-fg`, `border-line`,
  `bg-accent`, …). Usa esas clases, nunca colores hardcodeados; `ThemeProvider` aplica
  clase `dark` a `<html>`.
- Colores semánticos (fuera de la paleta, solo para sucesos): `--success` verde, `--danger`
  rojo, `--warning` ámbar → utilidades `text-success/danger/warning`, `bg-*`, `border-*`.
  Úsalos en toasts (`showToast(msg, 'success'|'error'|'warning')`), `Badge` (variantes
  `success/danger/warning`) y errores de formulario (`text-danger`). No los uses para
  decoración.
- Al agregar/renombar componentes UI actualizar el catálogo `docs/COMPONENTES.txt`
  (formato `NOMBRE — src/ruta — descripción`); es el índice que se referencia en prompts.

## Convenciones backend

- Capas: rutas (`app/api/v1/`) → servicios (`app/services/`) → repositorios
  (`app/repositories/`) → modelos (`app/models/`). Prefijo real `/api/v1` (blueprints
  anidados: `api` + `v1`).
- Las respuestas `to_dict()` de los modelos usan camelCase y **espejan exactamente**
  `src/shared/types/domain.ts` (`id` UUID string, timestamps en ms, `price` como float).
  Cambiar un modelo exige cambiar el dominio TS y los repos del frontend.
- Validación marshmallow (`app/schemas/`); errores JSON uniformes
  `{ "error": { "code", "message" } }` (`app/errors.py`). Whitelist de monedas en
  `app/config.py::CURRENCIES` = `src/config/constants.ts::CURRENCIES` (mantener sincronizadas).
- CORS limitado a `FRONTEND_ORIGIN`; config desde `.env` (dotenv se carga en `run.py` antes
  de importar `app`). BD: `DATABASE_URL` (dev/prod) y `TEST_DATABASE_URL` (pytest); el rol
  de BD necesita `CREATEDB` para el test de migraciones.
- Integridad ALSO en base: checks (`price/stock >= 0`, nombre no vacío, moneda whitelist) y
  FKs con reglas específicas: `product_images→media_assets` RESTRICT (no borrar assets en
  uso), `stores.logo_asset_id` SET NULL, `products→stores` CASCADE.
