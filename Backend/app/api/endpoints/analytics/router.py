from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlmodel import select
from starlette.status import HTTP_401_UNAUTHORIZED, HTTP_404_NOT_FOUND

from app.api.dependencies import SessionDeps
from app.models.models import ClickEvents, Links, Users
from app.schemas.schemas import LinkAnalyticsResponse, LinksAnalyticsResponse
from app.services.authentication import get_current_user

from .helpers import (
    build_clicks_by_browser,
    build_clicks_by_country,
    build_clicks_over_time,
)

analytics_router = APIRouter(prefix="/me", tags=["Analytics"])
limiter = Limiter(key_func=get_remote_address)


@analytics_router.get("/analytics", response_model=LinksAnalyticsResponse)
@limiter.limit("30/minute")
async def get_links_analytics(
    current_user_public_id: Annotated[str, Depends(get_current_user)],
    session: SessionDeps,
    request: Request,
):
    """Get aggregated clicks analytics for the current user"""
    user = session.exec(
        select(Users).where(Users.public_id == current_user_public_id)
    ).first()

    if not user:
        raise HTTPException(
            status_code=HTTP_401_UNAUTHORIZED, detail="User not found, Go back to login"
        )

    base_query = (
        select(ClickEvents)
        .select_from(ClickEvents)
        .join(Links)
        .where(Links.user_id == user.id)
    )

    return {
        "clicks_over_time": build_clicks_over_time(session, base_query),
        "clicks_by_country": build_clicks_by_country(session, base_query),
        "clicks_by_browser": build_clicks_by_browser(session, base_query),
    }


@analytics_router.get("/analytics/{link_id}", response_model=LinkAnalyticsResponse)
@limiter.limit("30/minute")
async def get_link_analytics(
    link_id: int,
    current_user_public_id: Annotated[str, Depends(get_current_user)],
    session: SessionDeps,
    request: Request,
):
    """Get analytics for a link by id"""
    user = session.exec(
        select(Users).where(Users.public_id == current_user_public_id)
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

    base_query = select(ClickEvents).where(ClickEvents.link_id == link.id)

    return {
        "link_id": link.id,
        "clicks_over_time": build_clicks_over_time(session, base_query),
        "clicks_by_country": build_clicks_by_country(session, base_query),
        "clicks_by_browser": build_clicks_by_browser(session, base_query),
    }
