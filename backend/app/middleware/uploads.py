"""Upload validation and streaming size limit enforcement."""

import io

from fastapi import UploadFile
from PIL import Image, UnidentifiedImageError

from app.core.config import settings
from app.core.errors import ValidationError

ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}


async def validate_and_sanitize_image(file: UploadFile) -> bytes:
    """Stream and validate image size and content, stripping EXIF metadata."""
    max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
    content = bytearray()

    while chunk := await file.read(64 * 1024):
        content.extend(chunk)
        if len(content) > max_bytes:
            raise ValidationError(
                f"File size exceeds maximum allowed limit of {settings.MAX_UPLOAD_MB} MB."
            )

    raw_bytes = bytes(content)
    if not raw_bytes:
        raise ValidationError("Uploaded file is empty.")

    try:
        image = Image.open(io.BytesIO(raw_bytes))
        image_format = image.format
        if image_format not in ALLOWED_FORMATS:
            raise ValidationError(
                f"Unsupported image format ({image_format}). Allowed: JPEG, PNG, WEBP."
            )

        # Re-encode to clean bytes, stripping EXIF
        output = io.BytesIO()
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")
        image.thumbnail((1600, 1600), Image.Resampling.LANCZOS)
        image.save(output, format="WEBP", quality=85)
        return output.getvalue()
    except UnidentifiedImageError as err:
        raise ValidationError("File content is not a valid image.") from err
