# AGENTS.md

## Project: HomeRadar Frontend

This project is a modern SaaS web application that helps users find rental and future home-buying opportunities via real-time alerts.

---

## 🧱 Tech Stack

- Framework: Next.js (App Router)
- Language: TypeScript
- Styling: Tailwind CSS
- UI Components: shadcn/ui (or similar)
- Authentication: Clerk
  - Email/password
  - Google login
  - Facebook login
- Data Fetching: React Query (TanStack Query)
- Forms: React Hook Form + Zod
- API: REST (external backend)

---

## 🎨 Design Principles

- Clean, modern SaaS UI
- Mobile-first and responsive
- Accessible (semantic HTML, good contrast)
- Minimal and uncluttered layout
- Consistent spacing and typography
- Subtle animations (hover, transitions)

---

## 🌐 Pages Structure

### Public

- `/` → Landing page

### Auth

- `/sign-in`
- `/sign-up`

### Protected (require authentication)

- `/dashboard`
- `/filters`
- `/profile`

---

## 🧭 Navigation Rules

### When NOT authenticated:

- Show:
  - Logo
  - Sign In
  - Register

### When authenticated:

- Show:
  - Dashboard
  - Filters
  - Profile (dropdown with logout)

---

## 🏠 Landing Page Requirements

The landing page must include:

### Hero Section

- Headline: “Find your next home before anyone else”
- Subheadline explaining instant alerts
- CTA buttons:
  - Get Started
  - See How It Works

### Features Section

- Real-time alerts
- Smart filters
- Aggregated listings
- Save properties

### How It Works

1. Create filters
2. We scan listings
3. Get notified instantly

### Pricing Section

- Free Plan:
  - 1 filter
  - Delayed alerts
- Pro Plan:
  - Unlimited filters
  - Instant alerts
  - Priority matching

### Additional Sections

- Testimonials (mock data)
- FAQ
- Footer (privacy, terms, contact)

---

## 🔐 Authentication (Clerk)

- Use Clerk for all authentication flows
- Support:
  - Email/password
  - Google login
  - Facebook login

### Auth Pages

- `/sign-in`: login form + social login
- `/sign-up`: register form + social login

---

## 📊 Dashboard

- Display matched properties
- Property card must include:
  - Image
  - Price
  - Key details (beds, baths, location)
  - “View Listing” button

### States

- Loading state (skeleton)
- Empty state (no matches)

---

## 🔍 Filters Page

- Form fields:
  - Price range
  - Bedrooms
  - Bathrooms
  - Location
  - Keywords

- Features:
  - Create filter
  - Edit filter
  - Delete filter
  - List existing filters

---

## 👤 Profile Page

- Display user information
- Allow basic updates
- Logout functionality

---

## 🔗 API Integration

- Use environment variable:
  - `NEXT_PUBLIC_API_URL`

- Use React Query for:
  - Fetching
  - Mutations
  - Caching

### Example Endpoints

- `GET /properties`
- `GET /matches`
- `CRUD /filters`

---

## ✅ Validation

- Use Zod for all forms
- Integrate with React Hook Form
- Requirements:
  - Inline validation errors
  - Disable submit when invalid

---

## 🔒 Protected Routes

- Require authentication for:
  - `/dashboard`
  - `/filters`
  - `/profile`

- Redirect unauthenticated users to `/sign-in`

---

## ⚡ UX Requirements

- Loading states (skeletons or spinners)
- Toast notifications (success/error)
- Empty states with helpful messages
- Responsive layouts
- Fast interactions

---

## 📁 Project Structure

Use feature-based organization:
