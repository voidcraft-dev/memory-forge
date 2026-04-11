from __future__ import annotations

import json
import sqlite3
from pathlib import Path

from app.schemas import SessionDetail, SessionListItem, TimelineBlock
from app.services.commands import build_commands
from app.services.platforms.base import PlatformAdapter


class OpenCodePlatform(PlatformAdapter):
    platform_name = "opencode"

    def __init__(self, db_path: Path):
        self.db_path = db_path

    def connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def list_sessions(self, alias_map: dict[str, str]) -> list[SessionListItem]:
        if not self.db_path.exists():
            return []
        with self.connect() as conn:
            rows = conn.execute(
                "select id, title, directory, time_updated from session order by time_updated desc"
            ).fetchall()
        items: list[SessionListItem] = []
        for row in rows:
            alias = alias_map.get(row["id"], "")
            items.append(
                {
                    "platform": self.platform_name,
                    "sessionKey": row["id"],
                    "sessionId": row["id"],
                    "displayTitle": alias or row["title"] or row["id"],
                    "aliasTitle": alias,
                    "preview": row["title"] or row["id"],
                    "updatedAt": str(row["time_updated"] or ""),
                    "cwd": row["directory"] or "",
                    "editable": True,
                }
            )
        return items

    def get_session_detail(
        self, session_key: str, alias_map: dict[str, str]
    ) -> SessionDetail:
        with self.connect() as conn:
            session_row = conn.execute(
                "select * from session where id = ?", (session_key,)
            ).fetchone()
            part_rows = conn.execute(
                "select part.*, message.data as message_data from part join message on message.id = part.message_id where part.session_id = ? order by part.time_created asc, part.id asc",
                (session_key,),
            ).fetchall()

        # Handle session not found
        if session_row is None:
            return {
                "platform": self.platform_name,
                "sessionKey": session_key,
                "sessionId": session_key,
                "title": session_key,
                "aliasTitle": "",
                "cwd": "",
                "commands": [],
                "blocks": [],
            }

        alias = alias_map.get(session_key, "")
        blocks = []
        for row in part_rows:
            data = json.loads(row["data"])
            message_data = json.loads(row["message_data"] or "{}")
            block = self._part_to_block(row["id"], data, message_data)
            if block is not None:
                blocks.append(block)

        return {
            "platform": self.platform_name,
            "sessionKey": session_key,
            "sessionId": session_key,
            "title": alias or session_row["title"] or session_key,
            "aliasTitle": alias,
            "cwd": session_row["directory"] or "",
            "commands": build_commands(self.platform_name, session_key),
            "blocks": blocks,
        }

    def update_message(self, edit_target: str, new_content: str) -> str:
        with self.connect() as conn:
            row = conn.execute(
                "select data from part where id = ?", (edit_target,)
            ).fetchone()
            payload = json.loads(row[0])
            if payload.get("type") in {"text", "reasoning"}:
                old_content = payload.get("text", "")
                payload["text"] = new_content
            elif payload.get("type") == "tool":
                old_content = payload.get("state", {}).get("output", "")
                payload.setdefault("state", {})["output"] = new_content
            else:
                old_content = ""
            conn.execute(
                "update part set data = ? where id = ?",
                (json.dumps(payload, ensure_ascii=False), edit_target),
            )
            conn.commit()
        return old_content

    def matches_query(self, session_key: str, query: str) -> bool:
        needle = query.strip().lower()
        if not needle:
            return True
        with self.connect() as conn:
            session_row = conn.execute(
                "select title, directory from session where id = ?", (session_key,)
            ).fetchone()
            if session_row:
                if needle in (session_row["title"] or "").lower():
                    return True
                if needle in (session_row["directory"] or "").lower():
                    return True
            part_rows = conn.execute(
                "select data from part where session_id = ?", (session_key,)
            ).fetchall()
            for row in part_rows:
                data = json.loads(row[0])
                text = data.get("text", "")
                if needle in text.lower():
                    return True
        return False

    def _part_to_block(
        self, part_id: str, data: dict, message_data: dict
    ) -> TimelineBlock | None:
        kind = data.get("type")
        message_role = message_data.get("role") or "user"
        if kind == "text":
            return {
                "id": part_id,
                "role": message_role,
                "content": data.get("text", ""),
                "editable": True,
                "editTarget": part_id,
                "sourceMeta": {"partType": kind, "messageRole": message_role},
            }
        if kind == "reasoning":
            return {
                "id": part_id,
                "role": "thinking",
                "content": data.get("text", ""),
                "editable": True,
                "editTarget": part_id,
                "sourceMeta": {"partType": kind},
            }
        return None
