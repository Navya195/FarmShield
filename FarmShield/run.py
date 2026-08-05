#!/usr/bin/env python
"""
FarmShield Application Launcher
Simple script to run the Flask application
"""

import os
import sys
from app import app

if __name__ == "__main__":
    # Get port from environment or use default
    port = int(os.environ.get('PORT', 5000))
    
    # Print startup information
    print("\n" + "="*70)
    print("  🌱 FarmShield – Intelligent Agricultural Assistant")
    print("  🔐 Complete Authentication System Active")
    print("="*70)
    print(f"\n  ✅ Starting Flask Application...")
    print(f"  📍 Access at: http://localhost:{port}")
    print(f"  📍 Or:        http://127.0.0.1:{port}")
    print("\n  🔐 Test Credentials:")
    print("     Email:    test@farmshield.com")
    print("     Password: password123")
    print("\n  Press Ctrl+C to stop the server")
    print("="*70 + "\n")
    
    try:
        # Run the Flask app
        app.run(
            host='0.0.0.0',
            port=port,
            debug=True,
            use_reloader=False
        )
    except KeyboardInterrupt:
        print("\n\n✅ Server stopped successfully")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        sys.exit(1)
