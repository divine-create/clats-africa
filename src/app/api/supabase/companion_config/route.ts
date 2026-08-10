import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSB() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key || url.includes("your-project-id")) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET() {
  try {
    const sb = getSB();
    if (!sb) return NextResponse.json({ ok: false, data: [] });
    const { data, error } = await sb.from("companion_config").select("*");
    if (error) return NextResponse.json({ ok: false, error: error.message, data: [] });
    return NextResponse.json({ ok: true, data: data || [] });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message, data: [] });
  }
}
