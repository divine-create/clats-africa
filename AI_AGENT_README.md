# CLATS Africa - AI Agent Context

## 🎯 Application Overview
**CLATS (CLATS Learning Platform)** is an educational platform aimed at teaching children tech skills ("Building Tomorrow's Tech Minds Today!"). 
It supports multiple business models:
- **B2C (Parent/Child):** Parents subscribe, manage their kids' profiles, and track progress. Children log in to complete learning modules.
- **B2B / B2G (Sponsors/Schools/Government):** Organizations can purchase bulk seats (licenses) and distribute access codes to bypass the consumer paywall.

## 🛠 Tech Stack
- **Framework:** Next.js 16.3.0 (App Router)
- **UI & Styling:** React 19.2.8, Tailwind CSS v4, Lucide React, Framer Motion
- **Backend & Database:** Supabase (for Auth, Database, and Storage)
- **Mobile Packaging:** Capacitor (Wrapping the web app for iOS/Android distribution)
- **AI Integration:** Google GenAI
- **State Management:** React Context (`AppContext.tsx`), heavily reliant on `localStorage` for offline/session state.

## 📂 Core Architecture & Important Files
- **`src/app/`**: Next.js App Router (contains routes for `/auth`, `/child`, `/dashboard`, `/admin`, etc.)
- **`src/context/`**: Global state management (`AppContext.tsx`).
- **`supabase/`**: Contains SQL migrations (e.g., `supabase_referral_migration.sql`, `seed_curriculum_data.sql`).
- **`B2B_ARCHITECTURE.md`**: Defines the planned architecture for Schools/Sponsors/Government bulk purchasing and access codes.
- **`EXPO_MIGRATION_PLAN.md`**: Outlines a future plan to transition the app from a Capacitor-wrapped Next.js web app to a true Native Expo app.
- **`production_audit_report.md`**: Contains a list of critical pre-production bugs (e.g., missing API endpoints, infinite rendering loops, Tailwind v4 dark mode conflicts, and missing Next.js middleware for route protection).

## ⚠️ Known Architectural Issues & Quirks (Read Before Coding!)
1. **Routing Protection:** The app currently lacks Next.js `middleware.ts`. Protected routes rely on client-side `useEffect` checks, causing auth flashes.
2. **Error Handling:** The app lacks `error.tsx` and `loading.tsx` boundaries. Supabase DB errors in API routes are often silently swallowed or logged as warnings without notifying the frontend.
3. **Dark Mode Conflict:** The app mixes manual dark mode logic (`isDark ? "bg-[#111827]" : "bg-white"`) with Tailwind's `dark:` modifier. Tailwind v4 is using `prefers-color-scheme` which clashes with manual toggles, causing invisible text issues.
4. **Performance:** Beware of `useEffect` infinite loops in components like `ChildApp.tsx` due to unmemoized prop dependencies.
5. **Session Analytics:** The `src/utils/timeTracker.ts` currently tries to POST to `/api/supabase/sessions` which is missing its POST handler.

## 🚀 How to Help
When opening a new session, you can immediately begin tackling tasks from the `production_audit_report.md` or implementing the B2B features outlined in `B2B_ARCHITECTURE.md`.
