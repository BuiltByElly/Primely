from sqlalchemy import func
from sqlmodel import Session, select

from app.models.models import ClickEvents, Links
from app.schemas.schemas import (
    ClicksByBrowserEntry,
    ClicksByCountryEntry,
    ClicksOverTimeEntry,
)


def normalize_analytics_date(row_date):
    if hasattr(row_date, "isoformat"):
        return row_date
    return row_date


def build_clicks_over_time(
    session: Session, owner_id: int | None, by_link: bool = False
):
    statement = select(
        func.date(ClickEvents.timestamp),
        func.count(),
    ).select_from(ClickEvents)

    if owner_id is None:
        return []

    if by_link:
        statement = statement.where(ClickEvents.link_id == owner_id)
    else:
        statement = statement.join(Links).where(Links.user_id == owner_id)

    rows = session.exec(
        statement.group_by(func.date(ClickEvents.timestamp)).order_by(
            func.date(ClickEvents.timestamp)
        )
    ).all()

    return [
        ClicksOverTimeEntry(date=normalize_analytics_date(row_date), clicks=count)
        for row_date, count in rows
    ]


def build_clicks_by_country(
    session: Session, owner_id: int | None, by_link: bool = False
):
    statement = select(
        ClickEvents.country,
        func.count(),
    ).select_from(ClickEvents)

    if owner_id is None:
        return []

    if by_link:
        statement = statement.where(ClickEvents.link_id == owner_id)
    else:
        statement = statement.join(Links).where(Links.user_id == owner_id)

    rows = session.exec(
        statement.group_by(ClickEvents.country).order_by(func.count().desc())
    ).all()

    return [
        ClicksByCountryEntry(country=country, clicks=count) for country, count in rows
    ]


def build_clicks_by_browser(
    session: Session, owner_id: int | None, by_link: bool = False
):
    statement = select(
        ClickEvents.browser,
        func.count(),
    ).select_from(ClickEvents)

    if owner_id is None:
        return []

    if by_link:
        statement = statement.where(ClickEvents.link_id == owner_id)
    else:
        statement = statement.join(Links).where(Links.user_id == owner_id)

    rows = session.exec(
        statement.group_by(ClickEvents.browser).order_by(func.count().desc())
    ).all()

    return [
        ClicksByBrowserEntry(browser=browser, clicks=count) for browser, count in rows
    ]
