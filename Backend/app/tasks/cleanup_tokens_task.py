from datetime import datetime, timezone

from sqlmodel import Session, col, delete

from app.core.database import engine
from app.models.models import RefreshTokens


def cleanup_tokens_task():
    with Session(engine) as session:
        session.exec(
            delete(RefreshTokens).where(
                col(RefreshTokens.revoked)
                | (RefreshTokens.expires_at < datetime.now(timezone.utc))
            )
        )
        session.commit()
