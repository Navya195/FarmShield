
(function() {
    'use strict';
    
    const protectedRoutes = [
        '/',
        '/dashboard',
        '/detect',
        '/voice-diagnosis',
        '/one-tap-scan',
        '/community',
        '/experts',
        '/offline-mode',
        '/languages',
        '/disease-severity',
        '/daily-tasks',
        '/faq',
        '/guide',
        '/support',
        '/settings'
    ];
    
    const publicRoutes = [
        '/login',
        '/signup',
        '/auth/forgot-password'
    ];
    
    function isProtectedRoute() {
        const currentPath = window.location.pathname;
        
        if (protectedRoutes.includes(currentPath)) {
            return true;
        }
        
        return protectedRoutes.some(route => currentPath.startsWith(route + '/'));
    }
    
    function isPublicRoute() {
        const currentPath = window.location.pathname;
        return publicRoutes.some(route => currentPath.startsWith(route));
    }
    
    async function checkAuthentication() {
        try {
            const response = await fetch('/api/auth/session', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Cache-Control': 'no-cache'
                }
            });
            
            if (!response.ok) {
                return false;
            }
            
            const data = await response.json();
            return data.authenticated === true;
            
        } catch (error) {
            console.error('Authentication check failed:', error);
            return false;
        }
    }
    
    function redirectToLogin(reason = 'unauthenticated') {
        const currentPath = window.location.pathname;
        const returnUrl = encodeURIComponent(currentPath + window.location.search);
        
        console.log(`🔒 Access denied: ${reason}. Redirecting to login...`);
        
        document.body.innerHTML = `
            <div style="
                position: fixed;
                inset: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                color: white;
                font-family: 'Poppins', sans-serif;
                z-index: 99999;
            ">
                <div style="text-align: center;">
                    <i class="fas fa-lock" style="font-size: 3rem; color: #4ade80; margin-bottom: 1rem;"></i>
                    <h2 style="font-size: 1.5rem; margin-bottom: 0.5rem;">Authentication Required</h2>
                    <p style="color: #94a3b8; margin-bottom: 1.5rem;">Redirecting to login...</p>
                    <div style="
                        width: 200px;
                        height: 4px;
                        background: rgba(255,255,255,0.1);
                        border-radius: 2px;
                        overflow: hidden;
                        margin: 0 auto;
                    ">
                        <div style="
                            width: 50%;
                            height: 100%;
                            background: #4ade80;
                            animation: loading 1s ease-in-out infinite;
                        "></div>
                    </div>
                </div>
            </div>
            <style>
                @keyframes loading {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(300%); }
                }
            </style>
        `;
        
        setTimeout(() => {
            window.location.href = `/login?return=${returnUrl}&reason=${reason}`;
        }, 800);
    }
    
    async function protectRoute() {
        if (isPublicRoute()) {
            console.log('✅ Public route - no authentication required');
            return;
        }
        
        if (!isProtectedRoute()) {
            console.log('ℹ️ Unprotected route');
            return;
        }
        
        console.log('🔒 Protected route detected - verifying authentication...');
        
        const isAuthenticated = await checkAuthentication();
        
        if (!isAuthenticated) {
            redirectToLogin('session_expired');
        } else {
            console.log('✅ Authentication verified - access granted');
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', protectRoute);
    } else {
        protectRoute();
    }
    
    setInterval(async () => {
        if (isProtectedRoute() && !isPublicRoute()) {
            const isAuthenticated = await checkAuthentication();
            if (!isAuthenticated) {
                redirectToLogin('session_timeout');
            }
        }
    }, 5 * 60 * 1000); // 5 minutes
    
    window.addEventListener('pageshow', function(event) {
        if (event.persisted) {
            protectRoute();
        }
    });
    
    window.addEventListener('popstate', protectRoute);
    
    console.log('🛡️ Route protection initialized');
    
})();
