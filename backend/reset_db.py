import os
import sys
from datetime import date, timedelta

# 将项目根目录加入路径，便于导入应用
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app, db
from models import Category, Transaction, User


def _resolve_db_path(uri: str) -> str:
    """从 SQLAlchemy URI 提取本地 sqlite 文件路径。"""
    if not uri.startswith("sqlite:///"):
        return ""
    path = uri.replace("sqlite:///", "", 1)
    if not os.path.isabs(path):
        # 相对路径相对于当前脚本所在目录
        path = os.path.join(os.path.dirname(__file__), path)
    return path


def _create_categories(user_id: int) -> dict:
    """创建分类数据。"""
    expense_categories = [
        {"name": "食物", "color": "#FF6B6B"},
        {"name": "交通", "color": "#4ECDC4"},
        {"name": "住房", "color": "#845EC2"},
        {"name": "娱乐", "color": "#FF9671"},
        {"name": "购物", "color": "#F38181"},
        {"name": "医疗", "color": "#AA96DA"},
        {"name": "教育", "color": "#FCBAD3"},
        {"name": "电子产品", "color": "#A8D8EA"},
        {"name": "日用品", "color": "#FFD3B6"},
        {"name": "其他", "color": "#FFAAA5"},
    ]
    
    income_categories = [
        {"name": "工资", "color": "#1DD1A1"},
        {"name": "奖金", "color": "#2BB673"},
        {"name": "兼职", "color": "#10AC84"},
        {"name": "投资收益", "color": "#00D2D3"},
        {"name": "其他收入", "color": "#48DBFB"},
    ]
    
    categories = {}
    for cat_data in expense_categories:
        cat = Category(user_id=user_id, type="expense", **cat_data)
        db.session.add(cat)
        categories[cat_data["name"]] = cat
    
    for cat_data in income_categories:
        cat = Category(user_id=user_id, type="income", **cat_data)
        db.session.add(cat)
        categories[cat_data["name"]] = cat
    
    db.session.flush()
    return categories


def _create_transactions(user_id: int, categories: dict) -> list:
    """创建交易数据。"""
    today = date.today()
    
    # 定义交易数据模板
    transaction_data = [
        # 收入 - 4条
        {"type": "income", "amount_cents": 800000, "days_ago": 0, "category": "工资", "note": "10月工资", "tags": "收入,固定"},
        {"type": "income", "amount_cents": 150000, "days_ago": 5, "category": "奖金", "note": "季度奖金", "tags": "奖金,收入"},
        {"type": "income", "amount_cents": 50000, "days_ago": 10, "category": "兼职", "note": "周末兼职", "tags": "兼职"},
        {"type": "income", "amount_cents": 30000, "days_ago": 15, "category": "投资收益", "note": "基金分红", "tags": "投资"},
        
        # 支出 - 食物 (10条)
        {"type": "expense", "amount_cents": 5200, "days_ago": 0, "category": "食物", "note": "午餐+咖啡", "tags": "饮食,工作日"},
        {"type": "expense", "amount_cents": 3800, "days_ago": 1, "category": "食物", "note": "晚餐", "tags": "饮食"},
        {"type": "expense", "amount_cents": 6500, "days_ago": 2, "category": "食物", "note": "周末聚餐", "tags": "饮食,社交"},
        {"type": "expense", "amount_cents": 2200, "days_ago": 3, "category": "食物", "note": "早餐", "tags": "饮食"},
        {"type": "expense", "amount_cents": 4500, "days_ago": 5, "category": "食物", "note": "便利店购物", "tags": "饮食"},
        {"type": "expense", "amount_cents": 3500, "days_ago": 6, "category": "食物", "note": "外卖", "tags": "饮食"},
        {"type": "expense", "amount_cents": 8200, "days_ago": 8, "category": "食物", "note": "餐厅聚餐", "tags": "饮食,社交"},
        {"type": "expense", "amount_cents": 2800, "days_ago": 11, "category": "食物", "note": "咖啡馆", "tags": "饮食"},
        {"type": "expense", "amount_cents": 5600, "days_ago": 14, "category": "食物", "note": "超市购物", "tags": "饮食"},
        {"type": "expense", "amount_cents": 4200, "days_ago": 18, "category": "食物", "note": "便利店", "tags": "饮食"},
        
        # 支出 - 交通 (8条)
        {"type": "expense", "amount_cents": 3200, "days_ago": 1, "category": "交通", "note": "地铁与公交", "tags": "通勤"},
        {"type": "expense", "amount_cents": 5000, "days_ago": 4, "category": "交通", "note": "出租车", "tags": "出行"},
        {"type": "expense", "amount_cents": 8000, "days_ago": 7, "category": "交通", "note": "加油", "tags": "汽车"},
        {"type": "expense", "amount_cents": 2500, "days_ago": 9, "category": "交通", "note": "地铁卡充值", "tags": "通勤"},
        {"type": "expense", "amount_cents": 6000, "days_ago": 12, "category": "交通", "note": "滴滴出行", "tags": "出行"},
        {"type": "expense", "amount_cents": 3200, "days_ago": 16, "category": "交通", "note": "公交卡", "tags": "通勤"},
        {"type": "expense", "amount_cents": 7500, "days_ago": 19, "category": "交通", "note": "加油", "tags": "汽车"},
        {"type": "expense", "amount_cents": 4000, "days_ago": 22, "category": "交通", "note": "停车费", "tags": "汽车"},
        
        # 支出 - 住房 (5条)
        {"type": "expense", "amount_cents": 300000, "days_ago": 2, "category": "住房", "note": "房租", "tags": "住房,固定"},
        {"type": "expense", "amount_cents": 5000, "days_ago": 6, "category": "住房", "note": "水电费", "tags": "住房,固定"},
        {"type": "expense", "amount_cents": 2000, "days_ago": 13, "category": "住房", "note": "网络费", "tags": "住房,固定"},
        {"type": "expense", "amount_cents": 3500, "days_ago": 17, "category": "住房", "note": "物业费", "tags": "住房,固定"},
        {"type": "expense", "amount_cents": 1500, "days_ago": 21, "category": "住房", "note": "燃气费", "tags": "住房,固定"},
        
        # 支出 - 娱乐 (8条)
        {"type": "expense", "amount_cents": 8800, "days_ago": 3, "category": "娱乐", "note": "电影票", "tags": "娱乐,周末"},
        {"type": "expense", "amount_cents": 12000, "days_ago": 8, "category": "娱乐", "note": "KTV", "tags": "娱乐,社交"},
        {"type": "expense", "amount_cents": 3500, "days_ago": 10, "category": "娱乐", "note": "游戏充值", "tags": "娱乐"},
        {"type": "expense", "amount_cents": 6500, "days_ago": 15, "category": "娱乐", "note": "演唱会门票", "tags": "娱乐,音乐"},
        {"type": "expense", "amount_cents": 4200, "days_ago": 20, "category": "娱乐", "note": "棋牌室", "tags": "娱乐,社交"},
        {"type": "expense", "amount_cents": 5800, "days_ago": 23, "category": "娱乐", "note": "电影票", "tags": "娱乐,周末"},
        {"type": "expense", "amount_cents": 2500, "days_ago": 25, "category": "娱乐", "note": "游戏充值", "tags": "娱乐"},
        {"type": "expense", "amount_cents": 7000, "days_ago": 28, "category": "娱乐", "note": "聚餐娱乐", "tags": "娱乐,社交"},
        
        # 支出 - 购物 (6条)
        {"type": "expense", "amount_cents": 25000, "days_ago": 4, "category": "购物", "note": "衣服", "tags": "购物,衣服"},
        {"type": "expense", "amount_cents": 15000, "days_ago": 9, "category": "购物", "note": "鞋子", "tags": "购物,衣服"},
        {"type": "expense", "amount_cents": 18000, "days_ago": 14, "category": "购物", "note": "包包", "tags": "购物,配饰"},
        {"type": "expense", "amount_cents": 12000, "days_ago": 19, "category": "购物", "note": "衣服", "tags": "购物,衣服"},
        {"type": "expense", "amount_cents": 8500, "days_ago": 24, "category": "购物", "note": "帽子", "tags": "购物,配饰"},
        {"type": "expense", "amount_cents": 22000, "days_ago": 27, "category": "购物", "note": "外套", "tags": "购物,衣服"},
        
        # 支出 - 医疗 (3条)
        {"type": "expense", "amount_cents": 8000, "days_ago": 6, "category": "医疗", "note": "体检", "tags": "医疗,健康"},
        {"type": "expense", "amount_cents": 2500, "days_ago": 11, "category": "医疗", "note": "药物", "tags": "医疗"},
        {"type": "expense", "amount_cents": 3200, "days_ago": 26, "category": "医疗", "note": "挂号费", "tags": "医疗"},
        
        # 支出 - 教育 (3条)
        {"type": "expense", "amount_cents": 50000, "days_ago": 7, "category": "教育", "note": "课程报名费", "tags": "教育,学习"},
        {"type": "expense", "amount_cents": 3000, "days_ago": 12, "category": "教育", "note": "书籍", "tags": "教育,书籍"},
        {"type": "expense", "amount_cents": 4500, "days_ago": 29, "category": "教育", "note": "在线课程", "tags": "教育,学习"},
        
        # 支出 - 电子产品 (2条)
        {"type": "expense", "amount_cents": 120000, "days_ago": 5, "category": "电子产品", "note": "手机壳", "tags": "电子,配件"},
        {"type": "expense", "amount_cents": 8500, "days_ago": 30, "category": "电子产品", "note": "充电线", "tags": "电子,配件"},
        
        # 支出 - 日用品 (4条)
        {"type": "expense", "amount_cents": 4000, "days_ago": 8, "category": "日用品", "note": "洗护用品", "tags": "日用"},
        {"type": "expense", "amount_cents": 6000, "days_ago": 13, "category": "日用品", "note": "家居用品", "tags": "日用"},
        {"type": "expense", "amount_cents": 3500, "days_ago": 18, "category": "日用品", "note": "清洁用品", "tags": "日用"},
        {"type": "expense", "amount_cents": 5200, "days_ago": 31, "category": "日用品", "note": "日用百货", "tags": "日用"},
    ]
    
    transactions = []
    for data in transaction_data:
        occurred_on = today - timedelta(days=data.pop("days_ago"))
        category_name = data.pop("category")
        transaction = Transaction(
            user_id=user_id,
            occurred_on=occurred_on,
            category_id=categories[category_name].id,
            **data
        )
        db.session.add(transaction)
        transactions.append(transaction)
    
    db.session.flush()
    return transactions


def reset_db():
    """重置数据库并创建基础数据。"""
    db_path = _resolve_db_path(app.config["SQLALCHEMY_DATABASE_URI"])
    if db_path and os.path.exists(db_path):
        print(f"删除旧数据库文件: {db_path}")
        os.remove(db_path)

    with app.app_context():
        print("删除所有表...")
        db.drop_all()
        
        print("创建数据库表...")
        db.create_all()

        print("创建默认账号 admin/123456 ...")
        admin = User(username="admin")
        admin.set_password("123456")
        db.session.add(admin)
        db.session.flush()

        print("创建分类...")
        categories = _create_categories(admin.id)

        print("创建交易...")
        transactions = _create_transactions(admin.id, categories)

        db.session.commit()

        print("=== 初始化完成 ===")
        print("登录账号: admin / 123456")
        print(f"分类数量: {len(categories)}, 交易数量: {len(transactions)}")


if __name__ == "__main__":
    reset_db()