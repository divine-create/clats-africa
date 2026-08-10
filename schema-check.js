const { createClient } = require("@supabase/supabase-js");

const url = "https://eghnjdwpwbhpeytdfxzc.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnaG5qZHdwd2JocGV5dGRmeHpjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDU2MTAyMCwiZXhwIjoyMDk2MTM3MDIwfQ.VmcJ4kzUeSEaSixsw1llDEE0j8xtXd_TUqyxNenx_E8";
const sb = createClient(url, key);

async function check() {
  const { data: mods, error: e1 } = await sb.from("modules").select("*").limit(1);
  console.log("Modules:", mods || e1);
  const { data: less, error: e2 } = await sb.from("lessons").select("*").limit(1);
  console.log("Lessons:", less || e2);
  const { data: quiz, error: e3 } = await sb.from("quizzes").select("*").limit(1);
  console.log("Quizzes:", quiz || e3);
}

check();
