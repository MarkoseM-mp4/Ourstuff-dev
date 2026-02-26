# OurStuff — Project TODO Tracker
> Last Updated: 2026-02-26 (Task 1 done — Community Page API Integration)
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

---

## 🔄 IN PROGRESS / NEEDS ATTENTION

> Nothing currently in progress — see TODO below.

---

## ⬜ TODO — FRONTEND

### 1. Dashboard Page ⬅ NEXT UP
- [ ] Create `dashboard.html` (referenced in navbars but file doesn't exist)
- [ ] Tabs: My Listings | My Rentals | My Requests | Notifications
- [ ] Pull data from `GET /api/users/dashboard`
- [ ] Rental status management (accept/reject buttons for owners)
- [ ] Allow user to mark rentals as complete

### 2. Notifications
- [ ] Add a notification bell/dropdown in the navbar (shared across all pages)
- [ ] Fetch from `GET /api/notifications`
- [ ] Show unread count badge
- [ ] Mark as read on click (`PUT /api/notifications/:id/read`)

### 3. Community Page — Full JS Integration
- [ ] Dynamic rendering from API (see "In Progress" above)
- [ ] "Post a Request" modal/form
- [ ] Filter by category and location
- [ ] Pagination (API supports `page` + `limit` query params)
- [ ] Urgent requests highlighted (accent color, already in CSS)

### 4. Browse Page — API Integration
- [ ] Confirm item cards load from `GET /api/items`
- [ ] Search bar wired to `?search=` param
- [ ] Category filter wired to `?category=` param
- [ ] Price range filter wired to `?minPrice=&maxPrice=`
- [ ] Location filter wired to `?location=`
- [ ] Pagination controls

### 5. Item Detail Page — API Integration
- [ ] Load real item data from `GET /api/items/:id`
- [ ] Display owner name, avatar, verified badge, rating
- [ ] "Rent Now" button → calls `POST /api/rentals` (must be logged in + verified)
- [ ] Show availability calendar (respect `bookedDates` from item model)
- [ ] Load and display reviews from `GET /api/reviews/item/:itemId`

### 6. List Item Page — API Integration
- [ ] Wire form to `POST /api/items` (multipart/form-data with images)
- [ ] Guard: redirect to `/verify-identity.html` if user not verified

### 7. Login / Register — Full Auth Flow
- [ ] On login success, save JWT to `localStorage`
- [ ] On register success, auto-login
- [ ] Navbar updates to show avatar + logout after login
- [ ] All pages redirect to login if token missing/expired

### 8. Profile Page — API Integration
- [ ] Load user data from `GET /api/auth/me`
- [ ] Allow editing name, phone, bio, location, avatar image
- [ ] Save via `PUT /api/users/profile`
- [ ] Display verification badge based on `isVerified` field

### 9. Verify Identity Page — Integration
- [ ] On submit, call `POST /api/auth/verify-identity`
- [ ] Redirect back to intended action after success

---

## ⬜ TODO — BACKEND

### 1. Availability / Date Conflict Check
- [ ] When creating a rental, check if requested dates overlap with `bookedDates` in `Item` model
- [ ] Return a clear error if dates are unavailable

### 2. Real Identity Verification (Persona / Sumsub)
- [ ] Replace mock auto-approve in `submitVerification` with real Persona API call
- [ ] Handle webhook for async verification result
- [ ] More states: `pending`, `failed`

### 3. Geolocation / Radius Search
- [ ] Add GeoJSON coordinates to `User` and `Item` models
- [ ] Filter items and community requests by distance (`$near` MongoDB query)

### 4. Notification — Mark All Read
- [ ] Add `PUT /api/notifications/read-all` endpoint

### 5. OTP Store — Production Ready
- [ ] Replace in-memory `otpStore` with Redis (in-memory leaks on server restart)

### 6. Payment Integration (Future)
- [ ] Stripe or Razorpay for deposit collection
- [ ] Auto-refund on cancellation

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
