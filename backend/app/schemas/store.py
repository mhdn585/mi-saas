from marshmallow import ValidationError, fields, validate

from app.config import CURRENCIES
from app.schemas._base import TrimmingSchema


def _non_blank(value):
    if value is None or not str(value).strip():
        raise ValidationError("El campo no puede estar vacío")


class StoreCreateSchema(TrimmingSchema):
    trim_fields = ("name", "description")

    name = fields.String(
        required=True, validate=[_non_blank, validate.Length(max=60)]
    )
    description = fields.String(load_default="", validate=validate.Length(max=280))
    currency = fields.String(load_default="USD", validate=validate.OneOf(CURRENCIES))
    logo = fields.String(allow_none=True, load_default=None)


class StoreUpdateSchema(TrimmingSchema):
    trim_fields = ("name", "description")

    name = fields.String(validate=[_non_blank, validate.Length(max=60)])
    description = fields.String(validate=validate.Length(max=280))
    currency = fields.String(validate=validate.OneOf(CURRENCIES))
    logo = fields.String(allow_none=True)
