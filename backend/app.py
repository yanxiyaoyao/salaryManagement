"""Application factory for the personal expense tracker backend."""

import os
from flask import Flask, g, request
from flask_cors import CORS
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request

from config import DevelopmentConfig
from extensions import db, jwt
from utils.responses import unauthorized


EXEMPT_PATHS = {
    "/api/auth/login",
    "/api/auth/register",
}

def create_app(config_object=DevelopmentConfig) -> Flask:
    app = Flask(__name__, static_folder=None)
    app.config.from_object(config_object)

    CORS(app)
    db.init_app(app)
    jwt.init_app(app)

    _register_blueprints(app)
    _register_static_file_route(app)
    _register_request_hooks(app)

    return app


def _register_blueprints(app: Flask) -> None:
    from routes.auth_routes import auth_bp
    from routes.category_routes import category_bp
    from routes.transaction_routes import transaction_bp
    from routes.stats_routes import stats_bp
    from routes.user_routes import user_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(category_bp)
    app.register_blueprint(transaction_bp)
    app.register_blueprint(stats_bp)
    app.register_blueprint(user_bp)


def _register_static_file_route(app: Flask) -> None:
    """开放 files 目录用于访问上传的文件/头像。"""
    from flask import send_from_directory

    @app.route("/files/<path:filename>")
    def _uploaded_files(filename):
        upload_root = os.path.join(app.root_path, "files")
        return send_from_directory(upload_root, filename)


def _register_request_hooks(app: Flask) -> None:
    @app.before_request
    def _enforce_authentication():
        if request.method == "OPTIONS":
            return None

        path = request.path
        if not path.startswith("/api/"):
            return None
        if path in EXEMPT_PATHS:
            return None

        try:
            verify_jwt_in_request()
            g.user_id = get_jwt_identity()
        except Exception:
            return unauthorized("未认证")

        return None


app = create_app()


@app.shell_context_processor
def _make_shell_context():
    from models import User, Category, Transaction

    return {
        "db": db,
        "User": User,
        "Category": Category,
        "Transaction": Transaction,
    }


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)