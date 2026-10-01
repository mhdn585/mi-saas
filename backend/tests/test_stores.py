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


THEME = {
    "bg": "#fff8f0",
    "fg": "#3b2a1a",
    "surface": "#ffffff",
    "muted": "#8a7666",
    "line": "#e5d8cc",
    "accent": "#e8632a",
    "accentFg": "#ffffff",
}


def test_store_theme_defaults_null(client, make_store):
    store = make_store()
    assert store["theme"] is None
    body = client.get(f"/api/v1/stores/{store['id']}").get_json()
    assert body["theme"] is None


def test_update_store_theme(client, make_store):
    store = make_store()
    resp = client.patch(f"/api/v1/stores/{store['id']}", json={"theme": THEME})
    assert resp.status_code == 200
    assert resp.get_json()["theme"] == THEME
    assert client.get(f"/api/v1/stores/{store['id']}").get_json()["theme"] == THEME


def test_update_store_theme_reset(client, make_store):
    store = make_store()
    client.patch(f"/api/v1/stores/{store['id']}", json={"theme": THEME})
    resp = client.patch(f"/api/v1/stores/{store['id']}", json={"theme": None})
    assert resp.status_code == 200
    assert resp.get_json()["theme"] is None


def test_update_store_theme_invalid_hex(client, make_store):
    store = make_store()
    bad = dict(THEME, accent="rojo")
    resp = client.patch(f"/api/v1/stores/{store['id']}", json={"theme": bad})
    assert resp.status_code == 422
    assert client.get(f"/api/v1/stores/{store['id']}").get_json()["theme"] is None


def test_update_store_theme_incomplete(client, make_store):
    store = make_store()
    partial = {k: v for k, v in THEME.items() if k != "accentFg"}
    resp = client.patch(f"/api/v1/stores/{store['id']}", json={"theme": partial})
    assert resp.status_code == 422


def test_create_store_with_theme(client):
    resp = client.post(
        "/api/v1/stores", json={"name": "Con tema", "theme": THEME}
    )
    assert resp.status_code == 201
    assert resp.get_json()["theme"] == THEME
