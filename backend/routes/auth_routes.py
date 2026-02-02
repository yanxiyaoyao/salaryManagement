from datetime import datetime

from flask import Blueprint, request
from flask_jwt_extended import create_access_token

from extensions import db
from models import User
from utils.responses import (
    bad_request,
    conflict,
    success,
)


auth_bp = Blueprint("auth_bp", __name__, url_prefix="/api/auth")


@auth_bp.post("/login")
def login():
    payload = request.get_json(silent=True) or {}
    username = (payload.get("username") or "").strip()
    password = payload.get("password") or ""

    if not username or not password:
        return bad_request("用户名和密码不能为空")

    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        return bad_request("用户名或密码错误")

    token = create_access_token(identity=user.id)

    return success(
        data={
            "token": token,
            "user": user.to_dict(),
        },
        msg="登录成功",
    )


@auth_bp.post("/register")
def register():
    payload = request.get_json(silent=True) or {}
    username = (payload.get("username") or "").strip()
    password = payload.get("password") or ""

    if User.query.filter_by(username=username).first():
        return conflict("用户名已被占用")

    user = User(username=username)
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    return success(msg="注册成功")
