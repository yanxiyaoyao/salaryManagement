import os
import uuid
from datetime import datetime
from werkzeug.utils import secure_filename
from flask import current_app, request
import mimetypes

class FileHandler:
    """文件处理工具类"""
    
    # 允许的文件类型
    ALLOWED_EXTENSIONS = {
        'image': {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'},
        'document': {'pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx'}
    }
    
    # 文件大小限制 (字节)
    MAX_FILE_SIZE = {
        'image': 5 * 1024 * 1024,  # 5MB
        'document': 10 * 1024 * 1024  # 10MB
    }
    
    @staticmethod
    def allowed_file(filename, file_type='image'):
        """
        检查文件是否允许上传
        
        Args:
            filename: 文件名
            file_type: 文件类型 ('image' 或 'document')
            
        Returns:
            bool: 是否允许上传
        """
        if '.' not in filename:
            return False
        
        extension = filename.rsplit('.', 1)[1].lower()
        return extension in FileHandler.ALLOWED_EXTENSIONS.get(file_type, set())
    
    @staticmethod
    def get_file_type(filename):
        """
        根据文件扩展名判断文件类型
        
        Args:
            filename: 文件名
            
        Returns:
            str: 文件类型 ('image' 或 'document')
        """
        if '.' not in filename:
            return 'document'
        
        extension = filename.rsplit('.', 1)[1].lower()
        
        if extension in FileHandler.ALLOWED_EXTENSIONS['image']:
            return 'image'
        elif extension in FileHandler.ALLOWED_EXTENSIONS['document']:
            return 'document'
        else:
            return 'document'
    
    @staticmethod
    def generate_file_path(file_type='image', original_filename=None):
        """
        生成文件存储路径
        
        Args:
            file_type: 文件类型
            original_filename: 原始文件名
            
        Returns:
            tuple: (相对路径, 绝对路径, 文件名)
        """
        # 获取当前日期
        now = datetime.now()
        year = now.strftime('%Y')
        month = now.strftime('%m')
        day = now.strftime('%d')
        
        # 创建目录结构: files/{type}/{year}/{month}/{day}/
        relative_dir = os.path.join('files', file_type, year, month, day)
        absolute_dir = os.path.join(current_app.root_path, relative_dir)
        
        # 确保目录存在
        os.makedirs(absolute_dir, exist_ok=True)
        
        # 生成唯一文件名
        if original_filename:
            extension = os.path.splitext(original_filename)[1]
        else:
            extension = '.jpg'  # 默认扩展名
        
        unique_filename = f"{uuid.uuid4()}{extension}"
        
        # 构建完整路径
        relative_path = os.path.join(relative_dir, unique_filename)
        absolute_path = os.path.join(absolute_dir, unique_filename)
        
        return relative_path, absolute_path, unique_filename
    
    @staticmethod
    def save_file(file, file_type='image', original_filename=None):
        """
        保存上传的文件
        
        Args:
            file: 上传的文件对象
            file_type: 文件类型
            original_filename: 原始文件名
            
        Returns:
            dict: 包含文件信息的字典
        """
        try:
            # 检查文件是否存在
            if not file or not file.filename:
                raise ValueError("没有选择文件")
            
            # 获取安全的文件名
            filename = secure_filename(file.filename)
            
            # 检查文件类型
            if not FileHandler.allowed_file(filename, file_type):
                raise ValueError(f"不支持的文件类型，只支持: {', '.join(FileHandler.ALLOWED_EXTENSIONS[file_type])}")
            
            # 检查文件大小
            file.seek(0, 2)  # 移动到文件末尾
            file_size = file.tell()
            file.seek(0)  # 重置到文件开头
            
            if file_size > FileHandler.MAX_FILE_SIZE[file_type]:
                raise ValueError(f"文件大小超过限制 ({FileHandler.MAX_FILE_SIZE[file_type] // (1024*1024)}MB)")
            
            # 生成文件路径
            relative_path, absolute_path, unique_filename = FileHandler.generate_file_path(
                file_type, filename
            )
            
            # 保存文件
            file.save(absolute_path)
            
            # 返回文件信息
            return {
                'success': True,
                'filename': unique_filename,
                'original_filename': filename,
                'relative_path': relative_path,
                'absolute_path': absolute_path,
                'file_size': file_size,
                'file_type': file_type,
                'mime_type': mimetypes.guess_type(absolute_path)[0]
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def delete_file(file_path):
        """
        删除文件
        
        Args:
            file_path: 文件路径（相对路径或绝对路径）
            
        Returns:
            bool: 删除是否成功
        """
        try:
            # 如果是相对路径，转换为绝对路径
            if not os.path.isabs(file_path):
                file_path = os.path.join(current_app.root_path, file_path)
            
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
            else:
                return False
                
        except Exception as e:
            print(f"删除文件失败: {str(e)}")
            return False
    
    @staticmethod
    def get_file_url(relative_path):
        """
        获取文件的访问URL
        
        Args:
            relative_path: 相对路径
            
        Returns:
            str: 文件访问URL
        """
        # 将Windows反斜杠转换为正斜杠
        relative_path = relative_path.replace('\\', '/')
        
        # 确保路径以正斜杠开头
        if not relative_path.startswith('/'):
            relative_path = '/' + relative_path
        
        # 直接返回相对路径，让浏览器使用当前页面的协议和域名
        return relative_path

    @staticmethod
    def absolute_url(relative_path: str) -> str:
        """
        将相对路径转换为带域名的完整URL。
        """
        if not relative_path:
            return relative_path
        rel = relative_path.replace("\\", "/")
        if not rel.startswith("/"):
            rel = "/" + rel
        # request.url_root 末尾自带 /
        base = (request.url_root or "").rstrip("/")
        return f"{base}{rel}"
    
    @staticmethod
    def validate_image_file(file):
        """
        验证图片文件
        
        Args:
            file: 文件对象
            
        Returns:
            tuple: (是否有效, 错误信息)
        """
        if not file or not file.filename:
            return False, "没有选择文件"
        
        filename = secure_filename(file.filename)
        
        if not FileHandler.allowed_file(filename, 'image'):
            return False, f"不支持的图片格式，只支持: {', '.join(FileHandler.ALLOWED_EXTENSIONS['image'])}"
        
        # 检查文件大小
        file.seek(0, 2)
        file_size = file.tell()
        file.seek(0)
        
        if file_size > FileHandler.MAX_FILE_SIZE['image']:
            return False, f"图片大小超过限制 ({FileHandler.MAX_FILE_SIZE['image'] // (1024*1024)}MB)"
        
        return True, None
