"""Application configuration for the personal expense tracker backend."""

import os
from datetime import timedelta


class Config:
    """Base configuration."""

    SECRET_KEY = os.getenv("SECRET_KEY", "expense_tracker_secret_key")

    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///expense_tracker.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "expense_tracker_jwt_secret")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=2)

    JSON_AS_ASCII = False


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False

