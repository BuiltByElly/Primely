from datetime import datetime, timezone

from sqlmodel import Session, col, delete, or_, select

from app.core.database import engine
from app.core.logging import logger
from app.models.models import RefreshTokens


def cleanup_tokens_task():
    with Session(engine) as session:
        try:
            sub_query = (
                select(RefreshTokens.id).where(
                    or_(RefreshTokens.revoked),
                    RefreshTokens.expires_at < datetime.now(timezone.utc),
                )
            ).limit(500)

            session.exec(
                delete(RefreshTokens).where(col(RefreshTokens.id).in_(sub_query))
            )
            session.commit()
            logger.info("Revoked refresh token cleaned up")
        except Exception:
            logger.error("An error occurred while cleaning refresh tokens")
