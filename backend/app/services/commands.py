def build_commands(platform: str, session_id: str) -> dict[str, str]:
    if platform == "claude":
        return {
            "resume": f"claude --resume {session_id}",
            "fork": f"claude --resume {session_id} --fork-session",
        }
    if platform == "codex":
        return {
            "resume": f"codex resume {session_id}",
        }
    if platform == "opencode":
        return {
            "resume": f"opencode -s {session_id}",
            "fork": f"opencode -s {session_id} --fork",
        }
    return {"session": session_id}
