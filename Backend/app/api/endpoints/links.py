from datetime import datetime, timedelta, timezone
from typing import Annotated, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import func
from sqlalchemy.exc import NoResultFound
from sqlmodel import select
from starlette.status import (
    HTTP_200_OK,
    HTTP_201_CREATED,
    HTTP_401_UNAUTHORIZED,
    HTTP_404_NOT_FOUND,
)

from app.api.dependencies import SessionDeps
from app.core.logging import logger
from app.models.models import Links, Users
from app.schemas.schemas import LinkCreate, LinkResponse, LinkUpdate
from app.services.authentication import get_current_user
from app.tasks.scan_links_task import scan_links_task

links_router = APIRouter(prefix="/me", tags=["Links"])
limiter = Limiter(key_func=get_remote_address)


@links_router.post("/links")
@limiter.limit("10/minute")
async def post_link(
    current_user_public_id: Annotated[str, Depends(get_current_user)],
    session: SessionDeps,
    request: Request,
    link: LinkCreate,
):
    """Post a new link for the current user"""
    user = session.exec(
        select(Users).where(Users.public_id == UUID(current_user_public_id))
    ).first()

    if not user:
        raise HTTPException(
            status_code=HTTP_401_UNAUTHORIZED, detail="User not found, Go back to login"
        )

    new_link = Links(
        user_id=user.id,
        name=link.name,
        original_link=str(link.original_link),
        expires_at=datetime.now(timezone.utc) + timedelta(days=abs(link.lifetime)),
    )
    session.add(new_link)
    session.commit()

    count = session.exec(select(func.count()).where(Links.status == "scanning")).one()
    if count >= 400:
        logger.warning(
            "Too many scanning links, triggering background task immediately"
        )
        try:
            scan_links_task()
        except Exception as e:
            logger.error(f"Failed to trigger background task: {e}")

    return {
        "status": "success",
        "status_code": HTTP_201_CREATED,
        "message": "Link added successfully",
    }


@links_router.get("/links", response_model=List[LinkResponse])
@limiter.limit("15/minute")
async def get_links(
    current_user_public_id: Annotated[str, Depends(get_current_user)],
    session: SessionDeps,
    request: Request,
):
    """Get all links for the current user"""
    user = session.exec(
        select(Users).where(Users.public_id == UUID(current_user_public_id))
    ).first()

    if not user:
        raise HTTPException(
            status_code=HTTP_401_UNAUTHORIZED, detail="User not found, Go back to login"
        )

    links = session.exec(select(Links).where(Links.user_id == user.id)).all()
    return [link.model_dump() for link in links]


@links_router.get("/links/{link_id}", response_model=LinkResponse)
@limiter.limit("15/minute")
async def get_link(
    current_user_public_id: Annotated[str, Depends(get_current_user)],
    session: SessionDeps,
    link_id: int,
    request: Request,
):
    """Get a link that matches the link_id param for the current user"""
    user = session.exec(
        select(Users).where(Users.public_id == UUID(current_user_public_id))
    ).first()

    if not user:
        raise HTTPException(
            status_code=HTTP_401_UNAUTHORIZED, detail="User not found, Go back to login"
        )

    try:
        link = session.exec(
            select(Links).where(Links.user_id == user.id).where(Links.id == link_id)
        ).one()
    except NoResultFound:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Link not found")
    return link.model_dump()


@links_router.patch("/links/{link_id}")
@limiter.limit("10/minute")
async def patch_link(
    link_id: int,
    current_user_public_id: Annotated[str, Depends(get_current_user)],
    session: SessionDeps,
    request: Request,
    link_update: LinkUpdate,
):
    """Update a link's name or original link and set status to scanning"""
    user = session.exec(
        select(Users).where(Users.public_id == UUID(current_user_public_id))
    ).first()

    if not user:
        raise HTTPException(
            status_code=HTTP_401_UNAUTHORIZED, detail="User not found, Go back to login"
        )

    link = session.exec(
        select(Links).where(Links.id == link_id, Links.user_id == user.id)
    ).first()

    if not link:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Link not found")

    link.name = link_update.name
    link.original_link = str(link_update.original_link)

    link.status = "scanning"

    session.add(link)
    session.commit()
    session.refresh(link)

    return {
        "status": "success",
        "status_code": HTTP_201_CREATED,
        "message": "Link updated successfully.",
    }


@links_router.delete("/links/{link_id}")
@limiter.limit("10/minute")
async def delete_link(
    link_id: int,
    current_user_public_id: Annotated[str, Depends(get_current_user)],
    session: SessionDeps,
    request: Request,
):
    """Delete a link for the current user"""
    user = session.exec(
        select(Users).where(Users.public_id == UUID(current_user_public_id))
    ).first()

    if not user:
        raise HTTPException(
            status_code=HTTP_401_UNAUTHORIZED, detail="User not found, Go back to login"
        )

    link = session.exec(
        select(Links).where(Links.id == link_id, Links.user_id == user.id)
    ).first()

    if not link:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Link not found")

    session.delete(link)
    session.commit()

    return {
        "status": "success",
        "status_code": HTTP_200_OK,
        "message": "Link deleted successfully",
    }
