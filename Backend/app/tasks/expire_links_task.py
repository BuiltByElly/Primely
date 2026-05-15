from datetime import datetime, timezone

from sqlmodel import Session, col, select, update

from app.core.database import engine
from app.core.logging import logger
from app.models.models import Links

"""
This function sets the status of links due to expire, expired.
It is called by APScheduler every hour
"""


def expire_links_task():
    with Session(engine) as session:
        try:
            sub_query = (
                select(Links.id)
                .where(col(Links.status) == "active")
                .where(col(Links.expires_at) < datetime.now(timezone.utc))
                .limit(500)
            )

            session.exec(
                update(Links)
                .where(col(Links.id).in_(sub_query))
                .values(status="expired")
            )
            session.commit()
            logger.info("Expired links called successfully")
        except Exception:
            logger.error("An error occurred while expiring links")
