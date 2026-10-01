from marshmallow import ValidationError, fields, validate

from app.schemas._base import TrimmingSchema
from app.schemas.store import StoreThemeSchema


def _non_blank(value):
    if value is None or not str(value).strip():
        raise ValidationError("El campo no puede estar vacío")


class PaletteCreateSchema(TrimmingSchema):
    trim_fields = ("name",)

    name = fields.String(
        required=True, validate=[_non_blank, validate.Length(max=40)]
    )
    colors = fields.Nested(StoreThemeSchema, required=True)


class PaletteUpdateSchema(TrimmingSchema):
    trim_fields = ("name",)

    name = fields.String(validate=[_non_blank, validate.Length(max=40)])
    colors = fields.Nested(StoreThemeSchema)
