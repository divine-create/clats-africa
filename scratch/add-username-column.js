const { createClient } = require("@supabase/supabase-js");

const url = "https://eghnjdwpwbhpeytdfxzc.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnaG5qZHdwd2JocGV5dGRmeHpjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDU2MTAyMCwiZXhwIjoyMDk2MTM3MDIwfQ.VmcJ4kzUeSEaSixsw1llDEE0j8xtXd_TUqyxNenx_E8";
const sb = createClient(url, key);

async function run() {
  console.log("Checking children table schema...");
  try {
    const { data: kids, error: getErr } = await sb.from("clats_children").select("*").limit(1);
    if (getErr) {
      console.error("Error reading children table:", getErr);
    } else {
      console.log("Children table read successfully. Sample record:", kids);
      
      // Let's attempt to insert a test child with username to see if the column exists
      const testChild = {
        id: "schema_test_id",
        parent_email: "test_parent@clats.com",
        name: "Test Schema Kid",
        username: "test_schema_kid",
        age_group: "young innovators",
        avatar: "👦🏾",
        pin: "1111"
      };

      console.log("Testing insert with username column...");
      const { data, error } = await sb.from("clats_children").upsert([testChild]);
      if (error) {
        console.log("Column 'username' probably does not exist yet. Error details:", error.message);
        console.log("We will need to add the column 'username' in the Supabase Dashboard, or verify if the sync route needs to handle it gracefully if offline.");
      } else {
        console.log("Database table already contains 'username' column! Upsert was successful.");
        // Clean up
        await sb.from("clats_children").delete().eq("id", "schema_test_id");
      }
    }
  } catch (err) {
    console.error("Failure running test:", err);
  }
}

run();
