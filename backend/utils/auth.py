"""Authentication utilities for API security."""

import logging
from typing import Optional

from fastapi import Depends, Header, HTTPException, Query, status
from sqlmodel import Session

from database import get_session
from models import User
from utils.oauth import verify_token

logger = logging.getLogger(__name__)


async def get_current_user(
    authorization: Optional[str] = Header(None),
    token: Optional[str] = Query(None),
    session: Session = Depends(get_session),
) -> User:
    """
    Resolve the authenticated user from a JWT.

    Accepts the token either as an `Authorization: Bearer <token>` header
    (normal requests) or a `token` query parameter (needed for SSE/EventSource,
    which cannot set custom headers).
    """

    raw_token = token

    if not raw_token and authorization:
        try:
            scheme, raw_token = authorization.split()
            if scheme.lower() != "bearer":
                raw_token = None
        except ValueError:
            raw_token = None

    if not raw_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
        )

    token_data = verify_token(raw_token)
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
        )

    user = session.get(User, token_data.user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user
