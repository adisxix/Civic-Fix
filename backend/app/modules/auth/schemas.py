"""Auth schemas."""

from pydantic import EmailStr, Field

from app.core.schemas import ApiModel


class RegisterRequest(ApiModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=100)
    ward_id: int | None = None
    phone: str | None = Field(default=None, max_length=20)


class LoginRequest(ApiModel):
    email: EmailStr
    password: str


class UserResponse(ApiModel):
    id: int
    name: str
    email: str
    phone: str | None = None
    role: str
    ward_id: int | None = None
    department_id: int | None = None
