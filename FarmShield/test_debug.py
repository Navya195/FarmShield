#!/usr/bin/env python3
"""Debug - check actual content of home.html"""
import requests
import sys
sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:5000"

session = requests.Session()

# Login first
print("Logging in...")
r = session.post(f"{BASE_URL}/api/auth/login", 
                 json={"email": "test@farmshield.com", "password": "password123"})
print(f"Login response: {r.status_code} - {r.json()}")

# Get cookies
print(f"\nSession cookies: {session.cookies.get_dict()}")

# Access home
print("\nAccessing /home...")
r = session.get(f"{BASE_URL}/home")
print(f"Status: {r.status_code}")
print(f"URL: {r.url}")

# Save a small portion to check
content = r.text
start = content.find('<div id="voiceModal')
if start != -1:
    end = start + 500
    print(f"\n[OK] Found voiceModal at position {start}")
    print(f"Content preview:\n{content[start:end]}")
else:
    print("\n[ERROR] voiceModal NOT FOUND in response!")
    print(f"\nFile size: {len(content)} characters")
    print(f"Last 500 characters:\n{content[-500:]}")