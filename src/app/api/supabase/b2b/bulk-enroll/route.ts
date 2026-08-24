import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const getSB = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key || url.includes("your-project-id")) return null;
  return createClient(url, key, { auth: { persistSession: false } });
};

export async function POST(req: NextRequest) {
  const sb = getSB();
  if (!sb) return NextResponse.json({ ok: false, msg: "Supabase not configured." }, { status: 503 });

  try {
    const { org_id, parent_email, students } = await req.json();

    if (!org_id || !students || !Array.isArray(students)) {
      return NextResponse.json({ ok: false, msg: "org_id and students array are required." }, { status: 400 });
    }

    // Check existing max student_id for this org to generate sequential IDs
    const { data: existing } = await sb
      .from("clats_children")
      .select("student_id")
      .eq("org_id", org_id);

    const existingIds = (existing || []).map(s => parseInt(s.student_id || "0", 10)).filter(n => !isNaN(n));
    let nextNum = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;

    const inserts = students.map((s: any) => {
      const student_id = String(nextNum++).padStart(4, "0");
      const pin = s.pin || Math.floor(1000 + Math.random() * 9000).toString();
      const childId = `b2b-${org_id}-${student_id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      return {
        id: childId,
        parent_email: parent_email || `b2b-coord-${org_id}@clats.local`,
        name: s.name.trim(),
        age_group: s.age_group || "young",
        avatar: ["👦🏾", "👧🏽", "🧑🏿", "👩🏾", "👦🏽", "👧🏾"][Math.floor(Math.random() * 6)],
        pin,
        org_id,
        student_id,
        interests: [],
        completed_lessons: {},
        xp: 0,
        stars: {},
        quiz_results: {},
        companion: Math.random() > 0.5 ? "kobe" : "chibi",
      };
    });

    const { data: inserted, error } = await sb
      .from("clats_children")
      .insert(inserts)
      .select();

    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true, count: inserted.length, students: inserted });
  } catch (err: any) {
    return NextResponse.json({ ok: false, msg: err.message }, { status: 500 });
  }
}
