from datetime import date

from sqlalchemy import func
from sqlmodel import Session, select

from app.models.models import ClickEvents, Links
from app.schemas.schemas import (
    ClicksByBrowserEntry,
    ClicksByCountryEntry,
    ClicksOverTimeEntry,
)


def normalize_analytics_date(row_date) -> date:
    if isinstance(row_date, date):
        return row_date
    return date.fromisoformat(row_date)


def get_user_links_clicks_base_query(session: Session, user_id: int):
    return (
        select(ClickEvents)
        .select_from(ClickEvents)
        .join(Links)
        .where(Links.user_id == user_id)
    )


def get_link_clicks_base_query(link_id: int):
    return select(ClickEvents).where(ClickEvents.link_id == link_id)


def build_clicks_over_time(
    session: Session,
    base_query,
) -> list[ClicksOverTimeEntry]:
    rows = session.exec(
        base_query.group_by(func.date(ClickEvents.timestamp)).order_by(
            func.date(ClickEvents.timestamp)
        )
    ).all()

    return [
        ClicksOverTimeEntry(date=normalize_analytics_date(row_date), clicks=count)
        for row_date, count in rows
    ]


def build_clicks_by_country(
    session: Session,
    base_query,
) -> list[ClicksByCountryEntry]:
    rows = session.exec(
        base_query.group_by(ClickEvents.country).order_by(func.count().desc())
    ).all()

    return [
        ClicksByCountryEntry(country=country, clicks=count) for country, count in rows
    ]


def build_clicks_by_browser(
    session: Session,
    base_query,
) -> list[ClicksByBrowserEntry]:
    rows = session.exec(
        base_query.group_by(ClickEvents.browser).order_by(func.count().desc())
    ).all()

    return [
        ClicksByBrowserEntry(browser=browser, clicks=count) for browser, count in rows
    ]
