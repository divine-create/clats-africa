require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);
sb.from('clats_parents').select('*').limit(1).then(r => {
  console.log(r.data ? Object.keys(r.data[0] || {}) : r.error);
});
