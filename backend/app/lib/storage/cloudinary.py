"""Cloudinary storage provider (optional)."""

from app.core.config import settings


class CloudinaryStorageProvider:
    def __init__(self) -> None:
        self.configured = bool(
            settings.CLOUDINARY_CLOUD_NAME
            and settings.CLOUDINARY_API_KEY
            and settings.CLOUDINARY_API_SECRET
        )

    async def save_image(self, data: bytes, folder: str = "reports") -> dict[str, str]:
        # Fallback to local if Cloudinary credentials are not configured
        from app.lib.storage.local import LocalStorageProvider

        return await LocalStorageProvider().save_image(data, folder)

    async def delete_image(self, key: str) -> None:
        pass
