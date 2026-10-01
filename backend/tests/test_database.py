from sqlalchemy.exc import IntegrityError

from app.extensions import db
from app.models.media_asset import MediaAsset
from app.models.product import Product
from app.models.product_image import ProductImage
from app.models.store import Store


def _store(**kw) -> Store:
    defaults = {"name": "T", "description": "", "currency": "USD"}
    defaults.update(kw)
    return Store(**defaults)


def _product(store_id, **kw) -> Product:
    defaults = {"store_id": store_id, "name": "P", "price": 10, "stock": 1}
    defaults.update(kw)
    return Product(**defaults)


def _commit_or_rollback(stmt_fn):
    try:
        stmt_fn()
        db.session.commit()
        return None
    except IntegrityError as exc:
        db.session.rollback()
        return exc.orig.pgcode if exc.orig is not None else "integrity"


def test_store_name_blank_rejected_by_db(app):
    with app.app_context():
        code = _commit_or_rollback(lambda: db.session.add(_store(name="   ")))
    assert code == "23514"  # check_violation


def test_store_currency_invalid_rejected_by_db(app):
    with app.app_context():
        code = _commit_or_rollback(lambda: db.session.add(_store(currency="XXX")))
    assert code == "23514"


def test_product_negative_price_rejected_by_db(app, make_store):
    store_id = make_store()["id"]
    with app.app_context():
        code = _commit_or_rollback(lambda: db.session.add(_product(store_id, price=-1)))
    assert code == "23514"


def test_product_negative_stock_rejected_by_db(app, make_store):
    store_id = make_store()["id"]
    with app.app_context():
        code = _commit_or_rollback(lambda: db.session.add(_product(store_id, stock=-5)))
    assert code == "23514"


def test_product_requires_existing_store(app):
    with app.app_context():
        code = _commit_or_rollback(lambda: db.session.add(_product("store-inexistente")))
    assert code == "23503"  # foreign_key_violation


def test_store_delete_cascades_products_and_images(app, make_store, upload_image):
    store_id = make_store()["id"]
    img = upload_image()
    with app.app_context():
        asset = db.session.scalar(
            db.select(MediaAsset).where(MediaAsset.filename == img["filename"])
        )
        product = _product(store_id)
        db.session.add(product)
        db.session.flush()
        db.session.add(
            ProductImage(product_id=product.id, media_asset_id=asset.id, position=0)
        )
        store = db.session.get(Store, store_id)
        db.session.delete(store)
        db.session.commit()
        assert db.session.scalar(db.select(db.func.count(Product.id))) == 0
        assert db.session.scalar(db.select(db.func.count(ProductImage.product_id))) == 0


def test_media_asset_in_use_cannot_be_deleted_directly(app, upload_image, make_store):
    from sqlalchemy import delete as sa_delete

    img = upload_image()
    with app.app_context():
        asset = db.session.scalar(
            db.select(MediaAsset).where(MediaAsset.filename == img["filename"])
        )
        product = _product(make_store()["id"])
        db.session.add(product)
        db.session.flush()
        db.session.add(
            ProductImage(product_id=product.id, media_asset_id=asset.id, position=0)
        )
        db.session.commit()

        def _delete():
            db.session.execute(
                sa_delete(MediaAsset).where(MediaAsset.id == asset.id)
            )

        code = _commit_or_rollback(_delete)
    assert code == "23503"


def test_media_asset_referenced_by_two_products_allowed(app, make_store, upload_image):
    img = upload_image()
    s1, s2 = make_store()["id"], make_store()["id"]
    with app.app_context():
        asset = db.session.scalar(
            db.select(MediaAsset).where(MediaAsset.filename == img["filename"])
        )
        p1, p2 = _product(s1), _product(s2)
        db.session.add_all([p1, p2])
        db.session.flush()
        db.session.add_all(
            [
                ProductImage(product_id=p1.id, media_asset_id=asset.id, position=0),
                ProductImage(product_id=p2.id, media_asset_id=asset.id, position=0),
            ]
        )
        db.session.commit()
        links = db.session.scalars(
            db.select(ProductImage).where(ProductImage.media_asset_id == asset.id)
        ).all()
        assert len(links) == 2


def test_product_images_unique_position(app, make_store, upload_image):
    store_id = make_store()["id"]
    img1, img2 = upload_image(), upload_image()
    with app.app_context():
        a1 = db.session.scalar(
            db.select(MediaAsset).where(MediaAsset.filename == img1["filename"])
        )
        a2 = db.session.scalar(
            db.select(MediaAsset).where(MediaAsset.filename == img2["filename"])
        )
        product = _product(store_id)
        db.session.add(product)
        db.session.flush()
        db.session.add(
            ProductImage(product_id=product.id, media_asset_id=a1.id, position=0)
        )
        db.session.flush()

        def _dup():
            db.session.add(
                ProductImage(product_id=product.id, media_asset_id=a2.id, position=0)
            )
            db.session.flush()

        code = _commit_or_rollback(_dup)
    assert code == "23505"  # unique_violation
