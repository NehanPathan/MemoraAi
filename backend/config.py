import os
from dotenv import load_dotenv

load_dotenv()

class ConfigError(Exception):
    pass

def _get_required_env(key: str) -> str:
    value = os.getenv(key)
    if not value:
        raise ConfigError(f"Missing required environment variable: {key}")
    return value

def _get_optional_env(key: str, default: str = "") -> str:
    return os.getenv(key, default)

# Environment
ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower()
IS_PRODUCTION = ENVIRONMENT == "production"
IS_DEVELOPMENT = ENVIRONMENT == "development"

# OpenAI API Key
OPENAI_API_KEY = _get_required_env("OPENAI_API_KEY")

# ImageKit configuration
IMAGEKIT_PRIVATE_KEY = _get_required_env("IMAGEKIT_PRIVATE_KEY")
IMAGEKIT_PUBLIC_KEY = _get_required_env("IMAGEKIT_PUBLIC_KEY")
IMAGEKIT_URL_ENDPOINT = _get_required_env("IMAGEKIT_URL_ENDPOINT")

# Database
DATABASE_URL = _get_optional_env(
    "DATABASE_URL",
    "sqlite:///./memoriesbuilder.db"
)

# API Configuration
API_KEY = _get_optional_env("API_KEY", "")
API_SECRET = _get_optional_env("API_SECRET", "")

# Security
CORS_ORIGINS = _get_optional_env("CORS_ORIGINS", "http://localhost:5173").split(",")
MAX_REQUEST_SIZE = int(os.getenv("MAX_REQUEST_SIZE", "52428800"))  # 50MB
MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_BYTES", "10485760"))  # 10MB
RATE_LIMIT_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS", "100"))
RATE_LIMIT_WINDOW = int(os.getenv("RATE_LIMIT_WINDOW", "3600"))  # 1 hour

# Logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO" if IS_PRODUCTION else "DEBUG")
LOG_FORMAT = os.getenv("LOG_FORMAT", "json" if IS_PRODUCTION else "text")

# OpenAI
OPENAI_TIMEOUT = float(os.getenv("OPENAI_TIMEOUT", "150"))
OPENAI_MAX_RETRIES = int(os.getenv("OPENAI_MAX_RETRIES", "3"))

# Validation constraints
MIN_TITLE_LENGTH = 3
MAX_TITLE_LENGTH = 200
MAX_DESCRIPTION_LENGTH = 2000
MAX_MEMORY_TYPE_LENGTH = 100

# Google OAuth2
GOOGLE_OAUTH_CLIENT_ID = _get_optional_env("GOOGLE_OAUTH_CLIENT_ID", "")
GOOGLE_OAUTH_CLIENT_SECRET = _get_optional_env("GOOGLE_OAUTH_CLIENT_SECRET", "")
GOOGLE_OAUTH_REDIRECT_URI = _get_optional_env(
    "GOOGLE_OAUTH_REDIRECT_URI",
    "http://localhost:8000/auth/google/callback"
)

# JWT Token
JWT_SECRET = _get_optional_env(
    "JWT_SECRET",
    "your-super-secret-jwt-key-change-in-production"  # Should be set in production
)
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = int(os.getenv("JWT_EXPIRATION_HOURS", "24"))

def validate_config():
    """Validate all required configuration on startup."""
    errors = []

    # Check required API keys
    if not OPENAI_API_KEY:
        errors.append("OPENAI_API_KEY not set")
    if not IMAGEKIT_PRIVATE_KEY:
        errors.append("IMAGEKIT_PRIVATE_KEY not set")
    if not IMAGEKIT_PUBLIC_KEY:
        errors.append("IMAGEKIT_PUBLIC_KEY not set")
    if not IMAGEKIT_URL_ENDPOINT:
        errors.append("IMAGEKIT_URL_ENDPOINT not set")

    # Validate numeric configs
    if MAX_REQUEST_SIZE <= 0:
        errors.append("MAX_REQUEST_SIZE must be positive")
    if MAX_UPLOAD_BYTES <= 0:
        errors.append("MAX_UPLOAD_BYTES must be positive")
    if RATE_LIMIT_REQUESTS <= 0:
        errors.append("RATE_LIMIT_REQUESTS must be positive")

    if errors:
        raise ConfigError(f"Configuration validation failed:\n" + "\n".join(f"  - {e}" for e in errors))

    return True
