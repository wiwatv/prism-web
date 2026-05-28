@echo off
echo ==============================================
echo        Starting PRISM Web Application
echo ==============================================
echo.

:: Check if node is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js first.
    pause
    exit /b
)

:: Install dependencies if node_modules doesn't exist
if not exist "node_modules\" (
    echo [INFO] First time setup: Installing dependencies...
    call npm install --production
)

echo [INFO] Starting the local server...
start http://localhost:3001

echo.
echo Please keep this window open while using the application.
echo To stop the server, press Ctrl+C or close this window.
echo.

node server.js
pause
