def test_create_store_defaults(client):
    resp = client.post(
        "/api/v1/stores", json={"name": "Panadería La Espiga"}
    )
    assert resp.status_code == 201
    body = resp.get_json()
    assert body["id"]
    assert body["name"] == "Panadería La Espiga"
    assert body["currency"] == "USD"
    assert body["description"] == ""
    assert body["logo"] is None
    assert body["createdAt"] == body["updatedAt"]


def test_list_stores(client, make_store):
    make_store(name="Tienda A")
    make_store(name="Tienda B")
    resp = client.get("/api/v1/stores")
    assert resp.status_code == 200
    assert len(resp.get_json()) == 2


def test_get_store_not_found(client):
    resp = client.get("/api/v1/stores/no-existe")
    assert resp.status_code == 404
    assert resp.get_json()["error"]["code"] == "not_found"


def test_update_store_partial(client, make_store):
    store = make_store(name="Original")
    resp = client.patch(
        f"/api/v1/stores/{store['id']}", json={"currency": "MXN"}
    )
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["currency"] == "MXN"
    assert body["name"] == "Original"
    assert body["updatedAt"] >= store["updatedAt"]


def test_update_store_invalid_currency(client, make_store):
    store = make_store()
    resp = client.patch(
        f"/api/v1/stores/{store['id']}", json={"currency": "XYZ"}
    )
    assert resp.status_code == 422


def test_delete_store_cascades_products(client, make_store):
    store = make_store(name="Con productos")
    sid = store["id"]
    p1 = client.post(
        f"/api/v1/stores/{sid}/products",
        json={"name": "P1", "price": 10},
    )
    assert p1.status_code == 201
    resp = client.delete(f"/api/v1/stores/{sid}")
    assert resp.status_code == 204
    assert client.get(f"/api/v1/stores/{sid}").status_code == 404
    assert client.get(f"/api/v1/products/{p1.get_json()['id']}").status_code == 404


def test_create_store_blank_name(client):
    resp = client.post("/api/v1/stores", json={"name": "   "})
    assert resp.status_code == 422
