@echo off
setlocal enabledelayedexpansion

echo.
echo  ============================================================
echo   BhoomiSetu AI -- Land Intelligence Platform
echo   STOPPING APPLICATION
echo  ============================================================
echo.

:: ────────────────────────────────────────────────────
:: Kill processes on Backend port 8000
:: ────────────────────────────────────────────────────
echo [1/2] Stopping Backend  (port 8000)...
set FOUND_BACKEND=0
set LAST_PID=
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8000 " ^| find "LISTENING" 2^>nul') do (
    if not "%%a"=="!LAST_PID!" (
        taskkill /PID %%a /T /F >nul 2>&1
        echo  Killed process tree for PID %%a [FastAPI/uvicorn]
        set FOUND_BACKEND=1
        set LAST_PID=%%a
    )
)
if "!FOUND_BACKEND!"=="0" echo  Nothing running on port 8000.

:: ────────────────────────────────────────────────────
:: Kill processes on Frontend port 5173
:: ────────────────────────────────────────────────────
echo.
echo [2/2] Stopping Frontend (port 5173)...
set FOUND_FRONTEND=0
set LAST_PID=
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5173 " ^| find "LISTENING" 2^>nul') do (
    if not "%%a"=="!LAST_PID!" (
        taskkill /PID %%a /T /F >nul 2>&1
        echo  Killed process tree for PID %%a [Vite/Node]
        set FOUND_FRONTEND=1
        set LAST_PID=%%a
    )
)
if "!FOUND_FRONTEND!"=="0" echo  Nothing running on port 5173.

:: ────────────────────────────────────────────────────
:: Close the terminal windows by title
:: ────────────────────────────────────────────────────
echo.
echo [*] Closing BhoomiSetu terminal windows...
taskkill /FI "WINDOWTITLE eq BhoomiSetu Backend*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq BhoomiSetu Frontend*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq BhoomiSetu Backend" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq BhoomiSetu Frontend" /T /F >nul 2>&1

echo.
echo  ============================================================
echo   All BhoomiSetu services stopped.
echo   Run  start.bat  to start again.
echo  ============================================================
echo.
pause
