from datetime import date, datetime, timedelta, timezone
from typing import Annotated, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import func
from sqlmodel import select
from starlette.status import (
    HTTP_200_OK,
    HTTP_201_CREATED,
    HTTP_401_UNAUTHORIZED,
    HTTP_403_FORBIDDEN,
    HTTP_404_NOT_FOUND,
)

from app.api.dependencies import SessionDeps
from app.core.logging import logger
from app.models.models import ClickEvents, Links, Users
from app.schemas.schemas import (
    ClicksByBrowserEntry,
    ClicksByCountryEntry,
    ClicksOverTimeEntry,
    LinkAnalyticsResponse,
    LinkCreate,
    LinkResponse,
    LinksAnalyticsResponse,
    LinkUpdate,
    UserResponse,
)
from app.services.authentication import get_current_user
from app.tasks.scan_links_task import scan_links_task

root_router = APIRouter(tags=["User"])
limiter = Limiter(key_func=get_remote_address)


@root_router.get("/me", response_model=UserResponse)
@limiter.limit("30/minute")
async def me(
    current_user_public_id: Annotated[str, Depends(get_current_user)],
    session: SessionDeps,
    request: Request,
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
@limiter.limit("10/minute")
async def post_link(
    current_user_public_id: Annotated[str, Depends(get_current_user)],
    session: SessionDeps,
    request: Request,
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
            expires_at=datetime.now(timezone.utc) + timedelta(days=abs(Link.lifetime)),
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


@root_router.get("/me/analytics", response_model=LinksAnalyticsResponse)
@limiter.limit("30/minute")
async def get_links_analytics(
    current_user_public_id: Annotated[str, Depends(get_current_user)],
    session: SessionDeps,
    request: Request,
):
    """Get aggregated clicks analytics for the current user"""
    user = session.exec(
        select(Users).where(Users.public_id == UUID(current_user_public_id))
    ).first()
    if user:
        clicks_over_time_rows = session.exec(
            select(func.date(ClickEvents.timestamp), func.count())
            .select_from(ClickEvents)
            .join(Links)
            .where(Links.user_id == user.id)
            .group_by(func.date(ClickEvents.timestamp))
            .order_by(func.date(ClickEvents.timestamp))
        ).all()

        clicks_over_time = [
            ClicksOverTimeEntry(
                date=row_date
                if isinstance(row_date, date)
                else date.fromisoformat(row_date),
                clicks=count,
            )
            for row_date, count in clicks_over_time_rows
        ]

        country_rows = session.exec(
            select(ClickEvents.country, func.count())
            .select_from(ClickEvents)
            .join(Links)
            .where(Links.user_id == user.id)
            .group_by(ClickEvents.country)
            .order_by(func.count().desc())
        ).all()
        clicks_by_country = [
            ClicksByCountryEntry(country=country, clicks=count)
            for country, count in country_rows
        ]

        browser_rows = session.exec(
            select(ClickEvents.browser, func.count())
            .select_from(ClickEvents)
            .join(Links)
            .where(Links.user_id == user.id)
            .group_by(ClickEvents.browser)
            .order_by(func.count().desc())
        ).all()
        clicks_by_browser = [
            ClicksByBrowserEntry(browser=browser, clicks=count)
            for browser, count in browser_rows
        ]

        return {
            "clicks_over_time": clicks_over_time,
            "clicks_by_country": clicks_by_country,
            "clicks_by_browser": clicks_by_browser,
        }
    raise HTTPException(
        status_code=HTTP_401_UNAUTHORIZED, detail="User not found, Go back to login"
    )


@root_router.get("/me/links", response_model=List[LinkResponse])
@limiter.limit("30/minute")
async def get_links(
    current_user_public_id: Annotated[str, Depends(get_current_user)],
    session: SessionDeps,
    request: Request,
):
    """Get all links for the current user"""
    user = session.exec(
        select(Users).where(Users.public_id == UUID(current_user_public_id))
    ).first()
    if user:
        links = session.exec(select(Links).where(Links.user_id == user.id)).all()
        return [link.model_dump() for link in links]
    raise HTTPException(
        status_code=HTTP_401_UNAUTHORIZED, detail="User not found, Go back to login"
    )


@root_router.patch("/me/links/{link_id}")
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

    if link_update.name is not None:
        link.name = link_update.name
    if link_update.original_link is not None:
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


@root_router.delete("/me/links/{link_id}")
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


@root_router.get("/me/analytics/{link_id}", response_model=LinkAnalyticsResponse)
@limiter.limit("30/minute")
async def get_link_analytics(
    link_id: int,
    current_user_public_id: Annotated[str, Depends(get_current_user)],
    session: SessionDeps,
    request: Request,
):
    """Get analytics for a link by id"""
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

    clicks_over_time_rows = session.exec(
        select(func.date(ClickEvents.timestamp), func.count())
        .where(ClickEvents.link_id == link.id)
        .group_by(func.date(ClickEvents.timestamp))
        .order_by(func.date(ClickEvents.timestamp))
    ).all()
    clicks_over_time = [
        ClicksOverTimeEntry(
            date=row_date
            if isinstance(row_date, date)
            else date.fromisoformat(row_date),
            clicks=count,
        )
        for row_date, count in clicks_over_time_rows
    ]

    country_rows = session.exec(
        select(ClickEvents.country, func.count())
        .where(ClickEvents.link_id == link.id)
        .group_by(ClickEvents.country)
        .order_by(func.count().desc())
    ).all()
    clicks_by_country = [
        ClicksByCountryEntry(country=country, clicks=count)
        for country, count in country_rows
    ]

    browser_rows = session.exec(
        select(ClickEvents.browser, func.count())
        .where(ClickEvents.link_id == link.id)
        .group_by(ClickEvents.browser)
        .order_by(func.count().desc())
    ).all()
    clicks_by_browser = [
        ClicksByBrowserEntry(browser=browser, clicks=count)
        for browser, count in browser_rows
    ]

    return {
        "link_id": link.id,
        "clicks_over_time": clicks_over_time,
        "clicks_by_country": clicks_by_country,
        "clicks_by_browser": clicks_by_browser,
    }
