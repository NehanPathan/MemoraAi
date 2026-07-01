"""Authentication routes for OAuth2 and JWT."""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Header
from pydantic import BaseModel
from sqlmodel import Session, select

from database import get_session
from models import User
from utils.oauth import (
    create_access_token,
    verify_token,
    TokenData,
    verify_google_token,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


class GoogleAuthRequest(BaseModel):
    """Google OAuth2 authentication request."""
    token: str
    test_mode: bool = False


class AuthResponse(BaseModel):
    """Authentication response with JWT token."""
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserResponse(BaseModel):
    """User information."""
    id: str
    email: str
    name: str
    picture_url: Optional[str] = None


@router.post("/google")
async def google_auth(
    request: GoogleAuthRequest,
    session: Session = Depends(get_session),
):
    """
    Authenticate with Google OAuth2 token.

    Frontend should:
    1. Use Google Sign-In to get ID token
    2. Send token to this endpoint
    3. Receive JWT access token
    """
    logger.info(f"Processing Google auth - request: token={request.token[:20] if request.token else None}, test_mode={getattr(request, 'test_mode', False)}")

    try:
        # Test mode for development
        test_mode = getattr(request, 'test_mode', False)
        logger.info(f"Test mode value: {test_mode} (type: {type(test_mode)})")

        if test_mode:
            logger.info("Using test mode credentials")
            google_id = "test-user-id"
            email = "test@example.com"
            name = "Test User"
            picture = None
        else:
            logger.info("Verifying Google token")
            # Verify Google token
            google_user = await verify_google_token(request.token)
            google_id = google_user["user_id"]
            email = google_user["email"]
            name = google_user["name"]
            picture = google_user.get("picture")

        # Find or create user
        statement = select(User).where(User.google_id == google_id)
        user = session.exec(statement).first()

        if user:
            # Update last login
            user.last_login_at = __import__("datetime").datetime.utcnow()
            session.add(user)
            session.commit()
            session.refresh(user)
            logger.info(f"User logged in: {user.email}")
        else:
            # Create new user
            user = User(
                email=email,
                name=name,
                picture_url=picture,
                google_id=google_id,
            )
            session.add(user)
            session.commit()
            session.refresh(user)
            logger.info(f"New user created: {email}")

        # Create JWT token
        access_token = create_access_token(user_id=user.id, email=user.email)

        return AuthResponse(
            access_token=access_token,
            user={
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "picture_url": user.picture_url,
            },
        )

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception(f"Google authentication failed: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication failed",
        ) from exc


@router.post("/logout")
async def logout():
    """
    Logout endpoint.

    Frontend should:
    1. Clear the access token
    2. Clear user data from localStorage/state
    """
    return {"status": "logged_out"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    authorization: str = Header(None),
    session: Session = Depends(get_session),
):
    """Get current authenticated user information."""

    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header",
        )

    try:
        # Extract token from "Bearer <token>"
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise ValueError("Invalid auth scheme")
    except (ValueError, IndexError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header",
        )

    # Verify token
    token_data = verify_token(token)
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    # Get user
    statement = select(User).where(User.id == token_data.user_id)
    user = session.exec(statement).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        picture_url=user.picture_url,
    )
