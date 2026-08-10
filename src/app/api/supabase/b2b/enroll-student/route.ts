import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const getSB = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key || url.includes("your-project-id")) return null;
  return createClient(url, key, { auth: { persistSession: false } });
};

/**
 * POST /api/supabase/b2b/enroll-student
 * Coordinator enrolls a new student into their org with an auto-assigned 4-digit student_id.
 */
export async function POST(req: NextRequest) {
  const sb = getSB();
  if (!sb) return NextResponse.json({ ok: false, msg: "Supabase not configured." }, { status: 503 });

  try {
    const { org_id, student_id, name, age_group, avatar, pin, parent_email } = await req.json();

    if (!org_id || !student_id || !name || !pin) {
      return NextResponse.json({ ok: false, msg: "org_id, student_id, name and pin are required." }, { status: 400 });
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return NextResponse.json({ ok: false, msg: "PIN must be exactly 4 digits." }, { status: 400 });
    }

    // Check uniqueness: same org_id + student_id combo must not exist
    const { data: existing } = await sb
      .from("clats_children")
      .select("id")
      .eq("org_id", org_id)
      .eq("student_id", student_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ ok: false, msg: `Student ID ${student_id} already exists in this organization.` }, { status: 409 });
    }

    const childId = `b2b-${org_id}-${student_id}-${Date.now()}`;

    const { data: child, error } = await sb
      .from("clats_children")
      .insert({
        id: childId,
        parent_email: parent_email || `b2b-coord-${org_id}@clats.local`,
        name: name.trim(),
        age_group: age_group || "young",
        avatar: avatar || "👦🏾",
        pin,
        org_id,
        student_id,
        interests: [],
        completed_lessons: {},
        xp: 0,
        stars: {},
        quiz_results: {},
        companion: "kobe",
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true, student: child });
  } catch (err: any) {
    return NextResponse.json({ ok: false, msg: err.message }, { status: 500 });
  }
}
