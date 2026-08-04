
let firebaseConfig = null;
let auth = null;
let googleProvider = null;
let microsoftProvider = null;
let isFirebaseReady = false;

async function initializeFirebaseAuth() {
    try {
        if (typeof firebase === 'undefined') {
            console.warn('⚠️ Firebase SDK not loaded');
            return false;
        }
        
        const response = await fetch('/api/auth/firebase-config');
        if (!response.ok) {
            console.warn('⚠️ Firebase config not available from backend');
            return false;
        }
        
        firebaseConfig = await response.json();
        
        if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
            console.warn('⚠️ Firebase not configured (missing apiKey or projectId)');
            return false;
        }
        
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        
        auth = firebase.auth();
        
        googleProvider = new firebase.auth.GoogleAuthProvider();
        googleProvider.addScope('email');
        googleProvider.addScope('profile');
        googleProvider.setCustomParameters({
            prompt: 'select_account'
        });
        
        microsoftProvider = new firebase.auth.OAuthProvider('microsoft.com');
        microsoftProvider.addScope('email');
        microsoftProvider.addScope('profile');
        microsoftProvider.setCustomParameters({
            prompt: 'select_account',
            tenant: 'common'
        });
        
        isFirebaseReady = true;
        console.log('✅ Firebase Authentication initialized successfully');
        return true;
    } catch (error) {
        console.warn('⚠️ Firebase initialization failed:', error.message);
        isFirebaseReady = false;
        return false;
    }
}

async function signInWithGoogle() {
    try {
        if (!isFirebaseReady || !auth || !googleProvider) {
            throw new Error('Firebase not initialized. Please configure Firebase first.');
        }
        
        showAuthLoading('google', 'Opening Google Sign-In...');
        
        const result = await auth.signInWithPopup(googleProvider);
        const user = result.user;
        
        const idToken = await user.getIdToken();
        
        const response = await fetch('/api/auth/google/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                idToken: idToken,
                email: user.email,
                name: user.displayName,
                photoURL: user.photoURL,
                uid: user.uid
            })
        });
        
        hideAuthLoading();
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Authentication failed');
        }
        
        const data = await response.json();
        
        // Success! Redirect to home
        showSuccessMessage('Google authentication successful!');
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
        
    } catch (error) {
        hideAuthLoading();
        
        if (error.message && error.message.includes('Firebase not initialized')) {
            throw error;
        }
        
        handleAuthError('google', error);
    }
}

async function signInWithMicrosoft() {
    try {
        if (!isFirebaseReady || !auth || !microsoftProvider) {
            throw new Error('Firebase not initialized. Please configure Firebase first.');
        }
        
        showAuthLoading('microsoft', 'Opening Microsoft Sign-In...');
        
        const result = await auth.signInWithPopup(microsoftProvider);
        const user = result.user;
        
        const idToken = await user.getIdToken();
        
        const response = await fetch('/api/auth/microsoft/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                idToken: idToken,
                email: user.email,
                name: user.displayName,
                photoURL: user.photoURL,
                uid: user.uid
            })
        });
        
        hideAuthLoading();
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Authentication failed');
        }
        
        const data = await response.json();
        
        // Success! Redirect to home
        showSuccessMessage('Microsoft authentication successful!');
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
        
    } catch (error) {
        hideAuthLoading();
        
        if (error.message && error.message.includes('Firebase not initialized')) {
            throw error;
        }
        
        handleAuthError('microsoft', error);
    }
}

function showAuthLoading(provider, message) {
    const btn = document.getElementById(`${provider}Login`);
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${message}`;
    }
}

function hideAuthLoading() {
    const googleBtn = document.getElementById('googleLogin');
    const microsoftBtn = document.getElementById('microsoftLogin');
    
    if (googleBtn) {
        googleBtn.disabled = false;
        googleBtn.innerHTML = '<i class="fab fa-google"></i> Google';
    }
    
    if (microsoftBtn) {
        microsoftBtn.disabled = false;
        microsoftBtn.innerHTML = '<i class="fab fa-microsoft"></i> Microsoft';
    }
}

function handleAuthError(provider, error) {
    console.error(`${provider} auth error:`, error);
    
    let message = 'Authentication failed. Please try again.';
    
    if (error.code === 'auth/popup-closed-by-user') {
        message = 'Sign-in cancelled. Please try again.';
    } else if (error.code === 'auth/popup-blocked') {
        message = 'Popup blocked by browser. Please allow popups and try again.';
    } else if (error.code === 'auth/cancelled-popup-request') {
        message = 'Sign-in cancelled.';
    } else if (error.code === 'auth/network-request-failed') {
        message = 'Network error. Please check your internet connection.';
    } else if (error.message) {
        message = error.message;
    }
    
    showErrorMessage(message);
}

function showSuccessMessage(message) {
    const notification = document.createElement('div');
    notification.className = 'auth-notification success';
    notification.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #22c55e, #16a34a);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 8px 25px rgba(34, 197, 94, 0.3);
        z-index: 10000;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideInRight 0.5s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

function showErrorMessage(message) {
    const notification = document.createElement('div');
    notification.className = 'auth-notification error';
    notification.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" style="background: none; border: none; color: white; cursor: pointer; margin-left: auto;">
            <i class="fas fa-times"></i>
        </button>
    `;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #ef4444, #dc2626);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 8px 25px rgba(239, 68, 68, 0.3);
        z-index: 10000;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideInRight 0.5s ease;
        max-width: 400px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 7000);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

window.signInWithGoogle = signInWithGoogle;
window.signInWithMicrosoft = signInWithMicrosoft;
window.initializeFirebaseAuth = initializeFirebaseAuth;
