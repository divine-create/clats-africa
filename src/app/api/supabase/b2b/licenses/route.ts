import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const getSB = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key || url.includes("your-project-id")) return null;
  return createClient(url, key, { auth: { persistSession: false } });
};

export async function POST(req: Request) {
  const sb = getSB();
  if (!sb) return NextResponse.json({ ok: false, msg: "Supabase not configured." });

  try {
    const body = await req.json();
    const org_id = body.org_id;
    const max_uses = body.max_uses;

    if (!org_id) {
      return NextResponse.json({ ok: false, msg: "org_id is required." }, { status: 400 });
    }

    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const code = `CLATS-${randomSuffix}`;

    const { data, error } = await sb
      .from("b2b_license_keys")
      .insert([{ org_id, max_uses: max_uses || 100, code }])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, license: data });
  } catch (err: any) {
    return NextResponse.json({ ok: false, msg: err.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const sb = getSB();
  if (!sb) return NextResponse.json({ ok: false, msg: "Supabase not configured." });

  try {
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("org_id");
    let query = sb.from("b2b_license_keys").select("*");
    if (orgId) {
      query = query.eq("org_id", orgId);
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, data: data || [] });
  } catch (err: any) {
    return NextResponse.json({ ok: false, msg: err.message }, { status: 500 });
  }
}
