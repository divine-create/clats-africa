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

export async function POST(req: NextRequest) {
  const sb = getSB();
  if (!sb) return NextResponse.json({ ok: false, msg: "Supabase not configured." }, { status: 503 });

  try {
    const { org_id, parent_email, students } = await req.json();

    if (!org_id || !students || !Array.isArray(students)) {
      return NextResponse.json({ ok: false, msg: "org_id and students array are required." }, { status: 400 });
    }

    // Fetch all existing student_ids for this org ONCE before the loop
    const { data: existing } = await sb
      .from("clats_children")
      .select("student_id")
      .eq("org_id", org_id);

    const usedIds = new Set<string>((existing || []).map((s: any) => s.student_id));

    /**
     * Generate a unique random 4-digit ID not already used in this org or in
     * this current batch (usedIds set grows as we assign IDs).
     */
    function generateUniqueId(): string | null {
      const MAX_TRIES = 200;
      for (let i = 0; i < MAX_TRIES; i++) {
        const candidate = String(Math.floor(1000 + Math.random() * 9000));
        if (!usedIds.has(candidate)) {
          usedIds.add(candidate); // reserve it immediately to avoid duplicates in batch
          return candidate;
        }
      }
      return null;
    }

    const inserts: any[] = [];
    const skipped: string[] = [];

    for (const s of students) {
      const student_id = generateUniqueId();
      if (!student_id) {
        skipped.push(s.name || "unknown");
        continue;
      }

      const pin = s.pin || Math.floor(1000 + Math.random() * 9000).toString();
      const childId = `b2b-${org_id}-${student_id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      inserts.push({
        id: childId,
        parent_email: parent_email || `b2b-coord-${org_id}@clats.local`,
        name: s.name.trim(),
        age_group: normalizeAge(s.age_group),
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
      });
    }

    if (inserts.length === 0) {
      return NextResponse.json({ ok: false, msg: "No students could be enrolled. School may be at capacity." }, { status: 500 });
    }

    const { data: inserted, error } = await sb
      .from("clats_children")
      .insert(inserts)
      .select();

    if (error) throw new Error(error.message);

    return NextResponse.json({
      ok: true,
      count: inserted.length,
      students: inserted,
      ...(skipped.length > 0 ? { skipped, warning: `${skipped.length} student(s) could not be assigned a unique ID.` } : {})
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, msg: err.message }, { status: 500 });
  }
}
