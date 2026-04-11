from __future__ import annotations

from pathlib import Path


def encode_path_key(path: Path) -> str:
    return str(path.resolve()).replace("\\", "/")


class PlatformAdapter:
    platform_name: str

    def list_sessions(self, alias_map: dict[str, str]):
        raise NotImplementedError

    def get_session_detail(self, session_key: str, alias_map: dict[str, str]):
        raise NotImplementedError

    def update_message(self, edit_target: str, new_content: str):
        raise NotImplementedError

    def matches_query(self, session_key: str, query: str) -> bool:
        raise NotImplementedError
