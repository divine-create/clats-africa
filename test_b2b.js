const { createClient } = require("@supabase/supabase-js");

const url = "https://eghnjdwpwbhpeytdfxzc.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnaG5qZHdwd2JocGV5dGRmeHpjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDU2MTAyMCwiZXhwIjoyMDk2MTM3MDIwfQ.VmcJ4kzUeSEaSixsw1llDEE0j8xtXd_TUqyxNenx_E8";
const sb = createClient(url, key);

async function check() {
  const { data, error } = await sb.from("b2b_organizations").select("*").limit(5);
  if (error) {
    console.error("DB Error querying b2b_organizations:", error);
  } else {
    console.log("Success! Organizations in DB:", data);
  }
}

check();
