#!/usr/bin/env python3
"""Test session handling with Flask"""
import requests
import sys
sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:5000"

session = requests.Session()

print("=" * 60)
print("SESSION TEST")
print("=" * 60)

# Check initial state
print("\n1. Initial state (no login)")
r = session.get(f"{BASE_URL}/")
print(f"   URL: {r.url}")
print(f"   Status: {r.status_code}")

# Try to access home without login
print("\n2. Access /home without login")
r = session.get(f"{BASE_URL}/home")
print(f"   URL: {r.url}")
print(f"   Status: {r.status_code}")

# Login
print("\n3. Login")
r = session.post(f"{BASE_URL}/api/auth/login", 
                 json={"email": "test@farmshield.com", "password": "password123"})
print(f"   Status: {r.status_code}")
data = r.json()
print(f"   Response: {data}")

# Check session cookie
print(f"\n4. Session cookie: {session.cookies.get_dict()}")

# Try to access home again
print("\n5. Access /home AFTER login")
r = session.get(f"{BASE_URL}/home")
print(f"   URL: {r.url}")
print(f"   Status: {r.status_code}")
print(f"   Contains 'voiceModal': {'voiceModal' in r.text}")
print(f"   Contains 'voiceMicButton': {'voiceMicButton' in r.text}")

# Check if session is in response
print(f"\n6. Checking session persistence")
r = session.get(f"{BASE_URL}/api/auth/session")
print(f"   Session API response: {r.json()}")

print("\n" + "=" * 60)