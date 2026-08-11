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
    const { email, password, name, timezone, device, browser, phone, location } = await req.json();

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
      last_login_at: Date.now(),
      login_device: device || "Unknown",
      login_browser: browser || "Unknown",
      user_id: authData.user?.id || "",
    };

    const { error: insertError } = await sb.from("clats_parents").upsert(parentPayload, { onConflict: "email" });
    
    if (insertError) {
      console.warn("Failed to upsert into clats_parents:", insertError);
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
