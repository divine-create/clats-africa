import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSB() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key || url.includes("your-project-id")) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: NextRequest) {
  try {
    const { email, message } = await req.json();
    if (!email || !message) {
      return NextResponse.json({ ok: false, msg: "email and message required" }, { status: 400 });
    }
    const sb = getSB();
    if (!sb) return NextResponse.json({ ok: false, msg: "Supabase not configured" });

    const { error } = await sb.from("waitlist").insert([{
      email,
      message,
      created_at: new Date().toISOString(),
    }]);

    if (error) return NextResponse.json({ ok: false, msg: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, msg: e.message }, { status: 500 });
  }
}
