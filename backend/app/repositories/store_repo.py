from app.models.store import Store
from app.repositories.base import Repository

store_repository: Repository[Store] = Repository(Store)
