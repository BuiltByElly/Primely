from datetime import datetime, timezone

from sqlmodel import Session, col, update

from app.core.database import engine
from app.models.models import Links


def expire_links_task():
    with Session(engine) as session:
        session.exec(
            update(Links)
            .where(col(Links.status) == "active")
            .where(col(Links.expires_at) < datetime.now(timezone.utc))
            .values(status="expired")
        )
        session.commit()
