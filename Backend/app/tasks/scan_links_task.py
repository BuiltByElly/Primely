from datetime import datetime, timezone

from sqlmodel import or_, select

from app.api.dependencies import Session
from app.core.database import engine
from app.core.logging import logger
from app.models.models import Links
from app.utils.generate_short_code import generate_unique_short_code
from app.utils.scan_links import scan_links

"""
This function uses the Google Safe Browsing API to scan links in batches.
It is called by APScheduler every 10s
"""


async def scan_links_task():
    with Session(engine) as session:
        unscanned_links = session.exec(
            select(Links)
            .where(or_(Links.status == "scanning", Links.status == "failed"))
            .limit(500)
            .with_for_update(skip_locked=True)
        ).all()
        if not unscanned_links:
            return
        try:
            malicious_links = await scan_links(
                [link.original_link for link in unscanned_links]
            )

            for link in unscanned_links:
                if link.original_link in malicious_links:
                    link.status = "malicious"
                else:
                    if link.short_code is None:
                        link.short_code = generate_unique_short_code(
                            session, link.original_link, link.id
                        )
                    elif link.expires_at < datetime.now(timezone.utc):
                        link.status = "expired"
                    else:
                        link.status = "active"
            session.commit()
            logger.info(f"Scanned {len(unscanned_links)} links successfully")

        except Exception as e:
            # Something else failed — mark all as failed
            logger.error(f"Unexpected error in scanning link task: {e}")
            for link in unscanned_links:
                link.status = "failed"
            session.commit()
