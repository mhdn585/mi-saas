from flask import Blueprint, request

from app.errors import ValidationError
from app.services import media_service
from app.utils.auth import login_required

bp = Blueprint("media", __name__)


@bp.post("/media")
@login_required
def upload_media():
    if "file" not in request.files:
        raise ValidationError("Falta el campo 'file' en la petición.")
    file_storage = request.files["file"]
    if file_storage is None or not file_storage.filename:
        raise ValidationError("No se ha enviado ningún archivo.")
    result = media_service.save_upload(file_storage)
    return result, 201
