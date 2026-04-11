from pathlib import Path
import sys
import os

# Detect if running as PyInstaller bundle
_frozen = getattr(sys, 'frozen', False)

if _frozen:
    # PyInstaller sets sys._MEIPASS to the temp extraction directory
    _meipass = Path(getattr(sys, '_MEIPASS', ''))
    _exec_path = Path(sys.executable)
    ROOT_DIR = _exec_path.parent
    BACKEND_DIR = ROOT_DIR
else:
    # Running from source
    ROOT_DIR = Path(__file__).resolve().parent.parent.parent
    BACKEND_DIR = ROOT_DIR / "backend"

# Data directory — use AppData/XDG data dir in production, local dir in dev
if _frozen:
    _app_data = os.environ.get(
        'APPDATA' if sys.platform == 'win32' else
        'XDG_DATA_HOME' if sys.platform == 'linux' else
        None,  # macOS uses default below
        str(Path.home() / 'Library' / 'Application Support') if sys.platform == 'darwin' else
        str(Path.home() / '.local' / 'share')
    )
    DATA_DIR = Path(_app_data) / "MemoryForge" / "data"
else:
    DATA_DIR = BACKEND_DIR / "data"

DATABASE_PATH = DATA_DIR / "memoryforge.db"
DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

# Frontend dist — bundled inside the PyInstaller exe via _MEIPASS, or in project root for dev
if _frozen:
    FRONTEND_DIST = _meipass / "dist"
else:
    FRONTEND_DIST = ROOT_DIR / "dist"

# App info
APP_NAME = "MemoryForge"
APP_BRAND_ZH = "记忆锻造"
APP_BRAND_EN = "Memory Forge"

# Default platform paths
DEFAULT_CLAUDE_HOME = Path.home() / ".claude"
DEFAULT_CODEX_HOME = Path.home() / ".codex"
DEFAULT_OPENCODE_DB = Path.home() / ".local" / "share" / "opencode" / "opencode.db"

# Supported options
SUPPORTED_PLATFORMS = ("claude", "codex", "opencode")
SUPPORTED_LOCALES = ("zh-CN", "en")
SUPPORTED_THEMES = ("light", "dark", "system")
DEFAULT_LOCALE = "zh-CN"
DEFAULT_THEME = "system"
DEFAULT_SIDEBAR_COLLAPSED = False
