@echo off
echo ========================================================
echo Starting AuraFinance AI - Backend and Frontend Servers
echo ========================================================

start "AuraFinance Backend (FastAPI)" cmd /k "cd backend && python run_backend.py"
start "AuraFinance Frontend (React Vite)" cmd /k "cd frontend && npm run dev"

echo.
echo Servers are launching:
echo - Backend API:  http://localhost:8000 (Swagger docs at /docs)
echo - Frontend UI:   http://localhost:3000
echo ========================================================
