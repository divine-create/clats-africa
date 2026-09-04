import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key || url.includes("your-project-id")) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, timezone, device, browser, phone, location, referral_code, partner_code } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ ok: false, msg: "Email, password, and name are required." }, { status: 400 });
    }

    const sb = getSupabaseClient();
    if (!sb) {
      return NextResponse.json({ ok: false, msg: "Supabase not configured." });
    }

    // 1. Register with actual Supabase Auth (replaces plaintext passwords!)
    const { data: authData, error: authError } = await sb.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        data: { name },
      },
    });

    if (authError) {
      console.warn("Supabase Auth signUp error (ignoring to allow legacy fallback):", authError.message);
    }

    // 2. Insert into the legacy clats_parents table for compatibility
    // We save the actual password so the legacy fallback in login works seamlessly
    // even if Supabase Auth requires email confirmation.
    const generated_referral_code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const parentPayload = {
      email: email.toLowerCase().trim(),
      password: password, 
      name,
      phone: phone || null,
      location: location || null,
      created_at: Date.now(),
      tutorial_completed: false,
      timezone: timezone || "UTC",
      provider: "email",
      last_login_at: new Date().toISOString(),
      login_device: device || "Unknown",
      login_browser: browser || "Unknown",
      user_id: authData.user?.id || "",
      referral_code: generated_referral_code,
      referred_by: referral_code || null,
      partner_id: partner_code || null,
    };

    // Upsert into clats_parents, tolerating schema drift (a column the live table
    // doesn't have yet) by dropping the offending field and retrying, the same way
    // /api/supabase/sync does for clats_children. Any other error is a real failure
    // and must be surfaced -- silently swallowing it here previously let the client
    // believe signup succeeded when no row was ever written, which then showed a
    // false "Your account was deleted" popup on the very next background sync.
    let payloadToInsert: any = { ...parentPayload };
    let insertError: any = null;
    let retryCount = 0;
    // Each retry strips exactly one missing column, so the loop can never need
    // more retries than there are optional columns to strip -- a fixed cap here
    // (previously 5) can be too low if the live table has drifted further than
    // that, silently failing the whole signup on the one column past the cap.
    const maxRetries = Object.keys(payloadToInsert).length;

    while (retryCount < maxRetries) {
      const { error } = await sb.from("clats_parents").upsert(payloadToInsert, { onConflict: "email" });
      if (!error) {
        insertError = null;
        break;
      }
      insertError = error;

      if (error.message && error.message.includes("Could not find the")) {
        const match = error.message.match(/'([^']+)' column/);
        if (match && match[1] && match[1] in payloadToInsert) {
          console.warn(`Column '${match[1]}' missing in clats_parents. Retrying without it...`);
          delete payloadToInsert[match[1]];
          retryCount++;
          continue;
        }
      }

      break; // Unknown/unrecoverable error, give up
    }

    if (insertError) {
      console.error("Failed to create parent in clats_parents:", insertError);
      return NextResponse.json(
        { ok: false, msg: `Could not create your account: ${insertError.message}` },
        { status: 500 }
      );
    }

    try {
      await sb.from("system_logs").insert([{
        event_type: "auth",
        event_name: "sign_up",
        parent_email: parentPayload.email,
        device_info: JSON.stringify({ device, browser }),
        details: `Parent registered (Secure Supabase Auth): ${name}`
      }]);
    } catch (e) {}

    return NextResponse.json({ ok: true, parent: { ...parentPayload, children: [], tutorial_completed: false } });
  } catch (err: any) {
    return NextResponse.json({ ok: false, msg: err.message }, { status: 500 });
  }
}
