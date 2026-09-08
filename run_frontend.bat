@echo off
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0frontend"
echo ===================================================
echo  Starting RakshaSethu Frontend (Vite + React)
echo ===================================================
npm run dev
pause
