# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-04-11

### Added

- **Dashboard** with session statistics and 7-day trend chart
- **Multi-platform session browsing** for Claude Code, Codex CLI, and OpenCode
- **Message editing** for user, assistant, and thinking blocks
- **Edit audit log** with read-only change tracking and diff view
- **Session aliases** — give sessions memorable names
- **Quick command copy** — Resume / Fork commands one-click copy
- **Dark / Light theme** with system auto-detection
- **About page** with platform info and tech stack
- **Desktop app** packaging via Tauri v2 (Windows, macOS, Linux)
- **Portable version** — unzip and run, no installation needed
- **Build script** (`build.py`) for automated packaging
- **One-click launcher** (`start.bat`) for Windows

### Supported Platforms

| Platform | Resume | Fork |
|----------|--------|------|
| Claude Code | `claude --resume <id>` | `claude --resume <id> --fork-session` |
| Codex CLI | `codex resume <id>` | — |
| OpenCode | `opencode -s <id>` | `opencode -s <id> --fork` |
