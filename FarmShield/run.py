#!/usr/bin/env python3

import os
import sys
import subprocess
import webbrowser
import time
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

def check_python_version():
    if sys.version_info < (3, 7):
        print("❌ Python 3.7 or higher is required")
        return False
    print(f"✅ Python {sys.version.split()[0]} detected")
    return True

def install_requirements():
    print("📦 Installing required packages...")
    requirements = [
        "flask",
        "flask-cors", 
        "numpy",
        "pillow",
        "werkzeug"
    ]
    optional_requirements = [
        "tensorflow",
        "opencv-python",
        "scikit-learn",
        "nltk",
        "matplotlib",
        "seaborn"
    ]
    for package in requirements:
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", package])
            print(f"✅ Installed {package}")
        except subprocess.CalledProcessError:
            print(f"❌ Failed to install {package}")
    print("\n🤖 Installing AI packages (optional)...")
    for package in optional_requirements:
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", package])
            print(f"✅ Installed {package}")
        except subprocess.CalledProcessError:
            print(f"⚠️  Could not install {package} (optional)")

def create_directories():
    directories = [
        "uploads",
        "reports", 
        "model",
        "datasets",
        "static/images",
        "static/assets"
    ]
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
        print(f"📁 Created directory: {directory}")

def download_nltk_data():
    try:
        import nltk
        print("📚 Downloading NLTK data...")
        nltk.download('punkt', quiet=True)
        nltk.download('stopwords', quiet=True) 
        nltk.download('wordnet', quiet=True)
        print("✅ NLTK data downloaded")
    except ImportError:
        print("⚠️  NLTK not available - NLP features will be limited")

def check_port_availability(port=5000):
    import socket
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind(('localhost', port))
            return True
        except OSError:
            return False

def main():
    print("🌱 FarmShield - Intelligent Agricultural Assistant")
    print("=" * 60)
    if not check_python_version():
        return
    if not os.path.exists("app.py"):
        print("❌ Please run this script from the FarmShield directory")
        return
    create_directories()
    download_nltk_data()
    port = 5000
    if not check_port_availability(port):
        print(f"⚠️  Port {port} is busy, trying port 5001...")
        port = 5001
        if not check_port_availability(port):
            print("❌ Ports 5000 and 5001 are busy. Please free up a port.")
            return
    print(f"\n🚀 Starting FarmShield on port {port}...")
    print(f"🌐 Application will be available at: http://localhost:{port}")
    print("📱 Features available:")
    print("   • AI Disease Detection")
    print("   • Voice Assistant (Hindi, Telugu, Tamil, Marathi)")
    print("   • One-Tap Camera Scanning")
    print("   • Offline Mode Support")
    print("   • Daily Farming Tasks")
    print("   • Weather Alerts")
    print("   • Expert Contact")
    print("   • Farmer Community")
    def open_browser():
        time.sleep(2)
        webbrowser.open(f"http://localhost:{port}")
    import threading
    browser_thread = threading.Thread(target=open_browser)
    browser_thread.daemon = True
    browser_thread.start()
    try:
        os.environ['FLASK_ENV'] = 'development'
        os.environ['FLASK_DEBUG'] = '1'
        from app import app
        app.run(host='0.0.0.0', port=port, debug=True, use_reloader=False)
    except KeyboardInterrupt:
        print("\n\n🛑 FarmShield stopped by user")
    except Exception as e:
        print(f"\n❌ Error starting application: {e}")
        print("\nTroubleshooting:")
        print("1. Make sure all files are in place")
        print("2. Check if Python packages are installed")
        print("3. Try running: python app.py")

if __name__ == "__main__":
    main()