import httpx
from sqlmodel import Session, select

from app.core.database import engine
from app.core.logging import logger
from app.models.models import ClickEvents
from app.utils.extract_browser import extract_browser

HTTP_TIMEOUT_SECONDS = 3.0


def _get_cached_country(session: Session, ip: str) -> str | None:
    cached_event = session.exec(
        select(ClickEvents.country)
        .where(ClickEvents.ip_address == ip)
        .where(ClickEvents.country != "Unknown")
    ).first()

    return cached_event


def _fetch_country_from_ip_api(ip: str) -> str:
    response = httpx.get(
        f"http://ip-api.com/json/{ip}?fields=57345",
        timeout=HTTP_TIMEOUT_SECONDS,
    )
    response.raise_for_status()

    payload = response.json()
    if payload.get("status") == "fail":
        logger.warning(
            f"ip-api returned a failure for IP {ip}: {payload.get('message', 'Unknown error')}"
        )
        return "Unknown"

    return payload.get("country", "Unknown")


def click_event_task(link_id, ip, browser):
    country = "Unknown"

    try:
        with Session(engine) as session:
            cached_country = _get_cached_country(session, ip)
            if cached_country:
                country = cached_country
            else:
                try:
                    country = _fetch_country_from_ip_api(ip)
                except httpx.TimeoutException as e:
                    logger.warning(f"ip-api timed out - Error {e}")
                except httpx.HTTPStatusError as e:
                    logger.warning(f"ip-api returned an HTTP error - Error {e}")
                except httpx.HTTPError as e:
                    logger.error(f"Failed to get country - Error {e}")
                except ValueError as e:
                    logger.error(f"Invalid JSON returned by ip-api - Error {e}")

            session.add(
                ClickEvents(
                    link_id=link_id,
                    ip_address=ip,
                    country=country,
                    browser=extract_browser(browser),
                )
            )
            session.commit()
            logger.info("Click event saved")

    except Exception as e:
        logger.error(f"Unexpected error while saving click event: {e}")
