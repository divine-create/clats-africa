import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key || url.includes("your-project-id")) {
    return NextResponse.json({ ok: false, msg: "Supabase not configured." });
  }

  const sb = createClient(url, key, { auth: { persistSession: false } });

  try {
    const { data: parents, error: parentErr } = await sb.from("clats_parents").select("*");
    const { data: children, error: childErr } = await sb.from("clats_children").select("*");

    if (parentErr || childErr) {
      throw new Error(parentErr?.message || childErr?.message);
    }

    return NextResponse.json({
      ok: true,
      parents: parents || [],
      children: children || []
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, msg: err.message }, { status: 500 });
  }
}
