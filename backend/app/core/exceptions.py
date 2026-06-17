"""全局异常定义"""
from fastapi import HTTPException


class AppException(HTTPException):
    def __init__(self, code: int, message: str, detail: str = None):
        super().__init__(status_code=code, detail={
            "code": code,
            "message": message,
            "detail": detail,
        })


class NotFoundException(AppException):
    def __init__(self, resource: str, resource_id: int = None):
        msg = f"{resource} 不存在"
        if resource_id:
            msg += f" (id={resource_id})"
        super().__init__(code=404, message=msg)


class BadRequestException(AppException):
    def __init__(self, message: str, detail: str = None):
        super().__init__(code=400, message=message, detail=detail)


class UnauthorizedException(AppException):
    def __init__(self, message: str = "未授权访问"):
        super().__init__(code=401, message=message)


class ConflictException(AppException):
    def __init__(self, message: str):
        super().__init__(code=409, message=message)


class AIException(AppException):
    def __init__(self, message: str = "AI 服务异常，请稍后重试"):
        super().__init__(code=503, message=message)
