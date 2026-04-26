import httpx
from sqlmodel import Session

from app.core.database import engine
from app.core.logging import logger
from app.models.models import ClickEvents
from app.utils.extract_browser import extract_browser


def click_event_task(link_id, ip, browser):
    try:
        country = (
            httpx.get(f"http://ip-api.com/json/{ip}?fields=57345")
            .json()
            .get("country", "Unknown")
        )
        with Session(engine) as session:
            session.add(
                ClickEvents(
                    link_id=link_id,
                    ip_address=ip,
                    country=country,
                    browser=extract_browser(browser),
                )
            )
            session.commit()
    except httpx.HTTPError as e:
        logger.error(f"Failed to get country for IP {ip} - Error {e}")
