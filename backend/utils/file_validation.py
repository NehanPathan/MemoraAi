"""File validation utilities for secure file uploads."""

import logging
from typing import Tuple

logger = logging.getLogger(__name__)

ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/bmp",
}

FILE_SIGNATURES = {
    b"\xFF\xD8\xFF": ("image/jpeg", ".jpg"),
    b"\x89PNG\r\n\x1a\n": ("image/png", ".png"),
    b"RIFF": ("image/webp", ".webp"),  # WebP: RIFF....WEBP
    b"GIF87a": ("image/gif", ".gif"),
    b"GIF89a": ("image/gif", ".gif"),
    b"BM": ("image/bmp", ".bmp"),
}


def validate_image_file(
    file_bytes: bytes,
    client_content_type: str | None = None,
    max_size: int = 10485760,  # 10MB
) -> Tuple[bool, str | None, str]:
    """
    Validate image file by checking magic bytes and size.

    Returns: (is_valid, error_message, detected_mime_type)
    """

    # Check file size
    if len(file_bytes) > max_size:
        return False, f"File exceeds maximum size of {max_size // 1024 // 1024}MB", ""

    if len(file_bytes) < 8:
        return False, "File is too small to be a valid image", ""

    # Detect MIME type by magic bytes
    detected_mime_type = None
    detected_extension = None

    for signature, (mime_type, extension) in FILE_SIGNATURES.items():
        if file_bytes.startswith(signature):
            # Special case for RIFF (could be WebP, WAV, AVI, etc.)
            if signature == b"RIFF" and len(file_bytes) >= 12:
                if file_bytes[8:12] == b"WEBP":
                    detected_mime_type = mime_type
                    detected_extension = extension
                    break
            else:
                detected_mime_type = mime_type
                detected_extension = extension
                break

    # If no magic bytes matched, reject
    if not detected_mime_type:
        return False, "File is not a supported image format (invalid magic bytes)", ""

    # Verify client's claimed MIME type matches detected
    if client_content_type and client_content_type not in ALLOWED_MIME_TYPES:
        logger.warning(
            f"Client claimed MIME type not allowed: {client_content_type}. "
            f"Detected: {detected_mime_type}"
        )
        return False, "File MIME type not supported", ""

    # If client provided wrong MIME type, log warning but accept detected type
    if (
        client_content_type
        and client_content_type != detected_mime_type
    ):
        logger.warning(
            f"MIME type mismatch - Client: {client_content_type}, "
            f"Detected: {detected_mime_type}"
        )

    return True, None, detected_mime_type


def generate_safe_filename(original_filename: str | None, extension: str) -> str:
    """
    Generate a safe filename from user input.

    Removes path traversal attempts and special characters.
    """
    import os
    import uuid

    if not original_filename:
        return f"{uuid.uuid4()}{extension}"

    # Remove path separators
    safe_name = os.path.basename(original_filename)

    # Remove special characters, keep only alphanumeric, dash, underscore
    safe_name = "".join(c if c.isalnum() or c in "-_." else "" for c in safe_name)

    # Remove extension from original and use detected extension
    safe_name = os.path.splitext(safe_name)[0]

    # Limit length
    safe_name = safe_name[:100]

    # If completely empty after sanitization, generate UUID
    if not safe_name:
        return f"{uuid.uuid4()}{extension}"

    return f"{safe_name}-{uuid.uuid4()}{extension}"
