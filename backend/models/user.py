from datetime import datetime

from werkzeug.security import check_password_hash, generate_password_hash

from extensions import db


class TimestampMixin:
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class User(db.Model, TimestampMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    nickname = db.Column(db.String(50))
    email = db.Column(db.String(120))
    phone = db.Column(db.String(20))
    avatar = db.Column(db.String(255))

    categories = db.relationship("Category", backref="user", lazy=True, cascade="all, delete-orphan")
    transactions = db.relationship("Transaction", backref="user", lazy=True, cascade="all, delete-orphan")
    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_dict(self, absolute_avatar: bool = True) -> dict:
        # 需要请求上下文才能拼接绝对 URL
        from utils.file_handler import FileHandler

        avatar_url = self.avatar
        if absolute_avatar and avatar_url:
            try:
                avatar_url = FileHandler.absolute_url(avatar_url)
            except Exception:
                avatar_url = self.avatar
        return {
            "id": self.id,
            "username": self.username,
            "nickname": self.nickname,
            "email": self.email,
            "phone": self.phone,
            "avatar": avatar_url,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

