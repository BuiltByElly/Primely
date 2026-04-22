import httpx
from sqlmodel import select

from app.api.dependencies import Session
from app.core.celery import celery_app
from app.core.database import engine
from app.core.logging import logger
from app.models.models import Links
from app.utils.generate_short_code import generate_unique_short_code
from app.utils.scan_links import scan_links


@celery_app.task(bind=True, max_retries=3)
def scan_links_task(self):
    with Session(engine) as session:
        unscanned_links = session.exec(
            select(Links).where(Links.status == "scanning")
        ).all()
        if not unscanned_links:
            return
        try:
            malicious_links = scan_links(
                [link.original_link for link in unscanned_links]
            )

            for link in unscanned_links:
                if link.original_link in malicious_links:
                    link.status = "malicious"
                else:
                    link.short_code = generate_unique_short_code(
                        session, link.original_link, link.id
                    )

                    link.status = "active"

            session.commit()
            logger.info(f"Scanned {len(unscanned_links)} links successfully")

        except httpx.HTTPError as e:
            # Google API failed — retry the task
            logger.warning(f"Google API failed: {e}, retrying in 60 seconds")
            raise self.retry(exc=e, countdown=60)

        except Exception as e:
            # Something else failed — mark all as failed
            logger.error(f"Unexpected error in scanning link celery task: {e}")
            for link in unscanned_links:
                link.status = "failed"
            session.commit()
            raise e
