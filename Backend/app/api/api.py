from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, HTTPException, Request
from fastapi.responses import RedirectResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlmodel import select
from starlette.status import (
    HTTP_302_FOUND,
    HTTP_404_NOT_FOUND,
    HTTP_410_GONE,
    HTTP_503_SERVICE_UNAVAILABLE,
)

from app.api.dependencies import SessionDeps
from app.api.endpoints.auth import auth_router
from app.api.endpoints.root import root_router
from app.models.models import Links
from app.tasks.click_event_task import click_event_task

api_router = APIRouter(prefix="/api")
redirect_router = APIRouter(prefix="/r")


# endpoints
api_router.include_router(auth_router)
api_router.include_router(root_router)

limiter = Limiter(key_func=get_remote_address)


@redirect_router.get("/{short_code}")
@limiter.limit("5/minute")
async def get_link_by_short_code(
    short_code: str,
    session: SessionDeps,
    request: Request,
    background_tasks: BackgroundTasks,
):
    """Get a link by its short code"""
    now = datetime.now(timezone.utc)
    user_agent = request.headers.get("user-agent")
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        ip = forwarded_for.split(",")[0].strip()
    else:
        ip = request.client.host if request.client else "unknown"

    link = session.exec(select(Links).where(Links.short_code == short_code)).first()
    if link:
        if link.status == "expired":
            raise HTTPException(status_code=HTTP_410_GONE, detail="Link has expired")

        elif link.status == "active":
            if link.expires_at < now:
                raise HTTPException(
                    status_code=HTTP_410_GONE, detail="Link has expired"
                )
            background_tasks.add_task(click_event_task, link.id, ip, user_agent)  # type: ignore
            return RedirectResponse(url=link.original_link, status_code=HTTP_302_FOUND)

        elif link.status == "scanning":
            raise HTTPException(
                status_code=HTTP_503_SERVICE_UNAVAILABLE,
                detail="Link is still being scanned for malicious activity",
            )

    raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Link not found")
