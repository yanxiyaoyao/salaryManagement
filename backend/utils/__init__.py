import json
from flask import jsonify

class Result:
    """
    统一响应格式类
    用于规范API返回的JSON格式，包含code（状态码）、msg（消息）和data（数据）三个字段
    """
    # 常用状态码定义
    SUCCESS = 200
    BAD_REQUEST = 400
    UNAUTHORIZED = 401
    FORBIDDEN = 403
    NOT_FOUND = 404
    SERVER_ERROR = 500
    VALIDATION_ERROR = 422
    
    def __init__(self, code=SUCCESS, msg='成功', data=None):
        """
        初始化Result对象
        
        :param code: 状态码，默认为SUCCESS(200)
        :param msg: 消息，默认为'成功'
        :param data: 数据，可以是任意类型，默认为None
        """
        self.code = code
        self.msg = msg
        self.data = data
        
    def to_dict(self):
        """
        转换为字典格式
        
        :return: 包含code、msg和data的字典
        """
        result = {
            'code': self.code,
            'msg': self.msg
        }
        if self.data is not None:
            result['data'] = self.data
        return result
        
    def to_json(self):
        """
        转换为JSON字符串
        
        :return: JSON格式的字符串
        """
        return json.dumps(self.to_dict(), ensure_ascii=False)
        
    def to_response(self):
        """
        转换为Flask的响应对象
        
        :return: Flask的Response对象
        """
        return jsonify(self.to_dict())
        
    @staticmethod
    def success(data=None, msg='成功'):
        """
        创建成功响应
        
        :param data: 数据，默认为None
        :param msg: 消息，默认为'成功'
        :return: Result对象
        """
        return Result(code=Result.SUCCESS, msg=msg, data=data)
        
    @staticmethod
    def error(code=SERVER_ERROR, msg='服务器错误', data=None):
        """
        创建错误响应
        
        :param code: 状态码，默认为SERVER_ERROR(500)
        :param msg: 消息，默认为'服务器错误'
        :param data: 数据，默认为None
        :return: Result对象
        """
        return Result(code=code, msg=msg, data=data)
        
    @staticmethod
    def bad_request(msg='请求参数错误', data=None):
        """
        创建400错误响应
        
        :param msg: 消息，默认为'请求参数错误'
        :param data: 数据，默认为None
        :return: Result对象
        """
        return Result(code=Result.BAD_REQUEST, msg=msg, data=data)
        
    @staticmethod
    def unauthorized(msg='未授权，请登录', data=None):
        """
        创建401错误响应
        
        :param msg: 消息，默认为'未授权，请登录'
        :param data: 数据，默认为None
        :return: Result对象
        """
        return Result(code=Result.UNAUTHORIZED, msg=msg, data=data)
        
    @staticmethod
    def forbidden(msg='权限不足', data=None):
        """
        创建403错误响应
        
        :param msg: 消息，默认为'权限不足'
        :param data: 数据，默认为None
        :return: Result对象
        """
        return Result(code=Result.FORBIDDEN, msg=msg, data=data)
        
    @staticmethod
    def not_found(msg='请求的资源不存在', data=None):
        """
        创建404错误响应
        
        :param msg: 消息，默认为'请求的资源不存在'
        :param data: 数据，默认为None
        :return: Result对象
        """
        return Result(code=Result.NOT_FOUND, msg=msg, data=data)

# 导出常用函数，方便直接使用
def success(data=None, msg='成功'):
    """快捷创建成功响应"""
    return Result.success(data, msg)


def error(code=Result.SERVER_ERROR, msg='服务器错误', data=None):
    """快捷创建错误响应"""
    return Result.error(code, msg, data)


def bad_request(msg='请求参数错误', data=None):
    """快捷创建400错误响应"""
    return Result.bad_request(msg, data)


def unauthorized(msg='未授权，请登录', data=None):
    """快捷创建401错误响应"""
    return Result.unauthorized(msg, data)


def forbidden(msg='权限不足', data=None):
    """快捷创建403错误响应"""
    return Result.forbidden(msg, data)


def not_found(msg='请求的资源不存在', data=None):
    """快捷创建404错误响应"""
    return Result.not_found(msg, data)