"""用户个人中心接口：资料、头像、密码。"""

import os
from flask import Blueprint, g, request, current_app

from extensions import db
from models import User
from utils.file_handler import FileHandler
from utils.responses import bad_request, not_found, success


user_bp = Blueprint("user_bp", __name__, url_prefix="/api/users")


@user_bp.get("/profile")
def get_profile():
    """获取当前用户信息。"""
    user = User.query.get(g.user_id)
    if not user:
        return not_found("用户不存在")
    return success("获取成功", user.to_dict())


@user_bp.put("/profile")
def update_profile():
    """更新昵称、邮箱、电话。"""
    user = User.query.get(g.user_id)
    if not user:
        return not_found("用户不存在")

    payload = request.get_json(silent=True) or {}
    nickname = payload.get("nickname")
    email = payload.get("email")
    phone = payload.get("phone")

    if nickname is not None:
        user.nickname = nickname.strip() or None
    if email is not None:
        user.email = email.strip() or None
    if phone is not None:
        user.phone = phone.strip() or None

    db.session.commit()
    return success("更新成功", user.to_dict())


@user_bp.post("/avatar")
def upload_avatar():
    """上传头像，返回可访问的路径。"""
    user = User.query.get(g.user_id)
    if not user:
        return not_found("用户不存在")

    file = request.files.get("file")
    ok, err = FileHandler.validate_image_file(file)
    if not ok:
        return bad_request(err)

    saved = FileHandler.save_file(file, file_type="image", original_filename=file.filename)
    if not saved.get("success"):
        return bad_request(saved.get("error", "上传失败"))

    # 构造可访问 URL（相对路径）
    avatar_url = FileHandler.get_file_url(saved["relative_path"])
    user.avatar = avatar_url
    db.session.commit()

    return success("上传成功", {"avatar": FileHandler.absolute_url(avatar_url)})


@user_bp.put("/password")
def change_password():
    """修改密码。"""
    user = User.query.get(g.user_id)
    if not user:
        return not_found("用户不存在")

    payload = request.get_json(silent=True) or {}
    old_password = payload.get("oldPassword") or ""
    new_password = payload.get("newPassword") or ""

    if not old_password or not new_password:
        return bad_request("旧密码和新密码不能为空")
    if len(new_password) < 6 or len(new_password) > 128:
        return bad_request("新密码长度需在6-128之间")
    if not user.check_password(old_password):
        return bad_request("旧密码错误")

    user.set_password(new_password)
    db.session.commit()

    return success("密码修改成功")

