const { createClient } = require("@supabase/supabase-js");

const url = "https://eghnjdwpwbhpeytdfxzc.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnaG5qZHdwd2JocGV5dGRmeHpjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDU2MTAyMCwiZXhwIjoyMDk2MTM3MDIwfQ.VmcJ4kzUeSEaSixsw1llDEE0j8xtXd_TUqyxNenx_E8";
const sb = createClient(url, key);

async function check() {
  // 1. Get first organization
  const { data: orgs, error: e1 } = await sb.from("b2b_organizations").select("id").limit(1);
  if (e1 || !orgs || orgs.length === 0) {
    console.error("Could not find any organization:", e1);
    return;
  }
  const org_id = orgs[0].id;
  console.log("Using org_id:", org_id);

  // 2. Insert license
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  const code = `CLATS-${randomSuffix}`;

  const { data: license, error: e2 } = await sb
    .from("b2b_license_keys")
    .insert([{ org_id, max_uses: 100, code }])
    .select();

  if (e2) {
    console.error("DB Error inserting license key:", e2);
  } else {
    console.log("Success! Inserted license key:", license);
  }
}

check();
