@echo off
setlocal enabledelayedexpansion

echo.
echo  ============================================================
echo   BhoomiSetu AI -- Land Intelligence Platform
echo   SETUP SCRIPT
echo  ============================================================
echo.

set ROOT=%~dp0
set BACKEND=%ROOT%backend
set FRONTEND=%ROOT%frontend

:: ────────────────────────────────────────────────────
:: 1. Check Python
:: ────────────────────────────────────────────────────
echo [1/5] Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo  ERROR: Python not found. Please install Python 3.10-3.12 and add it to PATH.
    pause & exit /b 1
)

for /f "tokens=2 delims= " %%v in ('python --version 2^>^&1') do set PY_FULL_VER=%%v
echo  Detected Python: !PY_FULL_VER!
echo  (Note: Python 3.10 to 3.12 is recommended for pre-built ML/OCR binary wheels)
echo  OK

:: ────────────────────────────────────────────────────
:: 2. Check Node.js
:: ────────────────────────────────────────────────────
echo.
echo [2/5] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo  ERROR: Node.js not found. Please install Node.js 18+ from https://nodejs.org
    pause & exit /b 1
)
for /f "tokens=*" %%v in ('node --version 2^>^&1') do set NODE_VER=%%v
echo  Detected Node.js: !NODE_VER!
echo  OK

:: ────────────────────────────────────────────────────
:: 3. Backend - create venv + install requirements
:: ────────────────────────────────────────────────────
echo.
echo [3/5] Setting up Python virtual environment...
cd /d "%BACKEND%"

if not exist venv (
    echo  Creating venv in backend\venv...
    python -m venv venv
    if errorlevel 1 (
        echo  ERROR: Failed to create virtual environment.
        pause & exit /b 1
    )
) else (
    echo  venv already exists.
)

echo  Upgrading pip...
"%BACKEND%\venv\Scripts\python.exe" -m pip install --upgrade pip >nul 2>&1

echo  Installing backend dependencies from requirements.txt...
"%BACKEND%\venv\Scripts\python.exe" -m pip install -r requirements.txt
if errorlevel 1 (
    echo.
    echo  ERROR: pip install failed.
    echo  Tip: If compilation failed for numpy/spacy/shapely, ensure you are
    echo       using Python 3.10-3.12 which have pre-compiled wheels for Windows.
    pause & exit /b 1
)
echo  Backend dependencies installed successfully.

:: ────────────────────────────────────────────────────
:: 4. Check & configure environment (.env) files
:: ────────────────────────────────────────────────────
echo.
echo [4/5] Checking environment files...
cd /d "%ROOT%"

:: Root .env
if not exist "%ROOT%.env" (
    if exist "%ROOT%.env.example" (
        copy "%ROOT%.env.example" "%ROOT%.env" >nul
        echo  Created root .env from .env.example
    ) else (
        echo  WARNING: No root .env.example found.
    )
) else (
    echo  Root .env already exists.
)

:: Backend .env
if not exist "%BACKEND%\.env" (
    if exist "%ROOT%.env" (
        copy "%ROOT%.env" "%BACKEND%\.env" >nul
        echo  Created backend\.env from root .env
    ) else if exist "%ROOT%.env.example" (
        copy "%ROOT%.env.example" "%BACKEND%\.env" >nul
        echo  Created backend\.env from root .env.example
    )
) else (
    echo  backend\.env already exists.
)

:: Frontend .env
if not exist "%FRONTEND%\.env" (
    if exist "%FRONTEND%\.env.example" (
        copy "%FRONTEND%\.env.example" "%FRONTEND%\.env" >nul
        echo  Created frontend\.env from frontend\.env.example
    )
) else (
    echo  frontend\.env already exists.
)

:: ────────────────────────────────────────────────────
:: 5. Frontend - install npm packages
:: ────────────────────────────────────────────────────
echo.
echo [5/5] Installing frontend dependencies...
cd /d "%FRONTEND%"
if not exist node_modules (
    echo  Running npm install...
    call npm install
    if errorlevel 1 (
        echo  ERROR: npm install failed.
        pause & exit /b 1
    )
) else (
    echo  node_modules already exists, skipping install.
)
echo  Frontend dependencies installed successfully.

:: ────────────────────────────────────────────────────
:: Done
:: ────────────────────────────────────────────────────
echo.
echo  ============================================================
echo   Setup complete!
echo   Run  start.bat  to launch the application.
echo  ============================================================
echo.
pause
