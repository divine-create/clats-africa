import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

// GET all community events
export async function GET() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key || url.includes("your-project-id")) {
    return NextResponse.json({ ok: false, msg: "Supabase not configured." });
  }

  const sb = createClient(url, key, { auth: { persistSession: false } });

  try {
    const { data, error } = await sb
      .from("clats_community_events")
      .select("*")
      .order("event_datetime", { ascending: true });

    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true, events: data || [] });
  } catch (err: any) {
    return NextResponse.json({ ok: false, msg: err.message }, { status: 500 });
  }
}

// POST new community event
export async function POST(req: Request) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key || url.includes("your-project-id")) {
    return NextResponse.json({ ok: false, msg: "Supabase not configured." });
  }

  const sb = createClient(url, key, { auth: { persistSession: false } });

  try {
    const body = await req.json();
    const { data, error } = await sb
      .from("clats_community_events")
      .insert([body])
      .select()
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true, event: data });
  } catch (err: any) {
    return NextResponse.json({ ok: false, msg: err.message }, { status: 500 });
  }
}

// PUT (update) community event
export async function PUT(req: Request) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key || url.includes("your-project-id")) {
    return NextResponse.json({ ok: false, msg: "Supabase not configured." });
  }

  const sb = createClient(url, key, { auth: { persistSession: false } });

  try {
    const body = await req.json();
    const { id, rsvp_increment, ...updates } = body;
    
    if (!id) throw new Error("ID is required for updates");

    if (rsvp_increment) {
      const { data: current, error: fetchErr } = await sb.from("clats_community_events").select("rsvp_count").eq("id", id).single();
      if (!fetchErr && current) {
        updates.rsvp_count = (current.rsvp_count || 0) + 1;
      }
    }

    const { data, error } = await sb
      .from("clats_community_events")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true, event: data });
  } catch (err: any) {
    return NextResponse.json({ ok: false, msg: err.message }, { status: 500 });
  }
}

// DELETE community event
export async function DELETE(req: Request) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key || url.includes("your-project-id")) {
    return NextResponse.json({ ok: false, msg: "Supabase not configured." });
  }

  const sb = createClient(url, key, { auth: { persistSession: false } });

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) throw new Error("ID is required for deletion");

    const { error } = await sb
      .from("clats_community_events")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, msg: err.message }, { status: 500 });
  }
}
