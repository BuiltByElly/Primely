from datetime import datetime, timezone

from sqlmodel import Session, col, delete

from app.core.celery import celery_app
from app.core.database import engine
from app.models.models import RefreshTokens


@celery_app.task(bind=True)
def cleanup_tokens_task(self):
    with Session(engine) as session:
        session.exec(
            delete(RefreshTokens).where(
                col(RefreshTokens.revoked)
                | (RefreshTokens.expires_at < datetime.now(timezone.utc))
            )
        )
        session.commit()
