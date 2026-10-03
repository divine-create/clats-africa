import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || '';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

const sb = createClient(url, key);

async function run() {
  const { data, count, error } = await sb.from('clats_children').select('id, name, xp, completed_lessons, org_id', { count: 'exact' }).neq('org_id', null);
  console.log("Count:", count);
  if (data) {
    console.log(JSON.stringify(data.slice(0, 5), null, 2));
  }
}
run();
