import logging
import sys

from config import IMAGEKIT_PRIVATE_KEY, IMAGEKIT_PUBLIC_KEY, IMAGEKIT_URL_ENDPOINT

logger = logging.getLogger(__name__)

_imagekit = None

def get_imagekit():
    """Lazy initialization of ImageKit to avoid Pydantic issues."""
    global _imagekit
    if _imagekit is None:
        try:
            from imagekitio import ImageKit
            _imagekit = ImageKit(private_key=IMAGEKIT_PRIVATE_KEY)
        except Exception as exc:
            logger.error(f"Failed to initialize ImageKit: {exc}")
            # Re-raise with more context
            raise RuntimeError(
                f"ImageKit initialization failed. This may be due to library compatibility issues. "
                f"Error: {exc}"
            ) from exc
    return _imagekit


def upload_file(
    file_bytes: bytes,
    file_name: str,
    folder: str,
    content_type: str = "image/png",
) -> dict:
    """Upload generated media asset to ImageKit CDN.

    Args:
        file_bytes: File content as bytes
        file_name: Name for the file
        folder: Folder path in ImageKit
        content_type: MIME type (used for logging only)

    Returns:
        Dictionary with 'url' and 'file_id' keys
    """

    try:
        logger.debug(
            f"Uploading file to ImageKit: {file_name} "
            f"({len(file_bytes)} bytes, {content_type})"
        )

        imagekit = get_imagekit()
        response = imagekit.files.upload(
            file=file_bytes,
            file_name=file_name,
            folder=folder,
            is_private_file=False,
            use_unique_file_name=True,
        )

        logger.debug(f"File uploaded successfully: {response.url} (ID: {response.file_id})")
        return {
            "url": response.url,
            "file_id": response.file_id,
        }

    except Exception as exc:
        logger.exception(f"Failed to upload file to ImageKit: {exc}")
        raise RuntimeError(f"Failed to upload file to ImageKit: {exc}") from exc


def get_memory_variants(base_url: str) -> dict:
    """
    Generate optimized media variants for different platforms.
    """

    return {
        "instagram_story": (
            f"{base_url}?tr=w-1080,h-1920,c-maintain_ratio"
        ),
        "instagram_post": (
            f"{base_url}?tr=w-1080,h-1080,c-maintain_ratio"
        ),
        "memory_album": (
            f"{base_url}?tr=w-1600,h-900,c-maintain_ratio"
        ),
        "mobile_preview": (
            f"{base_url}?tr=w-600,h-900,c-maintain_ratio"
        ),
    }


def delete_file(file_id: str) -> bool:
    """
    Delete a file from ImageKit CDN.

    Args:
        file_id: The file ID returned by ImageKit during upload

    Returns:
        True if successful, False otherwise
    """
    try:
        if not file_id:
            logger.warning("No file ID provided for deletion")
            return False

        logger.debug(f"Deleting ImageKit file with ID: {file_id}")

        # Delete file from ImageKit using the file ID
        imagekit = get_imagekit()
        imagekit.files.delete(file_id=file_id)

        logger.info(f"File deleted from ImageKit: {file_id}")
        return True

    except Exception as exc:
        from imagekitio import NotFoundError

        if isinstance(exc, NotFoundError):
            # File's already gone - that's the desired end state, so this is
            # a success, not a failure. Treating it as a failure left the
            # caller's DB row stuck forever with no way to ever delete it.
            logger.info(f"File already absent from ImageKit (treating as deleted): {file_id}")
            return True

        logger.error(f"Failed to delete file from ImageKit: {exc}")
        return False


def delete_files_in_folder(folder_path: str) -> bool:
    """
    Delete all files in a folder from ImageKit.

    Useful for cleanup when deleting entire stories.

    Args:
        folder_path: Folder path like "/memory-cards/story-id/"

    Returns:
        True if successful
    """
    try:
        logger.debug(f"Deleting all files in ImageKit folder: {folder_path}")

        imagekit = get_imagekit()
        files = imagekit.assets.list(path=folder_path, type="file")

        for file_item in files:
            try:
                imagekit.files.delete(file_id=file_item.file_id)
                logger.debug(f"Deleted file: {file_item.name}")
            except Exception as exc:
                logger.warning(f"Failed to delete {file_item.name}: {exc}")

        try:
            imagekit.folders.delete(folder_path=folder_path)
        except Exception as exc:
            logger.debug(f"Folder {folder_path} not removed (may already be gone): {exc}")

        logger.info(f"Folder cleanup complete: {folder_path}")
        return True

    except Exception as exc:
        logger.error(f"Failed to delete folder from ImageKit: {exc}")
        return False
