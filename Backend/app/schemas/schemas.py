from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, Field, HttpUrl


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
    lifetime: Annotated[int, Field(le=30)] = 30


class LinkResponse(BaseModel):
    id: int
    name: str
    original_link: str
    short_code: str
    status: Literal["scanning", "active", "malicious", "expired", "failed"]
    created_at: datetime
    expires_at: datetime
