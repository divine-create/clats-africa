import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || '';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

const sb = createClient(url, key);

async function run() {
  const orgId = "555e7fc1-285b-4171-af14-64b18c645d94"; // If I can get it... wait I don't know the org_id.
  
  // Just find a B2B student
  const { data: students } = await sb.from('clats_children').select('*').neq('org_id', null).limit(1);
  if (!students || students.length === 0) {
    console.log("No B2B students found");
    return;
  }
  
  const student = students[0];
  console.log("Found student:", student.name, "XP:", student.xp, "Completed:", student.completed);
  
  // Update progress
  const { data: updated, error } = await sb.from('clats_children').update({
    xp: (student.xp || 0) + 100,
    completed: { ...(student.completed || {}), "lesson_test": true }
  }).eq('id', student.id).select().single();
  
  if (error) {
    console.error("Update error:", error.message);
  } else {
    console.log("Successfully updated to XP:", updated.xp, "Completed:", updated.completed);
  }
}
run();
