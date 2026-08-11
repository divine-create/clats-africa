# CLATS Africa - Pre-Production Audit Report

The AI Strike Team has completed a comprehensive audit of the application's routing, APIs, components, and UI to ensure production readiness. Below is the consolidated list of issues that must be addressed before deployment.

## 1. Data Loss & API Vulnerabilities (High Priority)
- **Silent Database Errors (`clats_children`)**: In multiple routes (`parent/get`, `auth/login`, `child/login`, `auth/google/verify`), errors from Supabase queries are completely ignored. If the database connection drops or a query fails, `childrenData` returns `null` instead of throwing an error. The system incorrectly assumes the parent has "0 children", which can lead to data loss or overwriting on the frontend.
- **False Positives in Sync**: In `src/app/api/supabase/sync/route.ts` and `src/app/api/auth/google/verify/route.ts`, catastrophic database insertion failures (e.g., `childErr`, `insertErr`) are simply logged to the console via `console.warn`, and the endpoints still return a `200 OK` success message to the frontend.
- **Missing Session Tracking API**: `src/utils/timeTracker.ts` attempts to `POST` analytics data to `/api/supabase/sessions` to log child screen time and lesson duration, but the API route entirely lacks a `POST()` handler. All session data is currently failing to save.

## 2. Rendering & State Bugs (High Priority)
- **Infinite Render Loop (`ChildApp.tsx`)**: An infinite `useEffect` loop exists around line 194. It depends directly on the `parent` object passed via props without memoization. This causes the component to constantly destroy and recreate interval timers on every single render cycle, crippling client-side performance.
- **Prop Drilling**: `ChildApp.tsx` forces deep prop-drilling for core contextual data (`parent`, `child`, `theme`, `lang`) instead of using React Context, exacerbating re-rendering bugs.

## 3. UI/UX Accessibility & Styling (Medium Priority)
- **Critical Dark Mode Failure**: The codebase mixes manual dark theme logic (e.g., `isDark ? "bg-[#111827]" : "bg-white"`) with Tailwind's `dark:` classes (e.g., `dark:text-white`). Because Tailwind v4 defaults to `prefers-color-scheme`, if a user manually enables "Dark Mode" inside the app while their OS is Light Mode, the backgrounds will turn black but the `dark:text-white` classes will ignore it, resulting in invisible black text on black backgrounds.
- **Invalid Tailwind Classes**: Dozens of nonexistent Tailwind classes are scattered across `AdminDashboard.tsx` and `coordinator/login`. E.g., `border-slate-20e`, `border-slate-105`, `border-slate-205`, `text-slate-850`, `bg-slate-450/5`. These silently fail to apply.
- **Broken Mobile Admin Sidebar**: In `AdminDashboard.tsx`, the sidebar lacks mobile visibility controls (`hidden md:flex`). On mobile phones, the entire sidebar renders at full width above the main content, completely burying the dashboard metrics out of view.
- **Broken Logo Fallbacks**: `CLATSLogo.tsx` attempts to load `/input_file_3.png` and `/assets/input_file_3.png` if the main logo fails to load. Neither of these fallback assets exist in the `public` directory.

## 4. Routing & Protection (Medium Priority)
- **Zero Error Boundaries**: The entire `src/app` directory lacks `error.tsx` or `global-error.tsx`. Any unexpected runtime crash in production will crash the whole page rather than displaying a fallback UI.
- **Zero Suspense Loaders**: There are no `loading.tsx` files, meaning users will stare at blank screens during server-side data fetching route transitions.
- **Client-Side Auth Flashes**: Because there is no Next.js `middleware.ts`, route protection (e.g., in `/dashboard`) relies on client-side `useEffect` checks. This causes a visible "flash" of protected content before the router kicks the unauthenticated user back to `/auth/login`.
- **Missing SEO Metadata**: Because almost all pages are marked `'use client'`, they cannot natively export metadata. They are missing unique `<title>` and `<meta>` tags for SEO.
- **Unhandled Dynamic Routes**: `/admin/[[...slug]]` swallows deep, invalid routes (e.g., `/admin/users/invalid/deep/path`) and defaults to rendering the main dashboard instead of returning a proper `404 Not Found`.

## 5. Leftover Placeholder Data (Low Priority)
- **Mock Data**: `B2BCoordinatorDashboard.tsx` still initializes with a hardcoded mock school district (`CLATS-DEMO-2026`).
- **Placeholder Dummy Strings**: `AdminDashboard.tsx` contains static fake data like `Admin Profile: onyiobazi.aquah@clats.io` and `Metric anomaly alerts: None`.
- **Broken Links**: The Privacy Policy and Terms of Service links in the `/pricing` page and `ParentDashboard.tsx` footer are still dead links (`href="#"`).

---

**Next Steps:** Review the list and let me know which area you would like us to tackle fixing first!
