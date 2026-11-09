"""Local disk storage provider."""

import io
import uuid
from pathlib import Path

from PIL import Image


class LocalStorageProvider:
    def __init__(self, base_dir: Path | None = None) -> None:
        self.base_dir = base_dir or Path(__file__).resolve().parent.parent.parent.parent / "uploads"
        self.base_dir.mkdir(parents=True, exist_ok=True)

    async def save_image(self, data: bytes, folder: str = "reports") -> dict[str, str]:
        folder_dir = self.base_dir / folder
        folder_dir.mkdir(parents=True, exist_ok=True)

        filename = f"{uuid.uuid4().hex}.webp"
        filepath = folder_dir / filename

        # Open and sanitize image with Pillow, re-encode to WebP without EXIF
        image = Image.open(io.BytesIO(data))
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")
        image.thumbnail((1600, 1600), Image.Resampling.LANCZOS)
        image.save(filepath, format="WEBP", quality=85)

        key = f"{folder}/{filename}"
        url = f"/uploads/{key}"
        return {"url": url, "key": key}

    async def delete_image(self, key: str) -> None:
        filepath = self.base_dir / key
        if filepath.exists():
            filepath.unlink()
