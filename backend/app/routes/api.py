from fastapi import APIRouter, HTTPException

from app.db import SessionDep
from app.models import EditLog
from app.services.aliases import get_alias_map, save_alias
from app.services.cache import dashboard_cache, sessions_cache
from app.services.platform_registry import (
    dashboard_summary,
    get_platform,
    platform_config,
)
from sqlmodel import select


router = APIRouter(prefix="/api/platforms", tags=["api"])
dashboard_router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@dashboard_router.get("/summary")
def get_dashboard_summary():
    cached = dashboard_cache.get("summary")
    if cached is not None:
        return {"ok": True, "data": cached}
    data = dashboard_summary()
    dashboard_cache.set("summary", data)
    return {"ok": True, "data": data}


@router.get("/{platform}/config")
def get_config(platform: str):
    try:
        return {"ok": True, "data": platform_config(platform)}
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Unknown platform") from exc


@router.get("/{platform}/sessions")
def list_sessions(platform: str, session: SessionDep, q: str = ""):
    try:
        adapter = get_platform(platform)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Unknown platform") from exc

    cache_key = f"sessions:{platform}:{q.strip().lower()}"
    if not q.strip():
        cached = sessions_cache.get(cache_key)
        if cached is not None:
            return {"ok": True, "data": cached}

    alias_map = get_alias_map(session, platform)
    items = adapter.list_sessions(alias_map)
    if q.strip():
        needle = q.strip().lower()
        items = [
            item
            for item in items
            if needle
            in " ".join(
                [item["displayTitle"], item["preview"], item["cwd"], item["sessionId"]]
            ).lower()
            or adapter.matches_query(item["sessionKey"], q)
        ]

    if not q.strip():
        sessions_cache.set(cache_key, items)

    return {"ok": True, "data": items}


@router.get("/{platform}/page-data")
def get_platform_page_data(platform: str, session: SessionDep, q: str = ""):
    try:
        adapter = get_platform(platform)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Unknown platform") from exc

    cache_key = f"sessions:{platform}:{q.strip().lower()}"
    if not q.strip():
        cached = sessions_cache.get(cache_key)
        if cached is not None:
            items = cached
        else:
            alias_map = get_alias_map(session, platform)
            items = adapter.list_sessions(alias_map)
            sessions_cache.set(cache_key, items)
    else:
        alias_map = get_alias_map(session, platform)
        items = adapter.list_sessions(alias_map)
        if q.strip():
            needle = q.strip().lower()
            items = [
                item
                for item in items
                if needle
                in " ".join(
                    [item["displayTitle"], item["preview"], item["cwd"], item["sessionId"]]
                ).lower()
                or adapter.matches_query(item["sessionKey"], q)
            ]

    first = items[0] if items else None
    if first:
        alias_map = get_alias_map(session, platform)
        detail = adapter.get_session_detail(first["sessionKey"], alias_map)
    else:
        detail = None

    return {
        "ok": True,
        "data": {"sessions": items, "detail": detail},
    }


@router.get("/{platform}/session-detail/{session_key:path}")
def get_platform_session_detail(platform: str, session_key: str, session: SessionDep):
    try:
        adapter = get_platform(platform)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Unknown platform") from exc
    alias_map = get_alias_map(session, platform)
    detail = adapter.get_session_detail(session_key, alias_map)
    return {
        "ok": True,
        "data": {
            "detail": detail,
        },
    }


@router.post("/{platform}/sessions/{session_key:path}/alias")
def set_alias(platform: str, session_key: str, payload: dict, session: SessionDep):
    row = save_alias(session, platform, session_key, payload.get("title", ""))
    return {"ok": True, "data": {"title": row.title}}


@router.get("/{platform}/sessions/{session_key:path}/edit-log")
def get_edit_log(platform: str, session_key: str, session: SessionDep):
    rows = session.exec(
        select(EditLog)
        .where(
            EditLog.platform == platform,
            EditLog.session_key == session_key,
        )
        .order_by(EditLog.id.desc())
    ).all()
    return {
        "ok": True,
        "data": [
            {
                "id": row.id,
                "editTarget": row.edit_target,
                "oldContent": row.old_content,
                "newContent": row.new_content,
                "createdAt": row.created_at.isoformat(),
            }
            for row in rows
        ],
    }


@router.get("/{platform}/sessions/{session_key:path}")
def get_session(platform: str, session_key: str, session: SessionDep):
    try:
        adapter = get_platform(platform)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Unknown platform") from exc
    alias_map = get_alias_map(session, platform)
    return {"ok": True, "data": adapter.get_session_detail(session_key, alias_map)}


@router.post("/{platform}/messages/{message_id:path}/edit")
def edit_message(platform: str, message_id: str, payload: dict, session: SessionDep):
    try:
        adapter = get_platform(platform)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Unknown platform") from exc
    content = payload.get("content", "")
    session_key = payload.get("sessionKey", message_id)
    old_content = adapter.update_message(message_id, content)
    # Log the edit
    log = EditLog(
        platform=platform,
        session_key=session_key,
        edit_target=message_id,
        old_content=old_content,
        new_content=content,
    )
    session.add(log)
    session.commit()
    # Invalidate caches after edit
    sessions_cache.invalidate_prefix(f"sessions:{platform}")
    dashboard_cache.invalidate("summary")
    return {"ok": True}
