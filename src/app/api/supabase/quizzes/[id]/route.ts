import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSB() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key || url.includes("your-project-id")) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sb = getSB();
    if (!sb) return NextResponse.json({ ok: false, error: "No DB configuration" });
    const resolvedParams = await params;
    const id = resolvedParams.id;
    if (!id) return NextResponse.json({ ok: false, error: "Missing ID" });
    
    const { error } = await sb.from("quizzes").delete().eq("id", id);
    if (error) return NextResponse.json({ ok: false, error: error.message });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message });
  }
}
