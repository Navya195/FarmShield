# FarmShield - Run Instructions

## 🚀 Quickest Way to Start

### Windows Users
**Simply double-click:**
```
START.bat
```

### Linux/Mac Users
**Run in terminal:**
```bash
bash start.sh
```

Or make it executable first:
```bash
chmod +x start.sh
./start.sh
```

---

## 🚀 Manual Start (If Above Doesn't Work)

### Step 1: Install Dependencies
```cmd
pip install flask flask-cors python-dotenv numpy pillow werkzeug
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
python3 run.py
```

---

## 🌐 Access the Application

After starting, you should see:
```
======================================================================
  🌱 FarmShield – Intelligent Agricultural Assistant
  🔐 Complete Authentication System Active
======================================================================

  ✅ Starting Flask Application...
  📍 Access at: http://localhost:5000
  📍 Or:        http://127.0.0.1:5000

  🔐 Test Credentials:
     Email:    test@farmshield.com
     Password: password123

  Press Ctrl+C to stop the server
======================================================================
```

**Open your browser and go to:**
```
http://localhost:5000
```

## 🔐 Login Credentials

Use these to login:

**Account 1:**
- Email: `test@farmshield.com`
- Password: `password123`

**Account 2:**
- Email: `farmer@example.com`
- Password: `demo123`

---

## ✨ Features Ready to Use

✅ **Voice Diagnosis** - All 5 buttons working!  
✅ **Camera Detection** - Scan crops with camera  
✅ **Multi-Language** - 10 languages supported  
✅ **AI Analysis** - Instant crop diagnosis  
✅ **Authentication** - Secure login system  
✅ **Farmer Mode** - Special farmer-focused interface  
✅ **Dark/Light Theme** - Toggle theme anytime  

---

## ❌ Troubleshooting

### ❓ "START.bat doesn't work" (Windows)
**Solution:**
1. Open Command Prompt (cmd)
2. Navigate to FarmShield folder:
   ```cmd
   cd "path\to\FarmShield"
   ```
3. Run manually:
   ```cmd
   python run.py
   ```

### ❓ "start.sh doesn't work" (Linux/Mac)
**Solution:**
```bash
chmod +x start.sh
./start.sh
```

### ❓ "Python not found"
**Solution:**
1. Download Python from https://www.python.org
2. **IMPORTANT:** During installation, CHECK the box: "Add Python to PATH"
3. Restart your computer
4. Try again

### ❓ "ModuleNotFoundError: No module named 'flask'"
**Solution:**
```cmd
pip install flask flask-cors python-dotenv numpy pillow werkzeug
```

### ❓ "Address already in use" (Port 5000)
**Windows:**
```cmd
netstat -ano | findstr :5000
taskkill /PID <PID_number> /F
```

**Linux/Mac:**
```bash
lsof -i :5000
kill -9 <PID_number>
```

Or use a different port:
```cmd
set PORT=5001
python run.py
```

### ❓ "Cannot connect to http://localhost:5000"
**Checklist:**
- [ ] Flask app is running (check terminal window)
- [ ] URL is correct (http://localhost:5000 or http://127.0.0.1:5000)
- [ ] No firewall blocking port 5000
- [ ] Browser is not in offline mode
- [ ] Try http://127.0.0.1:5000 instead
- [ ] Try a different browser (Chrome recommended)

### ❓ "Page keeps redirecting to login"
**Solution:**
1. Clear browser cache and cookies
2. Press Ctrl+Shift+Delete (most browsers)
3. Try Incognito/Private mode
4. Log in again

### ❓ "Voice Diagnosis buttons not working"
**Requirements:**
- ✅ Use Chrome, Edge, or Safari
- ✅ Allow microphone permission when prompted
- ✅ Check internet connection
- ✅ Try typing instead of speaking

### ❓ "Camera button not working"
**Solution:**
1. Browser must have camera permission
2. Allow when browser asks
3. Try a different browser
4. Use Chrome or Edge (best support)

---

## 📋 System Requirements

| Requirement | Minimum | Recommended |
|------------|---------|------------|
| Python | 3.8 | 3.10+ |
| RAM | 2 GB | 4 GB+ |
| Disk Space | 500 MB | 1 GB |
| Browser | Modern | Chrome/Edge |
| Internet | Required | For AI features |

## 🌐 Supported Browsers

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Full | Recommended |
| Edge | ✅ Full | Recommended |
| Safari | ✅ Full | 14+ required |
| Firefox | ⚠️ Limited | Voice support limited |
| IE 11 | ❌ No | Not supported |

---

## 🎯 Voice Diagnosis Features

All buttons are **fully functional**:

1. **🎤 Microphone Button**
   - Click to start recording
   - Speak your crop problem
   - Click again to stop

2. **🌍 Language Selector**
   - Choose from 10 languages
   - Updates instantly
   - Works with voice and text

3. **📝 Text Input**
   - Type your symptoms
   - Press Enter or click Send
   - Works even if microphone unavailable

4. **✈️ Send Button**
   - Submits typed symptoms
   - Validates input
   - Shows errors if needed

5. **✕ Close Button**
   - Closes the modal
   - Stops any recording
   - Resets for next use

---

## 📞 Need Help?

- 🔗 **GitHub**: https://github.com/Navya195/FarmShield
- 📖 **Documentation**: See RUN.md (this file)
- 🐛 **Report Issues**: GitHub Issues tab

---

**Version**: 2.0  
**Last Updated**: August 5, 2026  
**Status**: ✅ All buttons working, ready to use!
