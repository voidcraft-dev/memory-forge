from datetime import datetime, timedelta
from pathlib import Path

from app.config import (
    DEFAULT_CLAUDE_HOME,
    DEFAULT_CODEX_HOME,
    DEFAULT_OPENCODE_DB,
    SUPPORTED_PLATFORMS,
)
from app.services.platforms.claude import ClaudePlatform
from app.services.platforms.codex import CodexPlatform
from app.services.platforms.opencode import OpenCodePlatform


def get_platform(platform: str):
    if platform == "claude":
        return ClaudePlatform(Path(DEFAULT_CLAUDE_HOME))
    if platform == "codex":
        return CodexPlatform(Path(DEFAULT_CODEX_HOME))
    if platform == "opencode":
        return OpenCodePlatform(Path(DEFAULT_OPENCODE_DB))
    raise KeyError(platform)


def platform_config(platform: str) -> dict:
    if platform == "claude":
        return {"platform": platform, "root": str(DEFAULT_CLAUDE_HOME)}
    if platform == "codex":
        return {"platform": platform, "root": str(DEFAULT_CODEX_HOME)}
    if platform == "opencode":
        return {"platform": platform, "root": str(DEFAULT_OPENCODE_DB)}
    raise KeyError(platform)


def list_platform_names() -> tuple[str, ...]:
    return SUPPORTED_PLATFORMS


def dashboard_summary() -> dict:
    platforms = []
    recent_sessions = []
    trend_map = {}

    for name in list_platform_names():
        adapter = get_platform(name)
        items = adapter.list_sessions(alias_map={})
        platforms.append(
            {
                "platform": name,
                "count": len(items),
                "latest": format_timestamp(items[0]["updatedAt"]) if items else "",
                "items": items[:5],
            }
        )

        for item in items[:20]:
            updated_at = format_timestamp(item["updatedAt"])
            recent_sessions.append(
                {
                    "platform": name,
                    "sessionKey": item["sessionKey"],
                    "title": item["displayTitle"],
                    "cwd": item["cwd"],
                    "updatedAt": updated_at,
                }
            )
            day_key = updated_at[:10]
            trend_map[day_key] = trend_map.get(day_key, 0) + 1

    # Ensure we have 7 days of data, filling missing days with 0
    today = datetime.now().strftime("%Y-%m-%d")
    seven_days_ago = (datetime.now() - timedelta(days=6)).strftime("%Y-%m-%d")
    all_days = []
    current = datetime.strptime(seven_days_ago, "%Y-%m-%d")
    for _ in range(7):
        day_str = current.strftime("%Y-%m-%d")
        all_days.append(day_str)
        current += timedelta(days=1)

    trend = [
        {"day": day, "count": trend_map.get(day, 0)} for day in all_days
    ]

    recent_sessions.sort(key=lambda row: row["updatedAt"], reverse=True)

    return {
        "platforms": platforms,
        "trend": trend,
        "recentSessions": recent_sessions[:10],
    }


def format_timestamp(value: str) -> str:
    text = str(value or "").strip()
    if not text:
        return ""

    try:
        number = int(text)
    except ValueError:
        return text

    # Existing sources mostly use millisecond or nanosecond-like integers.
    if number > 10**17:
        number = number / 1_000_000_000
    elif number > 10**15:
        number = number / 1_000_000
    elif number > 10**12:
        number = number / 1000

    dt = datetime.fromtimestamp(number)
    return dt.strftime("%Y-%m-%d")
