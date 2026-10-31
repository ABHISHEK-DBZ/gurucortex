@echo off
title GuruCortex - AI Learning Companion
echo ============================================================
echo           GuruCortex - Local Development Launcher
echo ============================================================
echo.
echo Starting FastAPI Backend (Port 8000)...
start "GuruCortex Backend" cmd /k "cd /d %~dp0backend && if exist .venv\Scripts\activate (call .venv\Scripts\activate) && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo Waiting for backend to initialize...
timeout /t 3 /nobreak >nul

echo Starting Next.js Frontend (Port 3000)...
start "GuruCortex Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo Waiting for frontend to start...
timeout /t 4 /nobreak >nul

echo Opening browser at http://localhost:3000...
start http://localhost:3000

echo.
echo GuruCortex is running!
echo - Frontend: http://localhost:3000
echo - Backend:  http://localhost:8000
echo - API Docs: http://localhost:8000/docs
echo.
