/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Next.js Route Handler — POST /api/supabase/storage/upload
 * Uploads companion voice files to Supabase storage bucket.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import path from "path";

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

export async function POST(req: NextRequest) {
  try {
    const { fileName, base64Data, contentType } = await req.json();

    if (!fileName || !base64Data) {
      return NextResponse.json({ ok: false, msg: "Missing fileName or base64Data." }, { status: 400 });
    }

    const cleanName = path.basename(fileName);
    const buffer = Buffer.from(base64Data, "base64");

    const sb = getSupabaseClient();
    let finalUrl = "";

    if (sb) {
      // Ensure bucket exists
      try {
        await sb.storage.createBucket("companion-voices", { public: true });
      } catch (err) {
        // bucket might already exist
      }

      const { error } = await sb.storage
        .from("companion-voices")
        .upload(cleanName, buffer, {
          contentType: contentType || "audio/mpeg",
          upsert: true,
        });

      if (!error) {
        const { data: urlData } = sb.storage.from("companion-voices").getPublicUrl(cleanName);
        if (urlData?.publicUrl) {
          finalUrl = urlData.publicUrl;
        }
      } else {
        console.warn("Supabase upload error details:", error);
        return NextResponse.json({ ok: false, msg: "Supabase upload failed." }, { status: 500 });
      }
    } else {
      return NextResponse.json({ ok: false, msg: "Supabase not configured." }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      fileName: cleanName,
      url: finalUrl,
      source: "supabase",
    });
  } catch (err: any) {
    console.error("Upload handler error:", err);
    return NextResponse.json({ ok: false, msg: err.message }, { status: 500 });
  }
}
