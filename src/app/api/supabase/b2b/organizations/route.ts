import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const getSB = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key || url.includes("your-project-id")) return null;
  return createClient(url, key, { auth: { persistSession: false } });
};

export async function GET() {
  const sb = getSB();
  if (!sb) return NextResponse.json({ ok: false, msg: "Supabase not configured." });

  try {
    const { data, error } = await sb
      .from("b2b_organizations")
      .select(`
        *,
        b2b_license_keys (
          code,
          current_uses,
          max_uses
        )
      `)
      .order("created_at", { ascending: false });
      
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, data: data || [] });
  } catch (err: any) {
    return NextResponse.json({ ok: false, msg: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const sb = getSB();
  if (!sb) return NextResponse.json({ ok: false, msg: "Supabase not configured." });

  try {
    const body = await req.json();
    const { error } = await sb.from("b2b_organizations").upsert(body);
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, msg: err.message }, { status: 500 });
  }
}
