from marshmallow import ValidationError, fields, validate

from app.config import CURRENCIES
from app.schemas._base import TrimmingSchema

HEX_COLOR_RE = r"^#[0-9a-fA-F]{6}$"


def _non_blank(value):
    if value is None or not str(value).strip():
        raise ValidationError("El campo no puede estar vacío")


def _hex_field():
    return fields.String(
        required=True,
        validate=validate.Regexp(HEX_COLOR_RE, error="Debe ser un color hex #rrggbb"),
    )


class StoreThemeSchema(TrimmingSchema):
    """Tema completo (los 7 tokens resueltos) de la tienda pública."""

    bg = _hex_field()
    fg = _hex_field()
    surface = _hex_field()
    muted = _hex_field()
    line = _hex_field()
    accent = _hex_field()
    accentFg = _hex_field()


class StoreCreateSchema(TrimmingSchema):
    trim_fields = ("name", "description")

    name = fields.String(
        required=True, validate=[_non_blank, validate.Length(max=60)]
    )
    description = fields.String(load_default="", validate=validate.Length(max=280))
    currency = fields.String(load_default="USD", validate=validate.OneOf(CURRENCIES))
    logo = fields.String(allow_none=True, load_default=None)
    theme = fields.Nested(StoreThemeSchema, allow_none=True, load_default=None)


class StoreUpdateSchema(TrimmingSchema):
    trim_fields = ("name", "description")

    name = fields.String(validate=[_non_blank, validate.Length(max=60)])
    description = fields.String(validate=validate.Length(max=280))
    currency = fields.String(validate=validate.OneOf(CURRENCIES))
    logo = fields.String(allow_none=True)
    theme = fields.Nested(StoreThemeSchema, allow_none=True)
