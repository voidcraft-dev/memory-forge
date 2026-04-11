from typing import TypedDict


class SessionListItem(TypedDict):
    platform: str
    sessionKey: str
    sessionId: str
    displayTitle: str
    aliasTitle: str
    preview: str
    updatedAt: str
    cwd: str
    editable: bool


class TimelineBlock(TypedDict):
    id: str
    role: str
    content: str
    editable: bool
    editTarget: str
    sourceMeta: dict


class SessionDetail(TypedDict):
    platform: str
    sessionKey: str
    sessionId: str
    title: str
    aliasTitle: str
    cwd: str
    commands: dict[str, str]
    blocks: list[TimelineBlock]
