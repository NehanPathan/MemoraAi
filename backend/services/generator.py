import asyncio
import logging
import time
from typing import Optional

from sqlmodel import Session, select

from database import engine
from models import StoryJob, MemoryCard, UploadedPhoto
from services.openai_service import generate_memory_card

logger = logging.getLogger(__name__)

MEMORY_THEMES = {
    "nostalgic_film": (
        "Vintage nostalgic film aesthetic with soft warm tones, "
        "cinematic lighting, emotional atmosphere, and scrapbook styling."
    ),
    "cinematic_travel": (
        "Luxury cinematic travel aesthetic with vibrant scenery, "
        "beautiful depth, premium editorial composition, and emotional storytelling."
    ),
    "warm_family": (
        "Warm family memory aesthetic with cozy lighting, soft emotions, "
        "natural candid moments, and heartfelt storytelling visuals."
    ),
    "dreamy_childhood": (
        "Dreamy childhood aesthetic with soft pastel colors, magical atmosphere, "
        "gentle warmth, and nostalgic emotions."
    ),
}

THEME_ORDER = [
    "nostalgic_film",
    "cinematic_travel",
    "warm_family",
]


def themes_for_job(primary_theme: str, count: int) -> list[str]:
    """Return up to `count` themes, starting from the user's selected theme."""
    if primary_theme not in THEME_ORDER:
        primary_theme = THEME_ORDER[0]

    start = THEME_ORDER.index(primary_theme)
    rotated = THEME_ORDER[start:] + THEME_ORDER[:start]
    return rotated[: min(count, len(THEME_ORDER))]


async def _retry_with_backoff(
    coro_func,
    max_retries: int = 3,
    base_delay: float = 1.0,
):
    """Retry async operation with exponential backoff."""
    last_exc = None

    for attempt in range(max_retries):
        try:
            return await coro_func()
        except Exception as exc:
            last_exc = exc
            if attempt < max_retries - 1:
                delay = base_delay * (2 ** attempt)
                logger.warning(
                    f"Attempt {attempt + 1}/{max_retries} failed: {exc}. "
                    f"Retrying in {delay}s..."
                )
                await asyncio.sleep(delay)
            else:
                logger.error(
                    f"All {max_retries} attempts failed. Last error: {exc}"
                )

    raise last_exc


async def generate_single_memory_card(
    memory_card_id: str,
    memory_title: str,
    memory_description: str,
    reference_photo_urls: list[str],
    request_id: str = "",
):
    """Generate one memory card with proper error handling and retry logic."""

    try:
        # Get card and theme in single session
        with Session(engine) as session:
            card = session.get(MemoryCard, memory_card_id)
            if not card:
                logger.error(f"[{request_id}] Card not found: {memory_card_id}")
                return

            card.status = "generating"
            theme_name = card.theme_name
            story_job_id = card.story_job_id

            session.add(card)
            session.commit()

        logger.info(
            f"[{request_id}] Generating card {memory_card_id} "
            f"(theme: {theme_name})"
        )

        theme_prompt = MEMORY_THEMES.get(
            theme_name,
            MEMORY_THEMES[THEME_ORDER[0]],
        )

        # Generate image with retry logic
        start_time = time.time()

        async def _generate():
            return await generate_memory_card(
                memory_title=memory_title,
                memory_description=memory_description,
                theme_prompt=theme_prompt,
                reference_photo_urls=reference_photo_urls,
            )

        image_bytes = await _retry_with_backoff(_generate, max_retries=3)

        generation_time = time.time() - start_time
        logger.info(
            f"[{request_id}] Image generated in {generation_time:.1f}s "
            f"({len(image_bytes)} bytes)"
        )

        # Upload image
        from services.imagekit_service import upload_file
        upload_result = upload_file(
            file_bytes=image_bytes,
            file_name=f"{memory_card_id}.png",
            folder=f"/memory-cards/{story_job_id}/",
        )
        image_url = upload_result["url"]

        logger.info(
            f"[{request_id}] Card uploaded: {image_url}"
        )

        # Update card status in single session
        with Session(engine) as session:
            card = session.get(MemoryCard, memory_card_id)
            card.image_url = image_url
            card.status = "completed"
            session.add(card)
            session.commit()

        logger.info(f"[{request_id}] Card {memory_card_id} completed successfully")

    except asyncio.CancelledError:
        logger.warning(f"[{request_id}] Generation cancelled for card {memory_card_id}")
        with Session(engine) as session:
            card = session.get(MemoryCard, memory_card_id)
            if card:
                card.status = "failed"
                card.error_message = "Generation cancelled"
                session.add(card)
                session.commit()
        raise

    except Exception as e:
        error_msg = f"{type(e).__name__}: {str(e)}"[:500]
        logger.exception(
            f"[{request_id}] Error generating card {memory_card_id}: {error_msg}"
        )

        # Mark card as failed
        try:
            with Session(engine) as session:
                card = session.get(MemoryCard, memory_card_id)
                if card:
                    card.status = "failed"
                    card.error_message = error_msg
                    session.add(card)
                    session.commit()
        except Exception as db_exc:
            logger.exception(f"[{request_id}] Failed to update card status: {db_exc}")


ORPHANED_PHOTO_MAX_AGE_HOURS = 24


async def sweep_orphaned_photos():
    """Delete uploaded photos that were never attached to a finished story job.

    A story job's processing never takes anywhere near this long, so any
    UploadedPhoto record still around after the cutoff was abandoned
    (uploaded then never submitted, or the tab/session was closed).
    """
    from datetime import datetime, timedelta, timezone

    from services.imagekit_service import delete_file

    cutoff = datetime.now(timezone.utc) - timedelta(hours=ORPHANED_PHOTO_MAX_AGE_HOURS)

    try:
        with Session(engine) as session:
            stale_photos = session.exec(
                select(UploadedPhoto).where(UploadedPhoto.created_at < cutoff)
            ).all()

            if not stale_photos:
                return

            logger.info(f"Sweeping {len(stale_photos)} orphaned uploaded photo(s)")

            for photo in stale_photos:
                if delete_file(photo.file_id):
                    session.delete(photo)
                else:
                    logger.warning(
                        f"Failed to delete orphaned photo {photo.file_id} from ImageKit; will retry next sweep"
                    )

            session.commit()
    except Exception as exc:
        logger.exception(f"Orphaned photo sweep failed: {exc}")


async def run_orphaned_photo_sweep_loop(interval_seconds: float = 3600):
    """Background loop that periodically sweeps orphaned uploaded photos."""
    while True:
        await asyncio.sleep(interval_seconds)
        await sweep_orphaned_photos()


async def process_story_job(story_job_id: str, request_id: str = ""):
    """Process an entire memory storytelling job."""

    try:
        logger.info(
            f"[{request_id}] Starting story job processing: {story_job_id}"
        )

        # Load job data
        with Session(engine) as session:
            story_job = session.get(StoryJob, story_job_id)

            if not story_job:
                logger.error(
                    f"[{request_id}] Story job not found: {story_job_id}"
                )
                return

            story_job.status = "processing"
            session.add(story_job)
            session.commit()

            memory_cards = session.exec(
                select(MemoryCard).where(
                    MemoryCard.story_job_id == story_job_id
                )
            ).all()

            memory_card_ids = [card.id for card in memory_cards]
            memory_title = story_job.title
            memory_description = story_job.description or ""

            # Parse and validate photo URLs
            photo_urls = [
                url.strip()
                for url in story_job.photo_urls.split(",")
                if url.strip()
            ][:3]

        logger.info(
            f"[{request_id}] Processing {len(memory_card_ids)} cards "
            f"with {len(photo_urls)} reference photos"
        )

        # Generate all cards concurrently
        tasks = [
            generate_single_memory_card(
                memory_card_id=card_id,
                memory_title=memory_title,
                memory_description=memory_description,
                reference_photo_urls=photo_urls,
                request_id=request_id,
            )
            for card_id in memory_card_ids
        ]

        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Check for errors
        errors = [r for r in results if isinstance(r, Exception)]
        if errors:
            logger.warning(
                f"[{request_id}] {len(errors)} cards failed out of {len(tasks)}"
            )

        # Update job status
        with Session(engine) as session:
            cards = session.exec(
                select(MemoryCard).where(
                    MemoryCard.story_job_id == story_job_id
                )
            ).all()

            all_failed = all(card.status == "failed" for card in cards)
            story_job = session.get(StoryJob, story_job_id)

            story_job.status = "failed" if all_failed else "completed"
            session.add(story_job)
            session.commit()

        status_msg = "FAILED" if all_failed else "COMPLETED"
        logger.info(
            f"[{request_id}] Story job {story_job_id} {status_msg}"
        )

    except Exception as exc:
        logger.exception(
            f"[{request_id}] Unexpected error in process_story_job: {exc}"
        )
        try:
            with Session(engine) as session:
                story_job = session.get(StoryJob, story_job_id)
                if story_job:
                    story_job.status = "failed"
                    story_job.error_message = str(exc)[:500]
                    session.add(story_job)
                    session.commit()
        except Exception as db_exc:
            logger.exception(f"[{request_id}] Failed to update job status: {db_exc}")
