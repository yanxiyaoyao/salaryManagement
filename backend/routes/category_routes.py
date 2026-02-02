"""分类管理接口。"""

from flask import Blueprint, g, request
from sqlalchemy import func

from extensions import db
from models import Category, Transaction
from utils.responses import bad_request, conflict, not_found, success


category_bp = Blueprint("category_bp", __name__, url_prefix="/api/categories")


@category_bp.get("")
def list_categories():
    """获取分类列表，支持分页、类型筛选、关键词搜索。"""
    user_id = g.user_id
    page = max(int(request.args.get("page", 1)), 1)
    size = min(max(int(request.args.get("size", 10)), 1), 100)

    query = Category.query.filter_by(user_id=user_id)

    type_param = request.args.get("type")
    if type_param:
        query = query.filter(Category.type == type_param)

    kw = request.args.get("kw")
    if kw:
        query = query.filter(Category.name.ilike(f"%{kw}%"))

    total = query.count()
    items = (
        query.order_by(Category.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )

    data = {
        "items": [c.to_dict() for c in items],
        "total": total,
        "page": page,
        "size": size,
    }
    return success("获取成功", data)


@category_bp.post("")
def create_category():
    """创建分类。"""
    user_id = g.user_id
    payload = request.get_json(silent=True) or {}
    name = (payload.get("name") or "").strip()
    type_ = (payload.get("type") or "").strip()
    color = payload.get("color")
    if color:
        color = color.strip() or None
    icon = payload.get("icon")
    if icon:
        icon = icon.strip() or None

    if not name or type_ not in {"expense", "income"}:
        return bad_request("名称和类型不能为空，类型必须是 expense/income")

    exists = Category.query.filter_by(user_id=user_id, name=name, type=type_).first()
    if exists:
        return conflict("同类型下已存在相同名称的分类")

    category = Category(user_id=user_id, name=name, type=type_, color=color, icon=icon)
    db.session.add(category)
    db.session.commit()

    return success("分类创建成功", category.to_dict())


@category_bp.put("/<int:category_id>")
def update_category(category_id: int):
    """更新分类。"""
    user_id = g.user_id
    category = Category.query.filter_by(id=category_id, user_id=user_id).first()
    if not category:
        return not_found("分类不存在")

    payload = request.get_json(silent=True) or {}
    name = payload.get("name")
    type_ = payload.get("type")
    color = payload.get("color")
    icon = payload.get("icon")

    # 校验类型
    if type_ is not None:
        type_ = type_.strip()
        if type_ not in {"expense", "income"}:
            return bad_request("类型必须是 expense/income")

    # 校验名称并检查唯一性（考虑可能修改类型）
    if name is not None:
        name = name.strip()
        if not name:
            return bad_request("分类名称不能为空")
        check_type = type_ if type_ else category.type
        exists = (
            Category.query.filter_by(user_id=user_id, type=check_type, name=name)
            .filter(Category.id != category.id)
            .first()
        )
        if exists:
            return conflict("同类型下已存在相同名称的分类")
        category.name = name

    if type_ is not None:
        category.type = type_

    if color is not None:
        category.color = color.strip() or None
    if icon is not None:
        category.icon = icon.strip() or None

    db.session.commit()
    return success("更新成功", category.to_dict())


@category_bp.delete("/<int:category_id>")
def delete_category(category_id: int):
    """删除分类，若已关联交易则阻止删除。"""
    user_id = g.user_id
    category = Category.query.filter_by(id=category_id, user_id=user_id).first()
    if not category:
        return not_found("分类不存在")

    used = (
        Transaction.query.filter_by(user_id=user_id, category_id=category_id)
        .with_entities(func.count(Transaction.id))
        .scalar()
    )
    if used:
        return conflict("分类已被使用，无法删除")

    db.session.delete(category)
    db.session.commit()
    return success("删除成功")

