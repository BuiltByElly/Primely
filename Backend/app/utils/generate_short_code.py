import hashlib
import secrets

from sqlmodel import Session, select
from sqlmodel.sql.expression import col

from app.models.models import Links


def generate_short_code(original_link: str) -> str:
    """Generate a short code for the given original link."""
    salt = secrets.token_hex(4)  # 8 char random salt
    hashed = hashlib.md5(f"{original_link}{salt}".encode()).hexdigest()
    return hashed[:8]  # first 8 chars


def generate_unique_short_code(
    session: Session,
    original_url: str,
    link_id: int | None = 0,
) -> str:
    while True:
        short_code = generate_short_code(original_url)
        exists = session.exec(
            select(Links).where(
                col(Links.short_code) == short_code,
                Links.id != link_id,  # exclude the current link
            )
        ).first()
        if not exists:
            return short_code
