@echo off
title FixoBoard MMS - Server Launcher
echo ===================================================
echo   Starting FixoBoard MMS (Backend + Frontend)
echo ===================================================
echo.

:: Clean up any lingering processes on ports 8000 & 3000
echo Cleaning up any existing processes on ports 8000 and 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do (
    if not "%%a"=="0" taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    if not "%%a"=="0" taskkill /F /PID %%a >nul 2>&1
)

echo Starting Backend on http://localhost:8000 and Frontend on http://localhost:3000...
echo Both servers feature automatic Hot-Reload upon code changes.
echo.

call npx -y concurrently -k -p "[{name}]" -n "BACKEND,FRONTEND" -c "blue.bold,green.bold" "python -m uvicorn app.main:app --reload --port 8000 --app-dir backend" "npm --prefix frontend run dev"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ===================================================
    echo Server process exited with code %ERRORLEVEL%.
    echo ===================================================
    pause
)
