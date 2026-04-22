from datetime import datetime, timedelta, timezone
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlmodel import select
from starlette.status import (
    HTTP_201_CREATED,
    HTTP_401_UNAUTHORIZED,
    HTTP_403_FORBIDDEN,
)

from app.api.dependencies import SessionDeps
from app.core.logging import logger
from app.models.models import Links, Users
from app.schemas.schemas import LinkCreate, UserResponse
from app.services.authentication import get_current_user
from app.tasks.scan_links_task import scan_links_task

root_router = APIRouter(tags=["User"])


@root_router.get("/me", response_model=UserResponse)
async def me(
    current_user_public_id: Annotated[str, Depends(get_current_user)],
    session: SessionDeps,
):
    """Get current user information"""
    current_user = session.exec(
        select(Users).where(Users.public_id == UUID(current_user_public_id))
    ).first()

    if not current_user:
        raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail="User not found")

    return {
        "public_id": current_user_public_id,
        "username": current_user.username,
        "email": current_user.email,
    }


@root_router.post("/me/links")
async def post_link(
    current_user_public_id: Annotated[str, Depends(get_current_user)],
    session: SessionDeps,
    Link: LinkCreate,
):
    """Post a new link for the current user"""
    user = session.exec(
        select(Users).where(Users.public_id == UUID(current_user_public_id))
    ).first()

    if user:
        user_id = user.id
        new_link = Links(
            user_id=user_id,
            name=Link.name,
            original_link=str(Link.original_link),
            expires_at=datetime.now(timezone.utc) + timedelta(days=Link.lifetime),
        )  # status scanning by default

        session.add(new_link)
        session.commit()

        count = session.exec(
            select(func.count()).where(Links.status == "scanning")
        ).one()
        if count >= 400:
            logger.warning(
                "Too many scanning links, triggering background task immediately"
            )
            try:
                scan_links_task.delay()  # type: ignore
            except Exception as e:
                logger.error(f"Failed to trigger background task: {e}")
    else:
        raise HTTPException(
            status_code=HTTP_401_UNAUTHORIZED, detail="User not found, Go back to login"
        )

    return {
        "status": "success",
        "status_code": HTTP_201_CREATED,
        "message": "Link added successfully",
    }
