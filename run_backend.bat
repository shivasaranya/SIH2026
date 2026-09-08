@echo off
cd /d "%~dp0backend"
echo ===================================================
echo  Starting RakshaSethu Backend (FastAPI + Uvicorn)
echo ===================================================
.\.venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000
pause
