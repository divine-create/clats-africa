import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes("your-project-id")) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { childId, type, payload } = body;

    if (!childId || !payload) {
      return NextResponse.json({ ok: false, msg: "childId and payload are required" }, { status: 400 });
    }

    const sb = getSupabaseClient();
    if (!sb) {
      // Return ok: true so client gameplay is never interrupted if Supabase is offline/mocked
      return NextResponse.json({ ok: true, offline: true });
    }

    // Try storing in dedicated table if present
    if (type === "evidence") {
      try {
        const { error: insertErr } = await sb.from("child_skill_evidence").insert([{
          child_id: childId,
          skill_id: payload.skillId,
          source_type: payload.sourceType,
          source_id: payload.sourceId,
          attempt_count: payload.attemptCount || 1,
          hints_requested: payload.hintsUsed || 0,
          demonstrated: Boolean(payload.demonstrated),
          evidence_level: payload.evidenceLevel || "demonstrated",
          context_data: {
            notes: payload.notes,
            outputValid: payload.outputValid,
            skillName: payload.skillName
          },
          recorded_at: payload.timestamp || new Date().toISOString()
        }]);

        if (!insertErr) {
          return NextResponse.json({ ok: true, stored: "table" });
        }
      } catch (e) {
        // Fallback to updating child row if table is not migrated yet
      }

      // Fallback: Append to clats_children.skill_evidence array
      try {
        const { data: childData } = await sb
          .from("clats_children")
          .select("skill_evidence")
          .eq("id", childId)
          .maybeSingle();

        const currentList: any[] = Array.isArray(childData?.skill_evidence) ? childData.skill_evidence : [];
        currentList.push(payload);
        if (currentList.length > 100) currentList.shift();

        await sb.from("clats_children").update({
          skill_evidence: currentList
        }).eq("id", childId);

        return NextResponse.json({ ok: true, stored: "child_record" });
      } catch (err) {
        // Non-blocking: client already has localStorage record
        return NextResponse.json({ ok: true, fallback: true });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: true, error: err.message });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const childId = searchParams.get("childId");

    if (!childId) {
      return NextResponse.json({ ok: false, msg: "childId is required" }, { status: 400 });
    }

    const sb = getSupabaseClient();
    if (!sb) {
      return NextResponse.json({ ok: true, records: [] });
    }

    // Try dedicated table first
    const { data: tableData, error } = await sb
      .from("child_skill_evidence")
      .select("*")
      .eq("child_id", childId)
      .order("recorded_at", { ascending: false })
      .limit(50);

    if (!error && Array.isArray(tableData) && tableData.length > 0) {
      return NextResponse.json({ ok: true, records: tableData });
    }

    // Fallback to child profile
    const { data: childData } = await sb
      .from("clats_children")
      .select("skill_evidence")
      .eq("id", childId)
      .maybeSingle();

    return NextResponse.json({
      ok: true,
      records: childData?.skill_evidence || []
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, msg: err.message }, { status: 500 });
  }
}
