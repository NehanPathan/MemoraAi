import base64
import logging

from openai import AsyncOpenAI

from config import OPENAI_API_KEY, OPENAI_TIMEOUT
from utils.circuit_breaker import circuit_breaker_manager

logger = logging.getLogger(__name__)

client = AsyncOpenAI(
    api_key=OPENAI_API_KEY,
    timeout=OPENAI_TIMEOUT,
    max_retries=0,  # generator.py's _retry_with_backoff already retries; avoid compounding retries
)


async def generate_memory_card(
    memory_title: str,
    memory_description: str,
    theme_prompt: str,
    reference_photo_urls: list[str],
) -> bytes:
    """Generate a memory card image using OpenAI with circuit breaker protection."""

    full_prompt = f"""
    Create a beautiful cinematic memory card.

    Memory Title:
    {memory_title}

    Memory Description:
    {memory_description}

    Visual Theme:
    {theme_prompt}

    Requirements:
    - emotional storytelling aesthetic
    - premium scrapbook feeling
    - cinematic composition
    - warm visual atmosphere
    - modern social-media-ready design
    - preserve likeness of people from uploaded images
    - use ALL uploaded photos as visual references
    - visually elegant typography space
    """

    content = []

    # Add uploaded images
    for url in reference_photo_urls:
        content.append(
            {
                "type": "input_image",
                "image_url": url,
            }
        )

    # Add prompt text
    content.append(
        {
            "type": "input_text",
            "text": full_prompt,
        }
    )

    # Use circuit breaker to protect against OpenAI service failures
    async def _call_openai():
        return await client.responses.create(
            model="gpt-4o-mini",
            input=[
                {
                    "role": "user",
                    "content": content,
                },
            ],
            tools=[
                {
                    "type": "image_generation",
                    "size": "1024x1024",
                    "quality": "medium",
                    "output_format": "png",
                }
            ],
        )

    try:
        response = await circuit_breaker_manager.call(
            "openai_generation",
            _call_openai,
        )
    except Exception as exc:
        logger.error(f"OpenAI generation failed: {exc}")
        raise RuntimeError(f"Failed to generate image: {exc}") from exc

    for item in response.output:
        if item.type == "image_generation_call" and item.result:
            return base64.b64decode(item.result)

    raise RuntimeError("No image generation result found in OpenAI response")
