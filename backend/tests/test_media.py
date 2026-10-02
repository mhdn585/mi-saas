import io

from PIL import Image


def _png_bytes(color=(255, 0, 0), size=(40, 40)):
    buf = io.BytesIO()
    Image.new("RGB", size, color).save(buf, "PNG")
    buf.seek(0)
    return buf


def test_upload_image_success(auth_client):
    resp = auth_client.post(
        "/api/v1/media",
        data={"file": (_png_bytes(), "foto.png")},
        content_type="multipart/form-data",
    )
    assert resp.status_code == 201
    body = resp.get_json()
    assert body["url"].startswith("/media/")
    assert body["filename"].endswith(".jpg")


def test_uploaded_image_is_served(auth_client):
    upload = auth_client.post(
        "/api/v1/media",
        data={"file": (_png_bytes(), "foto.png")},
        content_type="multipart/form-data",
    ).get_json()
    resp = auth_client.get(upload["url"])
    assert resp.status_code == 200


def test_upload_missing_file_field(auth_client):
    resp = auth_client.post("/api/v1/media", content_type="multipart/form-data")
    assert resp.status_code == 422


def test_upload_non_image_rejected(auth_client):
    data = io.BytesIO(b"esto no es una imagen")
    resp = auth_client.post(
        "/api/v1/media",
        data={"file": (data, "truco.txt")},
        content_type="multipart/form-data",
    )
    assert resp.status_code == 422


def test_health(auth_client):
    resp = auth_client.get("/api/v1/health")
    assert resp.status_code == 200
    assert resp.get_json() == {"status": "ok"}


def _asset_by_filename(app, filename):
    from sqlalchemy import select

    from app.extensions import db
    from app.models.media_asset import MediaAsset

    with app.app_context():
        return db.session.scalar(
            select(MediaAsset).where(MediaAsset.filename == filename)
        )


def test_upload_registers_media_asset(auth_client, app):
    upload = auth_client.post(
        "/api/v1/media",
        data={"file": (_png_bytes(size=(80, 40)), "foto.png")},
        content_type="multipart/form-data",
    ).get_json()

    asset = _asset_by_filename(app, upload["filename"])
    assert asset is not None
    assert asset.status == "active"
    assert asset.mime_type == "image/jpeg"
    assert asset.format == "JPEG"
    assert asset.width == 80
    assert asset.height == 40
    assert asset.size_bytes > 0
    assert asset.url == upload["url"]


def test_invalid_upload_does_not_create_asset(auth_client, app):
    data = io.BytesIO(b"texto sin imagen")
    resp = auth_client.post(
        "/api/v1/media",
        data={"file": (data, "nota.txt")},
        content_type="multipart/form-data",
    )
    assert resp.status_code == 422
    with app.app_context():
        from sqlalchemy import func, select

        from app.extensions import db
        from app.models.media_asset import MediaAsset

        count = db.session.scalar(select(func.count()).select_from(MediaAsset))
    assert count == 0


def test_store_logo_referenced_and_orphaned_on_delete(auth_client, app, upload_image, make_store):
    img = upload_image()
    store = make_store(logo=img["url"])
    assert store["logo"] == img["url"]

    asset = _asset_by_filename(app, img["filename"])
    assert asset is not None
    assert asset.status == "active"

    resp = auth_client.delete(f"/api/v1/stores/{store['id']}")
    assert resp.status_code == 204

    from pathlib import Path

    assert Path(app.config["MEDIA_FOLDER"], img["filename"]).exists()
    assert _asset_by_filename(app, img["filename"]).status == "orphan"


def test_store_logo_rejects_unknown_url(auth_client, make_store):
    resp = auth_client.patch(
        f"/api/v1/stores/{make_store()['id']}",
        json={"logo": "/media/jamas-subida.jpg"},
    )
    assert resp.status_code == 422


def test_store_logo_change_orphans_previous(auth_client, app, upload_image, make_store):
    logo1 = upload_image()
    logo2 = upload_image()
    store = make_store(logo=logo1["url"])
    resp = auth_client.patch(
        f"/api/v1/stores/{store['id']}", json={"logo": logo2["url"]}
    )
    assert resp.status_code == 200
    assert resp.get_json()["logo"] == logo2["url"]
    assert _asset_by_filename(app, logo1["filename"]).status == "orphan"
    assert _asset_by_filename(app, logo2["filename"]).status == "active"


def test_upload_requires_auth(client):
    resp = client.post(
        "/api/v1/media",
        data={"file": (_png_bytes(), "foto.png")},
        content_type="multipart/form-data",
    )
    assert resp.status_code == 401
    assert resp.get_json()["error"]["code"] == "no_autenticado"
