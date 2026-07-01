from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

from sqlmodel import SQLModel, Field, Relationship


def _uuid() -> str:
    return str(uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class User(SQLModel, table=True):
    """User account model."""
    id: str = Field(default_factory=_uuid, primary_key=True)

    email: str = Field(unique=True, index=True)
    name: str
    picture_url: Optional[str] = None
    google_id: Optional[str] = Field(default=None, unique=True, index=True)

    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=_now, index=True)
    last_login_at: Optional[datetime] = None

    story_jobs: list["StoryJob"] = Relationship(back_populates="user")


class MemoryCard(SQLModel, table=True):
    id: str = Field(default_factory=_uuid, primary_key=True)

    story_job_id: str = Field(
        foreign_key="storyjob.id",
        index=True,
    )

    card_type: str = Field(default="")
    theme_name: str = Field(default="")

    caption: Optional[str] = Field(default=None)

    image_url: Optional[str] = Field(default=None)

    status: str = Field(default="pending", index=True)

    error_message: Optional[str] = Field(default=None)

    created_at: datetime = Field(default_factory=_now, index=True)

    story_job: Optional["StoryJob"] = Relationship(
        back_populates="memory_cards"
    )


class UploadedPhoto(SQLModel, table=True):
    """Tracks ownership of photos uploaded to ImageKit, scoped per user."""
    file_id: str = Field(primary_key=True)

    user_id: str = Field(foreign_key="user.id", index=True)

    url: str

    created_at: datetime = Field(default_factory=_now, index=True)


class StoryJob(SQLModel, table=True):
    id: str = Field(default_factory=_uuid, primary_key=True)

    user_id: str = Field(foreign_key="user.id", index=True)

    title: str = Field(default="", index=True)

    description: Optional[str] = Field(default=None)

    memory_type: str = Field(default="general")

    theme_name: str = Field(default="nostalgic")

    photo_urls: str = Field(default="")

    num_memory_cards: int = Field(
        default=3,
        ge=1,
        le=5,
    )

    status: str = Field(default="pending", index=True)

    error_message: Optional[str] = Field(default=None)

    created_at: datetime = Field(default_factory=_now, index=True)

    user: Optional["User"] = Relationship(back_populates="story_jobs")
    memory_cards: list["MemoryCard"] = Relationship(
        back_populates="story_job"
    )
