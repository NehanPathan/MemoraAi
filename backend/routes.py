import asyncio
import json
import logging
import uuid

from fastapi import (
    APIRouter,
    HTTPException,
    UploadFile,
    File,
    Depends,
    Request,
    status,
)

from fastapi.responses import StreamingResponse

from pydantic import BaseModel, Field

from sqlmodel import Session, select

from database import get_session, engine

from models import StoryJob, MemoryCard, UploadedPhoto, User

from services.generator import (
    process_story_job,
    THEME_ORDER,
    themes_for_job,
)


from config import (
    MAX_UPLOAD_BYTES,
    MIN_TITLE_LENGTH,
    MAX_TITLE_LENGTH,
    MAX_DESCRIPTION_LENGTH,
    MAX_MEMORY_TYPE_LENGTH,
)

from utils.file_validation import (
    validate_image_file,
    generate_safe_filename,
)

from utils.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api")


# ---------------------------------------------------
# Request / Response Schemas
# ---------------------------------------------------


class CreateStoryRequest(BaseModel):
    title: str = Field(
        ...,
        min_length=MIN_TITLE_LENGTH,
        max_length=MAX_TITLE_LENGTH,
        description="Story title",
    )
    description: str | None = Field(
        None,
        max_length=MAX_DESCRIPTION_LENGTH,
        description="Emotional context/description",
    )

    memory_type: str = Field(
        ...,
        min_length=1,
        max_length=MAX_MEMORY_TYPE_LENGTH,
        description="Focus subject (e.g., Travel, Family)",
    )
    theme_name: str = Field(
        "nostalgic_film",
        description="Visual theme for memory cards",
    )

    photo_urls: list[str] = Field(
        ...,
        min_length=1,
        description="At least one photo URL required",
    )

    num_memory_cards: int = Field(
        3,
        ge=1,
        le=len(THEME_ORDER),
        description="Number of memory cards to generate",
    )

    def validate_title(self) -> None:
        """Validate title is not just whitespace."""
        if self.title.strip() != self.title or not self.title.strip():
            raise ValueError("Title cannot contain leading/trailing whitespace or be empty")

    def validate_urls(self) -> None:
        """Validate photo URLs are valid."""
        if not self.photo_urls:
            raise ValueError("At least one photo URL is required")

        if len(self.photo_urls) > 10:
            raise ValueError("Maximum 10 photos allowed")

        for url in self.photo_urls:
            if not isinstance(url, str) or len(url) < 10 or len(url) > 2000:
                raise ValueError("Invalid photo URL format")


class CreateStoryResponse(BaseModel):
    story_job_id: str


class MemoryCardResponse(BaseModel):
    id: str

    card_type: str
    theme_name: str

    status: str

    caption: str | None = None

    image_url: str | None = None

    error_message: str | None = None

    variants: dict | None = None


class StoryJobResponse(BaseModel):
    id: str

    title: str

    description: str | None

    memory_type: str

    theme_name: str

    status: str

    memory_cards: list[MemoryCardResponse]


class StoryJobSummaryResponse(BaseModel):
    id: str

    title: str

    theme_name: str

    status: str

    created_at: str

    thumbnail_url: str | None = None

    completed_cards: int

    total_cards: int


class UploadedPhotoResponse(BaseModel):
    file_id: str

    url: str

    created_at: str


# ---------------------------------------------------
# Upload Memory Photo
# ---------------------------------------------------


@router.get("/photos", response_model=list[UploadedPhotoResponse])
def list_uploaded_photos(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """List the current user's uploaded reference photos not yet cleaned up."""

    photos = session.exec(
        select(UploadedPhoto)
        .where(UploadedPhoto.user_id == current_user.id)
        .order_by(UploadedPhoto.created_at.desc())
    ).all()

    return [
        UploadedPhotoResponse(
            file_id=photo.file_id,
            url=photo.url,
            created_at=photo.created_at.isoformat(),
        )
        for photo in photos
    ]


@router.delete("/photos")
async def delete_memory_photo(
    file_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a previously uploaded memory photo from ImageKit CDN.

    Args:
        file_id: The file ID returned during upload (query parameter)
    """
    request_id = str(uuid.uuid4())

    try:
        photo = session.get(UploadedPhoto, file_id)
        if not photo or photo.user_id != current_user.id:
            logger.warning(
                f"[{request_id}] User {current_user.id} attempted to delete "
                f"photo {file_id} they don't own"
            )
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Photo not found",
            )

        logger.info(f"[{request_id}] Deleting photo with file_id: {file_id}")

        # Delete from ImageKit
        from services.imagekit_service import delete_file

        success = delete_file(file_id)

        if success:
            session.delete(photo)
            session.commit()
            logger.info(f"[{request_id}] Photo deleted successfully")
            return {"status": "deleted", "file_id": file_id}
        else:
            logger.warning(f"[{request_id}] Failed to delete photo")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete photo from storage",
            )

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception(f"[{request_id}] Error deleting photo: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete photo",
        ) from exc


@router.post("/upload-memory-photo")
async def upload_memory_photo(
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Upload a memory photo for story generation.

    Validates file type using magic bytes, not client headers.
    Returns signed URL for accessing the uploaded image.
    """
    request_id = str(uuid.uuid4())

    try:
        content = await file.read()

        # Validate file
        is_valid, error_msg, detected_mime = validate_image_file(
            file_bytes=content,
            client_content_type=file.content_type,
            max_size=MAX_UPLOAD_BYTES,
        )

        if not is_valid:
            logger.warning(
                f"[{request_id}] File validation failed: {error_msg} "
                f"(client MIME: {file.content_type})"
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_msg or "Invalid image file",
            )

        # Generate safe filename
        safe_filename = generate_safe_filename(file.filename, ".jpg")

        logger.info(
            f"[{request_id}] Uploading file: {file.filename} -> {safe_filename} "
            f"(size: {len(content)} bytes, MIME: {detected_mime})"
        )

        # Upload to ImageKit, scoped to this user's folder
        from services.imagekit_service import upload_file
        upload_result = upload_file(
            file_bytes=content,
            file_name=safe_filename,
            folder=f"/memory-photos/{current_user.id}",
            content_type=detected_mime,
        )

        session.add(
            UploadedPhoto(
                file_id=upload_result["file_id"],
                user_id=current_user.id,
                url=upload_result["url"],
            )
        )
        session.commit()

        logger.info(f"[{request_id}] File uploaded successfully to {upload_result['url']}")
        return {
            "url": upload_result["url"],
            "file_id": upload_result["file_id"],
        }

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception(f"[{request_id}] Unexpected error during upload: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Image upload failed. Please try again later.",
        ) from exc


# ---------------------------------------------------
# Create Story Job
# ---------------------------------------------------


@router.post(
    "/story-jobs",
    response_model=CreateStoryResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_story_job(
    request: CreateStoryRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new story job for memory generation.

    Validates input, creates story job and memory cards, then
    starts async generation in background.
    """
    request_id = str(uuid.uuid4())

    try:
        # Validate request data
        request.validate_title()
        request.validate_urls()

        # Validate num_memory_cards
        if request.num_memory_cards < 1 or request.num_memory_cards > len(THEME_ORDER):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"num_memory_cards must be between 1 and {len(THEME_ORDER)}",
            )

        # Validate theme_name
        if request.theme_name not in THEME_ORDER:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid theme. Must be one of: {', '.join(THEME_ORDER)}",
            )

        logger.info(
            f"[{request_id}] Creating story job: '{request.title}' "
            f"({request.num_memory_cards} cards, theme: {request.theme_name})"
        )

        # Create story job
        story_job = StoryJob(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            title=request.title.strip(),
            description=request.description.strip() if request.description else None,
            memory_type=request.memory_type.strip(),
            theme_name=request.theme_name,
            photo_urls=",".join(url.strip() for url in request.photo_urls),
            num_memory_cards=request.num_memory_cards,
            status="pending",
        )

        session.add(story_job)
        session.commit()
        session.refresh(story_job)

        logger.debug(f"[{request_id}] Story job created: {story_job.id}")

        # Create memory cards
        themes = themes_for_job(request.theme_name, request.num_memory_cards)

        for i, theme in enumerate(themes):
            memory_card = MemoryCard(
                id=str(uuid.uuid4()),
                story_job_id=story_job.id,
                card_type=request.memory_type,
                theme_name=theme,
                status="pending",
            )
            session.add(memory_card)
            logger.debug(f"[{request_id}] Memory card created: {memory_card.id}")

        session.commit()

        logger.info(f"[{request_id}] Starting background generation for job {story_job.id}")

        # Start async generation with error tracking
        task = asyncio.create_task(process_story_job(story_job.id, request_id))

        return CreateStoryResponse(story_job_id=story_job.id)

    except HTTPException:
        raise
    except ValueError as exc:
        logger.warning(f"[{request_id}] Validation error: {exc}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        logger.exception(f"[{request_id}] Unexpected error creating story job")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create story job. Please try again later.",
        ) from exc


# ---------------------------------------------------
# List Story Jobs
# ---------------------------------------------------


@router.get(
    "/story-jobs",
    response_model=list[StoryJobSummaryResponse],
)
def list_story_jobs(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """List the current user's story jobs, most recent first."""

    story_jobs = session.exec(
        select(StoryJob)
        .where(StoryJob.user_id == current_user.id)
        .order_by(StoryJob.created_at.desc())
    ).all()

    summaries = []
    for story_job in story_jobs:
        cards = story_job.memory_cards
        completed = [c for c in cards if c.status == "completed" and c.image_url]

        summaries.append(
            StoryJobSummaryResponse(
                id=story_job.id,
                title=story_job.title,
                theme_name=story_job.theme_name,
                status=story_job.status,
                created_at=story_job.created_at.isoformat(),
                thumbnail_url=completed[0].image_url if completed else None,
                completed_cards=len(completed),
                total_cards=len(cards),
            )
        )

    return summaries


# ---------------------------------------------------
# Delete Story Job
# ---------------------------------------------------


@router.delete("/story-jobs/{story_job_id}")
def delete_story_job(
    story_job_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Delete a story job, its memory cards, and their generated images."""

    story_job = session.get(StoryJob, story_job_id)

    if not story_job or story_job.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Story job not found",
        )

    from services.imagekit_service import delete_files_in_folder
    delete_files_in_folder(f"/memory-cards/{story_job_id}/")

    for card in story_job.memory_cards:
        session.delete(card)
    session.delete(story_job)
    session.commit()

    logger.info(f"Deleted story job {story_job_id} for user {current_user.id}")
    return {"status": "deleted", "story_job_id": story_job_id}


# ---------------------------------------------------
# Get Story Job
# ---------------------------------------------------


@router.get(
    "/story-jobs/{story_job_id}",
    response_model=StoryJobResponse,
)
def get_story_job(
    story_job_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Get story job details and its memory cards."""

    try:
        story_job = session.get(StoryJob, story_job_id)

        if not story_job or story_job.user_id != current_user.id:
            logger.warning(f"Story job not found: {story_job_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Story job not found",
            )

        memory_cards_response = []

        from services.imagekit_service import get_memory_variants
        for card in story_job.memory_cards:
            variants = get_memory_variants(card.image_url) if card.image_url else None

            memory_cards_response.append(
                MemoryCardResponse(
                    id=card.id,
                    card_type=card.card_type,
                    theme_name=card.theme_name,
                    status=card.status,
                    caption=card.caption,
                    image_url=card.image_url,
                    error_message=card.error_message,
                    variants=variants,
                )
            )

        return StoryJobResponse(
            id=story_job.id,
            title=story_job.title,
            description=story_job.description,
            memory_type=story_job.memory_type,
            theme_name=story_job.theme_name,
            status=story_job.status,
            memory_cards=memory_cards_response,
        )

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception(f"Error retrieving story job {story_job_id}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve story job",
        ) from exc


# ---------------------------------------------------
# Stream Story Progress (SSE)
# ---------------------------------------------------


STREAM_MAX_SECONDS = 300


@router.get("/story-jobs/{story_job_id}/stream")
async def stream_story_job(
    story_job_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
):
    """
    Stream real-time updates as memory cards are generated.

    Uses Server-Sent Events (SSE) for live progress updates.
    """

    async def event_generator():
        request_id = str(uuid.uuid4())
        sent_cards = set()
        elapsed = 0.0

        try:
            logger.info(f"[{request_id}] Starting stream for job {story_job_id}")

            while True:
                if await request.is_disconnected():
                    logger.info(f"[{request_id}] Client disconnected, closing stream")
                    return

                if elapsed >= STREAM_MAX_SECONDS:
                    logger.warning(f"[{request_id}] Stream exceeded {STREAM_MAX_SECONDS}s, closing")
                    timeout_data = {"error": "Stream timed out waiting for generation"}
                    yield (
                        f"event: story_error\n"
                        f"data: {json.dumps(timeout_data)}\n\n"
                    )
                    return

                try:
                    with Session(engine) as session:
                        story_job = session.get(StoryJob, story_job_id)

                        if not story_job or story_job.user_id != current_user.id:
                            error_data = {"error": "Story job not found"}
                            yield (
                                f"event: story_error\n"
                                f"data: {json.dumps(error_data)}\n\n"
                            )
                            logger.warning(f"[{request_id}] Story job not found: {story_job_id}")
                            return

                        memory_cards = session.exec(
                            select(MemoryCard).where(
                                MemoryCard.story_job_id == story_job_id
                            )
                        ).all()

                        from services.imagekit_service import get_memory_variants
                        for card in memory_cards:
                            # Completed Card
                            if card.status == "completed" and card.id not in sent_cards:
                                variants = (
                                    get_memory_variants(card.image_url)
                                    if card.image_url
                                    else None
                                )

                                data = {
                                    "id": card.id,
                                    "theme_name": card.theme_name,
                                    "status": card.status,
                                    "image_url": card.image_url,
                                    "variants": variants,
                                }

                                yield (
                                    f"event: memory_card_ready\n"
                                    f"data: {json.dumps(data)}\n\n"
                                )
                                sent_cards.add(card.id)
                                logger.debug(f"[{request_id}] Card ready: {card.id}")

                            # Failed Card
                            elif card.status == "failed" and card.id not in sent_cards:
                                data = {
                                    "id": card.id,
                                    "theme_name": card.theme_name,
                                    "status": card.status,
                                    "error_message": card.error_message or "Unknown error",
                                }

                                yield (
                                    f"event: memory_card_failed\n"
                                    f"data: {json.dumps(data)}\n\n"
                                )
                                sent_cards.add(card.id)
                                logger.warning(f"[{request_id}] Card failed: {card.id}")

                        # Check if all cards are done
                        all_done = all(
                            card.status in ["completed", "failed"]
                            for card in memory_cards
                        )

                        if all_done and len(sent_cards) == len(memory_cards):
                            completion_data = {"message": "Story generation completed"}
                            yield (
                                f"event: story_completed\n"
                                f"data: {json.dumps(completion_data)}\n\n"
                            )
                            logger.info(f"[{request_id}] Stream completed for job {story_job_id}")
                            return

                except Exception as exc:
                    logger.exception(f"[{request_id}] Error in event generator")
                    error_data = {"error": "Stream error occurred"}
                    yield (
                        f"event: story_error\n"
                        f"data: {json.dumps(error_data)}\n\n"
                    )
                    return

                await asyncio.sleep(1.5)
                elapsed += 1.5

        except Exception as exc:
            logger.exception(f"[{request_id}] Unexpected error in stream")

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
