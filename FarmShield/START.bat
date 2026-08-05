@echo off
REM FarmShield Startup Script for Windows

echo.
echo ========================================================================
echo  🌱 FarmShield - Intelligent Agricultural Assistant
echo ========================================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Python is not installed or not in PATH
    echo.
    echo Please install Python from https://www.python.org
    echo Make sure to CHECK "Add Python to PATH" during installation
    echo.
    pause
    exit /b 1
)

echo ✅ Python found
echo.

REM Check if Flask is installed
python -c "import flask" >nul 2>&1
if errorlevel 1 (
    echo ⏳ Installing required packages...
    pip install flask flask-cors python-dotenv numpy pillow werkzeug
    if errorlevel 1 (
        echo ❌ Failed to install packages
        pause
        exit /b 1
    )
)

echo ✅ All dependencies ready
echo.
echo ========================================================================
echo.

REM Start the application
python run.py

if errorlevel 1 (
    echo.
    echo ❌ Application failed to start
    pause
    exit /b 1
)
