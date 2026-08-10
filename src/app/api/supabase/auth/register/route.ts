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
    const { email, password, name, timezone, device, browser } = await req.json();

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
      // If user already exists in auth.users, Supabase might not return an error depending on settings, 
      // but it won't return a session if email confirmations are enabled. 
      // If it fails with "User already registered", handle it.
      return NextResponse.json({ ok: false, msg: authError.message }, { status: 400 });
    }

    // 2. Insert into the legacy clats_parents table for compatibility
    const parentPayload = {
      email: email.toLowerCase().trim(),
      password: "SUPABASE_AUTH_MANAGED", // Obsoleting the plaintext password column
      name,
      created_at: Date.now(),
      tutorial_completed: false,
      timezone: timezone || "UTC",
      provider: "email",
      last_login_at: Date.now(),
      login_device: device || "Unknown",
      login_browser: browser || "Unknown",
      user_id: authData.user?.id || "",
    };

    const { error: insertError } = await sb.from("clats_parents").insert([parentPayload]);
    
    // Ignore duplicate key error if they somehow already exist in clats_parents
    if (insertError && insertError.code !== '23505') {
      console.warn("Failed to insert into clats_parents:", insertError);
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
