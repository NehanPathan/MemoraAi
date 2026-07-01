"""OAuth2 and JWT utilities for authentication."""

import logging
from datetime import datetime, timedelta
from typing import Optional

import jwt
from fastapi import HTTPException, status

from config import JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRATION_HOURS

logger = logging.getLogger(__name__)


class TokenData:
    """OAuth token data."""

    def __init__(self, user_id: str, email: str):
        self.user_id = user_id
        self.email = email


def create_access_token(user_id: str, email: str) -> str:
    """Create JWT access token."""
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.utcnow(),
    }

    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token


def verify_token(token: str) -> Optional[TokenData]:
    """Verify and decode JWT token."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("user_id")
        email: str = payload.get("email")

        if user_id is None or email is None:
            return None

        return TokenData(user_id=user_id, email=email)

    except jwt.ExpiredSignatureError:
        logger.warning("Token expired")
        return None
    except jwt.InvalidTokenError:
        logger.warning("Invalid token")
        return None


def get_current_user(token: str) -> TokenData:
    """Get current user from token."""
    token_data = verify_token(token)

    if token_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return token_data


async def verify_google_token(token: str) -> dict:
    """Verify Google OAuth token."""
    try:
        from google.auth.transport import requests
        from google.oauth2 import id_token

        from config import GOOGLE_OAUTH_CLIENT_ID

        # Verify the token. A small clock_skew allowance avoids spurious
        # "Token used too early/late" failures from minor local clock drift.
        id_info = id_token.verify_oauth2_token(
            token,
            requests.Request(),
            GOOGLE_OAUTH_CLIENT_ID,
            clock_skew_in_seconds=10,
        )

        # ID token is valid
        return {
            "user_id": id_info["sub"],
            "email": id_info.get("email"),
            "name": id_info.get("name"),
            "picture": id_info.get("picture"),
        }

    except Exception as exc:
        logger.error(f"Google token verification failed: {exc}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google authentication token",
        ) from exc
