#!/usr/bin/env python3
"""
Memory Forge Build Script
Builds the Python backend with PyInstaller, then packages everything with Tauri.

Usage:
  python build.py                # Build backend + frontend + Tauri app (installer)
  python build.py --backend      # Build backend only
  python build.py --frontend     # Build frontend only
  python build.py --tauri        # Build Tauri app (requires backend + frontend already built)
  python build.py --portable     # Build portable version (no install needed, unzip & run)
  python build.py --all          # Build installer + portable
"""

import subprocess
import sys
import shutil
import platform
import zipfile
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent
BACKEND_DIR = PROJECT_ROOT / "backend"
BACKEND_DIST = PROJECT_ROOT / "src-tauri" / "backend-dist"
FRONTEND_DIST = PROJECT_ROOT / "dist"
PORTABLE_DIR = PROJECT_ROOT / "portable-dist"
TAURI_RELEASE = PROJECT_ROOT / "src-tauri" / "target" / "release"

APP_NAME = "MemoryForge"
APP_VERSION = "0.1.0"


def run(cmd, cwd=None, check=True):
    """Run a command and print it."""
    print(f"\n>>> {' '.join(cmd) if isinstance(cmd, list) else cmd}")
    result = subprocess.run(cmd, cwd=cwd, check=check, shell=isinstance(cmd, str))
    return result


def build_backend():
    """Build the Python backend into a standalone executable using PyInstaller."""
    print("\n" + "=" * 60)
    print("  Building Backend (PyInstaller)")
    print("=" * 60)

    # Install PyInstaller if needed
    run([sys.executable, "-m", "pip", "install", "pyinstaller"], check=False)

    # Build frontend first (backend serves it)
    if not FRONTEND_DIST.exists():
        print("\nFrontend dist not found, building frontend first...")
        build_frontend()

    # Run PyInstaller
    spec_file = BACKEND_DIR / "memoryforge-backend.spec"
    run([
        sys.executable, "-m", "PyInstaller",
        "--clean",
        "--noconfirm",
        str(spec_file),
    ], cwd=str(BACKEND_DIR))

    # Copy output to Tauri resources
    backend_build = BACKEND_DIR / "dist" / "memoryforge-backend"
    if BACKEND_DIST.exists():
        shutil.rmtree(BACKEND_DIST)
    shutil.copytree(backend_build, BACKEND_DIST)

    print(f"\n✓ Backend built: {BACKEND_DIST}")


def build_frontend():
    """Build the frontend with Vite."""
    print("\n" + "=" * 60)
    print("  Building Frontend (Vite)")
    print("=" * 60)

    # Install dependencies
    if not (PROJECT_ROOT / "node_modules").exists():
        run("npm install", cwd=str(PROJECT_ROOT))

    run("npm run build", cwd=str(PROJECT_ROOT))

    print(f"\n✓ Frontend built: {FRONTEND_DIST}")


def build_tauri():
    """Build the Tauri desktop application (installer)."""
    print("\n" + "=" * 60)
    print("  Building Tauri App (Installer)")
    print("=" * 60)

    # Check backend dist exists
    if not BACKEND_DIST.exists():
        print("\nBackend dist not found, building backend first...")
        build_backend()

    # Check frontend dist exists
    if not FRONTEND_DIST.exists():
        print("\nFrontend dist not found, building frontend first...")
        build_frontend()

    # Build Tauri
    run("npm run tauri build", cwd=str(PROJECT_ROOT))

    # Print output location
    system = platform.system()
    tauri_target = PROJECT_ROOT / "src-tauri" / "target" / "release" / "bundle"

    print("\n" + "=" * 60)
    print("  Installer Build Complete!")
    print("=" * 60)
    print(f"\n  Output: {tauri_target}")

    if system == "Windows":
        print(f"  NSIS installer: {tauri_target / 'nsis'}")
        print(f"  MSI installer:  {tauri_target / 'msi'}")
    elif system == "Darwin":
        print(f"  DMG:  {tauri_target / 'dmg'}")
        print(f"  App:  {tauri_target / 'macos'}")
    elif system == "Linux":
        print(f"  AppImage: {tauri_target / 'appimage'}")
        print(f"  Deb:      {tauri_target / 'deb'}")


def build_portable():
    """Build portable version — no install needed, just unzip and run."""
    print("\n" + "=" * 60)
    print("  Building Portable Version")
    print("=" * 60)

    system = platform.system()

    # Ensure Tauri release binary exists
    if system == "Windows":
        main_exe = TAURI_RELEASE / "memory-forge.exe"
    else:
        main_exe = TAURI_RELEASE / "memory-forge"

    if not main_exe.exists():
        print("\nTauri release binary not found, building first...")
        build_tauri()

    # Ensure backend dist exists
    if not BACKEND_DIST.exists():
        print("\nBackend dist not found, building first...")
        build_backend()

    # Prepare portable directory
    if PORTABLE_DIR.exists():
        shutil.rmtree(PORTABLE_DIR)
    PORTABLE_DIR.mkdir(parents=True)

    portable_root = PORTABLE_DIR / APP_NAME
    if portable_root.exists():
        shutil.rmtree(portable_root)
    portable_root.mkdir()

    # Copy main executable
    shutil.copy2(main_exe, portable_root / main_exe.name)
    print(f"  Copied: {main_exe.name}")

    # Copy backend resources
    backend_dest = portable_root / "backend"
    if backend_dest.exists():
        shutil.rmtree(backend_dest)
    shutil.copytree(BACKEND_DIST, backend_dest)
    print(f"  Copied: backend/")

    # Create startup script
    if system == "Windows":
        launcher = portable_root / "启动 MemoryForge.bat"
        launcher.write_text(
            '@echo off\r\n'
            'chcp 65001 >nul 2>&1\r\n'
            'start "" "memory-forge.exe"\r\n',
            encoding="utf-8"
        )
        # Also create a silent launcher
        silent_launcher = portable_root / "MemoryForge.bat"
        silent_launcher.write_text(
            '@echo off\r\n'
            'start "" "memory-forge.exe"\r\n',
            encoding="utf-8"
        )
    else:
        launcher = portable_root / "start-memoryforge.sh"
        launcher.write_text(
            '#!/bin/bash\n'
            'DIR="$(cd "$(dirname "$0")" && pwd)"\n'
            '"$DIR/memory-forge" &\n',
            encoding="utf-8"
        )
        import stat
        launcher.chmod(launcher.stat().st_mode | stat.S_IEXEC)
    print(f"  Created: launcher script")

    # Create README
    readme = portable_root / "README.txt"
    readme.write_text(
        f"{APP_NAME} v{APP_VERSION} Portable\n"
        f"{'=' * 40}\n\n"
        f"This is a portable version — no installation required.\n\n"
        f"How to use:\n"
        f"  1. Double-click the launcher script or the main executable\n"
        f"  2. The app will start automatically\n"
        f"  3. Data is stored in your user profile directory\n\n"
        f"Supported platforms: Claude Code, Codex CLI, OpenCode\n\n"
        f"Website: https://github.com/voidcraft-dev/memory-forge\n"
        f"License: MIT\n",
        encoding="utf-8"
    )

    # Create ZIP
    system_tag = {"Windows": "win64", "Darwin": "macos", "Linux": "linux"}[system]
    zip_name = f"{APP_NAME}_{APP_VERSION}_{system_tag}_portable"
    zip_path = PORTABLE_DIR / f"{zip_name}.zip"

    print(f"\n  Creating ZIP: {zip_path.name}")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for file_path in portable_root.rglob("*"):
            if file_path.is_file():
                arc_name = f"{APP_NAME}/{file_path.relative_to(portable_root)}"
                zf.write(file_path, arc_name)

    zip_size_mb = round(zip_path.stat().st_size / (1024 * 1024), 1)

    print("\n" + "=" * 60)
    print("  Portable Build Complete!")
    print("=" * 60)
    print(f"\n  Output: {zip_path}")
    print(f"  Size:   {zip_size_mb} MB")
    print(f"\n  Unzip and run — no installation needed!")


def main():
    args = set(sys.argv[1:])

    if "--backend" in args:
        build_backend()
    elif "--frontend" in args:
        build_frontend()
    elif "--tauri" in args:
        build_tauri()
    elif "--portable" in args:
        build_portable()
    elif "--all" in args:
        build_backend()
        build_tauri()
        build_portable()
    else:
        # Default: build installer + portable
        build_backend()
        build_tauri()
        build_portable()


if __name__ == "__main__":
    main()
