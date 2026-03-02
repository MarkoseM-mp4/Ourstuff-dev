const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const PROD_API = 'https://ourstuff-dev-backend.onrender.com/api'; // NOTE: Update this URL after deploying your backend!
const API = IS_LOCAL ? 'http://127.0.0.1:5000/api' : PROD_API;

// ============================================================
//  DARK MODE — apply saved preference immediately
// ============================================================
(function initDarkMode() {
    if (localStorage.getItem('theme') === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
})();

function isDarkMode() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
}

function setDarkMode(on) {
    if (on) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
    }
    // Sync the toggle checkbox if it exists
    const chk = document.getElementById('dm-toggle-chk');
    if (chk) chk.checked = on;
}

// ============================================================
//  LOADING SCREEN
// ============================================================
window.addEventListener('load', function () {
    const loadingScreen = document.getElementById('loading-screen');
    const minDisplayTime = 2000;
    const loadTime = performance.now();
    const remaining = Math.max(0, minDisplayTime - loadTime);

    setTimeout(function () {
        if (loadingScreen) {
            loadingScreen.classList.add('fade-out');
            loadingScreen.addEventListener('transitionend', function () {
                loadingScreen.remove();
            }, { once: true });
        }
    }, remaining);
});

// ============================================================
//  AUTH HELPERS
// ============================================================
function getUser() { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } }
function getToken() { return localStorage.getItem('token'); }
function isLoggedIn() { return !!getToken() && !!getUser(); }
function isVerified() { const u = getUser(); return u && u.isVerified === true; }

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// ============================================================
//  NAV STATE
//  Injects a user avatar with dropdown when logged in,
//  otherwise shows the Sign In button.
// ============================================================
function updateNavState() {
    const btnSignin = document.getElementById('btn-signin');
    const avatarEl = document.getElementById('user-avatar');
    const user = getUser();

    if (!btnSignin) return;

    if (isLoggedIn() && user) {
        // Hide sign-in button
        btnSignin.style.display = 'none';

        // Build avatar element
        if (avatarEl) {
            avatarEl.style.display = 'flex';
            avatarEl.style.cursor = 'pointer';
            avatarEl.title = user.name || 'My Account';

            // Avatar content: photo or initial
            const initial = user.name ? user.name.charAt(0).toUpperCase() : '?';
            const avatarSrc = user.avatar.startsWith('http') ? user.avatar : `${API.replace('/api', '')}${user.avatar}`;

            avatarEl.innerHTML = user.avatar
                ? `<img src="${avatarSrc}" alt="${user.name}" onerror="this.outerHTML='<span style=\\'font-size:15px;font-weight:800;color:#2563EB;\\'>${initial}</span>'"
                       style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
                : `<span style="font-size:15px;font-weight:800;color:#2563EB;">${initial}</span>`;

            // Inject dropdown menu (only once)
            if (!document.getElementById('nav-dropdown')) {
                const dropdown = document.createElement('div');
                dropdown.id = 'nav-dropdown';
                dropdown.innerHTML = `
                    <div class="nav-drop-arrow"></div>
                    <div class="nav-drop-user">
                        <strong id="drop-name">${user.name || 'Account'}</strong>
                        <span id="drop-email">${user.email || ''}</span>
                    </div>
                    <div class="nav-drop-divider"></div>
                    <a class="nav-drop-item" href="profile.html">
                        <span class="material-icons-outlined">person_outline</span> My Profile
                    </a>
                    <a class="nav-drop-item" href="/dashboard/listings">
                        <span class="material-icons-outlined">inventory_2</span> My Listings
                    </a>
                    <a class="nav-drop-item" href="/dashboard/rentals">
                        <span class="material-icons-outlined">shopping_bag</span> My Rentals
                    </a>
                    <div class="nav-drop-divider"></div>
                    <button class="nav-drop-item danger" id="nav-logout-btn">
                        <span class="material-icons-outlined">logout</span> Log Out
                    </button>
                `;
                avatarEl.parentElement.style.position = 'relative';
                avatarEl.parentElement.appendChild(dropdown);

                // Toggle on avatar click
                avatarEl.addEventListener('click', (e) => {
                    e.stopPropagation();
                    dropdown.classList.toggle('open');
                });

                // Close when clicking elsewhere
                document.addEventListener('click', () => dropdown.classList.remove('open'));

                // Logout from dropdown
                document.getElementById('nav-logout-btn').addEventListener('click', (e) => {
                    e.preventDefault();
                    showLogoutModal();
                });


            }
        }

        // Show notification bell only when logged in
        if (!document.getElementById('nav-bell-wrap')) {
            injectNotifBell(avatarEl.parentElement);
        }
    } else {
        // Not logged in
        btnSignin.style.display = 'inline-flex';
        if (avatarEl) avatarEl.style.display = 'none';
        btnSignin.addEventListener('click', () => {
            window.location.href = 'login.html';
        });
    }
}

// ============================================================
//  NOTIFICATION BELL — injected next to the avatar
// ============================================================
function injectNotifBell(parent) {
    const wrap = document.createElement('div');
    wrap.id = 'nav-bell-wrap';
    wrap.className = 'nav-bell-wrap';
    wrap.innerHTML = `
        <button class="nav-bell-btn" id="nav-bell-btn" title="Notifications" aria-label="Notifications">
            <span class="material-icons-outlined">notifications_none</span>
        </button>
        <div id="nav-notif-panel">
            <div class="notif-panel-head">
                <span>Notifications</span>
                <button class="notif-mark-all" id="nav-notif-mark-all">Mark all read</button>
            </div>
            <div class="notif-panel-list" id="nav-notif-list">
                <div class="notif-loading">
                    <div class="notif-spinner"></div> Loading…
                </div>
            </div>
            <div class="notif-panel-footer">
                <a href="dashboard.html#notifications">See all in Dashboard →</a>
            </div>
        </div>
    `;

    // Insert bell BEFORE the avatar element
    const avatarEl = document.getElementById('user-avatar');
    parent.insertBefore(wrap, avatarEl);

    // Toggle panel on bell click
    const bellBtn = document.getElementById('nav-bell-btn');
    const panel = document.getElementById('nav-notif-panel');

    bellBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = panel.classList.toggle('open');
        if (isOpen) loadNotifPanel();
        // Close the avatar dropdown if open
        const dropdown = document.getElementById('nav-dropdown');
        if (dropdown) dropdown.classList.remove('open');
    });

    // Close on outside click
    document.addEventListener('click', () => panel.classList.remove('open'));
    panel.addEventListener('click', (e) => e.stopPropagation());

    // Mark all read button
    document.getElementById('nav-notif-mark-all').addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
            await fetch(`${API}/notifications/read-all`, {
                method: 'PUT', headers: { Authorization: `Bearer ${getToken()}` }
            });
            removeBellBadge();
            loadNotifPanel();
        } catch (_) { }
    });

    // Fetch unread count to decide whether to show badge
    fetchUnreadCount();
}

// ============================================================
//  FETCH UNREAD COUNT (lightweight — just for badge)
// ============================================================
async function fetchUnreadCount() {
    if (!isLoggedIn()) return;
    try {
        const res = await fetch(`${API}/notifications`, {
            headers: { Authorization: `Bearer ${getToken()}` }
        });
        const data = await res.json();
        if (!data.success) return;
        const unread = (data.notifications || []).filter(n => !n.isRead).length;
        if (unread > 0) showBellBadge(unread);
    } catch (_) { }
}

function showBellBadge(count) {
    const btn = document.getElementById('nav-bell-btn');
    if (!btn) return;
    let badge = btn.querySelector('.nav-bell-badge');
    if (!badge) {
        badge = document.createElement('span');
        badge.className = 'nav-bell-badge';
        btn.appendChild(badge);
    }
    badge.textContent = count > 9 ? '9+' : count;
}

function removeBellBadge() {
    const badge = document.querySelector('.nav-bell-badge');
    if (badge) badge.remove();
}

// ============================================================
//  LOAD NOTIFICATION PANEL ITEMS
// ============================================================
async function loadNotifPanel() {
    const list = document.getElementById('nav-notif-list');
    if (!list) return;
    list.innerHTML = '<div class="notif-loading"><div class="notif-spinner"></div> Loading…</div>';

    try {
        const res = await fetch(`${API}/notifications`, {
            headers: { Authorization: `Bearer ${getToken()}` }
        });
        const data = await res.json();
        if (!data.success) throw new Error();

        // Bell panel only shows UNREAD notifications (read ones stay in Dashboard)
        const unreadNotifs = (data.notifications || []).filter(n => !n.isRead).slice(0, 10);

        if (unreadNotifs.length === 0) {
            list.innerHTML = `
                <div class="notif-panel-empty">
                    <span class="material-icons-outlined">notifications_none</span>
                    You're all caught up!
                </div>`;
            removeBellBadge();
            return;
        }

        list.innerHTML = '';
        unreadNotifs.forEach(n => {
            const item = document.createElement('div');
            item.className = 'notif-panel-item unread';
            item.innerHTML = `
                <div class="npi-icon">
                    <span class="material-icons-outlined">${notifPanelIcon(n.type)}</span>
                </div>
                <div class="npi-body">
                    <div class="npi-msg">${n.message}</div>
                    <div class="npi-time">${timeAgoShort(n.createdAt)}</div>
                </div>
                <div class="npi-dot"></div>
            `;

            // Click to mark as read → remove from bell panel
            item.addEventListener('click', async () => {
                try {
                    await fetch(`${API}/notifications/${n._id}/read`, {
                        method: 'PUT', headers: { Authorization: `Bearer ${getToken()}` }
                    });
                    // Remove this item from the bell panel
                    item.remove();
                    // Update badge
                    const badge = document.querySelector('.nav-bell-badge');
                    if (badge) {
                        const cur = parseInt(badge.textContent) || 1;
                        if (cur <= 1) removeBellBadge();
                        else badge.textContent = cur - 1;
                    }
                    // If no more unread items, show "all caught up"
                    if (list.children.length === 0) {
                        list.innerHTML = `
                            <div class="notif-panel-empty">
                                <span class="material-icons-outlined">notifications_none</span>
                                You're all caught up!
                            </div>`;
                    }
                } catch (_) { }
            });

            list.appendChild(item);
        });

        // Update badge with unread count
        showBellBadge(unreadNotifs.length);

    } catch (_) {
        list.innerHTML = '<div class="notif-panel-empty"><span class="material-icons-outlined">error_outline</span>Failed to load</div>';
    }
}

function notifPanelIcon(type) {
    const map = {
        rental_request: 'event_available', rental_accepted: 'check_circle',
        rental_rejected: 'cancel', rental_completed: 'verified',
        review_received: 'star', community_respond: 'forum', item_listed: 'inventory_2',
    };
    return map[type] || 'notifications';
}

function timeAgoShort(d) {
    if (!d) return '';
    const s = Math.floor((Date.now() - new Date(d)) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
}

// ============================================================
//  LOGOUT MODAL (for navbar dropdown)
// ============================================================
function showLogoutModal() {
    // Create if doesn't exist
    if (!document.getElementById('nav-logout-modal')) {
        const modal = document.createElement('div');
        modal.id = 'nav-logout-modal';
        modal.innerHTML = `
            <div class="nlm-box">
                <div class="nlm-icon">
                    <span class="material-icons-outlined">logout</span>
                </div>
                <h3>Log out?</h3>
                <p>You'll need to sign in again to access your account.</p>
                <div class="nlm-actions">
                    <button id="nlm-cancel">Cancel</button>
                    <button id="nlm-confirm">Log Out</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('nlm-cancel').addEventListener('click', () =>
            modal.classList.remove('show'));
        document.getElementById('nav-logout-modal').addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('show');
        });
        document.getElementById('nlm-confirm').addEventListener('click', logout);
    }
    document.getElementById('nav-logout-modal').classList.add('show');
}

// ============================================================
//  VERIFICATION GATE
// ============================================================
function requireVerifiedUser(redirectAfter) {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return false;
    }
    if (!isVerified()) {
        const dest = encodeURIComponent(redirectAfter || window.location.href);
        window.location.href = `verify-identity.html?redirect=${dest}`;
        return false;
    }
    return true;
}

// ============================================================
//  PAGE WIRING
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    // Update navbar immediately — deferred scripts run after DOM is parsed
    // so DOMContentLoaded fires right after, making this the earliest safe call.
    updateNavState();

    const btnJoin = document.getElementById('btn-join');
    if (btnJoin) {
        btnJoin.addEventListener('click', () => requireVerifiedUser('community.html'));
    }
});
