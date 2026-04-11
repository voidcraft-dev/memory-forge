from __future__ import annotations

import json
from pathlib import Path

from app.schemas import SessionDetail, SessionListItem, TimelineBlock
from app.services.commands import build_commands
from app.services.platforms.base import PlatformAdapter, encode_path_key


class CodexPlatform(PlatformAdapter):
    platform_name = "codex"
    _summary_cache: dict[str, tuple[int, dict[str, str]]] = {}

    def __init__(self, codex_home: Path):
        self.codex_home = codex_home
        self.sessions_root = codex_home / "sessions"

    def list_sessions(self, alias_map: dict[str, str]) -> list[SessionListItem]:
        items: list[SessionListItem] = []
        if not self.sessions_root.exists():
            return items
        for path in sorted(self.sessions_root.rglob("*.jsonl")):
            session_key = encode_path_key(path)
            summary = self._summary_for_path(path)
            alias = alias_map.get(session_key, "")
            items.append(
                {
                    "platform": self.platform_name,
                    "sessionKey": session_key,
                    "sessionId": summary["session_id"],
                    "displayTitle": alias or summary["session_id"],
                    "aliasTitle": alias,
                    "preview": summary["preview"],
                    "updatedAt": str(path.stat().st_mtime_ns),
                    "cwd": summary["cwd"],
                    "editable": True,
                }
            )
        return items

    def get_session_detail(
        self, session_key: str, alias_map: dict[str, str]
    ) -> SessionDetail:
        path = Path(session_key)
        lines = self._read_jsonl(path)
        thread_id = self._thread_id(lines, path)
        alias = alias_map.get(session_key, "")
        return {
            "platform": self.platform_name,
            "sessionKey": session_key,
            "sessionId": thread_id,
            "title": alias or thread_id,
            "aliasTitle": alias,
            "cwd": self._cwd(lines),
            "commands": build_commands(self.platform_name, thread_id),
            "blocks": self._blocks(lines),
        }

    def update_message(self, edit_target: str, new_content: str) -> str:
        file_path, line_index = edit_target.split("::")
        path = Path(file_path)
        rows = self._read_jsonl(path)
        old_content = rows[int(line_index)]["payload"].get("message", "")
        rows[int(line_index)]["payload"]["message"] = new_content
        serialized = []
        for row in rows:
            clean = {key: value for key, value in row.items() if key != "__file"}
            serialized.append(json.dumps(clean, ensure_ascii=False))
        path.write_text("\n".join(serialized) + "\n", encoding="utf-8")
        return old_content

    def matches_query(self, session_key: str, query: str) -> bool:
        needle = query.strip().lower()
        if not needle:
            return True
        path = Path(session_key)
        lines = self._read_jsonl(path)
        for line in lines:
            payload = line.get("payload") or {}
            msg = str(payload.get("message") or "").lower()
            if needle in msg:
                return True
        return False

    def _read_jsonl(self, path: Path) -> list[dict]:
        rows = []
        for raw in path.read_text(encoding="utf-8").splitlines():
            raw = raw.strip()
            if not raw:
                continue
            item = json.loads(raw)
            item["__file"] = encode_path_key(path)
            rows.append(item)
        return rows

    def _summary_for_path(self, path: Path) -> dict[str, str]:
        cache_key = encode_path_key(path)
        mtime = path.stat().st_mtime_ns
        cached = self._summary_cache.get(cache_key)
        if cached and cached[0] == mtime:
            return cached[1]

        summary = self._scan_summary(path)
        self._summary_cache[cache_key] = (mtime, summary)
        return summary

    def _scan_summary(self, path: Path) -> dict[str, str]:
        session_id = path.stem
        cwd = ""
        preview = ""

        with path.open("r", encoding="utf-8") as handle:
            for raw in handle:
                raw = raw.strip()
                if not raw:
                    continue
                item = json.loads(raw)
                payload = item.get("payload") or {}

                if payload.get("id") and session_id == path.stem:
                    session_id = str(payload["id"])
                if payload.get("cwd") and not cwd:
                    cwd = str(payload["cwd"])
                if not preview and payload.get("type") in {
                    "user_message",
                    "agent_message",
                }:
                    preview = str(payload.get("message") or "")[:120]

                if session_id != path.stem and cwd and preview:
                    break

        return {
            "session_id": session_id,
            "cwd": cwd,
            "preview": preview,
        }

    def _thread_id(self, lines: list[dict], path: Path) -> str:
        for line in lines:
            payload = line.get("payload") or {}
            if payload.get("id"):
                return str(payload["id"])
        return path.stem

    def _cwd(self, lines: list[dict]) -> str:
        for line in lines:
            payload = line.get("payload") or {}
            if payload.get("cwd"):
                return str(payload["cwd"])
        return ""

    def _preview(self, lines: list[dict]) -> str:
        blocks = self._blocks(lines)
        return blocks[0]["content"][:120] if blocks else ""

    def _blocks(self, lines: list[dict]) -> list[TimelineBlock]:
        blocks: list[TimelineBlock] = []
        for line_index, line in enumerate(lines):
            payload = line.get("payload") or {}
            kind = payload.get("type")
            if kind == "user_message":
                blocks.append(
                    self._block(line, line_index, "user", payload.get("message", ""))
                )
            elif kind == "agent_message":
                blocks.append(
                    self._block(
                        line, line_index, "assistant", payload.get("message", "")
                    )
                )
        return blocks

    def _block(
        self, line: dict, line_index: int, role: str, content: str
    ) -> TimelineBlock:
        return {
            "id": f"{line_index}:{role}",
            "role": role,
            "content": content,
            "editable": True,
            "editTarget": f"{line['__file']}::{line_index}",
            "sourceMeta": {"lineIndex": line_index},
        }
