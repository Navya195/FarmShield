#!/usr/bin/env python3
"""Test full authentication flow and verify voice system"""
import requests
import time
import sys
sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:5000"

print("=" * 60)
print("FULL SYSTEM TEST")
print("=" * 60)

# Test 1: Access home page (should redirect to login)
print("\n1. Testing / (root) - should redirect to login")
r = requests.get(f"{BASE_URL}/")
print(f"   Status: {r.status_code}")
print(f"   Redirects to: {r.url}")
print(f"   Has login form: {'loginForm' in r.text}")

# Test 2: Login
print("\n2. Logging in with test@farmshield.com / password123")
session = requests.Session()
r = session.post(f"{BASE_URL}/api/auth/login", 
                 json={"email": "test@farmshield.com", "password": "password123"})
print(f"   Status: {r.status_code}")
print(f"   Response: {r.json()}")

# Test 3: Access home page with session
print("\n3. Testing /home after login")
r = session.get(f"{BASE_URL}/home")
print(f"   Status: {r.status_code}")
print(f"   Has voiceMicButton: {'voiceMicButton' in r.text}")
print(f"   Has voice-system.js: {'voice-system.js' in r.text}")
print(f"   Has startVoiceAssistant: {'startVoiceAssistant' in r.text}")

# Test 4: Test voice diagnosis
print("\n4. Testing voice diagnosis API")
r = session.post(f"{BASE_URL}/api/voice-diagnosis",
                 json={"text": "Tomato leaves have yellow spots", "language": "en"})
print(f"   Status: {r.status_code}")
data = r.json()
print(f"   Success: {data.get('success')}")
if data.get('success'):
    print(f"   Disease: {data.get('diagnosis', {}).get('disease_name', 'N/A')}")

# Test 5: Test microphone button (simulate click by checking element exists)
print("\n5. Checking voice modal HTML structure")
r = session.get(f"{BASE_URL}/home")
html = r.text

checks = {
    'voiceModal': 'voiceModal' in html,
    'voiceMicButton': 'voiceMicButton' in html,
    'voiceLanguageSelect': 'voiceLanguageSelect' in html,
    'voiceStatus': 'voiceStatus' in html,
    'recordingIndicator': 'recordingIndicator' in html,
    'recordingTimer': 'recordingTimer' in html,
    'voiceTextInput': 'voiceTextInput' in html,
    'voiceSendButton': 'voiceSendButton' in html,
    'diagnosisResult': 'diagnosisResult' in html,
    'voice-system.js loaded': 'voice-system.js' in html,
}

print("   Voice System Elements:")
for element, exists in checks.items():
    print(f"     {'[PASS]' if exists else '[FAIL]'} {element}")

print("\n" + "=" * 60)
print("SYSTEM TEST COMPLETE")
print("=" * 60)