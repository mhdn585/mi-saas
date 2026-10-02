from marshmallow import ValidationError, fields, validate

from app.config import PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH
from app.schemas._base import TrimmingSchema


def _non_blank(value):
    if value is None or not str(value).strip():
        raise ValidationError("El campo no puede estar vacío")


class RegisterSchema(TrimmingSchema):
    trim_fields = ("name", "email")

    name = fields.String(
        required=True, validate=[_non_blank, validate.Length(max=60)]
    )
    email = fields.String(
        required=True, validate=[validate.Email(), validate.Length(max=254)]
    )
    password = fields.String(
        required=True,
        load_only=True,
        validate=validate.Length(
            min=PASSWORD_MIN_LENGTH, max=PASSWORD_MAX_LENGTH
        ),
    )


class LoginSchema(TrimmingSchema):
    trim_fields = ("email",)

    email = fields.String(required=True, validate=[validate.Email()])
    password = fields.String(required=True, load_only=True)
