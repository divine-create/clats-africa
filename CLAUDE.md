# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

CLATS is a Next.js 16 (App Router) educational platform teaching kids tech skills, with three business models sharing one codebase:
- **B2C**: Parents sign up, manage child profiles, track progress (`src/app/dashboard/`, `src/app/child/`).
- **B2B/B2G**: Schools/NGOs/government buy bulk "seats" and distribute access codes that bypass the paywall (`src/app/coordinator/`, `src/app/api/supabase/b2b/*`). See `B2B_ARCHITECTURE.md` for the intended end-state design.
- **Partner** program (`src/app/partner/`), separate from B2B coordinators.

Also shipped as a mobile app via Capacitor (`android/`, `ios/`) — the web app is wrapped, not rewritten. `capacitor.config.ts` currently points `server.url` at `https://app.clats.org` (loads the live site inside the shell) rather than `webDir: out`. `EXPO_MIGRATION_PLAN.md` documents a possible future move to native Expo — not started.

## Commands

```
npm run dev      # start dev server (localhost:3000)
npm run build    # production build
npm run start    # run production build
npm run lint     # eslint (flat config, eslint-config-next)
```

There is no test runner configured in this repo — don't assume `npm test` exists.

`next.config.ts` sets `typescript.ignoreBuildErrors: true`, so `npm run build` succeeds even with type errors. Don't rely on a green build as proof of type safety — check `tsc`/editor diagnostics directly when it matters.

## Architecture

**Client-heavy, singleton-context app.** Almost every page/component is `"use client"`. `src/context/AppContext.tsx` (`AppProvider`/`useApp()`) is the single global store for session, theme, language, parent, and active child — read it before adding new global state rather than introducing another context or prop-drilling deeper.

**Data flow: localStorage-first, Supabase-backed.** `src/utils/config.ts` (`S` object) is the localStorage layer (session, time tracking, settings, language) and also hosts client-side proxy functions (`syncToSupabase`, `pullParentFromSupabase`, `pullCurriculumFromSupabase`, `logSystemEvent`, etc.) that call the Next.js API routes below — components never call Supabase directly. The app is designed to keep working offline/degraded: most of these proxies swallow fetch failures and fall back to localStorage or in-memory defaults rather than surfacing errors to the UI. When editing this sync logic, preserve that fallback behavior intentionally, and see the known-issues note below about failures being *silently* swallowed where they shouldn't be.

**Two Supabase access paths:**
- `src/utils/supabaseClient.ts` — anon-key client, importable client-side.
- `src/app/api/supabase/**/route.ts` — ~40 server route handlers (auth, b2b, curriculum, sessions, storage, partner, etc.) that the client fetches instead of hitting Supabase directly for anything sensitive. When adding a new Supabase-backed feature, add a route under `src/app/api/supabase/` and a corresponding proxy fn in `src/utils/config.ts`, following the existing pattern.

**Curriculum data** has a static fallback in `src/data/curriculum.ts` and a dynamic version pulled from Supabase via `pullCurriculumFromSupabase()`, remapped into the same shape and cached on `window.__supabaseCurriculumData`. Age groups are normalized to three buckets: `early` (early explorers), `young` (young innovators), `future` (future builders) — see `AGE_LABEL`/`AGE_META`/`DEV_DEFAULTS` in `config.ts`.

**Kid-facing "Kobe" AI companion / chat** goes through `src/app/api/chat/route.ts` (Google GenAI). Tone/complexity per age group is driven by `AGE_META[...].kobeStyle` strings in `config.ts` — keep new AI-facing copy consistent with those personas.

**Games** live under `src/components/games/` (e.g. `PhishingSwipe`, `DeepfakeDetective`, `TeachableMachine`, `SmartCityBuilder`) and are surfaced through `ChildGames.tsx`.

**Path alias**: `@/*` → `src/*` (see `tsconfig.json`).

## Known architectural issues (read before touching related code)

These are tracked in `production_audit_report.md` and `AI_AGENT_README.md` — check there for the full list before assuming something is a new bug:
- No `middleware.ts`; protected routes gate on client-side `useEffect`, causing auth-flash on load.
- No `error.tsx`/`loading.tsx` boundaries anywhere in `src/app/`.
- Supabase errors in several API routes (`parent/get`, `auth/login`, `child/login`, `auth/google/verify`, `sync`) are logged and swallowed rather than surfaced — a failed query can read as "0 children" instead of an error.
- `src/utils/timeTracker.ts` posts to `/api/supabase/sessions`, but confirm the POST handler exists before assuming session analytics are being persisted (this was previously missing).
- Dark mode mixes manual `isDark ? ... : ...` conditionals with Tailwind's `dark:` modifier, which can produce invisible text since Tailwind v4 dark mode follows `prefers-color-scheme` by default — when touching themed UI, follow whichever pattern the surrounding component already uses rather than mixing both.
- `ChildApp.tsx` has had infinite-render risk from unmemoized `useEffect` dependencies (notably the `parent` object) — be careful reintroducing object/array deps there without memoization.

## Repo hygiene note

The working tree accumulates ad hoc `test-*.js/mjs`, `scratch*.ts/js`, and `*_output.txt` files at the repo root from prior debugging sessions. These aren't part of the app — don't treat them as reference implementations, and prefer cleaning up your own scratch files rather than leaving new ones at the root (use the scratch/ dir or your session scratchpad instead).
