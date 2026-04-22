from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import DateTime
from sqlmodel import Column, Field, Relationship, SQLModel


class RefreshTokens(SQLModel, table=True):
    id: int | None = Field(primary_key=True, default=None)
    user_id: int = Field(foreign_key="users.id", nullable=False)
    revoked: bool = False
    token_hash: str
    created_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )
    expires_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )


class Users(SQLModel, table=True):
    id: int | None = Field(primary_key=True, default=None)
    public_id: UUID = Field(
        default_factory=uuid4, index=True, unique=True, nullable=False
    )
    username: str = Field(max_length=25)
    password: str
    email: str = Field(unique=True)
    links: list["Links"] | None = Relationship(back_populates="owner")


class Links(SQLModel, table=True):
    id: int | None = Field(primary_key=True, default=None)
    user_id: int | None = Field(foreign_key="users.id")
    name: str
    owner: Users = Relationship(back_populates="links")
    original_link: str
    short_code: str | None = Field(
        default=None, unique=True, index=True
    )  # None until scanned
    status: str = Field(
        default="scanning", index=True
    )  # "scanning", "active", "malicious", "expired", "failed"
    clicks: list[ClickEvents] = Relationship(back_populates="link")
    created_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), nullable=False),
        default_factory=lambda: datetime.now(timezone.utc),
    )
    expires_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )


class ClickEvents(SQLModel, table=True):
    id: int | None = Field(primary_key=True, default=None)
    link_id: int | None = Field(foreign_key="links.id")
    link: Links = Relationship(back_populates="clicks")
    timestamp: datetime
    ip_address: str
    country: str
    user_agent: str
