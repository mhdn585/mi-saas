import time
import uuid

from app.extensions import db


def _now_ms() -> int:
    return int(time.time() * 1000)


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(60), nullable=False)
    # El email se guarda normalizado en minúsculas (único e identificable).
    email = db.Column(db.String(254), nullable=False, unique=True)
    # Hash bcrypt (60 chars). NUNCA se expone ni se loguea.
    password_hash = db.Column(db.String(128), nullable=False)
    created_at = db.Column(db.BigInteger, default=_now_ms, nullable=False)
    updated_at = db.Column(
        db.BigInteger, default=_now_ms, onupdate=_now_ms, nullable=False
    )

    __table_args__ = (
        db.CheckConstraint("TRIM(name) <> ''", name="name_not_blank"),
        db.CheckConstraint("TRIM(email) <> ''", name="email_not_blank"),
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "createdAt": self.created_at,
            "updatedAt": self.updated_at,
        }
