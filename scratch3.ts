import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || '';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

const sb = createClient(url, key);

async function run() {
  const { data } = await sb.from('clats_children').select('*').limit(3);
  console.log(JSON.stringify(data, null, 2));
}
run();
