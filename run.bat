@echo off
echo Starting Intelligent Shopping AI...

:: Backend
cd /d "%~dp0backend"
start "Backend" cmd /k "python -m uvicorn app.main:app --reload --port 8000"

:: Frontend
cd /d "%~dp0frontend"
start "Frontend" cmd /k "npm start"

echo.
echo Backend  → http://localhost:8000
echo Frontend → http://localhost:3000
echo API Docs → http://localhost:8000/api/docs
