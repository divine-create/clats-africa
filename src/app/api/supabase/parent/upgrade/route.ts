import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) return NextResponse.json({ ok: false, msg: "Supabase not configured." });

  const sb = createClient(url, key, { auth: { persistSession: false } });

  try {
    const { email, reference, plan_id } = await req.json();
    if (!email) throw new Error("Email required");

    // In a real app, you would verify the Paystack reference here server-side!
    // For this prototype, we immediately upgrade the user.
    const { error } = await sb
      .from("clats_parents")
      .update({ is_premium: true })
      .eq("email", email);

    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, msg: err.message }, { status: 500 });
  }
}
