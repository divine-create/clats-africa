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
    const { event_type, event_name, child_id, parent_email, device_info, details } = body;

    const sb = getSB();
    if (!sb) return NextResponse.json({ ok: false, msg: "Supabase not configured" });

    const { error } = await sb.from("system_logs").insert([{
      event_type: event_type || "info",
      event_name: event_name || "unknown",
      child_id: child_id || null,
      parent_email: parent_email || null,
      device_info: device_info || null,
      details: details || null,
    }]);

    if (error) return NextResponse.json({ ok: false, msg: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, msg: e.message }, { status: 500 });
  }
}
