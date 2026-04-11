# -*- mode: python ; coding: utf-8 -*-
# PyInstaller spec file for MemoryForge Backend

import sys
from pathlib import Path

backend_dir = Path(SPECPATH)
project_root = backend_dir.parent

a = Analysis(
    ['app/main.py'],
    pathex=[str(backend_dir)],
    binaries=[],
    datas=[
        # Include frontend dist if exists
        (str(project_root / 'dist'), 'dist'),
    ],
    hiddenimports=[
        'uvicorn.logging',
        'uvicorn.loops',
        'uvicorn.loops.auto',
        'uvicorn.protocols',
        'uvicorn.protocols.http',
        'uvicorn.protocols.http.auto',
        'uvicorn.protocols.websockets',
        'uvicorn.protocols.websockets.auto',
        'uvicorn.lifespan',
        'uvicorn.lifespan.on',
        'app.routes.api',
        'app.services.platforms.claude',
        'app.services.platforms.codex',
        'app.services.platforms.opencode',
        'app.services.commands',
        'app.services.edit_log',
        'app.db',
        'app.models',
        'sqlmodel.dialects.sqlite',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='memoryforge-backend',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='memoryforge-backend',
)
