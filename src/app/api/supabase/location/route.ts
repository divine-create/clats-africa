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
    const body = await req.json();
    const { email, country, region, city, timezone } = body;
    if (!email) return NextResponse.json({ ok: false, msg: "email required" }, { status: 400 });

    const sb = getSB();
    if (!sb) return NextResponse.json({ ok: false, msg: "Supabase not configured" });

    const { error } = await sb.from("user_location").insert([{
      email,
      country: country || "Unknown",
      region: region || "Unknown",
      city: city || null,
      timezone: timezone || "UTC",
    }]);

    if (error) return NextResponse.json({ ok: false, msg: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, msg: e.message }, { status: 500 });
  }
}
