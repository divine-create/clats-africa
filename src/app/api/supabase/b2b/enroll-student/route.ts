import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const getSB = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key || url.includes("your-project-id")) return null;
  return createClient(url, key, { auth: { persistSession: false } });
};

/** Normalize age_group to full app AgeGroup type */
function normalizeAge(raw: string): string {
  const v = (raw || "").toLowerCase();
  if (v === "early explorers" || v === "early") return "early explorers";
  if (v === "future builders" || v === "future") return "future builders";
  return "young innovators";
}

/**
 * Generates a unique random 4-digit student ID (1000–9999) for a given org.
 * Retries up to 100 times if collision occurs. Returns null if exhausted.
 */
async function generateUniqueStudentId(sb: any, org_id: string): Promise<string | null> {
  // Fetch all existing student_ids for this org in one query
  const { data: existing } = await sb
    .from("clats_children")
    .select("student_id")
    .eq("org_id", org_id);

  const usedIds = new Set<string>((existing || []).map((s: any) => s.student_id));

  const MAX_TRIES = 100;
  for (let i = 0; i < MAX_TRIES; i++) {
    const candidate = String(Math.floor(1000 + Math.random() * 9000)); // 1000–9999
    if (!usedIds.has(candidate)) {
      return candidate;
    }
  }
  return null; // All attempts exhausted (extremely unlikely with < 9000 students)
}

/**
 * POST /api/supabase/b2b/enroll-student
 * Coordinator enrolls a new student. A unique random 4-digit student_id is
 * auto-generated per school — coordinators do NOT need to supply one.
 */
export async function POST(req: NextRequest) {
  const sb = getSB();
  if (!sb) return NextResponse.json({ ok: false, msg: "Supabase not configured." }, { status: 503 });

  try {
    const { org_id, name, age_group, avatar, pin, parent_email } = await req.json();

    if (!org_id || !name || !pin) {
      return NextResponse.json({ ok: false, msg: "org_id, name and pin are required." }, { status: 400 });
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return NextResponse.json({ ok: false, msg: "PIN must be exactly 4 digits." }, { status: 400 });
    }

    // Auto-generate a unique random student ID for this school
    const student_id = await generateUniqueStudentId(sb, org_id);
    if (!student_id) {
      return NextResponse.json({ ok: false, msg: "Could not generate a unique student ID. School may be at capacity." }, { status: 500 });
    }

    const childId = `b2b-${org_id}-${student_id}-${Date.now()}`;

    const { data: child, error } = await sb
      .from("clats_children")
      .insert({
        id: childId,
        parent_email: parent_email || `b2b-coord-${org_id}@clats.local`,
        name: name.trim(),
        age_group: normalizeAge(age_group),
        avatar: avatar || ["👦🏾", "👧🏽", "🧑🏿", "👩🏾", "👦🏽", "👧🏾"][Math.floor(Math.random() * 6)],
        pin,
        org_id,
        student_id,
        interests: [],
        completed_lessons: {},
        xp: 0,
        stars: {},
        quiz_results: {},
        companion: Math.random() > 0.5 ? "kobe" : "chibi",
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true, student: child });
  } catch (err: any) {
    return NextResponse.json({ ok: false, msg: err.message }, { status: 500 });
  }
}
