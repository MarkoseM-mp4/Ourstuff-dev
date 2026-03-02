/* ============================================================
   dashboard.js — Full API integration for the Dashboard page.
   Requires: main.js (API, getToken, getUser, isLoggedIn)
   ============================================================ */

const API_URL = (typeof API !== 'undefined') ? API : 'http://127.0.0.1:5000/api';

// ============================================================
//  GUARD — redirect to login if not logged in
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }
    initDashboard();
});

// ============================================================
//  TOAST
// ============================================================
function showToast(msg, type = 'default') {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.className = `toast ${type} show`;
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 3500);
}

// ============================================================
//  DATE HELPERS
// ============================================================
function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

function timeAgo(d) {
    if (!d) return '';
    const s = Math.floor((Date.now() - new Date(d)) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
    return fmtDate(d);
}

// ============================================================
//  NOTIFICATION ICON MAP
// ============================================================
function notifIcon(type) {
    const map = {
        rental_request: 'event_available',
        rental_accepted: 'check_circle',
        rental_rejected: 'cancel',
        rental_completed: 'verified',
        review_received: 'star',
        community_respond: 'forum',
        item_listed: 'inventory_2',
    };
    return map[type] || 'notifications';
}

// ============================================================
//  THUMBNAIL HELPER
// ============================================================
function thumbHTML(images, cls = 'rental-thumb') {
    if (images && images.length > 0) {
        const src = images[0].startsWith('http')
            ? images[0]
            : `${API_URL.replace('/api', '')}${images[0]}`;
        return `<div class="${cls}"><img src="${src}" alt="item" onerror="this.style.display='none';this.parentElement.innerHTML='<span class=\\'material-icons-outlined\\'>image</span>'"></div>`;
    }
    return `<div class="${cls}"><span class="material-icons-outlined">image</span></div>`;
}

// ============================================================
//  INIT
// ============================================================
async function initDashboard() {
    populateHeader();
    setupTabs();
    let tabName = null;
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    if (pathParts[0] === 'dashboard' && pathParts[1]) {
        tabName = pathParts[1];
    } else if (window.location.hash) {
        tabName = window.location.hash.replace('#', '');
    }

    if (tabName) {
        const tabObj = document.querySelector(`.dash-tab[data-tab="${tabName}"]`);
        if (tabObj) {
            tabObj.click();
        }
    }
    await loadDashboard();
}

// ============================================================
//  HEADER: user info + stats
// ============================================================
function populateHeader() {
    const user = getUser();
    if (!user) return;

    document.getElementById('dash-username').textContent = user.name || 'My Dashboard';
    document.getElementById('dash-email').textContent = user.email || '';

    const avatarEl = document.getElementById('dash-avatar');
    if (user.avatar) {
        const src = user.avatar.startsWith('http') ? user.avatar : `${API_URL.replace('/api', '')}${user.avatar}`;
        avatarEl.innerHTML = `<img src="${src}" alt="${user.name}" onerror="this.outerHTML='${(user.name || 'U').charAt(0).toUpperCase()}'">`;
    } else {
        avatarEl.textContent = (user.name || 'U').charAt(0).toUpperCase();
    }
}

// ============================================================
//  TABS
// ============================================================
function setupTabs() {
    const tabs = document.querySelectorAll('.dash-tab');
    const panels = document.querySelectorAll('.tab-panel');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;

            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(`tab-${target}`).classList.add('active');

            // Update URL cleanly
            if (window.history.pushState) {
                window.history.pushState(null, '', `/dashboard/${target}`);
            }

            // Lazy-load tabs when first opened
            if (target === 'notifications' && !tab.dataset.loaded) {
                tab.dataset.loaded = 'true';
                loadNotifications();
            }
        });
    });
}

// ============================================================
//  LOAD DASHBOARD (main data fetch)
// ============================================================
async function loadDashboard() {
    try {
        const res = await fetch(`${API_URL}/users/dashboard`, {
            headers: { Authorization: `Bearer ${getToken()}` }
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        const { myListings, myRentals, myRequests, unreadNotifications } = data.dashboard;

        // Stats
        document.getElementById('stat-listings').textContent = myListings.length;
        document.getElementById('stat-rentals').textContent = myRentals.length;
        document.getElementById('stat-requests').textContent = myRequests.length;
        document.getElementById('stat-notifs').textContent = unreadNotifications;

        // Notification dot on tab
        if (unreadNotifications > 0) {
            document.getElementById('notif-dot').style.display = 'inline-block';
        }

        // Render panels
        renderListings(myListings);
        renderRenterRentals(myRentals);
        renderRequests(myRequests);

        // Incoming rentals (owner side) — needs separate call
        loadOwnerRentals();
        // Pre-load notifications
        loadNotifications();
        document.querySelector('[data-tab="notifications"]').dataset.loaded = 'true';

    } catch (err) {
        console.error('Dashboard error:', err);
        showToast('Failed to load dashboard data', 'error');
    }
}

// ============================================================
//  RENDER: My Listings
// ============================================================
function renderListings(listings) {
    const grid = document.getElementById('listings-grid');
    const empty = document.getElementById('listings-empty');
    grid.innerHTML = '';

    if (!listings || listings.length === 0) {
        grid.style.display = 'none';
        empty.style.display = 'flex';
        return;
    }

    grid.style.display = 'grid';
    empty.style.display = 'none';

    listings.forEach(item => {
        const imgHTML = item.images && item.images.length > 0
            ? `<img class="listing-card-img" src="${item.images[0].startsWith('http') ? item.images[0] : API_URL.replace('/api', '') + item.images[0]}" alt="${item.title}" onerror="this.style.display='none'">`
            : `<div class="listing-card-img-placeholder"><span class="material-icons-outlined">image</span></div>`;

        const avail = item.isAvailable
            ? `<span class="listing-avail"><span class="material-icons-outlined" style="font-size:12px">check_circle</span> Available</span>`
            : `<span class="listing-avail unavailable"><span class="material-icons-outlined" style="font-size:12px">cancel</span> Unavailable</span>`;

        const card = document.createElement('div');
        card.className = 'listing-card';
        card.innerHTML = `
            ${imgHTML}
            <div class="listing-card-body">
                <div class="listing-card-title">${item.title}</div>
                <div class="listing-card-meta">
                    <span><span class="material-icons-outlined">location_on</span>${item.location || '—'}</span>
                    <span><span class="material-icons-outlined">star</span>${item.rating || '0'} (${item.reviewCount || 0})</span>
                </div>
                <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
                    <span class="listing-card-price">$${item.pricePerDay}/day</span>
                    ${avail}
                </div>
                <div class="listing-card-actions">
                    <a class="btn-card-edit" href="item?id=${item._id}">
                        <span class="material-icons-outlined">visibility</span> View
                    </a>
                    <button class="btn-card-delete" onclick="deleteListing('${item._id}', this)">
                        <span class="material-icons-outlined">delete</span> Delete
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// ============================================================
//  DELETE LISTING
// ============================================================
async function deleteListing(id, btnEl) {
    showCustomConfirm(
        'Delete Listing',
        'Are you sure you want to delete this listing? This action cannot be undone.',
        'Delete',
        async () => {
            const originalText = btnEl.innerHTML;
            btnEl.innerHTML = '<span class="material-icons-outlined" style="animation:spin 1s linear infinite;">sync</span>...';
            btnEl.disabled = true;

            try {
                const res = await fetch(`${API_URL}/items/${id}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${getToken()}` }
                });
                const data = await res.json();
                if (!data.success) throw new Error(data.message);

                showToast('Listing deleted successfully', 'success');

                // Remove visually from grid
                btnEl.closest('.listing-card').remove();

                // Update header count
                const statEl = document.getElementById('stat-listings');
                const cur = parseInt(statEl.textContent) || 0;
                if (cur > 0) statEl.textContent = cur - 1;

                // Show empty state if nothing left
                if (cur - 1 === 0) {
                    document.getElementById('listings-grid').style.display = 'none';
                    document.getElementById('listings-empty').style.display = 'flex';
                }

            } catch (err) {
                showToast(err.message || 'Error deleting listing', 'error');
                btnEl.innerHTML = originalText;
                btnEl.disabled = false;
            }
        }
    );
}

// ============================================================
//  CUSTOM CONFIRM MODAL
// ============================================================
function showCustomConfirm(title, desc, confirmText, onConfirm) {
    const modal = document.getElementById('custom-confirm-modal');
    if (!modal) return;

    document.getElementById('ccm-title').textContent = title;
    document.getElementById('ccm-desc').textContent = desc;
    const btnConfirm = document.getElementById('ccm-confirm');
    btnConfirm.textContent = confirmText;

    const cancelHandler = () => {
        modal.classList.remove('open');
        cleanup();
    };

    const confirmHandler = () => {
        modal.classList.remove('open');
        onConfirm();
        cleanup();
    };

    const cleanup = () => {
        document.getElementById('ccm-cancel').removeEventListener('click', cancelHandler);
        btnConfirm.removeEventListener('click', confirmHandler);
    };

    document.getElementById('ccm-cancel').addEventListener('click', cancelHandler);
    btnConfirm.addEventListener('click', confirmHandler);

    modal.classList.add('open');
}

// ============================================================
//  RENDER: My Rentals (as renter - splitted to Active and History)
// ============================================================
function renderRenterRentals(rentals) {
    const activeRentals = rentals.filter(r => ['pending', 'accepted', 'active'].includes(r.status));
    const historyRentals = rentals.filter(r => ['completed', 'cancelled', 'rejected'].includes(r.status));

    renderActiveRentals(activeRentals);
    renderRentalHistory(historyRentals);
}

function renderActiveRentals(rentals) {
    const list = document.getElementById('rentals-list');
    const empty = document.getElementById('rentals-empty');
    list.innerHTML = '';

    if (!rentals || rentals.length === 0) {
        list.style.display = 'none';
        empty.style.display = 'flex';
        return;
    }
    list.style.display = 'flex';
    empty.style.display = 'none';

    rentals.forEach(r => {
        const item = r.item || {};
        const owner = r.owner || {};
        const row = document.createElement('div');
        row.className = 'rental-row';

        // OTP display if accepted
        let otpDisplay = '';
        if (r.status === 'accepted' && r.deliveryOtp) {
            otpDisplay = `<div style="font-size: 13px; margin-top: 6px; padding: 6px 12px; background: #FEF08A; color: #854D0E; border-radius: 8px; font-weight: 700; display: inline-block;">
                Delivery OTP: <span style="font-size: 15px;">${r.deliveryOtp}</span>
            </div>`;
        }

        // Action buttons based on status
        let actions = '<div class="rental-actions" style="margin-top: 12px; flex-wrap: wrap; gap: 8px; width: 100%; display: flex; justify-content: flex-start;">';

        if (r.status === 'pending' || r.status === 'accepted') {
            actions += `
                <button class="btn-reject" data-cancel-id="${r._id}">
                    <span class="material-icons-outlined">cancel</span> Cancel
                </button>
            `;
        } else if (r.status === 'active') {
            // Check 2 hours window for Report Issue
            const deliveredAt = r.deliveredAt ? new Date(r.deliveredAt).getTime() : 0;
            const twoHoursMs = 2 * 60 * 60 * 1000;
            const isWithinTwoHours = (Date.now() - deliveredAt) <= twoHoursMs;

            if (isWithinTwoHours && !r.issueReported) {
                actions += `
                    <button class="btn-reject" onclick="openReportIssueModal('${r._id}')">
                        <span class="material-icons-outlined">report_problem</span> Report Issue
                    </button>
                `;
            } else if (r.issueReported) {
                actions += `
                    <span style="font-size: 13px; color: #DC2626; font-weight: 500; display: flex; align-items: center; gap: 4px;">
                        <span class="material-icons-outlined" style="font-size: 15px;">report</span> Issue Reported
                    </span>
                `;
            }

            if (r.extensionRequested) {
                actions += `
                    <span style="font-size: 13px; color: #D97706; font-weight: 500; display: flex; align-items: center; gap: 4px;">
                        <span class="material-icons-outlined" style="font-size: 15px;">hourglass_empty</span> Extension Pending
                    </span>
                `;
            } else {
                actions += `
                    <button class="btn-panel-action-ghost" onclick="openExtendTimeModal('${r._id}')">
                        <span class="material-icons-outlined">update</span> Extend Time
                    </button>
                `;
            }

            actions += `
                <button class="btn-accept" data-return-id="${r._id}">
                    <span class="material-icons-outlined">assignment_return</span> Return Item
                </button>
            `;
        }
        actions += '</div>';

        row.innerHTML = `
            ${thumbHTML(item.images)}
            <div class="rental-info" style="flex: 1;">
                <div class="rental-item-name">${item.title || 'Unknown item'}</div>
                <div class="rental-meta">
                    <span><span class="material-icons-outlined">person</span> Owner: ${owner.name || '—'}</span>
                    <span><span class="material-icons-outlined">event</span>${fmtDate(r.fromDate)} → ${fmtDate(r.toDate)}</span>
                    <span><span class="material-icons-outlined">schedule</span>${r.totalDays} day${r.totalDays !== 1 ? 's' : ''}</span>
                </div>
                ${otpDisplay}
                ${actions}
            </div>
            <div class="rental-side" style="align-items: flex-end;">
                <span class="rental-price">$${r.totalPrice}</span>
                <span class="r-status ${r.status}">${capitalize(r.status)}</span>
            </div>
        `;

        row.querySelectorAll('[data-cancel-id]').forEach(btn => {
            btn.addEventListener('click', () => {
                showCustomConfirm(
                    'Cancel Rental',
                    'Are you sure you want to cancel this rental request? Your cancellation policy may apply.',
                    'Cancel Rental',
                    () => cancelRental(btn.dataset.cancelId)
                );
            });
        });

        row.querySelectorAll('[data-return-id]').forEach(btn => {
            btn.addEventListener('click', () => initiateReturn(btn.dataset.returnId));
        });

        list.appendChild(row);
    });
}

function renderRentalHistory(rentals) {
    const list = document.getElementById('rental-history-list');
    const empty = document.getElementById('rental-history-empty');
    if (!list) return; // safety
    list.innerHTML = '';

    if (!rentals || rentals.length === 0) {
        list.style.display = 'none';
        empty.style.display = 'flex';
        return;
    }
    list.style.display = 'flex';
    empty.style.display = 'none';

    rentals.forEach(r => {
        const item = r.item || {};
        const owner = r.owner || {};
        const row = document.createElement('div');
        row.className = 'rental-row';

        row.innerHTML = `
            ${thumbHTML(item.images)}
            <div class="rental-info">
                <div class="rental-item-name">${item.title || 'Unknown item'}</div>
                <div class="rental-meta">
                    <span><span class="material-icons-outlined">person</span> Owner: ${owner.name || '—'}</span>
                    <span><span class="material-icons-outlined">event</span>${fmtDate(r.fromDate)} → ${fmtDate(r.toDate)}</span>
                </div>
            </div>
            <div class="rental-side" style="align-items: flex-end;">
                <span class="rental-price">$${r.totalPrice}</span>
                <span class="r-status ${r.status}">${capitalize(r.status)}</span>
                ${r.status === 'completed' && !r.reviewedByRenter ? `
                    <a href="item.html?id=${item._id}#reviews" class="btn-panel-action-ghost" style="padding: 4px 10px; font-size: 11px;">
                        <span class="material-icons-outlined" style="font-size: 13px;">star_rate</span> Leave Review
                    </a>
                ` : ''}
            </div>
        `;

        list.appendChild(row);
    });
}

// ============================================================
//  CANCEL RENTAL (as renter)
// ============================================================
async function cancelRental(rentalId) {
    // Confirmation is now handled by showCustomConfirm wrapper
    try {
        const res = await fetch(`${API_URL}/rentals/${rentalId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
            body: JSON.stringify({ status: 'cancelled' }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        showToast('Rental cancelled successfully', 'success');
        loadDashboard(); // Reload data
    } catch (err) {
        showToast(err.message || 'Failed to cancel rental', 'error');
    }
}

// ============================================================
//  RETURN ITEM FLOW (as renter)
// ============================================================
let currentReturnRentalId = null;

async function initiateReturn(rentalId) {
    try {
        const res = await fetch(`${API_URL}/rentals/${rentalId}/request-return`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${getToken()}` }
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        showToast('Return requested! Ask seller for OTP.', 'success');

        // Open OTP Modal so buyer can enter OTP from seller
        currentReturnRentalId = rentalId;
        document.getElementById('return-otp-input').value = '';
        document.getElementById('return-otp-modal').classList.add('open');
    } catch (err) {
        showToast(err.message || 'Failed to request return', 'error');
    }
}

document.getElementById('btn-submit-return-otp')?.addEventListener('click', async () => {
    if (!currentReturnRentalId) return;
    const otp = document.getElementById('return-otp-input').value.trim();
    if (!otp) {
        showToast('Please enter the OTP provided by the seller', 'error');
        return;
    }

    const btn = document.getElementById('btn-submit-return-otp');
    btn.disabled = true;
    btn.innerHTML = '<span class="material-icons-outlined" style="animation:spin 1s linear infinite;">sync</span>...';

    try {
        const res = await fetch(`${API_URL}/rentals/${currentReturnRentalId}/complete-return`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
            body: JSON.stringify({ otp })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        showToast('Return completed successfully!', 'success');
        document.getElementById('return-otp-modal').classList.remove('open');
        currentReturnRentalId = null;
        loadDashboard();

        // Optionally alert user to leave review
        setTimeout(() => alert('Thank you! Please remember to leave a review for this item.'), 500);
    } catch (err) {
        showToast(err.message || 'Invalid OTP', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span class="material-icons-outlined">check_circle</span>Confirm Return';
    }
});

// ============================================================
//  LOAD + RENDER: Incoming Rentals (as owner)
// ============================================================
async function loadOwnerRentals() {
    try {
        const res = await fetch(`${API_URL}/rentals?role=owner`, {
            headers: { Authorization: `Bearer ${getToken()}` }
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        renderOwnerRentals(data.rentals || []);
    } catch (err) {
        document.getElementById('owner-rentals-list').innerHTML = '';
        console.error('Owner rentals error:', err);
    }
}

function renderOwnerRentals(rentals) {
    const list = document.getElementById('owner-rentals-list');
    const empty = document.getElementById('owner-rentals-empty');
    list.innerHTML = '';

    if (!rentals || rentals.length === 0) {
        list.style.display = 'none';
        empty.style.display = 'flex';
        return;
    }
    list.style.display = 'flex';
    empty.style.display = 'none';

    rentals.forEach(r => {
        const item = r.item || {};
        const renter = r.renter || {};
        const row = document.createElement('div');
        row.className = 'rental-row';

        // Action buttons based on status
        let actions = '';
        if (r.status === 'pending') {
            actions = `
                <div class="rental-actions" style="margin-top: 12px; display: flex; justify-content: flex-start; gap: 8px;">
                    <button class="btn-accept" data-status-rental="${r._id}" data-action="accepted">
                        <span class="material-icons-outlined">check</span> Accept
                    </button>
                    <button class="btn-reject" data-status-rental="${r._id}" data-action="rejected">
                        <span class="material-icons-outlined">close</span> Decline
                    </button>
                </div>`;
        } else if (r.status === 'accepted') {
            actions = `
                <div class="rental-actions" style="margin-top: 12px; display: flex; justify-content: flex-start;">
                    <button class="btn-complete" data-deliver-rental="${r._id}">
                        <span class="material-icons-outlined">local_shipping</span> Item Delivered
                    </button>
                </div>`;
        } else if (r.status === 'active') {
            if (r.extensionRequested) {
                actions = `
                    <div class="rental-actions" style="margin-top: 12px; display: flex; flex-direction: column; gap: 8px;">
                        <span style="font-size: 13px; color: #D97706; font-weight: 500;">
                            Renter wants to extend by ${r.extensionDays} day(s).
                        </span>
                        <div style="display: flex; gap: 8px;">
                            <button class="btn-accept" data-extend-rental="${r._id}" data-action="accept">
                                <span class="material-icons-outlined">check</span> Accept Extension
                            </button>
                            <button class="btn-reject" data-extend-rental="${r._id}" data-action="reject">
                                <span class="material-icons-outlined">close</span> Decline
                            </button>
                        </div>
                    </div>`;
            }
        }

        row.innerHTML = `
            ${thumbHTML(item.images)}
            <div class="rental-info" style="flex: 1;">
                <div class="rental-item-name">${item.title || 'Unknown item'}</div>
                <div class="rental-meta">
                    <span><span class="material-icons-outlined">person</span> From: ${renter.name || '—'}</span>
                    <span><span class="material-icons-outlined">event</span>${fmtDate(r.fromDate)} → ${fmtDate(r.toDate)}</span>
                    <span><span class="material-icons-outlined">schedule</span>${r.totalDays} day${r.totalDays !== 1 ? 's' : ''}</span>
                    ${r.message ? `<span><span class="material-icons-outlined">chat</span>"${r.message}"</span>` : ''}
                </div>
                ${actions}
            </div>
            <div class="rental-side" style="align-items: flex-end;">
                <span class="rental-price">$${r.totalPrice}</span>
                <span class="r-status ${r.status}">${capitalize(r.status)}</span>
            </div>
        `;

        // Wire action buttons
        row.querySelectorAll('[data-status-rental]').forEach(btn => {
            btn.addEventListener('click', () => updateRentalStatus(btn.dataset.statusRental, btn.dataset.action));
        });

        row.querySelectorAll('[data-deliver-rental]').forEach(btn => {
            btn.addEventListener('click', () => showDeliverModal(btn.dataset.deliverRental));
        });

        row.querySelectorAll('[data-extend-rental]').forEach(btn => {
            btn.addEventListener('click', () => handleExtensionStatus(btn.dataset.extendRental, btn.dataset.action));
        });

        list.appendChild(row);
    });
}

// ============================================================
//  DELIVER ITEM FLOW (as owner)
// ============================================================
let currentDeliverRentalId = null;

function showDeliverModal(rentalId) {
    currentDeliverRentalId = rentalId;
    document.getElementById('otp-input').value = '';
    document.getElementById('otp-modal').classList.add('open');
}

document.getElementById('btn-submit-otp')?.addEventListener('click', async () => {
    if (!currentDeliverRentalId) return;
    const otp = document.getElementById('otp-input').value.trim();
    if (!otp) {
        showToast('Please enter the OTP provided by the buyer', 'error');
        return;
    }

    const btn = document.getElementById('btn-submit-otp');
    btn.disabled = true;
    btn.innerHTML = '<span class="material-icons-outlined" style="animation:spin 1s linear infinite;">sync</span>...';

    try {
        const res = await fetch(`${API_URL}/rentals/${currentDeliverRentalId}/deliver`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
            body: JSON.stringify({ otp })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        showToast('Item marked as delivered!', 'success');
        document.getElementById('otp-modal').classList.remove('open');
        currentDeliverRentalId = null;
        loadDashboard(); // reload owner rentals
    } catch (err) {
        showToast(err.message || 'Invalid OTP', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span class="material-icons-outlined">check_circle</span>Confirm Delivery';
    }
});

// ============================================================
//  UPDATE RENTAL STATUS (accept / reject / complete)
// ============================================================
async function updateRentalStatus(rentalId, status) {
    try {
        const res = await fetch(`${API_URL}/rentals/${rentalId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
            body: JSON.stringify({ status }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        const msgs = {
            accepted: '✅ Rental accepted!',
            rejected: 'Rental declined.',
            completed: '✅ Rental marked as complete!',
        };
        showToast(msgs[status] || 'Updated!', status === 'rejected' ? 'default' : 'success');
        loadOwnerRentals(); // Re-render with new state

    } catch (err) {
        showToast(err.message || 'Failed to update rental', 'error');
    }
}

// ============================================================
//  RENDER: My Community Requests
// ============================================================
function renderRequests(requests) {
    const grid = document.getElementById('requests-grid');
    const empty = document.getElementById('requests-empty');
    grid.innerHTML = '';

    if (!requests || requests.length === 0) {
        grid.style.display = 'none';
        empty.style.display = 'flex';
        return;
    }
    grid.style.display = 'grid';
    empty.style.display = 'none';

    requests.forEach(r => {
        const card = document.createElement('div');
        card.className = 'req-dash-card';
        card.style.cursor = 'pointer';
        card.title = 'Click to view details';
        const responseCount = r.responses?.length || 0;
        card.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                <div class="req-dash-title">${r.itemName}</div>
                <div style="display:flex;align-items:center;gap:8px;">
                    <span class="req-dash-status ${r.status}">${capitalize(r.status)}</span>
                    <span class="material-icons-outlined" style="font-size:16px;color:var(--text-muted);">chevron_right</span>
                </div>
            </div>
            <div class="req-dash-meta">
                <span><span class="material-icons-outlined">payments</span>₹${r.budget}/day</span>
                <span><span class="material-icons-outlined">location_on</span>${r.location}</span>
                <span><span class="material-icons-outlined">event</span>${fmtDate(r.fromDate)}</span>
                ${responseCount > 0
                ? `<span style="color:var(--secondary);font-weight:600;"><span class="material-icons-outlined">forum</span>${responseCount} response${responseCount > 1 ? 's' : ''}</span>`
                : '<span style="color:var(--text-muted);"><span class="material-icons-outlined">forum</span>No responses yet</span>'}
            </div>
        `;
        card.addEventListener('click', () => {
            window.location.href = `community-request?id=${r._id}`;
        });
        grid.appendChild(card);
    });
}

// ============================================================
//  LOAD + RENDER: Notifications
// ============================================================
async function loadNotifications() {
    try {
        const res = await fetch(`${API_URL}/notifications`, {
            headers: { Authorization: `Bearer ${getToken()}` }
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        renderNotifications(data.notifications || []);
    } catch (err) {
        console.error('Notifications error:', err);
    }
}

function renderNotifications(notifs) {
    const list = document.getElementById('notif-list');
    const empty = document.getElementById('notif-empty');
    list.innerHTML = '';

    if (!notifs || notifs.length === 0) {
        list.style.display = 'none';
        empty.style.display = 'flex';
        return;
    }
    list.style.display = 'flex';
    empty.style.display = 'none';

    notifs.forEach(n => {
        const row = document.createElement('div');
        row.className = `notif-row ${n.isRead ? '' : 'unread'}`;
        row.innerHTML = `
            <div class="notif-icon-wrap">
                <span class="material-icons-outlined">${notifIcon(n.type)}</span>
            </div>
            <div class="notif-body">
                <div class="notif-msg">${n.message}</div>
                <div class="notif-time">${timeAgo(n.createdAt)}</div>
            </div>
            ${!n.isRead ? '<div class="notif-unread-dot"></div>' : ''}
        `;

        // Mark as read on click
        if (!n.isRead) {
            row.addEventListener('click', async () => {
                try {
                    await fetch(`${API_URL}/notifications/${n._id}/read`, {
                        method: 'PUT',
                        headers: { Authorization: `Bearer ${getToken()}` }
                    });
                    row.classList.remove('unread');
                    const dot = row.querySelector('.notif-unread-dot');
                    if (dot) dot.remove();
                    // Update unread count in header
                    const statEl = document.getElementById('stat-notifs');
                    const cur = parseInt(statEl.textContent) || 0;
                    if (cur > 0) statEl.textContent = cur - 1;
                    if (cur - 1 === 0) document.getElementById('notif-dot').style.display = 'none';
                } catch (_) { }
            });
        }

        list.appendChild(row);
    });
}

// ============================================================
//  MARK ALL READ
// ============================================================
document.getElementById('btn-mark-all-read')?.addEventListener('click', async () => {
    try {
        const res = await fetch(`${API_URL}/notifications/read-all`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${getToken()}` }
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        showToast('All notifications marked as read', 'success');
        document.getElementById('stat-notifs').textContent = '0';
        document.getElementById('notif-dot').style.display = 'none';
        loadNotifications();
    } catch (err) {
        showToast(err.message || 'Failed', 'error');
    }
});

// ============================================================
//  REPORT ISSUE (as renter)
// ============================================================
let currentIssueRentalId = null;

window.openReportIssueModal = function (rentalId) {
    currentIssueRentalId = rentalId;
    document.getElementById('issue-desc-input').value = '';
    document.getElementById('report-issue-modal').classList.add('open');
};

document.getElementById('btn-submit-issue')?.addEventListener('click', async () => {
    if (!currentIssueRentalId) return;
    const desc = document.getElementById('issue-desc-input').value.trim();
    if (!desc) {
        showToast('Please describe the issue', 'error');
        return;
    }

    const btn = document.getElementById('btn-submit-issue');
    btn.disabled = true;
    btn.innerHTML = '<span class="material-icons-outlined" style="animation:spin 1s linear infinite;">sync</span>...';

    try {
        const res = await fetch(`${API_URL}/rentals/${currentIssueRentalId}/report-issue`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
            body: JSON.stringify({ description: desc })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        showToast('Issue reported successfully. Owner notified.', 'success');
        document.getElementById('report-issue-modal').classList.remove('open');
        currentIssueRentalId = null;
        loadDashboard(); // reload 
    } catch (err) {
        showToast(err.message || 'Failed to report issue', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span class="material-icons-outlined">flag</span>Report Issue';
    }
});

// ============================================================
//  EXTEND TIME (as renter) 
// ============================================================
let currentExtendRentalId = null;

window.openExtendTimeModal = function (rentalId) {
    currentExtendRentalId = rentalId;
    document.getElementById('extend-days-input').value = '1';
    document.getElementById('extend-time-modal').classList.add('open');
};

document.getElementById('btn-submit-extend')?.addEventListener('click', async () => {
    if (!currentExtendRentalId) return;
    const days = parseInt(document.getElementById('extend-days-input').value, 10);
    if (!days || days < 1) {
        showToast('Please enter a valid number of days', 'error');
        return;
    }

    const btn = document.getElementById('btn-submit-extend');
    btn.disabled = true;
    btn.innerHTML = '<span class="material-icons-outlined" style="animation:spin 1s linear infinite;">sync</span>...';

    try {
        const res = await fetch(`${API_URL}/rentals/${currentExtendRentalId}/extend`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
            body: JSON.stringify({ days })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        showToast('Extension requested. Waiting for owner approval.', 'success');
        document.getElementById('extend-time-modal').classList.remove('open');
        currentExtendRentalId = null;
        loadDashboard();
    } catch (err) {
        showToast(err.message || 'Failed to request extension', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span class="material-icons-outlined">update</span>Request Extension';
    }
});

// ============================================================
//  HANDLE EXTENSION STATUS (as owner)
// ============================================================
window.handleExtensionStatus = async function (rentalId, action) {
    showCustomConfirm(
        action === 'accept' ? 'Accept Extension' : 'Decline Extension',
        `Are you sure you want to ${action} this time extension request?`,
        action === 'accept' ? 'Accept' : 'Decline',
        async () => {
            try {
                const res = await fetch(`${API_URL}/rentals/${rentalId}/extend-status`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                    body: JSON.stringify({ action })
                });
                const data = await res.json();
                if (!data.success) throw new Error(data.message);

                showToast(`Extension ${action}ed successfully`, 'success');
                loadDashboard();
            } catch (err) {
                showToast(err.message || `Failed to ${action} extension`, 'error');
            }
        }
    );
};

// ============================================================
//  UTILITY
// ============================================================
function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}
