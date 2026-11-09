"""Auth schemas."""

import re

from pydantic import Field, field_validator

from app.core.schemas import ApiModel

EMAIL_REGEX = re.compile(r"^[\w\.\+\-]+@[\w\.\-]+\.[a-zA-Z0-9\-_]+$")


class RegisterRequest(ApiModel):
    name: str = Field(min_length=2, max_length=120)
    email: str = Field(..., max_length=255)
    password: str = Field(min_length=8, max_length=100)
    ward_id: int | None = None
    phone: str | None = Field(default=None, max_length=20)

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
