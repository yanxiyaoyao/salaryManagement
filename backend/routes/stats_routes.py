"""统计与概览接口，支撑前端仪表盘。"""

from datetime import date, datetime, timedelta

from flask import Blueprint, g, request
from sqlalchemy import func, case, extract

from extensions import db
from models import Category, Transaction
from utils.responses import bad_request, success


stats_bp = Blueprint("stats_bp", __name__, url_prefix="/api/statistics")


def _parse_date(value: str):
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        return None


@stats_bp.get("/summary")
def summary():
    """汇总统计，含当前区间与上一期间对比。默认最近30天。"""
    user_id = g.user_id
    end_date = _parse_date(request.args.get("end_date")) or date.today()
    start_date = _parse_date(request.args.get("start_date")) or (end_date - timedelta(days=29))

    prev_start = start_date - (end_date - start_date) - timedelta(days=1)
    prev_end = start_date - timedelta(days=1)

    def _calc(start, end):
        totals = (
            db.session.query(
                func.coalesce(func.sum(case((Transaction.type == "income", Transaction.amount_cents), else_=0)), 0).label("income"),
                func.coalesce(func.sum(case((Transaction.type == "expense", Transaction.amount_cents), else_=0)), 0).label("expense"),
            )
            .filter(
                Transaction.user_id == user_id,
                Transaction.occurred_on >= start,
                Transaction.occurred_on <= end,
            )
            .first()
        )
        income_cents = totals.income or 0
        expense_cents = totals.expense or 0
        return {
            "income": income_cents / 100.0,
            "expense": expense_cents / 100.0,
            "net": (income_cents - expense_cents) / 100.0,
        }

    data = {
        "range": {"start_date": start_date.isoformat(), "end_date": end_date.isoformat()},
        "totals": _calc(start_date, end_date),
        "prev_totals": _calc(prev_start, prev_end),
    }
    return success("获取成功", data)


@stats_bp.get("/monthly")
def monthly():
    """按月汇总最近 N 个月（默认6）。"""
    user_id = g.user_id
    months = min(max(int(request.args.get("months", 6)), 1), 24)
    today = date.today()

    # 生成目标月份列表（年, 月）
    month_list = []
    y, m = today.year, today.month
    for _ in range(months):
        month_list.append((y, m))
        m -= 1
        if m == 0:
            m = 12
            y -= 1
    month_list = list(reversed(month_list))

    # 计算范围起始日期
    first_year, first_month = month_list[0]
    range_start = date(first_year, first_month, 1)
    range_end = today

    rows = (
        db.session.query(
            extract("year", Transaction.occurred_on).label("y"),
            extract("month", Transaction.occurred_on).label("m"),
            func.coalesce(func.sum(case((Transaction.type == "income", Transaction.amount_cents), else_=0)), 0).label("income"),
            func.coalesce(func.sum(case((Transaction.type == "expense", Transaction.amount_cents), else_=0)), 0).label("expense"),
        )
        .filter(Transaction.user_id == user_id)
        .filter(
            Transaction.occurred_on >= range_start,
            Transaction.occurred_on <= range_end,
        )
        .group_by("y", "m")
        .all()
    )

    # 转为 dict 方便查找
    data_map = {(int(r.y), int(r.m)): r for r in rows}
    items = []
    for y, m in month_list:
        r = data_map.get((y, m))
        income = (r.income if r else 0) / 100.0
        expense = (r.expense if r else 0) / 100.0
        items.append({"year": y, "month": m, "income": income, "expense": expense, "net": income - expense})

    return success("获取成功", {"items": items})


@stats_bp.get("/category-pie")
def category_pie():
    """本月支出分类占比。"""
    user_id = g.user_id
    today = date.today()
    start = today.replace(day=1)
    rows = (
        db.session.query(
            Category.name,
            func.coalesce(func.sum(Transaction.amount_cents), 0).label("amount"),
        )
        .join(Category, Category.id == Transaction.category_id)
        .filter(
            Transaction.user_id == user_id,
            Transaction.type == "expense",
            Transaction.occurred_on >= start,
            Transaction.occurred_on <= today,
        )
        .group_by(Category.id)
        .all()
    )
    items = [{"name": r[0], "amount": r[1] / 100.0} for r in rows]
    return success("获取成功", {"items": items})


@stats_bp.get("/annual")
def annual():
    """当前年份汇总。"""
    user_id = g.user_id
    year = int(request.args.get("year", date.today().year))
    start = date(year, 1, 1)
    end = date(year, 12, 31)
    totals = (
        db.session.query(
            func.coalesce(func.sum(case((Transaction.type == "income", Transaction.amount_cents), else_=0)), 0).label("income"),
            func.coalesce(func.sum(case((Transaction.type == "expense", Transaction.amount_cents), else_=0)), 0).label("expense"),
        )
        .filter(
            Transaction.user_id == user_id,
            Transaction.occurred_on >= start,
            Transaction.occurred_on <= end,
        )
        .first()
    )
    income_cents = totals.income or 0
    expense_cents = totals.expense or 0
    data = {
        "year": year,
        "totals": {
            "income": income_cents / 100.0,
            "expense": expense_cents / 100.0,
            "net": (income_cents - expense_cents) / 100.0,
        },
    }
    return success("获取成功", data)


@stats_bp.get("/trend")
def trend():
    """
    收支趋势数据，支持按天/按月/按年。
    前端入参：
      - granularity: day | month | year
      - day: start_date, end_date
      - month: months (默认6，最近N个月)
      - year: years (默认5，最近N年)
    返回字段：period, income, expense
    """
    user_id = g.user_id
    granularity = request.args.get("granularity", "day")

    if granularity == "day":
        start_date = _parse_date(request.args.get("start_date")) or (date.today() - timedelta(days=29))
        end_date = _parse_date(request.args.get("end_date")) or date.today()
        if start_date > end_date:
            return bad_request("开始日期不能晚于结束日期")
        group_expr = Transaction.occurred_on
        rows = (
            db.session.query(
                group_expr.label("period"),
                func.coalesce(func.sum(case((Transaction.type == "income", Transaction.amount_cents), else_=0)), 0).label("income"),
                func.coalesce(func.sum(case((Transaction.type == "expense", Transaction.amount_cents), else_=0)), 0).label("expense"),
            )
            .filter(
                Transaction.user_id == user_id,
                Transaction.occurred_on >= start_date,
                Transaction.occurred_on <= end_date,
            )
            .group_by("period")
            .order_by("period")
            .all()
        )
        items = [
            {
                "period": r.period.isoformat(),
                "income": (r.income or 0) / 100.0,
                "expense": (r.expense or 0) / 100.0,
            }
            for r in rows
        ]
        return success("获取成功", {"items": items})

    if granularity == "month":
        months = min(max(int(request.args.get("months", 6)), 1), 36)
        today = date.today()
        # 生成最近 N 个月的 (year, month) 列表，倒序，再翻转为时间顺序
        ym_list = []
        y, m = today.year, today.month
        for _ in range(months):
            ym_list.append((y, m))
            m -= 1
            if m == 0:
                m = 12
                y -= 1
        ym_list = list(reversed(ym_list))

        rows = (
            db.session.query(
                extract("year", Transaction.occurred_on).label("y"),
                extract("month", Transaction.occurred_on).label("m"),
                func.coalesce(func.sum(case((Transaction.type == "income", Transaction.amount_cents), else_=0)), 0).label("income"),
                func.coalesce(func.sum(case((Transaction.type == "expense", Transaction.amount_cents), else_=0)), 0).label("expense"),
            )
            .filter(Transaction.user_id == user_id)
            .filter(
                Transaction.occurred_on
                >= date(ym_list[0][0], ym_list[0][1], 1)
            )
            .group_by("y", "m")
            .all()
        )
        data_map = {(int(r.y), int(r.m)): r for r in rows}
        items = []
        for y, m in ym_list:
            r = data_map.get((y, m))
            income = (r.income if r else 0) / 100.0
            expense = (r.expense if r else 0) / 100.0
            items.append({"period": f"{y}-{m:02d}", "income": income, "expense": expense})
        return success("获取成功", {"items": items})

    if granularity == "year":
        years = min(max(int(request.args.get("years", 5)), 1), 50)
        current_year = date.today().year
        year_list = list(range(current_year - years + 1, current_year + 1))

        rows = (
            db.session.query(
                extract("year", Transaction.occurred_on).label("y"),
                func.coalesce(func.sum(case((Transaction.type == "income", Transaction.amount_cents), else_=0)), 0).label("income"),
                func.coalesce(func.sum(case((Transaction.type == "expense", Transaction.amount_cents), else_=0)), 0).label("expense"),
            )
            .filter(Transaction.user_id == user_id)
            .group_by("y")
            .all()
        )
        data_map = {int(r.y): r for r in rows}
        items = []
        for y in year_list:
            r = data_map.get(y)
            income = (r.income if r else 0) / 100.0
            expense = (r.expense if r else 0) / 100.0
            items.append({"period": str(y), "income": income, "expense": expense})
        return success("获取成功", {"items": items})

    return bad_request("granularity 必须是 day/month/year")

