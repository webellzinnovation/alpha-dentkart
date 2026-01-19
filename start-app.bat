@echo off
echo ========================================
echo   Alpha DentKart - Secure Application
echo ========================================
echo.
echo Starting Backend Server (Port 3001)...
echo Starting Frontend Server (Port 3000)...
echo.
echo Press Ctrl+C to stop both servers
echo ========================================
echo.

start "Backend Server" cmd /k "npm run server"
timeout /t 2 /nobreak >nul
start "Frontend Server" cmd /k "npm run dev"

echo.
echo Both servers are starting in separate windows!
echo.
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo Login: admin@alphadentkart.com / Admin@123
echo.
pause
