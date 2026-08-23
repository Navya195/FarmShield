import requests
import sys
sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:5000"

session = requests.Session()

# Login
print("Login...")
r = session.post(f"{BASE_URL}/api/auth/login", 
                 json={"email": "test@farmshield.com", "password": "password123"})
print(f"Login: {r.status_code}")

# Check session
print("\nChecking /api/auth/session...")
r = session.get(f"{BASE_URL}/api/auth/session")
print(f"Status: {r.status_code}")
print(f"Response: {r.text[:500]}")

# Try to get home
print("\nGetting /home...")
r = session.get(f"{BASE_URL}/home")
print(f"Status: {r.status_code}")
print(f"URL after redirect: {r.url}")