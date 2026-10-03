import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || '';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

const sb = createClient(url, key);

async function run() {
  const { data: students } = await sb.from('clats_children').select('*').not('org_id', 'is', null).limit(1);
  if (!students || students.length === 0) {
    console.log("No students found.");
    return;
  }
  
  const student = students[0];
  console.log("Before XP:", student.xp, "Completed:", student.completed_lessons);
  
  const updatePayload = {
    xp: (student.xp || 0) + 10,
    completed_lessons: { ...(student.completed_lessons || {}), "lesson_xyz": true },
    stars: { ...(student.stars || {}), "lesson_xyz": 3 },
    quiz_results: student.quiz_results || {},
    streak_count: student.streak_count || 0
  };
  
  console.log("Updating with:", updatePayload);
  
  const { data: updated, error } = await sb.from('clats_children')
    .update(updatePayload)
    .eq('id', student.id)
    .select()
    .single();
    
  if (error) {
    console.error("Error updating:", error);
  } else {
    console.log("Successfully updated:", updated.xp, updated.completed_lessons);
  }
}
run();
