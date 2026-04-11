@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
set "BACKEND_DIR=%SCRIPT_DIR%backend"
set "VENV_DIR=%BACKEND_DIR%\.venv"
set "PYTHON_EXE=%VENV_DIR%\Scripts\python.exe"
set "APP_URL=http://127.0.0.1:8000"
set "OPEN_BROWSER=1"
set "MODE=all"

:: Parse arguments
:parse_args
if "%~1"=="" goto args_done
if /I "%~1"=="--no-browser" set "OPEN_BROWSER=0"
if /I "%~1"=="--backend" set "MODE=backend"
if /I "%~1"=="--frontend" set "MODE=frontend"
shift
goto parse_args

:args_done

:: ── Backend setup ──
if not "%MODE%"=="frontend" (
  if not exist "%PYTHON_EXE%" (
    echo [MemoryForge] Creating Python virtual environment...
    py -m venv "%VENV_DIR%"
    if errorlevel 1 (
      echo [MemoryForge] Failed to create venv. Please install Python 3.
      pause
      exit /b 1
    )
  )

  "%PYTHON_EXE%" -c "import fastapi, uvicorn, sqlmodel" >nul 2>&1
  if errorlevel 1 (
    echo [MemoryForge] Installing backend dependencies...
    "%PYTHON_EXE%" -m pip install -r "%BACKEND_DIR%\requirements.txt"
    if errorlevel 1 (
      echo [MemoryForge] Dependency install failed.
      pause
      exit /b 1
    )
  )

  :: Build frontend if dist doesn't exist
  if not exist "%SCRIPT_DIR%dist\index.html" (
    echo [MemoryForge] Frontend not built, running npm build...
    pushd "%SCRIPT_DIR%"
    call npm run build
    popd
  )
)

:: ── Frontend dev mode ──
if "%MODE%"=="frontend" (
  echo [MemoryForge] Starting frontend dev server...
  pushd "%SCRIPT_DIR%"
  call npm run dev
  exit /b 0
)

:: ── Open browser ──
if "%OPEN_BROWSER%"=="1" (
  start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process '%APP_URL%'"
)

:: ── Start backend (serves both API and frontend) ──
echo [MemoryForge] Starting server at %APP_URL%
echo [MemoryForge] Press Ctrl+C to stop
pushd "%BACKEND_DIR%"
"%PYTHON_EXE%" -m uvicorn app.main:app --host 0.0.0.0 --port 8000
set "EXIT_CODE=%ERRORLEVEL%"
popd

if not "%EXIT_CODE%"=="0" (
  echo.
  echo [MemoryForge] Server exited with code %EXIT_CODE%.
  pause
)

exit /b %EXIT_CODE%
