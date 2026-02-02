from app import app, db

# 在应用上下文中创建所有数据库表
with app.app_context():
    db.create_all()
    print("数据库表已成功创建")