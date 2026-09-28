@echo off
setlocal enabledelayedexpansion

echo.
echo  ============================================================
echo   BhoomiSetu AI -- Land Intelligence Platform
echo   STARTING APPLICATION
echo  ============================================================
echo.

set ROOT=%~dp0
set BACKEND=%ROOT%backend
set FRONTEND=%ROOT%frontend

:: ────────────────────────────────────────────────────
:: Verify setup has been run
:: ────────────────────────────────────────────────────
if not exist "%BACKEND%\venv\Scripts\activate.bat" (
    echo  ERROR: Backend virtual environment not found.
    echo  Please run setup.bat first.
    pause & exit /b 1
)
if not exist "%BACKEND%\venv\Scripts\uvicorn.exe" (
    echo  ERROR: Backend dependencies [uvicorn] not found in virtual environment.
    echo  Please run setup.bat first to complete the installation.
    pause & exit /b 1
)
if not exist "%FRONTEND%\node_modules" (
    echo  ERROR: Frontend node_modules not found.
    echo  Please run setup.bat first.
    pause & exit /b 1
)

:: ────────────────────────────────────────────────────
:: Release old instances on ports 8000 and 5173
:: ────────────────────────────────────────────────────
echo [*] Releasing ports 8000 and 5173 if already in use...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8000 " ^| find "LISTENING" 2^>nul') do (
    taskkill /PID %%a /T /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5173 " ^| find "LISTENING" 2^>nul') do (
    taskkill /PID %%a /T /F >nul 2>&1
)

:: ────────────────────────────────────────────────────
:: Start Backend in a new window
:: ────────────────────────────────────────────────────
echo.
echo [1/2] Starting Backend  (FastAPI on http://localhost:8000) ...
start "BhoomiSetu Backend" /D "%BACKEND%" cmd /k ^
    "call venv\Scripts\activate.bat && echo Backend ready at http://localhost:8000 && echo API docs: http://localhost:8000/docs && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

:: Small pause so backend gets a head start
timeout /t 3 /nobreak >nul

:: ────────────────────────────────────────────────────
:: Start Frontend in a new window
:: ────────────────────────────────────────────────────
echo [2/2] Starting Frontend (Vite on http://localhost:5173) ...
start "BhoomiSetu Frontend" /D "%FRONTEND%" cmd /k ^
    "echo Frontend ready at http://localhost:5173 && npm run dev"

:: ────────────────────────────────────────────────────
:: Wait for servers then open browser
:: ────────────────────────────────────────────────────
echo.
echo  Waiting for servers to initialize...
timeout /t 5 /nobreak >nul

echo  Opening app in browser...
start "" "http://localhost:5173"

echo.
echo  ============================================================
echo   BhoomiSetu is running!
echo.
echo   Frontend  :  http://localhost:5173
echo   Backend   :  http://localhost:8000
echo   API Docs  :  http://localhost:8000/docs
echo.
echo   Two terminal windows are open for backend and frontend.
echo   Run  stop.bat  to shut everything down.
echo  ============================================================
echo.
pause
