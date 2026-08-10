/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Next.js Route Handler — GET /api/supabase/health-check
 * Verifies all 16 CLATS database tables exist and are accessible.
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key || url.includes("your-project-id")) return null;

  try {
    return createClient(url, key, { auth: { persistSession: false } });
  } catch (e) {
    console.error("Failed to initialize Supabase client:", e);
    return null;
  }
}

const REQUIRED_TABLES = [
  "clats_parents",
  "clats_children",
  "learning_pathways",
  "modules",
  "lessons",
  "quizzes",
  "child_progress",
  "rewards_badges",
  "child_rewards",
  "games",
  "companion_content",
  "waitlist",
  "user_location",
  "learning_sessions",
  "system_logs",
  "content_releases",
  "companion_config",
];

export async function GET() {
  const url = process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";
  const isConfigured = !!url && !url.includes("your-project-id") && !!key;

  if (!isConfigured) {
    return NextResponse.json({
      ok: false,
      synced: false,
      msg: "Supabase connection parameters are not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file.",
    });
  }

  const sb = getSupabaseClient();
  if (!sb) {
    return NextResponse.json({
      ok: false,
      synced: false,
      msg: "Could not initialize Supabase client. Verify your credentials.",
    });
  }

  const results: Record<string, { status: "OK" | "FAIL"; error?: string }> = {};
  let anyError = false;

  for (const table of REQUIRED_TABLES) {
    try {
      const { error } = await sb.from(table).select("*").limit(1);
      if (error) {
        results[table] = { status: "FAIL", error: error.message };
        anyError = true;
      } else {
        results[table] = { status: "OK" };
      }
    } catch (e: any) {
      results[table] = { status: "FAIL", error: e.message || String(e) };
      anyError = true;
    }
  }

  return NextResponse.json({
    ok: !anyError,
    synced: true,
    results,
    msg: anyError
      ? "Some tables are missing. Run the SQL schema script in your Supabase SQL editor to create them."
      : "All tables are verified and responsive on your Supabase backend!",
  });
}
