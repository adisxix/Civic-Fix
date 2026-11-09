"""Cloudinary storage provider."""

import asyncio
from typing import Any

from app.core.config import settings
from app.core.logging import logger


class CloudinaryStorageProvider:
    def __init__(self) -> None:
        self.configured = bool(
            settings.CLOUDINARY_CLOUD_NAME
            and settings.CLOUDINARY_API_KEY
            and settings.CLOUDINARY_API_SECRET
        )
        if self.configured:
            import cloudinary

            cloudinary.config(
                cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                api_key=settings.CLOUDINARY_API_KEY,
                api_secret=settings.CLOUDINARY_API_SECRET,
                secure=True,
            )

    async def save_image(self, data: bytes, folder: str = "reports") -> dict[str, str]:
        if not self.configured:
            from app.lib.storage.local import LocalStorageProvider

            logger.warning("Cloudinary not configured, falling back to local storage")
            return await LocalStorageProvider().save_image(data, folder)

        import cloudinary.uploader

        def _upload() -> dict[str, Any]:
            return cloudinary.uploader.upload(
                data,
                folder=f"civicfix/{folder}",
                resource_type="image",
            )

        res = await asyncio.to_thread(_upload)
        return {
            "url": res["secure_url"],
            "key": res["public_id"],
        }

    async def delete_image(self, key: str) -> None:
        if not self.configured:
            return

        import cloudinary.uploader

        await asyncio.to_thread(cloudinary.uploader.destroy, key)
