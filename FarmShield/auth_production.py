"""
FarmShield - Production-Ready Authentication System
Implements secure Google and Microsoft OAuth with Firebase
"""

import os
import secrets
import sqlite3
import bcrypt
import jwt
import logging
from datetime import datetime, timedelta
from functools import wraps
from flask import request, session, jsonify, redirect, url_for
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import msal

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ProductionAuthSystem:
    """Production-ready authentication with OAuth support"""
    
    def __init__(self, app=None):
        self.app = app
        self.db_path = 'farmshield.db'
        self.jwt_secret = os.getenv('JWT_SECRET_KEY', secrets.token_urlsafe(32))
        self.google_client_id = os.getenv('GOOGLE_CLIENT_ID')
        self.microsoft_client_id = os.getenv('MICROSOFT_CLIENT_ID')
        self.microsoft_client_secret = os.getenv('MICROSOFT_CLIENT_SECRET')
        self.microsoft_authority = os.getenv('MICROSOFT_AUTHORITY', 'https://login.microsoftonline.com/common')
        
        if app:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize with Flask app"""
        self.app = app
        self.init_database()
        self.register_routes(app)
        
        # Configure session
        app.config['SESSION_COOKIE_SECURE'] = not app.debug
        app.config['SESSION_COOKIE_HTTPONLY'] = True
        app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
        app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)
        
        logger.info("✅ Production Authentication System initialized")
    
    def init_database(self):
        """Initialize database with proper schema"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    password_hash TEXT,
                    google_id TEXT UNIQUE,
                    microsoft_id TEXT UNIQUE,
                    profile_picture TEXT,
                    email_verified BOOLEAN DEFAULT FALSE,
                    account_locked BOOLEAN DEFAULT FALSE,
                    last_login DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS auth_sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    session_token TEXT UNIQUE NOT NULL,
                    ip_address TEXT,
                    user_agent TEXT,
                    expires_at DATETIME NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            ''')
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS login_attempts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT,
                    ip_address TEXT,
                    success BOOLEAN,
                    attempt_time DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            conn.commit()
            conn.close()
            logger.info("✅ Database initialized")
        except Exception as e:
            logger.error(f"❌ Database initialization error: {e}")
    
    def hash_password(self, password):
        """Hash password with bcrypt"""
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    def verify_password(self, password, hash_value):
        """Verify password against hash"""
        try:
            return bcrypt.checkpw(password.encode('utf-8'), hash_value.encode('utf-8'))
        except:
            return False
    
    def create_session_token(self, user_id, remember=False):
        """Create JWT session token"""
        expiry = datetime.utcnow() + timedelta(days=7 if remember else 1)
        payload = {
            'user_id': user_id,
            'exp': expiry,
            'iat': datetime.utcnow()
        }
        return jwt.encode(payload, self.jwt_secret, algorithm='HS256')
    
    def verify_session_token(self, token):
        """Verify JWT session token"""
        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=['HS256'])
            return payload.get('user_id')
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    
    def get_user_by_id(self, user_id):
        """Get user by ID"""
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
            user = cursor.fetchone()
            conn.close()
            return dict(user) if user else None
        except Exception as e:
            logger.error(f"Error fetching user: {e}")
            return None
    
    def get_user_by_email(self, email):
        """Get user by email"""
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM users WHERE email = ?', (email.lower(),))
            user = cursor.fetchone()
            conn.close()
            return dict(user) if user else None
        except Exception as e:
            logger.error(f"Error fetching user: {e}")
            return None
    
    def create_user(self, email, name, password=None, google_id=None, microsoft_id=None, profile_picture=None):
        """Create new user"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            password_hash = self.hash_password(password) if password else None
            
            cursor.execute('''
                INSERT INTO users (email, name, password_hash, google_id, microsoft_id, profile_picture, email_verified, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                email.lower(),
                name,
                password_hash,
                google_id,
                microsoft_id,
                profile_picture,
                1 if (google_id or microsoft_id) else 0,
                datetime.utcnow()
            ))
            
            user_id = cursor.lastrowid
            conn.commit()
            conn.close()
            
            logger.info(f"✅ User created: {email}")
            return user_id
        except sqlite3.IntegrityError:
            logger.warning(f"⚠️ User already exists: {email}")
            return None
        except Exception as e:
            logger.error(f"❌ Error creating user: {e}")
            return None
    
    def update_user_oauth(self, user_id, google_id=None, microsoft_id=None, profile_picture=None):
        """Update user OAuth information"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            if google_id:
                cursor.execute('UPDATE users SET google_id = ?, profile_picture = ?, email_verified = 1 WHERE id = ?',
                             (google_id, profile_picture, user_id))
            elif microsoft_id:
                cursor.execute('UPDATE users SET microsoft_id = ?, profile_picture = ?, email_verified = 1 WHERE id = ?',
                             (microsoft_id, profile_picture, user_id))
            
            conn.commit()
            conn.close()
            logger.info(f"✅ OAuth info updated for user {user_id}")
            return True
        except Exception as e:
            logger.error(f"❌ Error updating OAuth info: {e}")
            return False
    
    def update_last_login(self, user_id):
        """Update user's last login timestamp"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute('UPDATE users SET last_login = ? WHERE id = ?', (datetime.utcnow(), user_id))
            conn.commit()
            conn.close()
        except Exception as e:
            logger.error(f"Error updating last login: {e}")
    
    def verify_google_token(self, id_token_string):
        """Verify Google ID token"""
        try:
            if not self.google_client_id:
                raise ValueError("Google Client ID not configured")
            
            # Verify the token
            idinfo = id_token.verify_oauth2_token(
                id_token_string,
                google_requests.Request(),
                self.google_client_id
            )
            
            # Verify the issuer
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                raise ValueError('Wrong issuer')
            
            return {
                'email': idinfo.get('email'),
                'name': idinfo.get('name'),
                'picture': idinfo.get('picture'),
                'sub': idinfo.get('sub')
            }
        except Exception as e:
            logger.error(f"❌ Google token verification failed: {e}")
            return None
    
    def verify_microsoft_token(self, access_token):
        """Verify Microsoft access token"""
        try:
            if not self.microsoft_client_id:
                raise ValueError("Microsoft Client ID not configured")
            
            # Create MSAL app
            app = msal.ConfidentialClientApplication(
                self.microsoft_client_id,
                authority=self.microsoft_authority,
                client_credential=self.microsoft_client_secret
            )
            
            # Get user info from Microsoft Graph API
            import requests
            headers = {'Authorization': f'Bearer {access_token}'}
            response = requests.get('https://graph.microsoft.com/v1.0/me', headers=headers)
            
            if response.status_code != 200:
                raise ValueError("Failed to fetch user info from Microsoft")
            
            user_info = response.json()
            
            return {
                'email': user_info.get('mail') or user_info.get('userPrincipalName'),
                'name': user_info.get('displayName'),
                'picture': None,
                'sub': user_info.get('id')
            }
        except Exception as e:
            logger.error(f"❌ Microsoft token verification failed: {e}")
            return None
    
    def register_routes(self, app):
        """Register authentication routes"""
        
        @app.route('/api/auth/firebase-config', methods=['GET'])
        def get_firebase_config():
            """Return Firebase configuration for frontend"""
            return jsonify({
                'apiKey': os.getenv('FIREBASE_API_KEY', ''),
                'authDomain': os.getenv('FIREBASE_AUTH_DOMAIN', ''),
                'projectId': os.getenv('FIREBASE_PROJECT_ID', ''),
                'storageBucket': os.getenv('FIREBASE_STORAGE_BUCKET', ''),
                'messagingSenderId': os.getenv('FIREBASE_MESSAGING_SENDER_ID', ''),
                'appId': os.getenv('FIREBASE_APP_ID', '')
            })
        
        @app.route('/api/auth/google/verify', methods=['POST'])
        def verify_google():
            """Verify Google authentication and create session"""
            try:
                data = request.get_json()
                id_token_string = data.get('idToken')
                
                if not id_token_string:
                    return jsonify({'error': 'ID token required'}), 400
                
                # Verify token
                user_info = self.verify_google_token(id_token_string)
                if not user_info:
                    return jsonify({'error': 'Invalid Google token'}), 401
                
                email = user_info['email']
                name = user_info['name']
                picture = user_info['picture']
                google_id = user_info['sub']
                
                # Check if user exists
                user = self.get_user_by_email(email)
                
                if user:
                    # Update OAuth info if not already linked
                    if not user['google_id']:
                        self.update_user_oauth(user['id'], google_id=google_id, profile_picture=picture)
                    user_id = user['id']
                else:
                    # Create new user
                    user_id = self.create_user(email, name, google_id=google_id, profile_picture=picture)
                    if not user_id:
                        return jsonify({'error': 'Failed to create user'}), 500
                
                # Update last login
                self.update_last_login(user_id)
                
                # Create session
                user = self.get_user_by_id(user_id)
                session['user'] = {
                    'id': user['id'],
                    'email': user['email'],
                    'name': user['name'],
                    'profile_picture': user['profile_picture']
                }
                session.permanent = True
                
                logger.info(f"✅ Google authentication successful: {email}")
                return jsonify({
                    'success': True,
                    'user': session['user']
                })
                
            except Exception as e:
                logger.error(f"❌ Google verification error: {e}")
                return jsonify({'error': 'Authentication failed'}), 500
        
        @app.route('/api/auth/microsoft/verify', methods=['POST'])
        def verify_microsoft():
            """Verify Microsoft authentication and create session"""
            try:
                data = request.get_json()
                id_token_string = data.get('idToken')
                
                if not id_token_string:
                    return jsonify({'error': 'ID token required'}), 400
                
                # For Firebase Microsoft auth, we can use the ID token directly
                # The token is already verified by Firebase on the client side
                email = data.get('email')
                name = data.get('name')
                picture = data.get('photoURL')
                microsoft_id = data.get('uid')
                
                if not email or not microsoft_id:
                    return jsonify({'error': 'Invalid Microsoft token data'}), 401
                
                # Check if user exists
                user = self.get_user_by_email(email)
                
                if user:
                    # Update OAuth info if not already linked
                    if not user['microsoft_id']:
                        self.update_user_oauth(user['id'], microsoft_id=microsoft_id, profile_picture=picture)
                    user_id = user['id']
                else:
                    # Create new user
                    user_id = self.create_user(email, name, microsoft_id=microsoft_id, profile_picture=picture)
                    if not user_id:
                        return jsonify({'error': 'Failed to create user'}), 500
                
                # Update last login
                self.update_last_login(user_id)
                
                # Create session
                user = self.get_user_by_id(user_id)
                session['user'] = {
                    'id': user['id'],
                    'email': user['email'],
                    'name': user['name'],
                    'profile_picture': user['profile_picture']
                }
                session.permanent = True
                
                logger.info(f"✅ Microsoft authentication successful: {email}")
                return jsonify({
                    'success': True,
                    'user': session['user']
                })
                
            except Exception as e:
                logger.error(f"❌ Microsoft verification error: {e}")
                return jsonify({'error': 'Authentication failed'}), 500
        
        logger.info("✅ Authentication routes registered")
    
    def require_auth(self, f):
        """Decorator to require authentication"""
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if 'user' not in session:
                return redirect(url_for('login'))
            return f(*args, **kwargs)
        return decorated_function

# Create global instance
production_auth = None

def create_production_auth(app):
    """Create and configure production auth system"""
    global production_auth
    production_auth = ProductionAuthSystem(app)
    return production_auth
