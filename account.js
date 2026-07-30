/**
 * Account center — tabs, profile sync, themes, notifications, cart summary
 */
(function () {
    const CART_KEY = 'hearth_cart';

    const defaultPrefs = () => ({
        theme: 'default',
        colorMode: 'dark',
        notifyMission: true,
        notifyOrders: true,
        marketing: false,
        compactNav: false,
        analyticsOk: true
    });

    function mergePrefs(user) {
        return { ...defaultPrefs(), ...(user && user.preferences ? user.preferences : {}) };
    }

    function showToast(message, type = 'info') {
        let host = document.getElementById('toast-host');
        if (!host) {
            host = document.createElement('div');
            host.id = 'toast-host';
            host.className = 'toast-host';
            document.body.appendChild(host);
        }
        const el = document.createElement('div');
        el.className = `toast ${type === 'success' ? 'ok' : type === 'error' ? 'err' : 'info'}`;
        el.textContent = message;
        host.appendChild(el);
        setTimeout(() => {
            el.remove();
            if (!host.children.length) host.remove();
        }, 4200);
    }

    function getInitials(name, email) {
        const n = (name || '').trim();
        if (n.length >= 2) return n.slice(0, 2).toUpperCase();
        const e = (email || '').trim();
        if (e.length >= 2) return e.slice(0, 2).toUpperCase();
        return 'HH';
    }

    function renderSidebarAvatar(user) {
        const wrap = document.getElementById('acct-avatar-slot');
        if (!wrap) return;
        wrap.innerHTML = '';
        if (user.avatarUrl) {
            const img = document.createElement('img');
            img.className = 'acct-avatar';
            img.src = user.avatarUrl;
            img.alt = '';
            img.referrerPolicy = 'no-referrer';
            img.onerror = () => {
                wrap.innerHTML = '';
                const fb = document.createElement('div');
                fb.className = 'acct-avatar-fallback';
                fb.textContent = getInitials(user.name, user.email);
                wrap.appendChild(fb);
            };
            wrap.appendChild(img);
        } else {
            const fb = document.createElement('div');
            fb.className = 'acct-avatar-fallback';
            fb.textContent = getInitials(user.name, user.email);
            wrap.appendChild(fb);
        }
    }

    function loadCartSummary() {
        const countEl = document.getElementById('cart-item-count');
        const totalEl = document.getElementById('cart-total-display');
        if (!countEl || !totalEl) return;
        let cart = [];
        try {
            cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
        } catch {
            cart = [];
        }
        if (!Array.isArray(cart)) cart = [];
        const n = cart.length;
        const total = cart.reduce((s, item) => s + (Number(item.price) || 0), 0);
        countEl.textContent = `${n} item${n === 1 ? '' : 's'}`;
        totalEl.textContent = `KES ${total.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
        const dash = document.getElementById('dash-cart-count');
        if (dash) dash.textContent = String(n);
    }

    function switchTab(tabId, evt) {
        if (evt) evt.preventDefault();
        document.querySelectorAll('.acct-section').forEach((s) => s.classList.remove('active'));
        const target = document.getElementById(tabId);
        if (target) target.classList.add('active');

        document.querySelectorAll('.acct-nav-item[data-target]').forEach((b) => {
            b.classList.toggle('active', b.getAttribute('data-target') === tabId);
        });

        try {
            const short = tabId.replace('-section', '');
            history.replaceState(null, '', `#${short}`);
        } catch (_) { /* ignore */ }

        if (window.feather) feather.replace();
    }

    function initTabsFromHash() {
        const h = (window.location.hash || '').replace(/^#/, '');
        const map = {
            overview: 'overview-section',
            profile: 'profile-section',
            appearance: 'appearance-section',
            notifications: 'notifications-section',
            privacy: 'privacy-section',
            security: 'security-section',
            orders: 'orders-section'
        };
        const id = map[h] || 'overview-section';
        switchTab(id);
    }

    function wireNav() {
        document.querySelectorAll('.acct-nav [data-target]').forEach((el) => {
            el.addEventListener('click', (e) => switchTab(el.getAttribute('data-target'), e));
        });
    }

    function fillForms(user) {
        const prefs = mergePrefs(user);
        const emailEl = document.getElementById('profile-email');
        const nameEl = document.getElementById('profile-name');
        const phoneEl = document.getElementById('profile-phone');
        const bioEl = document.getElementById('profile-bio');
        if (emailEl) emailEl.value = user.email || '';
        if (nameEl) nameEl.value = user.name || '';
        if (phoneEl) phoneEl.value = user.phone || '';
        if (bioEl) bioEl.value = user.bio || '';

        document.getElementById('pref-notify-mission').checked = !!prefs.notifyMission;
        document.getElementById('pref-notify-orders').checked = !!prefs.notifyOrders;
        document.getElementById('pref-marketing').checked = !!prefs.marketing;
        document.getElementById('pref-compact').checked = !!prefs.compactNav;
        document.getElementById('pref-analytics').checked = prefs.analyticsOk !== false;

        const theme = prefs.theme || 'default';
        document.querySelectorAll('.theme-card[data-theme]').forEach((c) => {
            c.classList.toggle('selected', c.getAttribute('data-theme') === theme);
        });
        const colorMode = prefs.colorMode || 'dark';
        document.querySelectorAll('.mode-card').forEach((c) => {
            c.classList.toggle('selected', c.getAttribute('data-mode') === colorMode);
        });
        if (window.Auth && Auth.applyTheme) Auth.applyTheme(theme);
        if (window.Auth && Auth.applyMode) Auth.applyMode(colorMode);
    }

    async function persistPrefs(patch) {
        const user = Auth.getCurrentUser();
        const prefs = { ...mergePrefs(user), ...patch };
        const res = await Auth.updateProfile({ preferences: prefs });
        if (res.success) {
            fillForms(res.user);
            return true;
        }
        showToast(res.message || 'Could not save settings', 'error');
        return false;
    }

    function wireThemeCards() {
        document.querySelectorAll('.theme-card[data-theme]').forEach((card) => {
            card.addEventListener('click', async () => {
                const theme = card.getAttribute('data-theme') || 'default';
                document.querySelectorAll('.theme-card[data-theme]').forEach((c) => c.classList.remove('selected'));
                card.classList.add('selected');
                Auth.applyTheme(theme);
                await persistPrefs({ theme });
                showToast('Theme updated', 'success');
            });
        });
    }

    function wireModeCards() {
        document.querySelectorAll('.mode-card').forEach((card) => {
            card.addEventListener('click', async () => {
                const mode = card.getAttribute('data-mode') || 'dark';
                document.querySelectorAll('.mode-card').forEach((c) => c.classList.remove('selected'));
                card.classList.add('selected');
                Auth.applyMode(mode);
                await persistPrefs({ colorMode: mode });
                showToast('Color mode updated', 'success');
            });
        });
    }

    function wireNotificationToggles() {
        const ids = [
            ['pref-notify-mission', 'notifyMission'],
            ['pref-notify-orders', 'notifyOrders'],
            ['pref-marketing', 'marketing'],
            ['pref-compact', 'compactNav'],
            ['pref-analytics', 'analyticsOk']
        ];
        ids.forEach(([elId, key]) => {
            const el = document.getElementById(elId);
            if (!el) return;
            el.addEventListener('change', async () => {
                await persistPrefs({ [key]: el.checked });
                showToast('Preference saved', 'success');
            });
        });
    }

    function wireAvatarUpload() {
        const input = document.getElementById('avatar-input');
        const zone = document.getElementById('avatar-dropzone');
        if (!input || !zone) return;

        zone.addEventListener('click', () => input.click());
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('drag');
        });
        zone.addEventListener('dragleave', () => zone.classList.remove('drag'));
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('drag');
            const f = e.dataTransfer.files && e.dataTransfer.files[0];
            if (f) uploadFile(f);
        });
        input.addEventListener('change', () => {
            const f = input.files && input.files[0];
            if (f) uploadFile(f);
            input.value = '';
        });

        async function uploadFile(file) {
            if (!file.type.startsWith('image/')) {
                showToast('Please choose an image file', 'error');
                return;
            }
            if (file.size > 2 * 1024 * 1024) {
                showToast('Image must be 2 MB or smaller', 'error');
                return;
            }
            showToast('Uploading…', 'info');
            const res = await Auth.uploadAvatar(file);
            if (res.success) {
                renderSidebarAvatar(res.user);
                showToast('Profile photo updated', 'success');
            } else {
                showToast(res.message || 'Upload failed', 'error');
            }
        }
    }

    async function onProfileSubmit(e) {
        e.preventDefault();
        const name = document.getElementById('profile-name').value.trim();
        const phone = document.getElementById('profile-phone').value.trim();
        const bio = document.getElementById('profile-bio').value.trim();
        const res = await Auth.updateProfile({ name, phone, bio });
        if (res.success) {
            document.getElementById('sidebar-name').textContent = res.user.name || res.user.email;
            renderSidebarAvatar(res.user);
            showToast('Profile saved', 'success');
        } else {
            showToast(res.message || 'Could not save profile', 'error');
        }
    }

    async function onPasswordSubmit(e) {
        e.preventDefault();
        const cur = document.getElementById('current-password').value;
        const nw = document.getElementById('new-password').value;
        const cf = document.getElementById('confirm-new-password').value;
        if (nw !== cf) {
            showToast('New passwords do not match', 'error');
            return;
        }
        const res = await Auth.changePassword(cur, nw);
        if (res.success) {
            document.getElementById('security-form').reset();
            showToast('Password updated', 'success');
        } else {
            showToast(res.message || 'Could not update password', 'error');
        }
    }

    async function init() {
        wireNav();
        wireThemeCards();        wireModeCards();        wireNotificationToggles();
        wireAvatarUpload();

        const profileForm = document.getElementById('profile-form');
        if (profileForm) profileForm.addEventListener('submit', onProfileSubmit);
        const secForm = document.getElementById('security-form');
        if (secForm) secForm.addEventListener('submit', onPasswordSubmit);

        const remote = await Auth.fetchMe();
        const user = Auth.getCurrentUser();
        if (!user) return;

        if (!remote.success) {
            showToast(remote.message || 'Using offline profile data', 'info');
        }

        document.getElementById('sidebar-name').textContent = user.name || user.email;
        document.getElementById('sidebar-email').textContent = user.email;
        renderSidebarAvatar(user);
        fillForms(user);
        loadCartSummary();

        initTabsFromHash();
        window.addEventListener('hashchange', initTabsFromHash);

        if (window.feather) feather.replace();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.switchTab = switchTab;
    window.showAcctToast = showToast;
})();
