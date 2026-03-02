# OurStuff — Project TODO Tracker
> Last Updated: 2026-02-26 (Task done — OTP Store migrated to MongoDB TTL)
> Status Key: ✅ Done | 🔄 In Progress | ⬜ Not Started | 🚫 Blocked

---

## ✅ COMPLETED

### Backend
- [x] Express server setup (`server.js`) with all routes mounted
- [x] MongoDB + Mongoose connection
- [x] Auth system — OTP email via Gmail SMTP (`authController.js`)
- [x] JWT-based login/register
- [x] Identity verification (mock auto-approve) — `POST /api/auth/verify-identity`
- [x] Item CRUD — create, read, update, delete (`itemController.js`)
- [x] Item search / filter by category, price, location
- [x] Rental lifecycle — create, get, update status (accept/reject/complete/cancel)
- [x] Community requests — get, create, respond, delete (`communityController.js`)
- [x] Reviews — create, get by item, get by user (`reviewController.js`)
- [x] Notifications — create & fetch (`notificationController.js`)
- [x] User profile — view public, update own, dashboard aggregate (`userController.js`)
- [x] Upload middleware (Multer) for item images & avatar
- [x] Auth middleware (JWT protect + isVerified guard)
- [x] Error handler middleware

### Frontend Pages (HTML/CSS Built)
- [x] Home page (`index.html`) — hero, search bar, category grid, CTA
- [x] Browse Items page (`browse.html`) — filter section + item grid
- [x] Item Detail page (`item.html`) — image carousel, zoom on click
- [x] List Item page (`list-item.html`) — form with image upload
- [x] Login / Register page (`login.html`) — OTP flow
- [x] Profile page (`profile.html`) — user details + verification badge
- [x] Verify Identity page (`verify-identity.html`) — ID upload + selfie steps
- [x] Community Feed page (`community.html`) — fully integrated with live API
  - [x] Dynamic card rendering from `GET /api/community`
  - [x] Category + location filters
  - [x] Pagination (12 per page)
  - [x] "Post a Request" modal → `POST /api/community` (requires login)
  - [x] "Respond" button → `POST /api/community/:id/respond` (requires verified)
  - [x] Skeleton loaders, empty state, toast notifications
  - [x] Urgent badge, status badge, response count
  - New files: `css/community.css`, `js/community.js`
- [x] Dashboard page (`dashboard.html`) — fully integrated with live API
  - [x] Header with user info + stats (listings, rentals, requests, unread notifs)
  - [x] 5 tabs: My Listings, My Rentals, Incoming Rentals, My Requests, Notifications
  - [x] Data from `GET /api/users/dashboard`
  - [x] Owner accept / reject / mark-complete actions → `PUT /api/rentals/:id/status`
  - [x] Notifications: mark one read, mark all read
  - [x] Skeleton loaders, empty states, tab lazy-loading, toast notifications
  - New files: `dashboard.html`, `css/dashboard.css`, `js/dashboard.js`
- [x] Notification bell in navbar — shared across all pages via `main.js` ⬅ **LATEST CHANGE**
  - [x] Bell button injected dynamically when logged in
  - [x] Red badge with unread count (auto-fetched from `GET /api/notifications`)
  - [x] Dropdown shows latest 10 notifications with icon + time-ago label
  - [x] Click notification row → marks as read (`PUT /api/notifications/:id/read`)
  - [x] "Mark all read" button → `PUT /api/notifications/read-all`
  - Modified: `js/main.js`, `css/style.css`

---

## 🔄 IN PROGRESS / NEEDS ATTENTION

> Nothing currently in progress — see TODO below.

---

## ⬜ TODO — FRONTEND

### 1. Dashboard Page ✅ DONE
- ~~Create `dashboard.html`~~ ✔
- ~~Tabs: My Listings | My Rentals | My Requests | Notifications~~ ✔
- ~~Pull data from `GET /api/users/dashboard`~~ ✔
- ~~Rental status management (accept/reject buttons for owners)~~ ✔
- ~~Allow user to mark rentals as complete~~ ✔

### 2. Notifications (Navbar Bell) ✅ DONE
- ~~Add a notification bell/dropdown in the navbar (shared across all pages)~~ ✔
- ~~Fetch from `GET /api/notifications`~~ ✔
- ~~Show unread count badge~~ ✔
- ~~Mark as read on click (`PUT /api/notifications/:id/read`)~~ ✔

### 3. Community Page — Full JS Integration ✅ DONE
- ~~Dynamic rendering from API~~ ✔
- ~~"Post a Request" modal/form~~ ✔
- ~~Filter by category and location~~ ✔
- ~~Pagination~~ ✔
- ~~Urgent requests highlighted~~ ✔

### 4. Browse Page — API Integration ✅ DONE ⬅ **LATEST CHANGE**
- ~~Confirm item cards load from `GET /api/items`~~ ✔
- ~~Search bar wired to `?search=` param~~ ✔
- ~~Category filter wired to `?category=` param~~ ✔
- ~~Price range filter wired to `?minPrice=&maxPrice=`~~ ✔
- ~~Location filter wired to `?location=`~~ ✔
- ~~Pagination controls~~ ✔
- ~~URL sync — filters persist on page refresh and work with browser back/forward~~ ✔
- ~~Sort null-safety fix (items with no rating/price sort correctly)~~ ✔

### 5. Item Detail Page — API Integration ✅ DONE ⬅ **LATEST CHANGE**
- ~~Load real item data from `GET /api/items/:id`~~ ✔
- ~~Display owner name, avatar, verified badge, rating~~ ✔
- ~~"Rent Now" button → calls `POST /api/rentals` (auth + verified guard)~~ ✔
- ~~Booked dates conflict check (blocks overlap)~~ ✔
- ~~Load and display reviews from `GET /api/reviews/item/:itemId`~~ ✔
- ~~Dynamic "Listed X days ago" text~~ ✔
- ~~Smart error message: CORS hint if opened via file://~~ ✔
- ~~Owner's own listing shows "Your Listing" button (disabled)~~ ✔

### 6. List Item Page — API Integration ✅ DONE ⬅ **LATEST CHANGE**
- ~~Wire form to `POST /api/items` (multipart/form-data with images)~~ ✔
- ~~Guard: redirect to `/verify-identity.html` if user not verified~~ ✔

### 7. Login / Register — Full Auth Flow ✅ DONE ⬅ **LATEST CHANGE**
- ~~On login success, save JWT to `localStorage`~~ ✔
- ~~On register success, auto-login~~ ✔
- ~~Navbar updates to show avatar + logout after login~~ ✔
- ~~All pages redirect to login if token missing/expired~~ ✔

### 8. Profile Page — API Integration ✅ DONE ⬅ **LATEST CHANGE**
- ~~Load user data from `GET /api/auth/me`~~ ✔
- ~~Allow editing name, phone, bio, location, avatar image~~ ✔
- ~~Save via `PUT /api/users/profile`~~ ✔
- ~~Display verification badge based on `isVerified` field~~ ✔

### 9. Verify Identity Page — Integration ✅ DONE ⬅ **LATEST CHANGE**
- ~~On submit, call `POST /api/auth/verify-identity`~~ ✔
- ~~Redirect back to intended action after success~~ ✔

---

## ⬜ TODO — BACKEND

### 1. Availability / Date Conflict Check ✅ DONE ⬅ **LATEST CHANGE**
- ~~When creating a rental, check if requested dates overlap with `bookedDates` in `Item` model~~ ✔
- ~~Return a clear error if dates are unavailable~~ ✔

### 2. Real Identity Verification (Persona / Sumsub) 🚫 SCRAPPED ⬅ **LATEST CHANGE**
- ~~Replace mock auto-approve in `submitVerification` with real Persona API call~~
- ~~Handle webhook for async verification result~~
- ~~More states: `pending`, `failed`~~

### 3. Geolocation / Radius Search ✅ DONE ⬅ **LATEST CHANGE**
- ~~Add GeoJSON coordinates to `User` and `Item` models~~ ✔
- ~~Filter items and community requests by distance (`$near` MongoDB query)~~ ✔

### 4. Notification — Mark All Read ✅ DONE ⬅ **LATEST CHANGE**
- ~~Add `PUT /api/notifications/read-all` endpoint~~ ✔

### 5. OTP Store — Production Ready ✅ DONE ⬅ **LATEST CHANGE**
- [x] Replaced in-memory `otpStore` with MongoDB `Otp` model + TTL index (auto-expires after 10 min, survives server restarts, no Redis needed)


### 7. Admin Panel (Future)
- [ ] View all users, flag suspicious listings
- [ ] Manual verification override

---

## ⬜ TODO — DESIGN / UX

- [ ] Dashboard page full UI design (not started)
- [ ] Mobile responsiveness audit on all pages
- [ ] Add loading skeletons for API-fetched content
- [ ] Empty state illustrations (no items found, no rentals yet, etc.)
- [ ] Toast notification system (success/error feedback on all form actions)

---

## ⬜ TODO — DEV OPS / DEPLOYMENT

- [ ] Set up environment variables for production (`.env.production`)
- [ ] Deploy backend to Railway / Render / Fly.io
- [ ] Deploy frontend to Vercel / Netlify / GitHub Pages
- [ ] Set up CORS for production frontend URL
- [ ] Configure MongoDB Atlas production cluster
- [ ] Add rate limiting (e.g. `express-rate-limit`) on `/api/auth/*` routes

---

## 📝 NOTES

- `development.md` in docs is empty — fill it in with setup instructions
- `community.html` navbar still links to `dashboard.html` which doesn't exist yet
- Identity verification is currently a **mock** — it auto-approves instantly
- OTP store is in-memory — will reset on every server restart

---

_This file is updated after each task is completed. Ask the assistant before starting the next task._
