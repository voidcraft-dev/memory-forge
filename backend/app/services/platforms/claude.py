from __future__ import annotations

import json
from pathlib import Path

from app.schemas import SessionDetail, SessionListItem, TimelineBlock
from app.services.commands import build_commands
from app.services.platforms.base import PlatformAdapter, encode_path_key


class ClaudePlatform(PlatformAdapter):
    platform_name = "claude"
    _jsonl_cache: dict[str, tuple[int, list[dict]]] = {}

    def __init__(self, claude_home: Path):
        self.claude_home = claude_home
        self.projects_root = claude_home / "projects"

    def list_sessions(self, alias_map: dict[str, str]) -> list[SessionListItem]:
        items: list[SessionListItem] = []
        if not self.projects_root.exists():
            return items
        for path in sorted(
            self.projects_root.rglob("*.jsonl"),
            key=lambda current: current.stat().st_mtime_ns,
            reverse=True,
        ):
            lines = self._read_jsonl(path)
            if not lines:
                continue
            session_id = self._session_id(lines, path)
            session_key = encode_path_key(path)
            preview = self._preview(lines)
            cwd = self._cwd(lines)
            alias = alias_map.get(session_key, "")
            items.append(
                {
                    "platform": self.platform_name,
                    "sessionKey": session_key,
                    "sessionId": session_id,
                    "displayTitle": alias or session_id,
                    "aliasTitle": alias,
                    "preview": preview,
                    "updatedAt": str(path.stat().st_mtime_ns),
                    "cwd": cwd,
                    "editable": True,
                }
            )
        return items

    def get_session_detail(
        self, session_key: str, alias_map: dict[str, str]
    ) -> SessionDetail:
        path = Path(session_key)
        lines = self._read_jsonl(path)
        session_id = self._session_id(lines, path)
        alias = alias_map.get(session_key, "")
        return {
            "platform": self.platform_name,
            "sessionKey": session_key,
            "sessionId": session_id,
            "title": alias or session_id,
            "aliasTitle": alias,
            "cwd": self._cwd(lines),
            "commands": build_commands(self.platform_name, session_id),
            "blocks": self._blocks(lines),
        }

    def update_message(self, edit_target: str, new_content: str) -> str:
        file_path, line_index, content_index, field_name = edit_target.split("::")
        path = Path(file_path)
        lines = self._read_jsonl(path)
        message = lines[int(line_index)]["message"]
        if field_name == "content" and isinstance(message.get("content"), str):
            old_content = message["content"]
            message["content"] = new_content
        else:
            item = message["content"][int(content_index)]
            old_content = item[field_name]
            item[field_name] = new_content
        serialized = []
        for row in lines:
            clean = {key: value for key, value in row.items() if key != "__file"}
            serialized.append(json.dumps(clean, ensure_ascii=False))
        path.write_text("\n".join(serialized) + "\n", encoding="utf-8")
        # Invalidate cache for this file
        cache_key = encode_path_key(path)
        self._jsonl_cache.pop(cache_key, None)
        return old_content

    def matches_query(self, session_key: str, query: str) -> bool:
        needle = query.strip().lower()
        if not needle:
            return True
        lines = self._read_jsonl(Path(session_key))
        haystacks = [
            self._last_prompt(lines),
            self._latest_user_text(lines),
            self._preview(lines),
        ]
        for line in lines:
            message = line.get("message") or {}
            raw_content = message.get("content")
            if isinstance(raw_content, str):
                haystacks.append(self._clean_preview_text(raw_content))
            elif isinstance(raw_content, list):
                for item in raw_content:
                    if not isinstance(item, dict):
                        continue
                    if item.get("type") == "text":
                        haystacks.append(self._clean_preview_text(item.get("text", "")))
                    elif item.get("type") in {"thinking", "reasoning"}:
                        haystacks.append(item.get("thinking", item.get("text", "")))
        return any(needle in (hay or "").lower() for hay in haystacks)

    def _read_jsonl(self, path: Path) -> list[dict]:
        """Read JSONL with mtime-based cache to avoid re-reading unchanged files."""
        cache_key = encode_path_key(path)
        try:
            mtime = path.stat().st_mtime_ns
        except OSError:
            mtime = 0
        cached = self._jsonl_cache.get(cache_key)
        if cached and cached[0] == mtime:
            return cached[1]

        rows = []
        for raw in path.read_text(encoding="utf-8").splitlines():
            raw = raw.strip()
            if not raw:
                continue
            item = json.loads(raw)
            item["__file"] = cache_key
            rows.append(item)

        self._jsonl_cache[cache_key] = (mtime, rows)
        return rows

    def _session_id(self, lines: list[dict], path: Path) -> str:
        for line in lines:
            if line.get("sessionId"):
                return str(line["sessionId"])
        return path.stem

    def _cwd(self, lines: list[dict]) -> str:
        for line in lines:
            if line.get("cwd"):
                return str(line["cwd"])
        return ""

    def _preview(self, lines: list[dict]) -> str:
        last_prompt = self._last_prompt(lines)
        if last_prompt:
            return last_prompt[:120]

        latest_user_text = self._latest_user_text(lines)
        if latest_user_text:
            return latest_user_text[:120]

        for block in self._blocks(lines):
            if block["content"]:
                cleaned = self._clean_preview_text(block["content"])
                if cleaned:
                    return cleaned[:120]
        return ""

    def _last_prompt(self, lines: list[dict]) -> str:
        for line in reversed(lines):
            if line.get("type") == "last-prompt" and line.get("lastPrompt"):
                return str(line["lastPrompt"]).strip()
        return ""

    def _latest_user_text(self, lines: list[dict]) -> str:
        for line in reversed(lines):
            message = line.get("message") or {}
            if message.get("role") != "user":
                continue
            raw_content = message.get("content")
            if isinstance(raw_content, str):
                cleaned = self._clean_preview_text(raw_content)
                if cleaned:
                    return cleaned
            elif isinstance(raw_content, list):
                for item in raw_content:
                    if not isinstance(item, dict):
                        continue
                    if item.get("type") == "text":
                        cleaned = self._clean_preview_text(item.get("text", ""))
                        if cleaned:
                            return cleaned
        return ""

    def _clean_preview_text(self, text: str) -> str:
        cleaned = text.strip()
        start_tag = "<local-command-caveat>"
        end_tag = "</local-command-caveat>"
        if start_tag in cleaned and end_tag in cleaned:
            cleaned = cleaned.split(end_tag, 1)[1].strip()
        if cleaned.startswith("<command-name>") or cleaned.startswith(
            "<local-command-stdout>"
        ):
            return ""
        return cleaned

    def _blocks(self, lines: list[dict]) -> list[TimelineBlock]:
        blocks: list[TimelineBlock] = []
        for line_index, line in enumerate(lines):
            message = line.get("message") or {}
            role = message.get("role")
            raw_content = message.get("content")
            if isinstance(raw_content, str):
                if role == "user":
                    blocks.append(
                        self._block(
                            line,
                            line_index,
                            0,
                            "user",
                            raw_content,
                            "content",
                        )
                    )
                elif role == "assistant":
                    blocks.append(
                        self._block(
                            line,
                            line_index,
                            0,
                            "assistant",
                            raw_content,
                            "content",
                        )
                    )
                continue

            content_items = raw_content or []
            for content_index, item in enumerate(content_items):
                if not isinstance(item, dict):
                    continue
                item_type = item.get("type")
                if role == "user" and item_type == "text":
                    blocks.append(
                        self._block(
                            line,
                            line_index,
                            content_index,
                            "user",
                            item.get("text", ""),
                            "text",
                        )
                    )
                elif role == "assistant" and item_type in {"thinking", "reasoning"}:
                    field_name = "thinking" if "thinking" in item else "text"
                    blocks.append(
                        self._block(
                            line,
                            line_index,
                            content_index,
                            "thinking",
                            item.get(field_name, ""),
                            field_name,
                        )
                    )
                elif role == "assistant" and item_type == "text":
                    blocks.append(
                        self._block(
                            line,
                            line_index,
                            content_index,
                            "assistant",
                            item.get("text", ""),
                            "text",
                        )
                    )
        return blocks

    def _block(
        self,
        line: dict,
        line_index: int,
        content_index: int,
        role: str,
        content: str,
        field_name: str,
    ) -> TimelineBlock:
        return {
            "id": f"{line_index}:{content_index}:{role}",
            "role": role,
            "content": content,
            "editable": True,
            "editTarget": f"{line['__file']}::{line_index}::{content_index}::{field_name}",
            "sourceMeta": {"lineIndex": line_index, "contentIndex": content_index},
        }
