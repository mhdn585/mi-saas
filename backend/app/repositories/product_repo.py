from app.models.product import Product
from app.repositories.base import Repository

product_repository: Repository[Product] = Repository(Product)
