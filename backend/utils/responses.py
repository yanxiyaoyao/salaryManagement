"""统一的 API 响应工具。"""

from flask import jsonify


def _build_payload(code: int, msg: str, data=None) -> dict:
    payload = {
        "code": code,
        "msg": msg,
        "data": data,
    }
    return payload


def success(msg: str = "操作成功", data=None, http_status: int = 200):
    """返回成功响应。"""
    return jsonify(_build_payload(200, msg, data)), http_status


def error(msg: str = "请求参数错误", code: int = 400, http_status: int = None, data=None):
    """
    返回错误响应。

    Args:
        msg: 错误信息
        code: 业务错误码
        http_status: HTTP 状态码（默认与业务码一致）
        data: 额外数据
    """
    status = http_status or code
    return jsonify(_build_payload(code, msg, data)), status


def bad_request(msg: str = "请求参数错误", data=None):
    return error(msg=msg, code=400, data=data)


def unauthorized(msg: str = "未认证", data=None):
    return error(msg=msg, code=401, data=data)


def forbidden(msg: str = "无权限", data=None):
    return error(msg=msg, code=403, data=data)


def not_found(msg: str = "资源不存在", data=None):
    return error(msg=msg, code=404, data=data)


def conflict(msg: str = "冲突", data=None):
    return error(msg=msg, code=409, data=data)


def server_error(msg: str = "服务器错误", data=None):
    return error(msg=msg, code=500, data=data)

