/* ============================================================
   community.js
   Full API integration for the Community Feed page.
   Requires: main.js (provides API, getToken, isLoggedIn, isVerified, requireVerifiedUser)
   ============================================================ */

const API_URL = (typeof API !== 'undefined') ? API : 'http://localhost:5000/api';

// ---- State ----
let currentPage = 1;
let totalPages = 1;
let activeFilters = { category: '', location: '' };
let respondingToId = null;   // ID of the community request being responded to

// ============================================================
//  UTILITY: Show Toast
// ============================================================
function showToast(msg, type = 'default') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.className = `toast ${type} show`;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('show'), 3500);
}

// ============================================================
//  UTILITY: Format date to "15 Mar 2026"
// ============================================================
function fmtDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
        day: 'numeric', month: 'short', year: 'numeric'
    });
}

// ============================================================
//  UTILITY: Days between two dates
// ============================================================
function daysBetween(from, to) {
    const ms = new Date(to) - new Date(from);
    const d = Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
    return d === 1 ? '1 day' : `${d} days`;
}

// ============================================================
//  UTILITY: Avatar HTML (initial or image)
// ============================================================
function avatarHTML(user) {
    if (!user) return `<div class="req-avatar">?</div>`;
    const initial = user.name ? user.name.charAt(0).toUpperCase() : '?';
    if (user.avatar) {
        const src = user.avatar.startsWith('http')
            ? user.avatar
            : `${API_URL.replace('/api', '')}${user.avatar}`;
        return `<div class="req-avatar"><img src="${src}" alt="${user.name}" onerror="this.parentElement.textContent='${initial}'"></div>`;
    }
    return `<div class="req-avatar">${initial}</div>`;
}

// ============================================================
//  RENDER: One request card
// ============================================================
function renderCard(req) {
    const statusMap = {
        open: '<span class="status-badge status-open">Open</span>',
        responded: '<span class="status-badge status-responded">Responded</span>',
        closed: '<span class="status-badge status-closed">Closed</span>',
    };
    const statusBadge = statusMap[req.status] || statusMap.open;
    const urgentBadge = req.isUrgent
        ? `<span class="urgent-badge"><span class="material-icons-outlined">bolt</span>Urgent</span>`
        : '';

    const user = req.requester;
    const verifiedIcon = (user && user.isVerified)
        ? `<span class="material-icons-outlined verified-tick" title="Verified">verified</span>`
        : '';

    const duration = (req.fromDate && req.toDate) ? daysBetween(req.fromDate, req.toDate) : '';

    const respondBtn = req.status !== 'closed'
        ? `<button class="btn-respond" data-id="${req._id}" data-name="${req.itemName}">
               <span class="material-icons-outlined">reply</span> Respond
           </button>`
        : '';

    return `
        <div class="req-card ${req.isUrgent ? 'is-urgent' : ''}">
            <div class="req-card-top">
                <h3 class="req-title">${req.itemName}</h3>
                <div style="display:flex;gap:6px;flex-shrink:0;flex-wrap:wrap;justify-content:flex-end;">
                    ${urgentBadge}
                    ${statusBadge}
                </div>
            </div>

            ${req.description
            ? `<p class="req-description">${req.description}</p>`
            : ''}

            <span class="req-category-tag">${req.category}</span>

            <div class="req-meta">
                <span class="req-meta-item">
                    <span class="material-icons-outlined">attach_money</span>
                    $${req.budget}/day
                </span>
                <span class="req-meta-item">
                    <span class="material-icons-outlined">location_on</span>
                    ${req.location}
                </span>
                ${duration
            ? `<span class="req-meta-item">
                           <span class="material-icons-outlined">event</span>
                           ${fmtDate(req.fromDate)} → ${fmtDate(req.toDate)}
                       </span>`
            : ''}
                ${req.responses && req.responses.length > 0
            ? `<span class="req-meta-item">
                           <span class="material-icons-outlined">forum</span>
                           ${req.responses.length} response${req.responses.length > 1 ? 's' : ''}
                       </span>`
            : ''}
            </div>

            <div class="req-requester">
                ${avatarHTML(user)}
                <div class="req-requester-info">
                    <div class="req-requester-name">
                        ${user ? user.name : 'Anonymous'}
                        ${verifiedIcon}
                    </div>
                    <div class="req-requester-sub">
                        ${user && user.location ? user.location : 'Posted ' + fmtDate(req.createdAt)}
                    </div>
                </div>
                ${respondBtn}
            </div>
        </div>
    `;
}

// ============================================================
//  FETCH & RENDER: Load requests from API
// ============================================================
async function loadRequests(page = 1) {
    // Show skeletons, hide grid and empty
    document.getElementById('comm-grid').style.display = 'none';
    document.getElementById('comm-skeleton').style.display = 'grid';
    document.getElementById('comm-empty').style.display = 'none';
    document.getElementById('comm-pagination').style.display = 'none';
    document.getElementById('stats-count').textContent = 'Loading...';

    try {
        const params = new URLSearchParams({ page, limit: 9 });
        if (activeFilters.category) params.set('category', activeFilters.category);
        if (activeFilters.location) params.set('location', activeFilters.location);

        const res = await fetch(`${API_URL}/community?${params}`);
        const data = await res.json();

        if (!data.success) throw new Error(data.message || 'Failed to load requests');

        const requests = data.requests || [];
        totalPages = data.pages || 1;
        currentPage = data.page || 1;

        // Stats bar
        const statsEl = document.getElementById('stats-count');
        if (data.total === 0) {
            statsEl.textContent = 'No requests found';
        } else {
            const filterNote = (activeFilters.category || activeFilters.location)
                ? ' (filtered)'
                : '';
            statsEl.textContent = `Showing ${requests.length} of ${data.total} request${data.total !== 1 ? 's' : ''}${filterNote}`;
        }

        // Hide skeletons
        document.getElementById('comm-skeleton').style.display = 'none';

        if (requests.length === 0) {
            document.getElementById('comm-empty').style.display = 'flex';
            document.getElementById('comm-grid').style.display = 'none';
        } else {
            const grid = document.getElementById('comm-grid');
            grid.innerHTML = requests.map(renderCard).join('');
            grid.style.display = 'grid';

            // Attach respond button listeners
            grid.querySelectorAll('.btn-respond').forEach(btn => {
                btn.addEventListener('click', () => openRespondModal(btn.dataset.id, btn.dataset.name));
            });
        }

        // Pagination
        if (totalPages > 1) {
            document.getElementById('comm-pagination').style.display = 'flex';
            document.getElementById('page-info').textContent = `Page ${currentPage} of ${totalPages}`;
            document.getElementById('btn-prev-page').disabled = currentPage <= 1;
            document.getElementById('btn-next-page').disabled = currentPage >= totalPages;
        }

    } catch (err) {
        document.getElementById('comm-skeleton').style.display = 'none';
        document.getElementById('comm-empty').style.display = 'flex';
        document.getElementById('stats-count').textContent = 'Failed to load requests';
        console.error('Community load error:', err);
    }
}

// ============================================================
//  MODAL HELPERS
// ============================================================
function openModal(id) {
    const m = document.getElementById(id);
    if (m) { m.classList.add('open'); document.body.style.overflow = 'hidden'; }
}

function closeModal(id) {
    const m = document.getElementById(id);
    if (m) { m.classList.remove('open'); document.body.style.overflow = ''; }
}

// ============================================================
//  POST REQUEST MODAL
// ============================================================
function openPostModal() {
    if (!isLoggedIn()) {
        showToast('Please log in to post a request', 'error');
        setTimeout(() => window.location.href = 'login.html', 1200);
        return;
    }
    // Set today as min date for date inputs
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('req-from-date').min = today;
    document.getElementById('req-to-date').min = today;

    openModal('modal-post');
}

async function submitPostRequest(e) {
    e.preventDefault();
    const errEl = document.getElementById('modal-post-error');
    errEl.style.display = 'none';
    const btn = document.getElementById('btn-submit-request');

    const itemName = document.getElementById('req-item-name').value.trim();
    const description = document.getElementById('req-description').value.trim();
    const category = document.getElementById('req-category').value;
    const budget = parseFloat(document.getElementById('req-budget').value);
    const location = document.getElementById('req-location').value.trim();
    const fromDate = document.getElementById('req-from-date').value;
    const toDate = document.getElementById('req-to-date').value;
    const isUrgent = document.getElementById('req-urgent').checked;

    // Client-side validation
    if (!itemName) { showError(errEl, 'Please enter what you need.'); return; }
    if (!category) { showError(errEl, 'Please select a category.'); return; }
    if (isNaN(budget) || budget < 0) { showError(errEl, 'Please enter a valid budget.'); return; }
    if (!location) { showError(errEl, 'Please enter a location.'); return; }
    if (!fromDate || !toDate) { showError(errEl, 'Please select both dates.'); return; }
    if (new Date(fromDate) >= new Date(toDate)) { showError(errEl, 'End date must be after start date.'); return; }

    btn.disabled = true;
    btn.textContent = 'Submitting…';

    try {
        const res = await fetch(`${API_URL}/community`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
            body: JSON.stringify({ itemName, description, category, budget, location, fromDate, toDate, isUrgent }),
        });
        const data = await res.json();

        if (!data.success) throw new Error(data.message || 'Could not submit request');

        closeModal('modal-post');
        document.getElementById('form-post-request').reset();
        showToast('✅ Request posted successfully!', 'success');
        loadRequests(1);

    } catch (err) {
        showError(errEl, err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span class="material-icons-outlined">send</span> Submit Request';
    }
}

// ============================================================
//  RESPOND MODAL
// ============================================================
function openRespondModal(requestId, itemName) {
    if (!isLoggedIn()) {
        showToast('Please log in to respond', 'error');
        setTimeout(() => window.location.href = 'login.html', 1200);
        return;
    }
    if (!isVerified()) {
        showToast('⚠ You must be verified to respond', 'error');
        setTimeout(() => window.location.href = `verify-identity.html?redirect=${encodeURIComponent('community.html')}`, 1400);
        return;
    }

    respondingToId = requestId;
    document.getElementById('respond-item-name').textContent = `📦 Responding to: "${itemName}"`;
    document.getElementById('respond-message').value = '';
    document.getElementById('modal-respond-error').style.display = 'none';
    openModal('modal-respond');
}

async function submitRespond(e) {
    e.preventDefault();
    const errEl = document.getElementById('modal-respond-error');
    errEl.style.display = 'none';
    const btn = document.getElementById('btn-submit-respond');
    const message = document.getElementById('respond-message').value.trim();

    if (!message) { showError(errEl, 'Please enter a message.'); return; }
    if (!respondingToId) { showError(errEl, 'Invalid request. Please try again.'); return; }

    btn.disabled = true;
    btn.textContent = 'Sending…';

    try {
        const res = await fetch(`${API_URL}/community/${respondingToId}/respond`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
            body: JSON.stringify({ message }),
        });
        const data = await res.json();

        if (!data.success) throw new Error(data.message || 'Could not send response');

        closeModal('modal-respond');
        showToast('✅ Response sent!', 'success');
        loadRequests(currentPage);

    } catch (err) {
        showError(errEl, err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span class="material-icons-outlined">reply</span> Send Response';
    }
}

// ============================================================
//  HELPER: show inline modal error
// ============================================================
function showError(el, msg) {
    el.textContent = msg;
    el.style.display = 'block';
}

// ============================================================
//  FILTERS
// ============================================================
function applyFilters() {
    activeFilters.category = document.getElementById('filter-category').value;
    activeFilters.location = document.getElementById('filter-location').value.trim();
    loadRequests(1);
}

function clearFilters() {
    document.getElementById('filter-category').value = '';
    document.getElementById('filter-location').value = '';
    activeFilters = { category: '', location: '' };
    loadRequests(1);
}

// ============================================================
//  INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {

    // Initial load
    loadRequests(1);

    // Post request buttons
    document.getElementById('btn-post-request')?.addEventListener('click', openPostModal);
    document.getElementById('btn-post-request-empty')?.addEventListener('click', openPostModal);

    // Post request form
    document.getElementById('form-post-request')?.addEventListener('submit', submitPostRequest);

    // Close post modal
    document.getElementById('modal-post-close')?.addEventListener('click', () => closeModal('modal-post'));
    document.getElementById('modal-post')?.addEventListener('click', (e) => {
        if (e.target === document.getElementById('modal-post')) closeModal('modal-post');
    });

    // Respond form
    document.getElementById('form-respond')?.addEventListener('submit', submitRespond);

    // Close respond modal
    document.getElementById('modal-respond-close')?.addEventListener('click', () => closeModal('modal-respond'));
    document.getElementById('modal-respond')?.addEventListener('click', (e) => {
        if (e.target === document.getElementById('modal-respond')) closeModal('modal-respond');
    });

    // Filters
    document.getElementById('btn-filter-apply')?.addEventListener('click', applyFilters);
    document.getElementById('btn-filter-clear')?.addEventListener('click', clearFilters);

    // Allow Enter key on location input to trigger filter
    document.getElementById('filter-location')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') applyFilters();
    });

    // Sync fromDate → toDate min
    document.getElementById('req-from-date')?.addEventListener('change', (e) => {
        document.getElementById('req-to-date').min = e.target.value;
    });

    // Pagination
    document.getElementById('btn-prev-page')?.addEventListener('click', () => {
        if (currentPage > 1) loadRequests(currentPage - 1);
    });
    document.getElementById('btn-next-page')?.addEventListener('click', () => {
        if (currentPage < totalPages) loadRequests(currentPage + 1);
    });

    // Close modals on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal('modal-post');
            closeModal('modal-respond');
        }
    });
});
