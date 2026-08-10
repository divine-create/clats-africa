/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Next.js Route Handler — GET /api/supabase/status
 * Checks whether Supabase credentials are configured.
 */

import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";

  const isEnabled =
    !!url &&
    !url.includes("your-project-id") &&
    !!key;

  return NextResponse.json({
    enabled: isEnabled,
    url: url || "Not configured",
  });
}
