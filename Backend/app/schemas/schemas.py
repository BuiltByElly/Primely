from datetime import datetime
from typing import Literal

from pydantic import BaseModel, HttpUrl

from app.models.models import ClickEvents


class LoginSchema(BaseModel):
    password: str
    email: str
    remember_me: bool = False


class RegisterSchema(BaseModel):
    username: str
    password: str
    email: str
    remember_me: bool = False


class UserResponse(BaseModel):
    public_id: str
    username: str
    email: str


class LinkCreate(BaseModel):
    name: str
    original_link: HttpUrl
    lifetime: int = 30


class LinkResponse(BaseModel):
    id: int
    name: str
    original_link: str
    short_code: str
    status: Literal["scanning", "active", "malicious", "expired", "failed"]
    clicks: list[ClickEvents] | None = None
    created_at: datetime
    expires_at: datetime
