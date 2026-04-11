@echo off
chcp 65001 >nul 2>&1
echo ========================================
echo   Memory Forge - Build Desktop App
echo ========================================
echo.

python build.py %*

echo.
echo Done!
pause
