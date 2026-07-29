
ï»¿/**
 * Hearth and Heal - Authentication Logic
 * Robust system with Email Verification, Password hashing, and 2FA OTP.
 */

const Auth = {
    // Relative path works both locally and in production, fallback to 3000 for file://
    API_BASE: window.location.protocol === 'file:' ? 'http://localhost:3000' : window.location.origin,
    CURRENT_USER_KEY: 'hearth_current_user',
    JWT_KEY: 'hearth_jwt_token',

    // Initialize session
    checkSession: () => {
        const currentUser = Auth.getCurrentUser();
        const path = window.location.pathname;
        // Improve page extraction: handle / correctly and query params
        let pageName = path.split('/').pop().split('?')[0].toLowerCase();

        // Explicitly handle root path or empty extraction
        if (path === '/' || pageName === '') {
            pageName = 'index.html';
        }

        const authPages = ['login.html', 'signup.html', 'forgot-password.html'];
        // Pages that are accessible without login (Homepage, Mission, Contact, Services, Donate)
        const publicPages = ['index.html', 'mission.html', 'contact.html', 'services.html', 'donate.html', 'verify-email.html'];

        console.log(`[Auth] Checking access for: ${pageName}. Logged in: ${!!currentUser}`);

        if (currentUser) {
            // Logged in users: redirect away from auth pages to home
            if (authPages.includes(pageName)) {
                window.location.href = 'index.html';
            }
            Auth.updateUI(true);
        } else {
            // Not logged in
            // Allow access ONLY if it's an auth page OR a public page
            if (authPages.includes(pageName) || publicPages.includes(pageName)) {
                Auth.updateUI(false);
            } else {
                console.warn(`[Auth] Access denied to ${pageName}. Redirecting to login.`);
                // Restricted page (Shop, Cart, Account, etc.) -> Redirect to login
                window.location.href = 'login.html';
            }
        }
    },

    getCurrentUser: () => {
        try {
            const raw = localStorage.getItem(Auth.CURRENT_USER_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    },
    setCurrentUser: (user) => localStorage.setItem(Auth.CURRENT_USER_KEY, JSON.stringify(user)),
    setToken: (token) => localStorage.setItem(Auth.JWT_KEY, token),
    logout: () => {
        localStorage.removeItem(Auth.CURRENT_USER_KEY);
        localStorage.removeItem(Auth.JWT_KEY);
        window.location.href = 'login.html';
    },

    updateUI: (isLoggedIn) => {
        const authLink = document.getElementById('auth-link');
        const loginBtn = document.getElementById('login-btn');
        const target = authLink || loginBtn;

        if (target) {
            if (isLoggedIn) {
                target.textContent = 'Account';
                target.href = 'account.html';
                target.onclick = null;
            } else {
                target.textContent = 'Login';
                target.href = 'login.html';
                target.onclick = null;
            }
        }
    },

    /* -------------------- API WRAPPERS -------------------- */

    // SIGNUP STEP 1
    requestSignupVerification: async (email) => {
        try {
            const normalized = typeof email === 'string' ? email.trim().toLowerCase() : '';
            if (!normalized) return { success: false, message: 'Email is required' };

            const response = await fetch(`${Auth.API_BASE}/request-verification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: normalized })
            });
            const text = await response.text();
            let data = {};
            try {
                data = text ? JSON.parse(text) : {};
            } catch {
                return { success: false, message: 'Invalid server response' };
            }
            if (response.ok) {
                Auth._signupRef = data.ref;
                Auth._signupEmail = email;
                return { success: true };
            }
            return { success: false, message: data.error };
        } catch (err) {
            return { success: false, message: 'Server unreachable' };
        }
    },

    // SIGNUP STEP 2 (Code)
    completeSignup: async (code, password) => {
        try {
            const response = await fetch(`${Auth.API_BASE}/verify-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ref: Auth._signupRef,
                    code: String(code ?? '').replace(/\s/g, ''),
                    password
                })
            });
            const text = await response.text();
            let data = {};
            try {
                data = text ? JSON.parse(text) : {};
            } catch {
                return { success: false, message: 'Invalid server response' };
            }
            if (response.ok) return { success: true };
            return { success: false, message: data.error };
        } catch (err) {
            return { success: false, message: 'Server unreachable' };
        }
    },

    // SIGNUP STEP 2 (Link)
    verifyEmailLink: async (ref, token, password) => {
        try {
            const response = await fetch(`${Auth.API_BASE}/verify-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ref, code: token, password })
            });
            const data = await response.json();
            if (response.ok) return { success: true };
            return { success: false, message: data.error };
        } catch (err) {
            return { success: false, message: 'Server unreachable' };
        }
    },

    // LOGIN STEP 1
    login: async (email, password) => {
        try {
            const response = await fetch(`${Auth.API_BASE}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: typeof email === 'string' ? email.trim().toLowerCase() : '',
                    password: typeof password === 'string' ? password : ''
                })
            });
            const text = await response.text();
            let data = {};
            try {
                data = text ? JSON.parse(text) : {};
            } catch {
                return { success: false, message: 'Invalid server response' };
            }
            if (response.ok) {
                if (data.token && data.user) {
                    Auth.setToken(data.token);
                    Auth.setCurrentUser(data.user);
                    return { success: true, directLogin: true };
                }

                Auth._loginRef = data.ref;
                Auth._loginEmail = email;
                return { success: true, directLogin: false };
            }
            return { success: false, message: data.error || 'Login failed' };
        } catch (err) {
            return { success: false, message: 'Server unreachable' };
        }
    },

    // LOGIN STEP 2 (OTP)
    verifyOTP: async (code) => {
        try {
            const response = await fetch(`${Auth.API_BASE}/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ref: Auth._loginRef, otp: code })
            });
            const data = await response.json();
            if (response.ok && data.success) {
                Auth.setToken(data.token);
                Auth.setCurrentUser(data.user);
                return { success: true };
            }
            return { success: false, message: data.error };
        } catch (err) {
            return { success: false, message: 'Server unreachable' };
        }
    },

    // PASSWORD RESET STEP 1
    requestReset: async (email) => {
        try {
            const response = await fetch(`${Auth.API_BASE}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await response.json();
            if (response.ok) {
                // Auth._resetRef = data.ref; // No longer needed in new flow
                return { success: true };
            }
            return { success: false, message: data.error };
        } catch (err) {
            return { success: false, message: 'Server unreachable' };
        }
    },

    // PASSWORD RESET STEP 2
    completeReset: async (token, newPassword) => {
        try {
            const response = await fetch(`${Auth.API_BASE}/api/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password: newPassword })
            });
            const text = await response.text();
            if (response.ok) return { success: true };

            try { return { success: false, message: JSON.parse(text).error }; }
            catch (e) { return { success: false, message: text }; }
        } catch (err) {
            return { success: false, message: 'Server unreachable' };
        }
    },

    // OTP REQUEST (Direct)
    requestOTP: async (identifier) => {
        try {
            const email = typeof identifier === 'string' ? identifier.trim().toLowerCase() : '';
            if (!email) return { success: false, message: 'Email is required' };

            const response = await fetch(`${Auth.API_BASE}/login/request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const text = await response.text();
            let data = {};
            try {
                data = text ? JSON.parse(text) : {};
            } catch {
                return { success: false, message: 'Invalid server response' };
            }
            if (response.ok) {
                Auth._loginRef = data.ref;
                // For development, you can see the code in the response
                if (data.code) console.log("Development OTP Code:", data.code);
                return { success: true };
            }
            return { success: false, message: data.error };
        } catch (err) {
            return { success: false, message: 'Server unreachable' };
        }
    },

    getToken: () => localStorage.getItem(Auth.JWT_KEY),

    authHeaders: (json = true) => {
        const headers = {};
        if (json) headers['Content-Type'] = 'application/json';
        const t = Auth.getToken();
        if (t) headers['Authorization'] = 'Bearer ' + t;
        return headers;
    },

    mergeCurrentUser: (updates) => {
        const cur = Auth.getCurrentUser() || {};
        Auth.setCurrentUser({ ...cur, ...updates });
    },

    fetchMe: async () => {
        try {
            const response = await fetch(`${Auth.API_BASE}/api/me`, { headers: Auth.authHeaders(true) });
            const text = await response.text();
            let data = {};
            try {
                data = text ? JSON.parse(text) : {};
            } catch {
                return { success: false, message: 'Invalid server response' };
            }
            if (response.ok && data.user) {
                Auth.mergeCurrentUser(data.user);
                return { success: true, user: data.user };
            }
            return { success: false, message: data.error || 'Session expired' };
        } catch {
            return { success: false, message: 'Server unreachable' };
        }
    },

    updateProfile: async (payload) => {
        try {
            const response = await fetch(`${Auth.API_BASE}/api/me/profile`, {
                method: 'PATCH',
                headers: Auth.authHeaders(true),
                body: JSON.stringify(payload)
            });
            const text = await response.text();
            let data = {};
            try {
                data = text ? JSON.parse(text) : {};
            } catch {
                return { success: false, message: 'Invalid server response' };
            }
            if (response.ok && data.user) {
                Auth.mergeCurrentUser(data.user);
                return { success: true, user: data.user };
            }
            return { success: false, message: data.error || 'Update failed' };
        } catch {
            return { success: false, message: 'Server unreachable' };
        }
    },

    changePassword: async (currentPassword, newPassword) => {
        try {
            const response = await fetch(`${Auth.API_BASE}/api/me/password`, {
                method: 'POST',
                headers: Auth.authHeaders(true),
                body: JSON.stringify({ currentPassword, newPassword })
            });
            const text = await response.text();
            let data = {};
            try {
                data = text ? JSON.parse(text) : {};
            } catch {
                return { success: false, message: 'Invalid server response' };
            }
            if (response.ok) return { success: true };
            return { success: false, message: data.error || 'Could not update password' };
        } catch {
            return { success: false, message: 'Server unreachable' };
        }
    },

    uploadAvatar: async (file) => {
        try {
            const t = Auth.getToken();
            if (!t) return { success: false, message: 'Not signed in' };
            const fd = new FormData();
            fd.append('avatar', file);
            const response = await fetch(`${Auth.API_BASE}/api/me/avatar`, {
                method: 'POST',
                headers: { Authorization: 'Bearer ' + t },
                body: fd
            });
            const text = await response.text();
            let data = {};
            try {
                data = text ? JSON.parse(text) : {};
            } catch {
                return { success: false, message: 'Invalid server response' };
            }
            if (response.ok && data.user) {
                Auth.mergeCurrentUser(data.user);
                return { success: true, user: data.user };
            }
            return { success: false, message: data.error || 'Upload failed' };
        } catch {
            return { success: false, message: 'Server unreachable' };
        }
    },

    applyTheme: (themeId) => {
        const id = themeId === 'default' || !themeId ? '' : String(themeId);
        const allowed = ['', 'emerald', 'warm', 'midnight'];
        if (id && !allowed.includes(id)) return;
        if (!id) document.documentElement.removeAttribute('data-theme');
        else document.documentElement.setAttribute('data-theme', id);
        try {
            localStorage.setItem('hearth_theme', id || 'default');
        } catch (_) { /* ignore */ }
    },

    applyMode: (modeId) => {
        const id = modeId === 'light' ? 'light' : 'dark';
        if (id === 'dark') {
            document.documentElement.removeAttribute('data-mode');
        } else {
            document.documentElement.setAttribute('data-mode', 'light');
        }
        try {
            localStorage.setItem('hearth_color_mode', id);
        } catch (_) { /* ignore */ }
    }
};

(function applyStoredThemeFromDisk() {
    try {
        const t = localStorage.getItem('hearth_theme');
        if (t && t !== 'default') document.documentElement.setAttribute('data-theme', t);
    } catch (_) { /* ignore */ }
    try {
        const m = localStorage.getItem('hearth_color_mode');
        if (m === 'light') document.documentElement.setAttribute('data-mode', 'light');
    } catch (_) { /* ignore */ }
})();

Auth.checkSession();

