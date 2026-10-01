def _create_product(client, store_id, **overrides):
    payload = {
        "name": "Pan de campo 500g",
        "description": "Pan rústico horneado a leña",
        "price": 12.5,
        "stock": 20,
        "published": True,
    }
    payload.update(overrides)
    resp = client.post(f"/api/v1/stores/{store_id}/products", json=payload)
    assert resp.status_code == 201
    return resp.get_json()


def test_create_product(client, make_store):
    store = make_store()
    body = _create_product(client, store["id"])
    assert body["id"]
    assert body["storeId"] == store["id"]
    assert body["price"] == 12.5
    assert body["published"] is True


def test_create_product_requires_existing_store(client):
    resp = client.post(
        "/api/v1/stores/inexistente/products",
        json={"name": "X", "price": 1},
    )
    assert resp.status_code == 404


def test_list_products_pagination(client, make_store):
    store = make_store()
    for i in range(3):
        _create_product(client, store["id"], name=f"P{i}")
    resp = client.get(
        f"/api/v1/stores/{store['id']}/products", query_string={"per_page": 2}
    )
    assert resp.status_code == 200
    body = resp.get_json()
    assert len(body["items"]) == 2
    assert body["total"] == 3
    assert body["pages"] == 2


def test_list_products_published_only(client, make_store):
    store = make_store()
    _create_product(client, store["id"], name="Publicado", published=True)
    _create_product(client, store["id"], name="Oculto", published=False)
    resp = client.get(
        f"/api/v1/stores/{store['id']}/products",
        query_string={"published": "true"},
    )
    items = resp.get_json()["items"]
    assert len(items) == 1
    assert items[0]["name"] == "Publicado"


def test_list_products_search(client, make_store):
    store = make_store()
    _create_product(client, store["id"], name="Café torrado")
    _create_product(client, store["id"], name="Té verde")
    resp = client.get(
        f"/api/v1/stores/{store['id']}/products",
        query_string={"search": "caf"},
    )
    items = resp.get_json()["items"]
    assert len(items) == 1
    assert items[0]["name"] == "Café torrado"


def test_update_product_toggle_published_and_stock(client, make_store):
    store = make_store()
    product = _create_product(client, store["id"])
    resp = client.patch(
        f"/api/v1/products/{product['id']}",
        json={"published": False, "stock": 3},
    )
    body = resp.get_json()
    assert body["published"] is False
    assert body["stock"] == 3


def test_get_product_in_store_mismatch(client, make_store):
    store = make_store()
    other = make_store(name="Otra")
    product = _create_product(client, store["id"])
    resp = client.get(
        f"/api/v1/stores/{other['id']}/products/{product['id']}"
    )
    assert resp.status_code == 404


def test_delete_product(client, make_store):
    store = make_store()
    product = _create_product(client, store["id"])
    assert client.delete(f"/api/v1/products/{product['id']}").status_code == 204
    assert client.get(f"/api/v1/products/{product['id']}").status_code == 404


def test_create_product_negative_price(client, make_store):
    resp = client.post(
        f"/api/v1/stores/{make_store()['id']}/products",
        json={"name": "X", "price": -5},
    )
    assert resp.status_code == 422


def test_create_product_negative_stock(client, make_store):
    resp = client.post(
        f"/api/v1/stores/{make_store()['id']}/products",
        json={"name": "X", "price": 1, "stock": -1},
    )
    assert resp.status_code == 422


def test_create_product_too_many_images(client, make_store):
    resp = client.post(
        f"/api/v1/stores/{make_store()['id']}/products",
        json={"name": "X", "price": 1, "images": [f"/media/{i}.jpg" for i in range(13)]},
    )
    assert resp.status_code == 422


def _asset_status(app, asset_id):
    from sqlalchemy import select

    from app.extensions import db
    from app.models.media_asset import MediaAsset

    with app.app_context():
        return db.session.scalar(select(MediaAsset.status).where(MediaAsset.id == asset_id))


def _asset_id_by_url(app, url):
    from sqlalchemy import select

    from app.extensions import db
    from app.models.media_asset import MediaAsset

    filename = url.rsplit("/media/", 1)[-1]
    with app.app_context():
        return db.session.scalar(
            select(MediaAsset.id).where(MediaAsset.filename == filename)
        )


def test_create_product_with_real_images_keeps_order(client, make_store, upload_image):
    store = make_store()
    img1 = upload_image()
    img2 = upload_image()
    body = _create_product(
        client, store["id"], images=[img1["url"], img2["url"]]
    )
    assert body["images"] == [img1["url"], img2["url"]]


def test_create_product_rejects_unknown_image(client, make_store):
    resp = client.post(
        f"/api/v1/stores/{make_store()['id']}/products",
        json={"name": "X", "price": 1, "images": ["/media/no-subida.jpg"]},
    )
    assert resp.status_code == 422
    assert resp.get_json()["error"]["code"] == "validation_error"


def test_create_product_rejects_duplicate_images(client, make_store, upload_image):
    img = upload_image()
    resp = client.post(
        f"/api/v1/stores/{make_store()['id']}/products",
        json={"name": "X", "price": 1, "images": [img["url"], img["url"]]},
    )
    assert resp.status_code == 422


def test_update_product_images_marks_removed_as_orphan(client, app, make_store, upload_image):
    store = make_store()
    img_a = upload_image()
    img_b = upload_image()
    product = _create_product(client, store["id"], images=[img_a["url"], img_b["url"]])

    resp = client.patch(
        f"/api/v1/products/{product['id']}", json={"images": [img_b["url"]]}
    )
    assert resp.status_code == 200
    assert resp.get_json()["images"] == [img_b["url"]]

    asset_a_id = _asset_id_by_url(app, img_a["url"])
    assert _asset_status(app, asset_a_id) == "orphan"


def test_update_product_rereferences_orphan_reactivates(client, app, make_store, upload_image):
    store = make_store()
    img = upload_image()
    product = _create_product(client, store["id"], images=[img["url"]])
    client.patch(f"/api/v1/products/{product['id']}", json={"images": []})
    url_ref = _asset_id_by_url(app, img["url"])
    assert _asset_status(app, url_ref) == "orphan"

    resp = client.patch(
        f"/api/v1/products/{product['id']}", json={"images": [img["url"]]}
    )
    assert resp.status_code == 200
    assert _asset_status(app, url_ref) == "active"


def test_delete_product_marks_assets_orphan_keeps_file(client, app, make_store, upload_image):
    store = make_store()
    img = upload_image()
    product = _create_product(client, store["id"], images=[img["url"]])

    assert client.delete(f"/api/v1/products/{product['id']}").status_code == 204

    asset_id = _asset_id_by_url(app, img["url"])
    assert _asset_status(app, asset_id) == "orphan"
    from pathlib import Path

    media_file = Path(app.config["MEDIA_FOLDER"]) / img["filename"]
    assert media_file.exists()


def test_shared_asset_stays_active_after_deleting_one_product(
    client, app, make_store, upload_image
):
    store = make_store()
    img = upload_image()
    p1 = _create_product(client, store["id"], name="P1", images=[img["url"]])
    _create_product(client, store["id"], name="P2", images=[img["url"]])

    client.delete(f"/api/v1/products/{p1['id']}")
    asset_id = _asset_id_by_url(app, img["url"])
    assert _asset_status(app, asset_id) == "active"


def test_cleanup_orphans_deletes_after_grace(client, app, make_store, upload_image):
    from pathlib import Path
    from time import time

    from sqlalchemy import update

    from app.extensions import db
    from app.models.media_asset import MediaAsset
    from app.services import media_service

    img = upload_image()
    media_file = Path(app.config["MEDIA_FOLDER"]) / img["filename"]
    assert media_file.exists()

    resp = client.post(
        f"/api/v1/stores/{make_store()['id']}/products",
        json={"name": "X", "price": 1, "images": [img["url"]]},
    )
    product_id = resp.get_json()["id"]
    client.delete(f"/api/v1/products/{product_id}")

    old_ms = int((time() - 10 * 86400) * 1000)
    with app.app_context():
        db.session.execute(update(MediaAsset).values(updated_at=old_ms))
        db.session.commit()

    with app.app_context():
        result = media_service.cleanup_orphans(grace_days=7)
    assert result["deleted"] == 1
    assert not media_file.exists()
    asset_id = _asset_id_by_url(app, img["url"])
    assert _asset_status(app, asset_id) == "deleted"
