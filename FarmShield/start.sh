#!/bin/bash

# FarmShield Startup Script for Linux/Mac

echo ""
echo "========================================================================"
echo "  🌱 FarmShield - Intelligent Agricultural Assistant"
echo "========================================================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ ERROR: Python 3 is not installed"
    echo ""
    echo "Please install Python from https://www.python.org"
    echo ""
    exit 1
fi

echo "✅ Python found: $(python3 --version)"
echo ""

# Check if Flask is installed
python3 -c "import flask" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "⏳ Installing required packages..."
    pip3 install flask flask-cors python-dotenv numpy pillow werkzeug
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install packages"
        exit 1
    fi
fi

echo "✅ All dependencies ready"
echo ""
echo "========================================================================"
echo ""

# Start the application
python3 run.py

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Application failed to start"
    exit 1
fi
