#!/bin/bash

# FarmShield Startup Script

echo "🌾 Starting FarmShield..."

# Create necessary directories
mkdir -p uploads reports model nlp

# Initialize database if it doesn't exist
if [ ! -f farmshield.db ]; then
    echo "📦 Initializing database..."
    python -c "from app import init_default_users; init_default_users()"
fi

# Set environment variables for production
export FLASK_ENV=production
export PYTHONUNBUFFERED=1

# Start the application
echo "🚀 Starting Flask application..."
exec gunicorn --bind 0.0.0.0:$PORT --workers 1 --timeout 120 app:app