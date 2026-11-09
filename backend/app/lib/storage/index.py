"""Storage entry point."""

from app.core.config import settings
from app.lib.storage.cloudinary import CloudinaryStorageProvider
from app.lib.storage.local import LocalStorageProvider

if settings.STORAGE_DRIVER == "cloudinary":
    _provider = CloudinaryStorageProvider()
else:
    _provider = LocalStorageProvider()


async def save_image(data: bytes, folder: str = "reports") -> dict[str, str]:
    return await _provider.save_image(data, folder)


async def delete_image(key: str) -> None:
    await _provider.delete_image(key)
