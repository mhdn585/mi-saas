from __future__ import annotations

from collections.abc import Callable
from typing import Generic, TypeVar

from app.extensions import db

T = TypeVar("T")


class Repository(Generic[T]):
    def __init__(self, model: type[T]):
        self.model = model

    def find_all(self) -> list[T]:
        return db.session.query(self.model).all()

    def find_by_id(self, item_id: str) -> T | None:
        return db.session.get(self.model, item_id)

    def find_where(self, predicate: Callable[[T], bool]) -> list[T]:
        return [item for item in self.find_all() if predicate(item)]

    def create(self, data: dict) -> T:
        item = self.model(**data)
        db.session.add(item)
        db.session.commit()
        return item

    def update(self, item_id: str, patch: dict) -> T | None:
        item = self.find_by_id(item_id)
        if item is None:
            return None
        for key, value in patch.items():
            if key in {"id", "created_at"}:
                continue
            if hasattr(item, key):
                setattr(item, key, value)
        db.session.commit()
        return item

    def remove(self, item_id: str) -> bool:
        item = self.find_by_id(item_id)
        if item is None:
            return False
        db.session.delete(item)
        db.session.commit()
        return True

    def remove_where(self, predicate: Callable[[T], bool]) -> int:
        items = self.find_where(predicate)
        for item in items:
            db.session.delete(item)
        db.session.commit()
        return len(items)
