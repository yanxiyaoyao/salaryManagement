"""交易管理接口。"""

from datetime import datetime, date

from flask import Blueprint, g, request
from sqlalchemy import and_, or_

from extensions import db
from models import Category, Transaction
from utils.responses import bad_request, not_found, success


transaction_bp = Blueprint("transaction_bp", __name__, url_prefix="/api/transactions")


def _validate_payload(payload: dict, is_update: bool = False):
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

    return True, ""


@transaction_bp.get("")
def list_transactions():
    """获取交易列表，支持分页、类型、分类、日期范围和关键词筛选。"""
    user_id = g.user_id
    page = max(int(request.args.get("page", 1)), 1)
    size = min(max(int(request.args.get("size", 20)), 1), 100)

    query = Transaction.query.filter_by(user_id=user_id)

    tx_type = request.args.get("type")
    if tx_type:
        query = query.filter(Transaction.type == tx_type)

    category_id = request.args.get("category_id")
    if category_id:
        query = query.filter(Transaction.category_id == int(category_id))

    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    if start_date:
        try:
            query = query.filter(Transaction.occurred_on >= datetime.strptime(start_date, "%Y-%m-%d").date())
        except ValueError:
            return bad_request("start_date 格式应为 YYYY-MM-DD")
    if end_date:
        try:
            query = query.filter(Transaction.occurred_on <= datetime.strptime(end_date, "%Y-%m-%d").date())
        except ValueError:
            return bad_request("end_date 格式应为 YYYY-MM-DD")

    keyword = request.args.get("keyword")
    if keyword:
        kw = f"%{keyword}%"
        query = query.filter(or_(Transaction.note.ilike(kw), Transaction.tags.ilike(kw)))

    total = query.count()
    items = (
        query.order_by(Transaction.occurred_on.desc(), Transaction.id.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )

    data = {
        "items": [t.to_dict() for t in items],
        "page": page,
        "size": size,
        "total": total,
        "pages": (total + size - 1) // size,
    }
    return success("获取成功", data)


@transaction_bp.post("")
def create_transaction():
    """创建交易。"""
    user_id = g.user_id
    payload = request.get_json(silent=True) or {}

    ok, msg = Transaction.validate_payload(payload, is_update=False)
    if not ok:
        return bad_request(msg)

    category_id = int(payload.get("category_id"))
    category = Category.query.filter_by(id=category_id, user_id=user_id).first()
    if not category:
        return not_found("分类不存在")

    occurred_on = datetime.strptime(payload["occurred_on"], "%Y-%m-%d").date()
    amount_cents = int(round(float(payload["amount"]) * 100))

    tx = Transaction(
        user_id=user_id,
        type=payload["type"],
        amount_cents=amount_cents,
        occurred_on=occurred_on,
        category_id=category_id,
        note=(payload.get("note") or "").strip() or None,
        tags=(payload.get("tags") or "").strip() or None,
        currency=(payload.get("currency") or "CNY").strip() or "CNY",
    )
    db.session.add(tx)
    db.session.commit()

    return success("创建成功", tx.to_dict())


@transaction_bp.put("/<int:tx_id>")
def update_transaction(tx_id: int):
    """更新交易。"""
    user_id = g.user_id
    tx = Transaction.query.filter_by(id=tx_id, user_id=user_id).first()
    if not tx:
        return not_found("交易不存在")

    payload = request.get_json(silent=True) or {}
    ok, msg = Transaction.validate_payload(payload, is_update=True)
    if not ok:
        return bad_request(msg)

    if "type" in payload and payload["type"]:
        tx.type = payload["type"]

    if "amount" in payload and payload["amount"] is not None:
        tx.amount_cents = int(round(float(payload["amount"]) * 100))

    if "occurred_on" in payload and payload["occurred_on"]:
        tx.occurred_on = datetime.strptime(payload["occurred_on"], "%Y-%m-%d").date()

    if "category_id" in payload and payload["category_id"]:
        cat_id = int(payload["category_id"])
        category = Category.query.filter_by(id=cat_id, user_id=user_id).first()
        if not category:
            return not_found("分类不存在")
        tx.category_id = cat_id

    if "note" in payload:
        tx.note = (payload.get("note") or "").strip() or None
    if "tags" in payload:
        tx.tags = (payload.get("tags") or "").strip() or None
    if "currency" in payload and payload["currency"]:
        tx.currency = payload["currency"]

    db.session.commit()
    return success("更新成功", tx.to_dict())


@transaction_bp.delete("/<int:tx_id>")
def delete_transaction(tx_id: int):
    """删除交易。"""
    user_id = g.user_id
    tx = Transaction.query.filter_by(id=tx_id, user_id=user_id).first()
    if not tx:
        return not_found("交易不存在")

    db.session.delete(tx)
    db.session.commit()
    return success("删除成功")

