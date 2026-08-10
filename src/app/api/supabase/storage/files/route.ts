/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Next.js Route Handler — GET /api/supabase/storage/files
 * Lists companion voice files from Supabase storage bucket.
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key || url.includes("your-project-id")) return null;
  try {
    return createClient(url, key, { auth: { persistSession: false } });
  } catch {
    return null;
  }
}

export async function GET() {
  const results: { name: string; source: string; url: string }[] = [];
  const sb = getSupabaseClient();

  if (sb) {
    try {
      const { data, error } = await sb.storage.from("companion-voices").list();
      if (!error && data) {
        data.forEach((item: any) => {
          const { data: urlData } = sb.storage
            .from("companion-voices")
            .getPublicUrl(item.name);
          if (urlData?.publicUrl) {
            results.push({ name: item.name, source: "supabase", url: urlData.publicUrl });
          }
        });
      }
    } catch (e) {
      console.warn("Supabase storage list error:", e);
    }
  }

  return NextResponse.json({ ok: true, files: results });
}
