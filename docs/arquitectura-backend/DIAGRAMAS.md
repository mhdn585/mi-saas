# CreaTienda — Diagramas del Backend

Documentación visual completa del backend (`backend/`): API REST en **Python/Flask** con
arquitectura en capas (**rutas → servicios → repositorios → modelos**), persistencia en
**PostgreSQL** vía SQLAlchemy, esquema versionado con **Alembic** y almacenamiento de
imágenes en el **filesystem local**.

> Fuente: análisis de todo el código en `backend/app/`, `backend/migrations/`, `run.py`
> y el lanzador raíz `app.py`. Fecha: 2026-10-02.

## Índice

| # | Diagrama | Tipo | Qué muestra |
|---|---|---|---|
| 1 | [Arquitectura general](#1-arquitectura-general) | `flowchart` | Sistema completo: frontend, backend, BD, media, procesos y puertos |
| 2 | [Capas y módulos](#2-capas-y-módulos) | `flowchart` | Cada archivo por capa y sus dependencias |
| 3 | [Modelo de datos](#3-modelo-de-datos) | `erDiagram` | 5 tablas, columnas, FKs con reglas de borrado, checks e índices |
| 4 | [Mapa de endpoints](#4-mapa-de-endpoints-apiv1) | `flowchart` | Las 21 rutas con su schema de validación y su servicio |
| 5 | [Flujo de una petición](#5-flujo-de-una-petición) | `sequenceDiagram` | Ciclo vida completo de POST/PATCH/DELETE de productos |
| 6 | [Ciclo de vida de MediaAsset](#6-ciclo-de-vida-de-mediaasset) | `stateDiagram` | active → orphan → deleted, reactivación y cleanup |
| 7 | [Arranque y migraciones](#7-arranque-y-migraciones) | `sequence` + `flowchart` | Cadena de arranque y las revisiones 0001→0005 |

---

## 1. Arquitectura general

Todo el sistema: el lanzador de desarrollo levanta backend y frontend; los datos de
dominio fluyen del frontend al backend (fuente única de verdad); el backend persiste en
PostgreSQL y guarda las imágenes normalizadas en disco.

```mermaid
flowchart TB
    USUARIO(["👤 Usuario / navegador"])

    subgraph LANZADOR["Lanzador de desarrollo (raíz del repo)"]
        APPI["app.py<br/>spawn backend + frontend<br/>logs combinados, Ctrl+C limpio<br/>verifica dependencias (npm, venv)"]
    end

    subgraph FE["FRONTEND — React 18 + TS + Vite (puerto :5173)"]
        direction TB
        PAGES["Páginas<br/>src/features/merchant · customer"]
        ZUSTAND["Stores Zustand<br/>src/store/ (productos, paletas…)"]
        REPOSFE["Repositorios async<br/>src/data/repositories/"]
        CLIENT["api/client.ts<br/>ApiError, mediaUrl()"]
        VITEPROXY["Proxy Vite<br/>/api y /media → :8000"]
        LS["localStorage<br/>solo cartStore + uiStore"]
        PAGES --> ZUSTAND --> REPOSFE --> CLIENT --> VITEPROXY
        PAGES -.->|carrito/tema| LS
    end

    subgraph BE["BACKEND — Flask API REST (puerto :8000, run.py)"]
        direction TB
        CORSB["CORS<br/>solo FRONTEND_ORIGIN"]
        APV1["/api/v1<br/>blueprints: stores · products · palettes · media"]
        MEDIAM["GET /media/[archivo]<br/>estático + Cache-Control 24h"]
        HEALTH["GET /api/v1/health"]
        ORM["SQLAlchemy 2.x<br/>db + naming convention"]
        PIL["Pillow<br/>validar/re-encodear JPEG"]
    end

    PG[("🐘 PostgreSQL<br/>cretienda_dev · cretienda_test<br/>rol cretienda con CREATEDB")]
    MEDIA[("💾 Filesystem<br/>backend/media/<br/>UUID.jpg normalizadas (max 1000px, q85)")]
    ALEMBIC["🧬 Alembic<br/>migrations/ 0001→0005"]
    CLICMD["🛠 CLI Flask<br/>flask media cleanup<br/>--grace-days N"]
    ENV[".env (dotenv)<br/>DATABASE_URL · TEST_DATABASE_URL<br/>SECRET_KEY · FRONTEND_ORIGIN<br/>MAX_UPLOAD_MB · HOST/PORT"]

    USUARIO -->|http://127.0.0.1:5173| PAGES
    APPI ==>|inicia| BE
    APPI ==>|npm run dev| FE

    CLIENT -->|fetch JSON / multipart| CORSB --> APV1
    VITEPROXY --> APV1
    VITEPROXY --> MEDIAM
    APV1 --> ORM
    MEDIAM -->|send_from_directory| MEDIA
    HEALTH --> ORM
    APV1 -.->|POST /media| PIL -->|escribe archivo| MEDIA
    ORM -->|psycopg2| PG
    ALEMBIC -->|upgrade head en dev| PG
    CLICMD -.->|borra huérfanos| PIL
    CLICMD -.->|unlink físico| MEDIA
    ENV -.->|configura| BE
    ENV -.->|configura| APPI

    style FE fill:#e0f2fe,stroke:#0284c7
    style BE fill:#dcfce7,stroke:#16a34a
    style PG fill:#fef9c3,stroke:#ca8a04
    style MEDIA fill:#fae8ff,stroke:#c026d3
    style LANZADOR fill:#f1f5f9,stroke:#64748b
```

---

## 2. Capas y módulos

Arquitectura estricta en capas dentro de `backend/app/`. Nada salta capas: las rutas solo
orquestan, los servicios contienen la lógica de negocio, los repositorios abstracten el
CRUD y los modelos definen el esquema.

```mermaid
flowchart TD
    subgraph L0["Bootstrap / infra global"]
        RUNPY["run.py<br/>dotenv → config → alembic → create_app"]
        CREATEAPP["app/__init__.py::create_app()<br/>db + cors + blueprints + handlers<br/>health, serve_media, shell ctx, CLI"]
        CONFIG["app/config.py<br/>Config · DevConfig · ProdConfig · TestConfig<br/>CURRENCIES(14) · DEFAULT_CURRENCY · MEDIA_DIR<br/>MAX_UPLOAD_MB=5 · MAX_CONTENT_LENGTH=10MB"]
        EXT["app/extensions.py<br/>db (SQLAlchemy + NAMING_CONVENTION<br/>ix_/uq_/ck_/fk_/pk_) · cors<br/>PRAGMA FK en SQLite"]
        ERRORS["app/errors.py<br/>ApiError 400 · NotFoundError 404<br/>ValidationError 422 · ConflictError 409<br/>handlers JSON + 413 + 500"]
        CLI["app/cli.py<br/>flask media cleanup<br/>flask user create/claim-orphan-stores"]
        UTILS["app/utils/pagination.py<br/>parse_pagination(50/200)<br/>app/utils/auth.py<br/>login_required · optional_user"]
    end

    subgraph L1["CAPA 1 — Rutas · app/api/v1/ (Blueprints anidados api→v1)"]
        APIINIT["api/__init__.py<br/>api /api → v1 /v1"]
        AUTHBP["auth.py<br/>3 rutas (público + me)"]
        STORESBP["stores.py<br/>5 rutas"]
        PRODUCBP["products.py<br/>6 rutas"]
        PALETBP["palettes.py<br/>4 rutas"]
        MEDIABP["media.py<br/>POST /media"]
    end

    subgraph L2["CAPA 2 — Validación · app/schemas/ (marshmallow)"]
        BASESC["_base.py<br/>TrimmingSchema (pre_load strip)"]
        AUTHSC["auth.py<br/>RegisterSchema (email, pass 8-72)<br/>LoginSchema"]
        STORESC["store.py<br/>StoreCreate/UpdateSchema<br/>StoreThemeSchema (7 hex)<br/>StoreLogoConfigSchema"]
        PRODSC["product.py<br/>ProductCreate/UpdateSchema<br/>máx 12 imágenes · price>=0"]
        PALESC["palette.py<br/>PaletteCreate/UpdateSchema<br/>colors = StoreThemeSchema"]
    end

    subgraph L3["CAPA 3 — Negocio · app/services/"]
        AUTHSV["auth_service.py<br/>bcrypt cost12 · JWT HS256<br/>(sha256 de SECRET_KEY, exp 168h)<br/>login genérico anti-enum"]
        STORESV["store_service.py<br/>CRUD + _apply_logo +<br/>release de logo viejo ·<br/>get_owned_store (404 si no dueño)"]
        PRODSV["product_service.py<br/>paginate máx 200 · swap imágenes<br/>release_assets en delete"]
        PALETSV["palette_service.py<br/>IntegrityError → Conflict 409"]
        MEDIASV["media_service.py<br/>save_upload (Pillow→JPEG)<br/>resolve_asset_urls estricto<br/>release/reactivate/cleanup"]
    end

    subgraph L4["CAPA 4 — Persistencia · app/repositories/"]
        BASEREPO["base.py<br/>Repository[T] genérico<br/>find_all/by_id/where · create<br/>update (protege id/created_at)<br/>remove/remove_where"]
        STORE_REPO["store_repo.py<br/>store_repository"]
        PROD_REPO["product_repo.py<br/>product_repository"]
        PALET_REPO["inline en palette_service<br/>Repository(SavedPalette)"]
    end

    subgraph L5["CAPA 5 — Modelos · app/models/ (SQLAlchemy)"]
        USERM["user.py — User<br/>(email unique lower,<br/>password_hash bcrypt)"]
        STOREM["store.py — Store<br/>(owner_id FK→users)"]
        PRODM["product.py — Product"]
        PIMAGEM["product_image.py — ProductImage"]
        MEDIAM["media_asset.py — MediaAsset"]
        PALETM["saved_palette.py — SavedPalette"]
    end

    DB[("PostgreSQL / SQLite")]

    RUNPY --> CREATEAPP
    RUNPY --> CONFIG
    CREATEAPP --> CONFIG
    CREATEAPP --> EXT
    CREATEAPP --> ERRORS
    CREATEAPP --> CLI
    CREATEAPP --> APIINIT
    APIINIT --> AUTHBP & STORESBP & PRODUCBP & PALETBP & MEDIABP

    AUTHBP --> AUTHSC --> BASESC
    AUTHBP --> AUTHSV
    AUTHSV --> USERM
    UTILS -.->|login_required/optional_user| STORESBP & PRODUCBP & PALETBP & MEDIABP
    STORESBP --> STORESC
    PRODUCBP --> PRODSC
    PALETBP --> PALESC
    STORESC & PRODSC & PALESC --> BASESC

    STORESBP --> STORESV
    PRODUCBP --> PRODSV
    PRODUCBP --> STORESV
    PALETBP --> PALETSV
    PALETBP --> STORESV
    MEDIABP --> MEDIASV
    PRODUCBP --> UTILS

    STORESV --> STORE_REPO
    STORESV --> MEDIASV
    PRODSV --> PROD_REPO
    PRODSV --> MEDIASV
    PALETSV --> PALET_REPO
    STORE_REPO --> BASEREPO
    PROD_REPO --> BASEREPO
    PALET_REPO --> BASEREPO

    BASEREPO --> EXT
    MEDIASV --> EXT
    PRODSV --> EXT
    PALETSV --> EXT

    STORE_REPO --> STOREM
    PROD_REPO --> PRODM
    PALET_REPO --> PALETM
    MEDIASV --> MEDIAM
    PRODSV --> PIMAGEM
    STOREM --> MEDIAM
    PRODM --> PIMAGEM --> MEDIAM
    PALETM --> STOREM

    EXT --> DB
    ERRORS -.->|raised por| STORESV & PRODSV & PALETSV & MEDIASV
    CLI -.->|llama a| MEDIASV

    style L1 fill:#dbeafe,stroke:#2563eb
    style L2 fill:#ede9fe,stroke:#7c3aed
    style L3 fill:#dcfce7,stroke:#16a34a
    style L4 fill:#ffedd5,stroke:#ea580c
    style L5 fill:#fef9c3,stroke:#ca8a04
    style L0 fill:#f1f5f9,stroke:#64748b
```

---

## 3. Modelo de datos

Las 5 tablas con columnas, claves y reglas de integridad. Reglas de borrado críticas:
un producto nunca sobrevive a su tienda (CASCADE), una imagen en uso no puede borrarse
(RESTRICT) y quitar un logo deja el asset huérfano en vez de romper la FK (SET NULL).

```mermaid
erDiagram
    USERS ||--o{ STORES : "owner_id · ON DELETE CASCADE (NULL = tiendas heredadas)"
    STORES ||--o{ PRODUCTS : "store_id · ON DELETE CASCADE"
    STORES ||--o{ SAVED_PALETTES : "store_id · ON DELETE CASCADE"
    STORES |o--o| MEDIA_ASSETS : "logo_asset_id · ON DELETE SET NULL"
    PRODUCTS ||--o{ PRODUCT_IMAGES : "product_id · ON DELETE CASCADE"
    MEDIA_ASSETS ||--o{ PRODUCT_IMAGES : "media_asset_id · ON DELETE RESTRICT"

    STORES {
        string id PK "uuid4 · String(36)"
        string owner_id FK "nullable → users CASCADE · index"
        string name "String(60) NOT NULL · CK TRIM(name) no vacío"
        text description "NOT NULL default ''"
        string currency "String(3) default USD · CK IN whitelist 14 monedas"
        string logo_asset_id FK "nullable → media_assets"
        json theme "7 hex bg fg surface muted line accent accentFg · NULL=default"
        json logo_config "fit height 24..56 positionX/Y background"
        bigint created_at "epoch ms"
        bigint updated_at "epoch ms · onupdate"
    }

    PRODUCTS {
        string id PK "uuid4 · String(36)"
        string store_id FK "NOT NULL, index → stores CASCADE"
        string name "String(80) NOT NULL · CK TRIM(name) no vacío"
        text description "default ''"
        decimal price "Numeric(10,2) · CK price >= 0"
        int stock "default 0 · CK stock >= 0"
        bool published "default true"
        bigint created_at "epoch ms"
        bigint updated_at "epoch ms"
    }

    PRODUCT_IMAGES {
        string product_id PK "PK compuesto · FK → products CASCADE"
        string media_asset_id PK "PK compuesto · FK → media_assets RESTRICT"
        smallint position "CK position >= 0 · UQ(product_id, position) · 0 = portada"
        bigint created_at "epoch ms"
    }

    MEDIA_ASSETS {
        string id PK "uuid4 · String(36)"
        string filename "String(255) UNIQUE · uuid.hex .jpg"
        string mime_type "image/jpeg"
        string format "JPEG · JPEG PNG WEBP GIF aceptados al subir"
        int size_bytes "CK size_bytes >= 0"
        int width "nullable"
        int height "nullable"
        string status "CK IN active/orphan/deleted · index ix_status"
        bigint created_at "epoch ms"
        bigint updated_at "epoch ms"
    }

    SAVED_PALETTES {
        string id PK "uuid4 · String(36)"
        string store_id FK "NOT NULL, index → stores CASCADE"
        string name "String(40) · CK no vacío · UQ(store_id, name)"
        json colors "los 7 tokens hex resueltos"
        bigint created_at "epoch ms"
        bigint updated_at "epoch ms"
    }

    USERS {
        string id PK "uuid4 · String(36)"
        string name "String(60) NOT NULL · CK TRIM(name) no vacío"
        string email "String(254) UNIQUE lower · CK no vacío"
        string password_hash "String(128) bcrypt cost12 · JAMAS se expone"
        bigint created_at "epoch ms"
        bigint updated_at "epoch ms"
    }
```

**Índices adicionales declarados en modelos/migraciones:**

| Tabla | Índice | Uso |
|---|---|---|
| `products` | `ix_products_store_published_created (store_id, published, created_at)` | storefront: publicados por fecha |
| `products` | `ix_products_store_created (store_id, created_at)` | listing del panel merchant |
| `product_images` | `ix_product_images_media_asset (media_asset_id)` | `count_references` al liberar assets |
| `media_assets` | `ix_media_assets_status (status)` | cleanup de huérfanos |
| `saved_palettes` | index en `store_id` + `uq_saved_palettes_store_id_name` | unicidad por tienda |

> Naming convention global en `app/extensions.py`: `ix_ / uq_ / ck_ / fk_ / pk_` —
> garantiza diffs limpios de `alembic revision --autogenerate`.
> `to_dict()` de todos los modelos emite **camelCase** con timestamps en ms, espejando
> `src/shared/types/domain.ts` del frontend.

---

## 4. Mapa de endpoints `/api/v1`

Las 21 rutas efectivas (15 de negocio + 3 de auth + media estático + health + upload),
con el schema marshmallow que valida el body y la función de servicio que ejecuta.
`🔒` = requiere sesión · `👑` = requiere ser el dueño de la tienda · sin marca = público.

```mermaid
flowchart LR
    subgraph CL_AUTH["🔑 auth.py (público)"]
        R20["POST /auth/register → 201 {user,token}"]
        R21["POST /auth/login → {user,token}"]
        R22["GET /auth/me 🔒"]
    end

    subgraph CL_API["🔵 stores.py"]
        R1["GET /stores 🔑👑"]
        R2["POST /stores 🔑 → 201"]
        R3["GET /stores/:id ·público"]
        R4["PATCH /stores/:id 🔑👑"]
        R5["DELETE /stores/:id 🔑👑 → 204"]
    end

    subgraph CL_PROD["🟢 products.py"]
        R6["GET /stores/:sid/products<br/>?search &published &page &per_page"]
        R7["POST /stores/:sid/products → 201"]
        R8["GET /stores/:sid/products/:pid"]
        R9["GET /products/:pid ·(lookup carrito)"]
        R10["PATCH /products/:pid"]
        R11["DELETE /products/:pid → 204"]
    end

    subgraph CL_PAL["🟣 palettes.py"]
        R12["GET /stores/:sid/palettes"]
        R13["POST /stores/:sid/palettes → 201"]
        R14["PATCH /stores/:sid/palettes/:pid"]
        R15["DELETE /stores/:sid/palettes/:pid → 204"]
    end

    subgraph CL_MED["🟠 media.py + create_app"]
        R16["POST /media ·multipart file → 201"]
        R17["GET /media/:filename ·Cache 24h"]
        R18["GET /api/v1/health"]
    end

    subgraph CL_SCHEMA["Validación (marshmallow)"]
        SC1["StoreCreateSchema<br/>StoreUpdateSchema"]
        SC2["ProductCreateSchema<br/>ProductUpdateSchema<br/>máx 12 imgs · price Decimal ≥0"]
        SC3["PaletteCreateSchema<br/>PaletteUpdateSchema"]
        SC0["422 + fields si falla ·<br/>TrimmingSchema hace strip"]
    end

    subgraph CL_SVC["Servicios"]
        SVCA["auth_service<br/>bcrypt + JWT · login genérico"]
        SVC1["store_service<br/>list · get · create ·<br/>update · delete"]
        SVC2["product_service<br/>list(paginate≤200) · get ·<br/>create · update · delete"]
        SVC3["palette_service<br/>CRUD + Conflict 409 dup nombre"]
        SVC4["media_service<br/>save_upload · resolve_asset_urls ·<br/>release_assets · cleanup_orphans"]
        SVCX["ValidationError si url<br/>no existe en media_assets"]
        REPO["store/product/palette<br/>Repository[T]"]
        DB[("PostgreSQL")]
        FS[("backend/media/")]
    end

    R2 --> SC1 --> SVC1
    R4 --> SC1
    R1 & R3 & R5 --> SVC1
    R7 --> SC2 --> SVC2
    R10 --> SC2
    R6 & R8 & R9 & R11 --> SVC2
    R13 --> SC3 --> SVC3
    R14 --> SC3
    R12 & R15 --> SVC3
    R16 --> SVC4
    R20 & R21 --> SVCA
    R22 -->|login_required| SVCA

    SC1 & SC2 & SC3 -.-> SC0
    SVC1 & SVC2 & SVC3 --> REPO --> DB
    SVC1 & SVC2 & SVC3 -.-> SVC4
    SVC4 --> DB
    SVC4 -->|Pillow JPEG q85 ≤1000px| FS
    R17 -->|send_from_directory| FS
    SVC4 -.-> SVCX

    style CL_API fill:#dbeafe,stroke:#2563eb
    style CL_PROD fill:#dcfce7,stroke:#16a34a
    style CL_PAL fill:#ede9fe,stroke:#7c3aed
    style CL_MED fill:#ffedd5,stroke:#ea580c
    style CL_SCHEMA fill:#fce7f3,stroke:#db2777
    style CL_SVC fill:#f1f5f9,stroke:#64748b
```

**Regla estricta de imágenes:** los campos `logo` (tiendas) y `images` (productos) deben
ser URLs previamente devueltas por `POST /media` y existentes en `media_assets`;
cualquier otra URL devuelve `422 validation_error`.

---

## 5. Flujo de una petición

Ciclo completo de una escritura de producto (el caso más rico): validación doble
(marshmallow + constraints de BD), resolución de media, transacción y respuesta
camelCase; incluye los caminos de error.

```mermaid
sequenceDiagram
    autonumber
    participant C as Frontend<br/>client.ts
    participant H as Handler HTTP<br/>errors.py
    participant B as Blueprint<br/>products.py
    participant S as Schema<br/>ProductCreate/Update
    participant PS as product_service
    participant MS as media_service
    participant R as product_repository<br/>Repository[T]
    participant PG as PostgreSQL
    participant FS as disco media/

    C->>B: POST /api/v1/stores/:sid/products (JSON)
    Note over B: store_service.get_store(sid)<br/>→ 404 si la tienda no existe
    B->>S: load(request.get_json())
    alt datos inválidos (name vacío, price negativo, más de 12 imgs)
        S-->>H: MarshmallowValidationError
        H-->>C: 422 {error.code, message, fields}
    end
    S-->>B: dict saneado (strip, defaults)
    B->>PS: create_product(store_id, data)
    PS->>MS: resolve_asset_urls(images)
    alt alguna url no está en media_assets o está deleted/duplicada
        MS-->>H: ValidationError("Subila primero vía /api/v1/media")
        H-->>C: 422 validation_error
    else urls OK (reactiva huérfanos reutilizados)
        MS-->>PS: [MediaAsset]
    end
    PS->>R: create(data + store_id)
    R->>PG: INSERT products · COMMIT
    PS->>PS: _set_links: ProductImage(position 0..n)
    PS->>PG: INSERT product_images · COMMIT
    Note over PG: checks: name≠'' · price≥0 · stock≥0<br/>uq(product_id, position) — integridad doble
    PS-->>B: Product
    B-->>C: 201 product.to_dict() camelCase

    rect rgb(254, 240, 240)
        Note over C,FS: PATCH /products/:pid con nuevas imágenes (swap)
        C->>B: PATCH (images: [nuevas urls])
        B->>PS: update_product(pid, patch)
        PS->>MS: resolve_asset_urls(nuevas)
        PS->>PG: clear links viejos → flush → set nuevos → COMMIT
        PS->>MS: release_assets(ids_viejos - ids_nuevos)
        MS->>PG: status='orphan' si count_references=0
        B-->>C: 200 to_dict()
    end

    rect rgb(240, 248, 255)
        Note over C,FS: DELETE /products/:pid
        C->>B: DELETE
        B->>PS: delete_product(pid)
        PS->>R: remove(id) → FK CASCADE borra product_images
        PS->>MS: release_assets(ids) · activa→orphan
        B-->>C: 204 vacío
    end

    rect rgb(250, 240, 250)
        Note over C,H: Otros errores uniformes
        H-->>C: 404 not_found · 409 conflict · 413 payload_too_large (>10MB)<br/>500 server_error (sin traceback en prod)
    end
```

---

## 6. Ciclo de vida de MediaAsset

Ninguna operación de borrado toca archivos físicos en uso: los assets entran a `orphan`
y solo el CLI los elimina definitivamente tras el período de gracia.

```mermaid
stateDiagram-v2
    direction LR

    [*] --> ACTIVE : POST /media<br/>save_upload(): Pillow verifica MIME real,<br/>convert RGB, thumbnail 1000px,<br/>re-encodea JPEG q85, filename UUID.jpg,<br/>registra fila + escribe disco

    ACTIVE --> ORPHAN : release_assets() tras borrar/actualizar<br/>tienda·producto·logo — solo si<br/>count_references()==0
    ACTIVE --> ORPHAN : cleanup_orphans(): activo nunca<br/>referenciado (subido y abandonado)

    ORPHAN --> ACTIVE : reutilizado: resolve_asset_urls<br/>o _apply_logo → reactivate()

    ORPHAN --> DELETED : CLI flask media cleanup --grace-days N<br/>archivo físico unlink() + status deleted<br/>(si unlink falla, NO marca deleted)

    DELETED --> [*] : irreversible · cualquier intento<br/>de referencia → 422 "fue eliminado"

    ACTIVE --> ACTIVE : referenciado por<br/>products/stores normales

    note right of ORPHAN
        status vive en media_assets.status
        (CK status_valid + ix_media_assets_status)
        FK product_images→media_assets RESTRICT
        impide borrar filas en uso;
        stores.logo SET NULL.
    end note
```

---

## 7. Arranque y migraciones

### 7.1 Cadena de arranque (desarrollo)

```mermaid
sequenceDiagram
    autonumber
    actor U as Developer
    participant LA as app.py (raíz)
    participant RUN as backend/run.py
    participant DOT as dotenv (.env)
    participant ALE as Alembic
    participant CA as create_app()
    participant VITE as Vite :5173
    participant PG as PostgreSQL

    U->>LA: python3 app.py
    LA->>LA: find_backend_python() (usa .venv si existe)<br/>check_dependencies(): npm, vite, flask, psycopg2…
    par procesos
        LA->>RUN: subprocess python run.py (cwd backend)
        RUN->>DOT: load_dotenv() ANTES de importar app
        DOT-->>RUN: DATABASE_URL · SECRET_KEY · FLASK_ENV · HOST/PORT
        RUN->>RUN: configs[FLASK_ENV] → DevConfig | ProdConfig
        alt DevConfig
            RUN->>ALE: command.upgrade("head") ← solo en dev
            ALE->>PG: aplica revisiones pendientes 0001→0005
        end
        RUN->>CA: create_app(config)
        CA->>CA: db.init_app + cors(FRONTEND_ORIGIN)
        CA->>CA: register_blueprint(api) → v1 → 4 blueprints
        CA->>CA: error handlers JSON + Marshmallow 422
        CA->>CA: health + serve_media + register_cli + shell ctx
        CA-->>RUN: Flask app → app.run(HOST=127.0.0.1, PORT=8000)
    and
        LA->>VITE: subprocess npm run dev
        VITE->>VITE: proxy /api y /media → :8000
    end
    LA->>LA: stream_logs con prefijo de color por proceso
    U->>LA: Ctrl+C → SIGINT al grupo de procesos → apagado limpio (kill a los 5s)
```

### 7.2 Historia de migraciones (única forma de tocar el esquema — nunca `create_all()`)

```mermaid
flowchart LR
    M0001["0001_initial_schema<br/>stores + products<br/>checks + índices compuestos"]
    M0002["0002_media_assets<br/>tabla registro de archivos<br/>status + size checks, ix_status"]
    M0003["0003_product_images<br/>tabla N:M producto↔asset<br/>position 0=portada · FK media RESTRICT<br/>+ stores.logo_asset_id SET NULL"]
    M0004["0004_store_theme_palettes<br/>stores.theme JSON<br/>+ saved_palettes UQ(store_id,name)"]
    M0005["0005_logo_config<br/>stores.logo_config JSON<br/>(fit/height/posiciones/fondo)"]
    M0006["0006_users<br/>tabla users: email unique lower<br/>+ password_hash bcrypt (cost 12)"]
    M0007["0007_store_ownership<br/>stores.owner_id FK→users CASCADE<br/>nullable (huérfanas: flask user<br/>claim-orphan-stores) + index"]

    M0001 ==> M0002 ==> M0003 ==> M0004 ==> M0005 ==> M0006 ==> M0007

    WORK[" Flujo de trabajo:<br/>editar modelos → alembic revision --autogenerate<br/>→ REVISAR el diff → alembic upgrade head<br/>(downgrade -1 para revertir)"]
    TESTS["tests/conftest.py:<br/>pytest sobre cretienda_test (TEST_DATABASE_URL)<br/>aplica migraciones y trunca entre tests<br/>test_migrations.py necesita rol CREATEDB<br/>fixtures: register_user · auth_client · auth_token"]
    M0007 -.-> WORK
    M0007 -.-> TESTS

    style M0007 fill:#dcfce7,stroke:#16a34a
```

---

## Notas transversales (visibles en los diagramas)

- **Doble validación:** marshmallow en la capa schemas + constraints/checks en la capa BD;
  ninguna de las dos se confía en la otra.
- **camelCase en la API:** `to_dict()` emite `storeId`, `createdAt` (ms), `logoConfig`,
  `accentFg`… espejo exacto de `src/shared/types/domain.ts`; cambiar un modelo exige
  cambiar el dominio TS.
- **Monedas:** whitelist de 14 en `app/config.py::CURRENCIES`, sincronizada con
  `src/config/constants.ts`.
- **Seguridad de media:** MIME real verificado con Pillow (no la extensión), re-encodeo a
  JPEG (strips metadata/ataques), nombres UUID, protección contra path traversal en
  `find_asset_by_url`, `MAX_CONTENT_LENGTH` limita el body a `MAX_UPLOAD_MB+5` MB (413).
- **Multi-tenancy simple:** todo cuelga de `stores.id`; los endpoints anidados validan que
  el recurso pertenezca a la tienda (404 si no, sin revelar existencia).
- **Auth (fase usuarios):** `users` con email único en minúsculas y `password_hash` bcrypt
  cost 12 (nunca se expone ni se loguea). Sesión = JWT HS256 (clave derivada de `SECRET_KEY`
  con SHA-256, exp 168 h) enviada como `Authorization: Bearer`. Login fallido → 401
  `credenciales_invalidas` genérico (anti-enumeración). Guardas: `@login_required` y
  `optional_user()` en `app/utils/auth.py`.
- **Visibilidad por rol:** cada tienda tiene `owner_id`; los visitantes anónimos del
  storefront solo ven tiendas y productos **publicados**; el dueño ve sus borradores; las
  mutaciones y las paletas requieren sesión + propiedad (ajeno = 404, no revela existencia).
