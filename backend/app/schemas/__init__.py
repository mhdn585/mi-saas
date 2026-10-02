from app.schemas.auth import LoginSchema, RegisterSchema
from app.schemas.palette import PaletteCreateSchema, PaletteUpdateSchema
from app.schemas.product import ProductCreateSchema, ProductUpdateSchema
from app.schemas.store import (
    StoreCreateSchema,
    StoreThemeSchema,
    StoreUpdateSchema,
)

__all__ = [
    "LoginSchema",
    "PaletteCreateSchema",
    "PaletteUpdateSchema",
    "ProductCreateSchema",
    "ProductUpdateSchema",
    "RegisterSchema",
    "StoreCreateSchema",
    "StoreThemeSchema",
    "StoreUpdateSchema",
]
