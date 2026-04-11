from datetime import datetime
from uuid import UUID, uuid4

from sqlmodel import Field, Relationship, SQLModel


class Users(SQLModel, table=True):
    id: UUID | None = Field(default_factory=uuid4, primary_key=True, nullable=False)
    username: str = Field(max_length=25, unique=True)
    password: str
    links: list["Links"] | None = Relationship(back_populates="owner")


class Links(SQLModel, table=True):
    id: UUID | None = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id")
    owner: Users = Relationship(back_populates="links")
    original_link: str
    shortened_link: str
    clicks: list[ClickEvents] = Relationship(back_populates="link")
    created_at: datetime
    expires_at: datetime


class ClickEvents(SQLModel, table=True):
    id: UUID | None = Field(default_factory=uuid4, primary_key=True)
    link_id: UUID = Field(foreign_key="links.id")
    link: Links = Relationship(back_populates="clicks")
    timestamp: datetime
    ip_address: str
    country: str
    user_agent: str
