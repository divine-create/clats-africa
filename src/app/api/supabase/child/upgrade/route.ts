import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) return NextResponse.json({ ok: false, msg: "Supabase not configured." });

  const sb = createClient(url, key, { auth: { persistSession: false } });

  try {
    const { email, child_id, reference, plan_id } = await req.json();
    if (!child_id) throw new Error("Child ID required");

    // In a real app, you would verify the Paystack reference here server-side!
    // For this prototype, we immediately upgrade the child.
    const { error } = await sb
      .from("clats_children")
      .update({ is_premium: true })
      .eq("id", child_id);

    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, msg: err.message }, { status: 500 });
  }
}
