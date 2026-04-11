from fastapi import APIRouter
from sqlmodel import select

from app.db import SessionDep
from app.models import Prompt

router = APIRouter(prefix="/api/prompts", tags=["prompts"])

PRESET_TAGS = ["代码", "写作", "翻译", "分析", "设计", "优化", "学习", "其他",
               "Code", "Writing", "Translation", "Analysis", "Design", "Optimization", "Learning", "Other"]


@router.get("")
def list_prompts(session: SessionDep, q: str = "", tag: str = ""):
    """List all prompts, optionally filtered by search query and/or tag."""
    statement = select(Prompt).order_by(Prompt.updated_at.desc())
    rows = session.exec(statement).all()

    results = rows
    if q.strip():
        needle = q.strip().lower()
        results = [r for r in results if needle in r.name.lower() or needle in r.content.lower()]

    if tag.strip():
        tag_lower = tag.strip().lower()
        results = [r for r in results if tag_lower in [t.strip().lower() for t in r.tags.split(",") if t.strip()]]

    return {
        "ok": True,
        "data": [
            {
                "id": row.id,
                "name": row.name,
                "content": row.content,
                "tags": [t.strip() for t in row.tags.split(",") if t.strip()],
                "useCount": row.use_count,
                "createdAt": row.created_at.isoformat(),
                "updatedAt": row.updated_at.isoformat(),
            }
            for row in results
        ],
        "presetTags": PRESET_TAGS,
    }


@router.post("")
def create_prompt(payload: dict, session: SessionDep):
    """Create a new prompt."""
    name = payload.get("name", "").strip()
    content = payload.get("content", "").strip()
    tags = payload.get("tags", [])

    if not name or not content:
        return {"ok": False, "error": "Name and content are required"}

    from datetime import UTC, datetime
    row = Prompt(
        name=name,
        content=content,
        tags=",".join(tags),
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )
    session.add(row)
    session.commit()
    session.refresh(row)

    return {
        "ok": True,
        "data": {
            "id": row.id,
            "name": row.name,
            "content": row.content,
            "tags": [t.strip() for t in row.tags.split(",") if t.strip()],
            "useCount": row.use_count,
            "createdAt": row.created_at.isoformat(),
            "updatedAt": row.updated_at.isoformat(),
        },
    }


@router.put("/{prompt_id}")
def update_prompt(prompt_id: int, payload: dict, session: SessionDep):
    """Update an existing prompt."""
    row = session.get(Prompt, prompt_id)
    if not row:
        return {"ok": False, "error": "Prompt not found"}

    if "name" in payload:
        row.name = payload["name"].strip()
    if "content" in payload:
        row.content = payload["content"].strip()
    if "tags" in payload:
        row.tags = ",".join(payload["tags"])

    from datetime import UTC, datetime
    row.updated_at = datetime.now(UTC)
    session.add(row)
    session.commit()
    session.refresh(row)

    return {
        "ok": True,
        "data": {
            "id": row.id,
            "name": row.name,
            "content": row.content,
            "tags": [t.strip() for t in row.tags.split(",") if t.strip()],
            "useCount": row.use_count,
            "createdAt": row.created_at.isoformat(),
            "updatedAt": row.updated_at.isoformat(),
        },
    }


@router.delete("/{prompt_id}")
def delete_prompt(prompt_id: int, session: SessionDep):
    """Delete a prompt."""
    row = session.get(Prompt, prompt_id)
    if not row:
        return {"ok": False, "error": "Prompt not found"}

    session.delete(row)
    session.commit()
    return {"ok": True}


@router.post("/{prompt_id}/use")
def increment_use_count(prompt_id: int, session: SessionDep):
    """Increment the use count of a prompt (called when user copies)."""
    row = session.get(Prompt, prompt_id)
    if not row:
        return {"ok": False, "error": "Prompt not found"}

    row.use_count += 1
    from datetime import UTC, datetime
    row.updated_at = datetime.now(UTC)
    session.add(row)
    session.commit()

    return {"ok": True, "data": {"useCount": row.use_count}}


@router.post("/import")
def import_prompts(payload: dict, session: SessionDep):
    """Import prompts from JSON."""
    prompts = payload.get("prompts", [])
    imported = 0
    from datetime import UTC, datetime

    for item in prompts:
        name = item.get("name", "").strip()
        content = item.get("content", "").strip()
        if not name or not content:
            continue
        tags = item.get("tags", [])
        row = Prompt(
            name=name,
            content=content,
            tags=",".join(tags) if isinstance(tags, list) else str(tags),
            use_count=item.get("useCount", 0),
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )
        session.add(row)
        imported += 1

    session.commit()
    return {"ok": True, "data": {"imported": imported}}


@router.get("/export")
def export_prompts(session: SessionDep):
    """Export all prompts as JSON."""
    rows = session.exec(select(Prompt).order_by(Prompt.updated_at.desc())).all()
    return {
        "ok": True,
        "data": [
            {
                "id": row.id,
                "name": row.name,
                "content": row.content,
                "tags": [t.strip() for t in row.tags.split(",") if t.strip()],
                "useCount": row.use_count,
                "createdAt": row.created_at.isoformat(),
                "updatedAt": row.updated_at.isoformat(),
            }
            for row in rows
        ],
    }
