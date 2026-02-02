from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager

# 初始化数据库
db = SQLAlchemy()

# 
jwt = JWTManager()