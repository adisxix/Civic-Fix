"""Auth schemas."""

import re
from typing import Any

from pydantic import Field, field_validator, model_validator

from app.core.schemas import ApiModel

EMAIL_REGEX = re.compile(r"^[\w\.\+\-]+@[\w\.\-]+\.[a-zA-Z0-9\-_]+$")


class RegisterRequest(ApiModel):
    name: str | None = Field(default=None, max_length=120)
    full_name: str | None = None
    email: str = Field(..., max_length=255)
    password: str = Field(min_length=8, max_length=100)
    ward_id: int | None = None
    phone: str | None = Field(default=None, max_length=20)

    @model_validator(mode="before")
    @classmethod
    def normalize_name(cls, data: Any) -> Any:
        if isinstance(data, dict):
            resolved = data.get("name") or data.get("full_name")
            if resolved:
                data["name"] = resolved.strip()
            elif "name" not in data:
                data["name"] = ""
        return data

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str | None) -> str:
        if not v or len(v.strip()) < 2:
            raise ValueError("Full name must be at least 2 characters.")
        return v.strip()

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        clean = v.strip().lower()
        if not EMAIL_REGEX.match(clean):
            raise ValueError("Please provide a valid email address.")
        return clean


class LoginRequest(ApiModel):
    email: str = Field(..., max_length=255)
    password: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class UserResponse(ApiModel):
    id: int
    name: str
    email: str
    phone: str | None = None
    role: str
    ward_id: int | None = None
    department_id: int | None = None
    token: str | None = None
