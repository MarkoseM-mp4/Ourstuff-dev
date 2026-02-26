const API = 'http://localhost:5000/api';

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
            avatarEl.innerHTML = user.avatar
                ? `<img src="${API.replace('/api', '')}${user.avatar}" alt="${user.name}"
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
                    <a class="nav-drop-item" href="profile.html#listings">
                        <span class="material-icons-outlined">inventory_2</span> My Listings
                    </a>
                    <a class="nav-drop-item" href="profile.html#rentals">
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
