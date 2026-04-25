from datetime import datetime, timezone

from sqlmodel import Session, col, update

from app.core.celery import celery_app
from app.core.database import engine
from app.models.models import Links


@celery_app.task(bind=True)
def expire_links_task(self):
    with Session(engine) as session:
        session.exec(
            update(Links)
            .where(col(Links.status) == "active")
            .where(col(Links.expires_at) < datetime.now(timezone.utc))
            .values(status="expired")
        )
        session.commit()
