# FarmShield - Run Instructions

## Quick Start

### Option 1: Windows CMD
```cmd
cd FarmShield
python app.py
```

### Option 2: Windows PowerShell
```powershell
cd FarmShield
python app.py
```

### Option 3: Linux/Mac Terminal
```bash
cd FarmShield
python app.py
```

## Access the Application

After running the app, open your browser and go to:

```
http://localhost:5000
```

or

```
http://localhost:5000/home
```

## Default Test Credentials

- **Email**: test@farmshield.com
- **Password**: password123

or

- **Email**: farmer@example.com
- **Password**: demo123

## Features

✅ Voice Diagnosis System (All buttons working)  
✅ Camera disease detection  
✅ Multi-language support (10 languages)  
✅ AI-powered crop analysis  
✅ User authentication  
✅ Farmer mode  

## Troubleshooting

**Port Already in Use?**
```cmd
netstat -ano | findstr :5000
```

**Python Not Found?**
- Install Python from https://www.python.org
- Add Python to PATH

**Module Not Found?**
```cmd
pip install -r requirements.txt
```

## Requirements

- Python 3.8+
- Flask
- NumPy
- Modern browser (Chrome, Edge, Safari)

---

**GitHub**: https://github.com/Navya195/FarmShield
