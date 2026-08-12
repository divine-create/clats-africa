import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key || url.includes("your-project-id")) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: NextRequest) {
  try {
    const { parentEmail, parentName, parentPassword, children, tutorial_completed } = await req.json();

    if (!parentEmail) {
      return NextResponse.json({ ok: false, msg: "parentEmail required" }, { status: 400 });
    }

    const sb = getSupabaseClient();
    if (!sb) {
      return NextResponse.json({ ok: false, msg: "Supabase not configured." });
    }

    const { data: existing } = await sb
      .from("clats_parents")
      .select("email")
      .eq("email", parentEmail.toLowerCase().trim())
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ ok: false, code: "ACCOUNT_DELETED" }, { status: 404 });
    }

    const updatePayload: any = {};
    if (parentName) updatePayload.name = parentName;
    if (parentPassword) updatePayload.password = parentPassword;
    if (tutorial_completed !== undefined) updatePayload.tutorial_completed = tutorial_completed;

    if (Object.keys(updatePayload).length > 0) {
      const { error: parentUpdateErr } = await sb.from("clats_parents").update(updatePayload).eq("email", parentEmail.toLowerCase().trim());
      if (parentUpdateErr) {
        throw new Error(`Failed to update parent row: ${parentUpdateErr.message}`);
      }
    }

    if (Array.isArray(children)) {
      for (const kid of children) {
        const kidPayload: any = {
          id: kid.id,
          parent_email: parentEmail.toLowerCase().trim(),
          name: kid.name,
          username: kid.username || kid.name.toLowerCase().replace(/\s+/g, "_"),
          age_group: kid.ageGroup || kid.age_group,
          avatar: kid.avatar,
          pin: kid.pin,
          interests: Array.isArray(kid.interests) ? kid.interests : [],
          completed_lessons: kid.completed || kid.completed_lessons || {},
          xp: kid.xp || 0,
          stars: kid.stars || {},
          quiz_results: kid.quizResults || kid.quiz_results || {},
          companion: kid.companion || "kobe",
          child_tutorial_completed: kid.child_tutorial_completed
        };

        let payloadToSync = kidPayload;
        let retryCount = 0;
        let childErr: any = null;

        while (retryCount < 3) {
          const { error } = await sb.from("clats_children").upsert([payloadToSync], { onConflict: "id" });
          if (!error) {
            childErr = null;
            break; // Success
          }
          childErr = error;
          
          // PostgREST missing column error usually looks like:
          // "Could not find the 'column_name' column of 'table_name' in the schema cache"
          if (childErr.message && childErr.message.includes("Could not find the")) {
             const match = childErr.message.match(/'([^']+)' column/);
             if (match && match[1]) {
                const missingCol = match[1];
                console.warn(`Column '${missingCol}' missing in clats_children. Retrying without it...`);
                delete payloadToSync[missingCol];
                retryCount++;
                continue;
             }
          }
          
          // Legacy generic check for username just in case
          if (childErr.message && childErr.message.includes("username") && payloadToSync.username !== undefined) {
             console.warn("Retrying child sync without username column...");
             delete payloadToSync.username;
             retryCount++;
             continue;
          }
          
          break; // Unknown error, give up
        }

        if (childErr) {
            throw new Error(`Failed to sync child to clats_children: ${childErr.message}`);
        }
      }
    }

    return NextResponse.json({ ok: true, synced: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, msg: err.message }, { status: 500 });
  }
}
