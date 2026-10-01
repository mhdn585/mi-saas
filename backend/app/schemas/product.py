from decimal import ROUND_HALF_UP

from marshmallow import ValidationError, fields, validate

from app.schemas._base import TrimmingSchema

MAX_PRODUCT_IMAGES = 12


def _non_blank(value):
    if value is None or not str(value).strip():
        raise ValidationError("El campo no puede estar vacío")


class ProductCreateSchema(TrimmingSchema):
    trim_fields = ("name", "description")

    name = fields.String(
        required=True, validate=[_non_blank, validate.Length(max=80)]
    )
    description = fields.String(load_default="", validate=validate.Length(max=1000))
    price = fields.Decimal(
        required=True,
        places=2,
        rounding=ROUND_HALF_UP,
        validate=validate.Range(min=0),
    )
    stock = fields.Integer(load_default=0, validate=validate.Range(min=0))
    images = fields.List(
        fields.String(),
        load_default=list,
        validate=validate.Length(max=MAX_PRODUCT_IMAGES),
    )
    published = fields.Boolean(load_default=True)


class ProductUpdateSchema(TrimmingSchema):
    trim_fields = ("name", "description")

    name = fields.String(validate=[_non_blank, validate.Length(max=80)])
    description = fields.String(validate=validate.Length(max=1000))
    price = fields.Decimal(
        places=2, rounding=ROUND_HALF_UP, validate=validate.Range(min=0)
    )
    stock = fields.Integer(validate=validate.Range(min=0))
    images = fields.List(
        fields.String(), validate=validate.Length(max=MAX_PRODUCT_IMAGES)
    )
    published = fields.Boolean()
