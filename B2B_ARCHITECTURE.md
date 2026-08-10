# B2B Educational & Sponsor System Architecture

## 1. Executive Summary
The B2B (Business-to-Business) and B2G (Business-to-Government) system allows CLATS to scale beyond individual B2C parent subscriptions. It empowers educational institutions (schools), NGOs, corporate CSR (Corporate Social Responsibility) programs, and government ministries to bulk-purchase "seats" and distribute them to learners. 

Currently, the Admin Dashboard has UI placeholders for tracking **Schools** and **Sponsors**. This document outlines the comprehensive architecture required to make this system fully functional across the entire stack.

---

## 2. Database Schema (Supabase)

To support multi-tenant B2B relationships, we need three primary tables added to the Supabase schema:

### `b2b_organizations`
Tracks the actual purchasing entity (The School, NGO, or Government Body).
* `id` (uuid, primary key)
* `name` (string) - e.g., "Alausa Model Academy"
* `type` (enum) - `School`, `Corporate CSR`, `NGO`, `Government Block Grant`
* `region` (string) - e.g., "Lagos State"
* `total_seats` (int) - The number of licenses purchased/granted.
* `status` (enum) - `Active`, `Suspended`, `Expired`

### `b2b_license_keys`
The codes distributed to end-users to bypass the paywall.
* `id` (uuid, primary key)
* `org_id` (uuid, foreign key -> b2b_organizations)
* `code` (string, unique) - e.g., `CLATS-LAGOS-2026`
* `max_uses` (int) - Number of times this specific code can be used.
* `current_uses` (int) - Count of successful registrations.
* `expires_at` (timestamp)

### `users` & `children` (Updates to existing tables)
* **Users Table**: Add `role` (`B2C_PARENT`, `B2B_COORDINATOR`, `SUPER_ADMIN`).
* **Users Table**: Add `org_id` (nullable) - Links a Coordinator to their School.
* **Children Table**: Add `license_used` (nullable, foreign key -> b2b_license_keys) - Tracks which child used which sponsor's code.

---

## 3. Core User Flows

### A. The B2B Coordinator Flow (The Teacher / Sponsor Admin)
1. **Login**: The school coordinator logs into CLATS. The system detects `role === 'B2B_COORDINATOR'`.
2. **B2B Portal**: Instead of the standard Parent Dashboard, they are routed to a specialized `B2BPortal.tsx`.
3. **Capabilities**:
   * View total seats used vs. available.
   * Generate new access codes for classrooms (e.g., generating 30 seats for "Primary 4").
   * View aggregated analytics for their specific school (average XP, completion rates) without seeing data from other schools.

### B. The End-User Flow (The Student / Parent Onboarding)
1. **Sign Up**: The user downloads the app or visits the web portal.
2. **Access Code Bypass**: During the onboarding flow (`Onboarding.tsx`), an option is presented: *"Have a School or Sponsor Code?"*
3. **Validation**: The user enters `CLATS-LAGOS-2026`. The system hits the `/api/b2b/validate-code` endpoint.
4. **Provisioning**: If valid, the payment/Stripe wall is bypassed. The child's profile is created and strictly tied to the Sponsor's `org_id`.

---

## 4. Required Backend API Routes

We will need to construct the following endpoints in the Next.js `src/app/api/supabase/` directory:

* `POST /api/supabase/b2b/organizations`: Create/update a school or sponsor (Used by Super Admin).
* `GET /api/supabase/b2b/organizations`: Fetch lists of schools/sponsors for the Admin Dashboard.
* `POST /api/supabase/b2b/licenses`: Generate a new license code for an organization.
* `POST /api/supabase/b2b/validate-code`: Takes a `{ code }` payload, checks if `current_uses < max_uses` and date is valid, then increments `current_uses` and returns a success token.

---

## 5. UI Implementation Plan

To bring this architecture to life in the codebase, the following UI tasks must be executed:

1. **AdminDashboard.tsx Integration**: 
   * Currently, the "B2B Schools" and "CSR Sponsors" tabs use local React state (`regionsServed`, `b2bSchools`). These must be wired up to the new `/api/supabase/b2b/organizations` endpoints.
2. **Onboarding.tsx Modification**:
   * Add a "Use Access Code" button in the subscription/payment step.
   * Add a loading state while verifying the code against the database.
3. **Create `B2BCoordinatorDashboard.tsx`**:
   * A new component heavily inspired by the Parent Dashboard, but tailored for a teacher. It will list all students registered under their `org_id`, allowing the teacher to monitor progress, assign specific modules as homework, and print bulk PDF report cards.

---

## 6. Analytics & Impact Reporting

Because B2B and B2G sales usually require proof of impact (e.g., proving to the Ministry of Education that the app works), the system will generate **Impact Reports**:
* **Data Isolation**: Analytics queries can filter `children` by `org_id`.
* **Export**: The `pdfGenerator.ts` will be updated to support exporting a "Sponsor Impact Report", detailing exactly how many lessons the sponsored children completed and what their average XP growth was over the term.
