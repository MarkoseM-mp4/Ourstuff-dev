Product Name: OurStuff
Tagline: Rent & Share. Anything.

1. Product Vision

OurStuff is a hyperlocal peer-to-peer rental platform where:

Users list items they own

Others rent them

If item not found → post a community request

Nearby users get notified

Primary UX goal:
Minimal, friendly, community-driven, trustworthy.

2. Design System

Your current landing page defines the core system. Everything must follow it.

🎨 Color Palette
Token	Value	Usage
Primary	#2563EB	Buttons, highlights
Primary Dark	#1D4ED8	Hover states
Secondary	#0D9488	Accent hover
Accent	#F59E0B	Highlights
Background	#F8FAFC	Page background
Surface	#FFFFFF	Cards
Border	#E2E8F0	Dividers
Text	#1E293B	Main text
Muted	#64748B	Secondary text
🧱 UI Components
1. Buttons

Rounded (20–32px radius)

Solid primary

Shadow on hover

Slight lift animation

2. Cards

Border radius: 16px

Subtle shadow

Border 1px solid var(--border)

Hover: slight lift + border color change

3. Inputs

Rounded

Soft border

Blue focus state

Clean typography

4. Grid

Responsive

3–5 columns depending on device

Consistent spacing (14–24px)

3. Page Design Structure
🏠 1. Home Page (Already Built)

Contains:

Loading animation

Sticky navbar

Hero section

Search bar

Category grid

CTA button

No changes required.

📦 2. Browse Items Page

Layout:

Same navbar

Search bar at top

Filter section (Category / Price / Location)

Item grid

Each item card:

Image (top)

Title

Price per day

Location

Rating

“View” button

Must visually match browse-card style.

📄 3. Item Detail Page

Layout:

Navbar

Large image carousel

Item title

Owner name

Price

Description

Availability calendar

“Rent Now” button

Design Rules:

White surface cards

Clear spacing

Primary CTA button centered

➕ 4. List Item Page

Centered form:

Title

Description

Price

Category dropdown

Image upload

Location

Deposit

Submit button (primary style)

👥 5. Community Feed Page

Layout:

Same card style as browse grid

Cards show:

Item requested

Budget

Location

Duration

“Respond” button

Color highlight for urgent requests (Accent color).

👤 6. Dashboard Page

Sections:

My Listings

My Rentals

My Requests

Notifications

Tabs or stacked cards layout.

4. User Experience Flow
Rental Flow

Home → Search → Item → Select Dates → Request → Accept → Complete → Review

Community Flow

Search → Not found → Create Request → Nearby notified → Accept → Rental Flow

5. Responsive Design Rules

Under 600px → 4-column grid

Under 480px → 3-column grid

Hide navbar links under 420px

Keep CTA large and centered

6. Accessibility Guidelines

Minimum 14px text

High contrast buttons

Focus states visible

Click targets ≥ 44px

dentity Verification (Using Persona)
🎯 Objective

Verify users before renting or listing

Show verified badge

Increase trust

Reduce fraud risk

🔵 UX Flow (Matches Your UI)
1️⃣ When User Tries to:

List an item

Rent an item

Respond to community request

If not verified → redirect to:

/verify-identity

🔹 Verify Identity Page Layout

Keep same:

Navbar

White surface card

Rounded 16px radius

Blue CTA

Inter font

Layout Structure

Centered Card:

Title:
Verify Your Identity

Subtitle:
Required to rent or list items.

Steps:

Upload Government ID

Take Selfie

Confirm Details

Button:
Start Verification (Primary Blue Button)

🔹 Profile Page Update

Add verification badge:

✔ Verified User (Green badge)

If not verified:
⚠ Not Verified (Gray)

