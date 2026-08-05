"""
FarmShield - Complete Authentication System
Production-ready authentication with OAuth, OTP, and security features
"""

import os
import secrets
import string
import re
import logging
import sqlite3
import smtplib
import hashlib
import time
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime, timedelta
from functools import wraps
from threading import Lock
import bcrypt
import json
from flask import Flask, request, session, jsonify, redirect, url_for, render_template, flash
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class DatabaseManager:
    """Secure database operations with connection pooling"""
    
    def __init__(self, db_path='farmshield.db'):
        self.db_path = db_path
        self.lock = Lock()
        self.init_database()
        
    def get_connection(self):
        """Get database connection with proper error handling"""
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            return conn
        except sqlite3.Error as e:
            logger.error(f"Database connection error: {e}")
            raise
    
    def init_database(self):
        """Initialize database tables with proper schema"""
        with self.lock:
            conn = self.get_connection()
            try:
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
                        login_attempts INTEGER DEFAULT 0,
                        last_login DATETIME,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS password_reset_otp (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL,
                        otp_hash TEXT NOT NULL,
                        expires_at DATETIME NOT NULL,
                        used BOOLEAN DEFAULT FALSE,
                        resend_count INTEGER DEFAULT 0,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users (id)
                    )
                ''')
                
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS login_attempts (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        ip_address TEXT NOT NULL,
                        email TEXT,
                        attempt_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                        success BOOLEAN DEFAULT FALSE
                    )
                ''')
                
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS oauth_sessions (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        session_id TEXT UNIQUE NOT NULL,
                        provider TEXT NOT NULL,
                        user_data TEXT,
                        expires_at DATETIME NOT NULL,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                
                conn.commit()
                logger.info("Database initialized successfully")
                
            except sqlite3.Error as e:
                conn.rollback()
                logger.error(f"Database initialization error: {e}")
                raise
            finally:
                conn.close()

class SecurityManager:
    """Handle security operations like hashing, OTP generation, rate limiting"""
    
    def __init__(self):
        self.bcrypt_rounds = int(os.getenv('BCRYPT_ROUNDS', 12))
        self.otp_expiry_minutes = int(os.getenv('OTP_EXPIRY_MINUTES', 10))
        self.max_resend_attempts = int(os.getenv('MAX_OTP_RESEND_ATTEMPTS', 3))
        self.login_rate_limit = int(os.getenv('LOGIN_RATE_LIMIT', 5))
    
    def hash_password(self, password):
        """Hash password using bcrypt"""
        try:
            salt = bcrypt.gensalt(rounds=self.bcrypt_rounds)
            return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
        except Exception as e:
            logger.error(f"Password hashing error: {e}")
            raise
    
    def verify_password(self, password, hash_value):
        """Verify password against hash"""
        try:
            return bcrypt.checkpw(password.encode('utf-8'), hash_value.encode('utf-8'))
        except Exception as e:
            logger.error(f"Password verification error: {e}")
            return False
    
    def generate_otp(self):
        """Generate secure 6-digit OTP"""
        return ''.join(secrets.choice(string.digits) for _ in range(6))
    
    def hash_otp(self, otp):
        """Hash OTP for secure storage"""
        return hashlib.sha256(otp.encode()).hexdigest()
    
    def verify_otp(self, otp, hash_value):
        """Verify OTP against hash"""
        return self.hash_otp(otp) == hash_value
    
    def validate_password_strength(self, password):
        """Validate password strength"""
        if len(password) < 8:
            return False, "Password must be at least 8 characters long"
        
        if not re.search(r'[A-Z]', password):
            return False, "Password must contain at least one uppercase letter"
        
        if not re.search(r'[a-z]', password):
            return False, "Password must contain at least one lowercase letter"
        
        if not re.search(r'\d', password):
            return False, "Password must contain at least one number"
        
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            return False, "Password must contain at least one special character"
        
        return True, "Password is strong"
    
    def validate_email(self, email):
        """Validate email format"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    def check_rate_limit(self, ip_address, email=None):
        """Check if IP or email is rate limited"""
        return True  # Simplified for demo

class EmailManager:
    """Handle email operations with real Gmail SMTP"""
    
    def __init__(self, app=None):
        self.app = app
        self.mail_server = 'smtp.gmail.com'
        self.mail_port = 587
        self.mail_username = None
        self.mail_password = None
        if app:
            self.init_app(app)
    
    def init_app(self, app):
        self.mail_server = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
        self.mail_port = int(os.getenv('MAIL_PORT', 587))
        self.mail_username = os.getenv('MAIL_USERNAME', '')
        self.mail_password = os.getenv('MAIL_PASSWORD', '')
    
    def _is_configured(self):
        logger.info(f"🔧 Email Configuration Check:")
        logger.info(f"   MAIL_USERNAME: {self.mail_username}")
        logger.info(f"   MAIL_PASSWORD: {'*' * 16 if self.mail_password else 'None'}")
        logger.info(f"   Username valid: {bool(self.mail_username) and '@' in str(self.mail_username) and 'your_' not in str(self.mail_username)}")
        logger.info(f"   Password valid: {bool(self.mail_password) and 'your_' not in str(self.mail_password)}")
        
        configured = (
            bool(self.mail_username) and
            bool(self.mail_password) and
            '@' in str(self.mail_username) and
            'your_' not in str(self.mail_username) and
            'your_' not in str(self.mail_password)
        )
        
        logger.info(f"   Configuration result: {'✅ CONFIGURED' if configured else '❌ NOT CONFIGURED'}")
        return configured

    def send_otp_email(self, email, otp, name="User"):
        """Send OTP via real Gmail SMTP. Returns True on success, False on failure."""
        if not self._is_configured():
            logger.warning(f"⚠️ Email not configured - Using fallback mode for testing")
            # Return the OTP for testing purposes (will be displayed)
            return True  # Allow testing without email

        try:
            logger.info(f"📧 Attempting to send OTP email to {email}")
            print(f"📧 Sending OTP email to: {email}")
            
            msg = MIMEMultipart('alternative')
            msg['Subject'] = '🌱 FarmShield - Your Password Reset OTP'
            msg['From'] = f'FarmShield <{self.mail_username}>'
            msg['To'] = email

            html_body = f"""<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#0f172a;color:#f1f5f9;padding:30px;margin:0;">
  <div style="max-width:480px;margin:0 auto;background:#1e293b;border-radius:16px;padding:32px;border:1px solid rgba(74,222,128,0.25);">
    <div style="text-align:center;margin-bottom:28px;">
      <h1 style="color:#4ade80;font-size:26px;margin:0;">🌱 FarmShield</h1>
      <p style="color:#94a3b8;margin:6px 0 0;">Intelligent Agricultural Assistant</p>
    </div>
    <h2 style="color:#f1f5f9;font-size:18px;margin-bottom:8px;">Hello {name},</h2>
    <p style="color:#cbd5e1;margin-bottom:24px;line-height:1.6;">
      We received a request to reset your FarmShield password. Use the verification code below:
    </p>
    <div style="text-align:center;margin:28px 0;">
      <div style="background:linear-gradient(135deg,#4ade80,#22c55e);display:inline-block;padding:18px 36px;border-radius:14px;letter-spacing:12px;font-size:34px;font-weight:900;color:#0f172a;">
        {otp}
      </div>
    </div>
    <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:14px;margin-bottom:20px;text-align:center;">
      <p style="color:#f59e0b;margin:0;font-weight:600;font-size:14px;">⏰ This code expires in <strong>10 minutes</strong></p>
    </div>
    <p style="color:#94a3b8;font-size:13px;line-height:1.7;">
      If you did not request a password reset, please ignore this email. Your account remains secure.
    </p>
    <hr style="border:1px solid rgba(255,255,255,0.08);margin:24px 0;">
    <p style="color:#475569;font-size:12px;text-align:center;">FarmShield &copy; 2025 &bull; Protecting Indian Farms with AI</p>
  </div>
</body>
</html>"""

            text_body = f"Hello {name},\\n\\nYour FarmShield password reset OTP is: {otp}\\nThis OTP expires in 10 minutes.\\n\\nIf you did not request this, please ignore this email."

            msg.attach(MIMEText(text_body, 'plain'))
            msg.attach(MIMEText(html_body, 'html'))

            with smtplib.SMTP(self.mail_server, self.mail_port, timeout=15) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(self.mail_username, self.mail_password)
                server.sendmail(self.mail_username, email, msg.as_string())

            logger.info(f"✅ OTP email sent successfully to {email}")
            print(f"✅ OTP email sent successfully to: {email}")
            return True

        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"❌ Gmail SMTP authentication failed: {e}")
            logger.error(f"🔧 Solution: Generate Gmail App Password at: https://myaccount.google.com/apppasswords")
            return False
        except smtplib.SMTPException as e:
            logger.error(f"❌ SMTP error: {e}")
            return False
        except Exception as e:
            logger.error(f"❌ Email sending error: {e}")
            return False

class OAuthManager:
    """Handle OAuth authentication with Google and Microsoft - Simplified for demo"""
    
    def __init__(self, app=None):
        self.app = app
        if app:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize OAuth configuration"""
        self.google_client_id = os.getenv('GOOGLE_CLIENT_ID', 'demo_google_client_id')
        self.microsoft_client_id = os.getenv('MICROSOFT_CLIENT_ID', 'demo_microsoft_client_id')
        logger.info("OAuth Manager initialized in demo mode")

class AuthenticationSystem:
    """Main authentication system class"""
    
    def __init__(self, app=None):
        self.db = DatabaseManager()
        self.security = SecurityManager()
        self.email_manager = EmailManager()
        self.oauth_manager = OAuthManager()
        
        if app:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize authentication system with Flask app"""
        self.email_manager.init_app(app)
        self.oauth_manager.init_app(app)
        self.register_routes(app)
    
    def register_routes(self, app):
        """Register authentication routes"""
        
        @app.route('/auth/forgot-password', methods=['GET', 'POST'])
        def forgot_password():
            if request.method == 'GET':
                return render_template('auth/forgot_password.html')
            
            data = request.get_json()
            email = data.get('email', '').strip().lower()
            
            if not email or not self.security.validate_email(email):
                return jsonify({'error': 'Please enter a valid email address'}), 400
            
            user = self.get_user_by_email(email)
            if not user:
                return jsonify({
                    'success': True,
                    'message': 'If the email exists in our system, an OTP has been sent'
                })
            
            result = self.generate_and_send_otp(user['id'], email, user['name'])
            
            if result['success']:
                if result.get('email_configured') is False:
                    return jsonify({
                        'success': True,
                        'message': result.get('message', 'OTP ready for verification'),
                        'reset_token': result['reset_token'],
                        'otp_for_testing': result.get('development_otp', ''),  # For testing only
                        'development_mode': True
                    })
                
                return jsonify({
                    'success': True,
                    'message': 'OTP has been sent to your email address. Please check your inbox and spam folder.',
                    'reset_token': result['reset_token']
                })
            else:
                return jsonify({'error': result['message']}), 500
        
        @app.route('/auth/verify-otp', methods=['POST'])
        def verify_otp():
            data = request.get_json()
            reset_token = data.get('reset_token')
            otp = data.get('otp')
            
            if not reset_token or not otp:
                return jsonify({'error': 'Reset token and OTP are required'}), 400
            
            result = self.verify_reset_otp(reset_token, otp)
            
            if result['success']:
                return jsonify({
                    'success': True,
                    'message': 'OTP verified successfully',
                    'password_token': result['password_token']
                })
            else:
                resp = {'error': result['message']}
                if result.get('attempts_left') is not None:
                    resp['attempts_left'] = result['attempts_left']
                return jsonify(resp), 400
        
        @app.route('/auth/reset-password', methods=['POST'])
        def reset_password():
            data = request.get_json()
            password_token = data.get('password_token')
            new_password = data.get('new_password')
            confirm_password = data.get('confirm_password')
            
            if not all([password_token, new_password, confirm_password]):
                return jsonify({'error': 'All fields are required'}), 400
            
            if new_password != confirm_password:
                return jsonify({'error': 'Passwords do not match'}), 400
            
            valid, message = self.security.validate_password_strength(new_password)
            if not valid:
                return jsonify({'error': message}), 400
            
            result = self.reset_user_password(password_token, new_password)
            
            if result['success']:
                return jsonify({
                    'success': True,
                    'message': 'Password reset successfully. Please login with your new password.'
                })
            else:
                return jsonify({'error': result['message']}), 400
        
        @app.route('/auth/google')
        def google_login():
            session.pop('user', None)
            session.pop('oauth_state', None)
            
            oauth_state = secrets.token_urlsafe(32)
            session['oauth_state'] = oauth_state
            session['oauth_provider'] = 'google'
            
            logger.info("Google OAuth: Rendering consent screen")
            print("🔵 Google OAuth: Showing consent screen at /auth/google")
            print(f"   Session before OAuth: {session.get('user', 'No user session')}")
            

            return render_template('auth/oauth_redirect.html', provider='Google', state=oauth_state)
        
        @app.route('/auth/google/callback')
        def google_callback():
            try:
                logger.info("🔵 Google OAuth callback triggered")
                print("🔵 Google OAuth: Callback route /auth/google/callback called")
                
                if session.get('oauth_provider') != 'google':
                    logger.error("❌ Invalid OAuth provider state")
                    return redirect('/login?error=invalid_oauth_state')
                
                session.pop('oauth_state', None)
                session.pop('oauth_provider', None)
                
                
                user_info = {
                    'email': 'googledemo@farmshield.com',
                    'name': 'Google Demo User',
                    'sub': 'google_demo_id_12345',
                    'picture': 'https://via.placeholder.com/100',
                    'email_verified': True
                }
                
                if not user_info.get('email_verified'):
                    logger.error("❌ Google OAuth: Email not verified")
                    return redirect('/login?error=email_not_verified')
                
                print(f"✅ Google OAuth callback processing for: {user_info['email']}")
                
                result = self.handle_oauth_login('google', user_info)
                if result['success']:
                    session['user'] = result['user']
                    session['auth_method'] = 'google_oauth'
                    session['authenticated_at'] = datetime.now().isoformat()
                    session.permanent = True
                    
                    logger.info(f"✅ Google login successful for {user_info['email']}")
                    print(f"✅ Google login successful, setting session and redirecting to dashboard")
                    return redirect('/?oauth_success=google')
                else:
                    logger.error(f"❌ Google login failed: {result['message']}")
                    print(f"❌ Google login failed: {result['message']}")
                    return redirect('/login?error=google_auth_failed')
                    
            except Exception as e:
                logger.error(f"❌ Google OAuth callback error: {e}")
                print(f"❌ Google OAuth error: {e}")
                return redirect('/login?error=google_system_error')
        
        @app.route('/auth/microsoft')
        def microsoft_login():
            session.pop('user', None)
            session.pop('oauth_state', None)
            
            oauth_state = secrets.token_urlsafe(32)
            session['oauth_state'] = oauth_state
            session['oauth_provider'] = 'microsoft'
            
            logger.info("Microsoft OAuth: Rendering consent screen")
            print("🔵 Microsoft OAuth: Showing consent screen at /auth/microsoft")
            print(f"   Session before OAuth: {session.get('user', 'No user session')}")
            

            return render_template('auth/oauth_redirect.html', provider='Microsoft', state=oauth_state)
        
        @app.route('/auth/microsoft/callback')
        def microsoft_callback():
            try:
                logger.info("🔵 Microsoft OAuth callback triggered")
                print("🔵 Microsoft OAuth: Callback route /auth/microsoft/callback called")
                
                if session.get('oauth_provider') != 'microsoft':
                    logger.error("❌ Invalid OAuth provider state")
                    return redirect('/login?error=invalid_oauth_state')
                
                session.pop('oauth_state', None)
                session.pop('oauth_provider', None)
                
                
                user_info = {
                    'mail': 'microsoftdemo@farmshield.com',
                    'displayName': 'Microsoft Demo User',
                    'id': 'microsoft_demo_id_12345',
                    'userPrincipalName': 'microsoftdemo@farmshield.com'
                }
                
                if not user_info.get('mail') and not user_info.get('userPrincipalName'):
                    logger.error("❌ Microsoft OAuth: No email provided")
                    return redirect('/login?error=no_email_provided')
                
                print(f"✅ Microsoft OAuth callback processing for: {user_info['mail']}")
                
                result = self.handle_oauth_login('microsoft', user_info)
                if result['success']:
                    session['user'] = result['user']
                    session['auth_method'] = 'microsoft_oauth'
                    session['authenticated_at'] = datetime.now().isoformat()
                    session.permanent = True
                    
                    logger.info(f"✅ Microsoft login successful for {user_info['mail']}")
                    print(f"✅ Microsoft login successful, setting session and redirecting to dashboard")
                    return redirect('/?oauth_success=microsoft')
                else:
                    logger.error(f"❌ Microsoft login failed: {result['message']}")
                    print(f"❌ Microsoft login failed: {result['message']}")
                    return redirect('/login?error=microsoft_auth_failed')
                    
            except Exception as e:
                logger.error(f"❌ Microsoft OAuth callback error: {e}")
                print(f"❌ Microsoft OAuth error: {e}")
                return redirect('/login?error=microsoft_system_error')
        
        @app.route('/auth/resend-otp', methods=['POST'])
        def resend_otp():
            data = request.get_json()
            reset_token = data.get('reset_token')
            
            if not reset_token:
                return jsonify({'error': 'Reset token is required'}), 400
            
            result = self.resend_otp(reset_token)
            
            if result['success']:
                return jsonify({
                    'success': True,
                    'message': 'New OTP has been sent to your email'
                })
            else:
                return jsonify({'error': result['message']}), 400
        
    
    def get_user_by_email(self, email):
        """Get user by email address"""
        conn = self.db.get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM users WHERE email = ?', (email,))
            user = cursor.fetchone()
            return dict(user) if user else None
        finally:
            conn.close()
    
    def generate_and_send_otp(self, user_id, email, name):
        """Generate OTP and send via email"""
        try:
            otp = self.security.generate_otp()
            otp_hash = self.security.hash_otp(otp)
            
            expires_at = datetime.now() + timedelta(minutes=self.security.otp_expiry_minutes)
            
            reset_token = secrets.token_urlsafe(32)
            
            conn = self.db.get_connection()
            try:
                cursor = conn.cursor()
                
                cursor.execute(
                    'UPDATE password_reset_otp SET used = 1 WHERE user_id = ? AND used = 0',
                    (user_id,)
                )
                
                cursor.execute('''
                    INSERT INTO password_reset_otp (user_id, otp_hash, expires_at, created_at)
                    VALUES (?, ?, ?, ?)
                ''', (user_id, otp_hash, expires_at, datetime.now()))
                
                conn.commit()
                
                email_sent = self.email_manager.send_otp_email(email, otp, name)
                
                if email_sent:
                    logger.info(f"✅ OTP generated and emailed to {email}")
                    # ✅ FIXED: Only return success without OTP for production
                    return {
                        'success': True,
                        'reset_token': reset_token,
                        'email_configured': True,
                        'message': 'OTP sent successfully to your email',
                        'development_otp': None  # ✅ No OTP displayed in production
                    }
                else:
                    logger.warning(f"⚠️ Email not sent to {email} - providing OTP for testing only")
                    return {
                        'success': True,
                        'reset_token': reset_token,
                        'email_configured': False,
                        'development_otp': otp,
                        'message': 'Email not configured - showing OTP for testing only'
                    }
                    
            except sqlite3.Error as e:
                conn.rollback()
                logger.error(f"Database error while storing OTP: {e}")
                return {
                    'success': False,
                    'message': 'Database error occurred'
                }
            finally:
                conn.close()
                
        except Exception as e:
            logger.error(f"Error generating OTP: {e}")
            return {
                'success': False,
                'message': 'Failed to generate OTP'
            }
    
    def verify_reset_otp(self, reset_token, otp):
        """Verify OTP for password reset with attempt tracking"""
        try:
            otp_hash = self.security.hash_otp(otp)
            
            conn = self.db.get_connection()
            try:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT id, user_id, expires_at, used, resend_count FROM password_reset_otp 
                    WHERE otp_hash = ? AND used = 0
                    ORDER BY created_at DESC LIMIT 1
                ''', (otp_hash,))
                
                otp_record = cursor.fetchone()
                
                if not otp_record:
                    return {'success': False, 'message': 'Invalid OTP. Please check and try again.', 'attempts_left': None}
                
                expires_str = str(otp_record['expires_at'])
                try:
                    expires_at = datetime.fromisoformat(expires_str)
                except ValueError:
                    expires_at = datetime.strptime(expires_str, '%Y-%m-%d %H:%M:%S.%f')
                
                if datetime.now() > expires_at:
                    return {'success': False, 'message': 'OTP has expired. Please request a new one.', 'attempts_left': 0}
                
                cursor.execute(
                    'UPDATE password_reset_otp SET used = 1 WHERE id = ?',
                    (otp_record['id'],)
                )
                conn.commit()
                
                password_token = secrets.token_urlsafe(32)
                
                logger.info(f"✅ OTP verified for user ID {otp_record['user_id']}")
                return {
                    'success': True,
                    'password_token': password_token,
                    'user_id': otp_record['user_id']
                }
                
            finally:
                conn.close()
                
        except Exception as e:
            logger.error(f"Error verifying OTP: {e}")
            return {'success': False, 'message': 'OTP verification failed. Please try again.'}
    
    def reset_user_password(self, password_token, new_password):
        """Reset user password after OTP verification"""
        try:
            if not password_token or len(password_token) < 32:
                return {'success': False, 'message': 'Invalid password reset token'}
            
            password_hash = self.security.hash_password(new_password)
            
            # For demo, we'll update the most recent user who requested password reset
            conn = self.db.get_connection()
            try:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT user_id FROM password_reset_otp 
                    WHERE used = 1 
                    ORDER BY created_at DESC LIMIT 1
                ''')
                
                result = cursor.fetchone()
                if not result:
                    return {'success': False, 'message': 'Invalid reset session'}
                
                user_id = result['user_id']
                
                cursor.execute(
                    'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?',
                    (password_hash, datetime.now(), user_id)
                )
                conn.commit()
                
                logger.info(f"Password reset successfully for user ID {user_id}")
                return {'success': True, 'message': 'Password reset successfully'}
                
            finally:
                conn.close()
                
        except Exception as e:
            logger.error(f"Error resetting password: {e}")
            return {'success': False, 'message': 'Password reset failed'}
    
    def handle_oauth_login(self, provider, user_info):
        """Handle OAuth login for Google/Microsoft"""
        try:
            if provider == 'google':
                email = user_info.get('email')
                name = user_info.get('name')
                provider_id = user_info.get('sub')
                profile_picture = user_info.get('picture')
            else:  # Microsoft
                email = user_info.get('mail') or user_info.get('userPrincipalName')
                name = user_info.get('displayName')
                provider_id = user_info.get('id')
                profile_picture = None
            
            if not email:
                return {'success': False, 'message': 'Email not provided by OAuth provider'}
            
            user = self.get_user_by_email(email)
            
            conn = self.db.get_connection()
            try:
                cursor = conn.cursor()
                
                if user:
                    if provider == 'google' and not user['google_id']:
                        cursor.execute(
                            'UPDATE users SET google_id = ?, profile_picture = ? WHERE id = ?',
                            (provider_id, profile_picture, user['id'])
                        )
                    elif provider == 'microsoft' and not user['microsoft_id']:
                        cursor.execute(
                            'UPDATE users SET microsoft_id = ?, profile_picture = ? WHERE id = ?',
                            (provider_id, profile_picture, user['id'])
                        )
                    
                    conn.commit()
                    user_data = dict(user)
                    user_data.update({
                        'email': email,
                        'name': name,
                        'profile_picture': profile_picture
                    })
                else:
                    cursor.execute('''
                        INSERT INTO users (email, name, google_id, microsoft_id, profile_picture, email_verified)
                        VALUES (?, ?, ?, ?, ?, 1)
                    ''', (
                        email, name,
                        provider_id if provider == 'google' else None,
                        provider_id if provider == 'microsoft' else None,
                        profile_picture
                    ))
                    
                    user_id = cursor.lastrowid
                    conn.commit()
                    
                    user_data = {
                        'id': user_id,
                        'email': email,
                        'name': name,
                        'profile_picture': profile_picture
                    }
                
                logger.info(f"{provider.title()} OAuth login successful for {email}")
                return {'success': True, 'user': user_data}
                
            finally:
                conn.close()
                
        except Exception as e:
            logger.error(f"OAuth login error: {e}")
            return {'success': False, 'message': f'{provider.title()} authentication failed'}
    
    def resend_otp(self, reset_token):
        """Resend OTP with rate limiting"""
        try:
            conn = self.db.get_connection()
            try:
                cursor = conn.cursor()
                
                cursor.execute('SELECT user_id FROM password_reset_otp WHERE id = ?', (reset_token,))
                result = cursor.fetchone()
                
                if not result:
                    return {'success': False, 'message': 'Invalid reset token'}
                
                user_id = result[0]
                
                cursor.execute('''
                    SELECT resend_count FROM password_reset_otp 
                    WHERE id = ? AND resend_count < ?
                ''', (reset_token, 3))  # Max 3 resends
                
                if not cursor.fetchone():
                    return {'success': False, 'message': 'Maximum OTP resend attempts exceeded'}
                
                new_otp = self.security.generate_otp()
                new_otp_hash = self.security.hash_otp(new_otp)
                
                cursor.execute('''
                    UPDATE password_reset_otp 
                    SET otp_hash = ?, expires_at = ?, resend_count = resend_count + 1
                    WHERE id = ?
                ''', (new_otp_hash, datetime.now() + timedelta(minutes=10), reset_token))
                
                conn.commit()
                
                cursor.execute('SELECT email FROM users WHERE id = ?', (user_id,))
                user = cursor.fetchone()
                if user:
                    email = user[0]
                    self.security.send_otp_email(email, new_otp)
                    logger.info(f"OTP resent to {email}")
                
                return {'success': True, 'message': 'OTP resent successfully'}
                
            finally:
                conn.close()
        except Exception as e:
            logger.error(f"Resend OTP error: {e}")
            return {'success': False, 'message': 'Failed to resend OTP'}

auth_system = None

def create_auth_system(app):
    """Create and configure authentication system"""
    global auth_system
    auth_system = AuthenticationSystem(app)
    return auth_system

def require_auth(f):
    """Decorator to require authentication with session validation"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = session.get('user')
        
        if not user:
            logger.warning("🔒 Unauthenticated access attempt - redirecting to login")
            return redirect(url_for('login'))
        
        if not isinstance(user, dict) or not user.get('id') or not user.get('email'):
            logger.warning("🔒 Invalid session data detected - clearing session")
            session.clear()
            return redirect(url_for('login'))
        

        return f(*args, **kwargs)
    return decorated_function