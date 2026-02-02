from datetime import datetime, date

from extensions import db


class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    type = db.Column(db.String(10), nullable=False)
    amount_cents = db.Column(db.Integer, nullable=False)
    currency = db.Column(db.String(3), default="CNY")
    occurred_on = db.Column(db.Date, nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey("category.id"))
    note = db.Column(db.Text)
    tags = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        db.Index("idx_transaction_user", "user_id"),
        db.Index("idx_transaction_date", "occurred_on"),
    )

    @classmethod
    def validate_payload(cls, payload: dict, is_update: bool = False):
        """校验交易入参。"""
        required_fields = ["type", "amount", "category_id", "occurred_on"]
        if not is_update:
            for field in required_fields:
                if payload.get(field) in (None, ""):
                    return False, f"{field} 不能为空"

        tx_type = payload.get("type")
        if tx_type and tx_type not in {"expense", "income"}:
            return False, "type 只能是 expense 或 income"

        amount = payload.get("amount")
        if amount is not None:
            try:
                amt = float(amount)
            except (TypeError, ValueError):
                return False, "amount 必须是数字"
            if amt <= 0:
                return False, "amount 必须为正数"

        occurred_on = payload.get("occurred_on")
        if occurred_on:
            try:
                datetime.strptime(occurred_on, "%Y-%m-%d").date()
            except ValueError:
                return False, "occurred_on 格式应为 YYYY-MM-DD"

        return True, ""

    def to_dict(self) -> dict:
        amount = self.amount_cents / 100.0
        return {
            "id": self.id,
            "type": self.type,
            "amount": amount,
            "currency": self.currency,
            "occurred_on": self.occurred_on.isoformat(),
            "category": self.category.to_dict() if self.category else None,
            "note": self.note,
            "tags": self.tags,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

