from app.extensions import db
from app.models.store import Store
from app.repositories.base import Repository


class StoreRepository(Repository[Store]):
    def find_by_owner(self, owner_id: str) -> list[Store]:
        return (
            db.session.query(Store)
            .filter(Store.owner_id == owner_id)
            .order_by(Store.created_at.desc())
            .all()
        )


store_repository: StoreRepository = StoreRepository(Store)
