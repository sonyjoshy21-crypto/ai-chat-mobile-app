@echo off
echo ===================================================
echo   AI Chat Mobile App - Dependency Setup Script
echo ===================================================
echo.

:: Check for Node.js installation
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in your PATH.
    echo Please install Node.js (v18 or higher recommended) and try again.
    pause
    exit /b 1
)

echo [1/4] Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install backend dependencies.
    pause
    exit /b 1
)
cd ..

echo [2/4] Setting up backend environment file...
cd backend
if not exist .env (
    copy .env.example .env
    echo Created .env file from .env.example in backend/
    echo Please configure your GEMINI_API_KEY and MONGODB_URI in backend/.env if needed.
) else (
    echo backend/.env already exists. Skipping copy.
)
cd ..

echo [3/4] Installing frontend dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install frontend dependencies.
    pause
    exit /b 1
)
cd ..

echo.
echo ===================================================
echo   Installation Successful!
echo ===================================================
echo.
echo To run the application:
echo.
echo   1. Start the Backend:
echo      cd backend
echo      npm run dev
echo.
echo   2. Start the Frontend (Expo Dev Server):
echo      cd frontend
echo      npm start
echo.
pause
