# FarmShield - Run Instructions

## 🚀 Quick Start

### Step 1: Install Dependencies
```cmd
pip install -r requirements.txt
```

### Step 2: Run the Application

**Windows (CMD):**
```cmd
python run.py
```

**Windows (PowerShell):**
```powershell
python run.py
```

**Linux/Mac:**
```bash
python run.py
```

### Step 3: Open in Browser

The app will start and display:
```
======================================================================
  🌱 FarmShield – Intelligent Agricultural Assistant
  🔐 Complete Authentication System Active
======================================================================

  ✅ Starting Flask Application...
  📍 Access at: http://localhost:5000
  📍 Or:        http://127.0.0.1:5000
```

**Copy and paste one of these links in your browser:**
- http://localhost:5000
- http://127.0.0.1:5000

## 🔐 Default Test Login

Use these credentials to login:

| Field | Value |
|-------|-------|
| Email | test@farmshield.com |
| Password | password123 |

Alternative account:
| Field | Value |
|-------|-------|
| Email | farmer@example.com |
| Password | demo123 |

## ✨ Features

✅ Voice Diagnosis System (All 5 buttons working)  
✅ Camera disease detection  
✅ Multi-language support (10 languages)  
✅ AI-powered crop analysis  
✅ User authentication  
✅ Farmer mode  
✅ Dark/Light theme  

## ❌ Troubleshooting

### Issue: "ModuleNotFoundError" or "pip install failed"
**Solution:**
```cmd
pip install flask flask-cors python-dotenv numpy pillow werkzeug
```

### Issue: "Address already in use" (Port 5000)
**Windows:**
```cmd
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
lsof -i :5000
kill -9 <PID>
```

Or use a different port:
```cmd
set PORT=5001
python run.py
```

### Issue: "Python not found"
- Download from https://www.python.org
- During installation, **CHECK** "Add Python to PATH"
- Restart your terminal after installing

### Issue: "404 Not Found" when accessing http://localhost:5000
**Solution:** 
1. Check that the Flask app is running (you should see the startup message)
2. Try accessing http://localhost:5000/login directly
3. If still not working, check browser console (F12) for errors

### Issue: "Connection refused"
**Solution:**
1. Make sure the Flask app is running
2. Check if port 5000 is being used by another app
3. Try http://127.0.0.1:5000 instead of localhost:5000

### Issue: "Page keeps redirecting to login"
**Solution:**
1. Clear browser cookies/cache
2. Try a different browser
3. Use Incognito/Private mode

## 📋 Requirements

- Python 3.8 or higher
- Flask and dependencies (installed via pip)
- Modern web browser:
  - ✅ Google Chrome (recommended)
  - ✅ Microsoft Edge
  - ✅ Safari 14+
  - ⚠️ Firefox (limited voice support)

## 🎯 Using the Application

### Voice Diagnosis (All Buttons Working!)
1. Click the 🎤 microphone button on dashboard
2. Select your language from dropdown 🌍
3. Either:
   - **Speak**: Click microphone button, say your crop problem
   - **Type**: Type symptoms and click Send or press Enter
4. View AI diagnosis results

### Camera Detection
1. Click the 📷 camera button
2. Allow camera permission when prompted
3. Capture or upload an image
4. Get instant disease diagnosis

### Profile Settings
- Edit your information
- Change password
- Download reports
- View history

## 🔗 Links

- **GitHub**: https://github.com/Navya195/FarmShield
- **Python**: https://www.python.org
- **Flask Docs**: https://flask.palletsprojects.com

---

**Last Updated**: August 5, 2026  
**Version**: 2.0 (Button Fixes Applied)
