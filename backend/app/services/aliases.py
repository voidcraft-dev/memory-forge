from datetime import UTC, datetime

from sqlmodel import Session, select

from app.models import SessionAlias


def get_alias_map(session: Session, platform: str) -> dict[str, str]:
    rows = session.exec(
        select(SessionAlias).where(SessionAlias.platform == platform)
    ).all()
    return {row.session_key: row.title for row in rows}


def save_alias(
    session: Session, platform: str, session_key: str, title: str
) -> SessionAlias:
    clean_title = title.strip()
    existing = session.exec(
        select(SessionAlias).where(
            SessionAlias.platform == platform,
            SessionAlias.session_key == session_key,
        )
    ).first()
    now = datetime.now(UTC)
    if existing is None:
        existing = SessionAlias(
            platform=platform,
            session_key=session_key,
            title=clean_title,
            created_at=now,
            updated_at=now,
        )
    else:
        existing.title = clean_title
        existing.updated_at = now
    session.add(existing)
    session.commit()
    session.refresh(existing)
    return existing
