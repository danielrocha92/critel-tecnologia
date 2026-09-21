import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: tickets } = await supabase.from('tickets').select('id, titulo, analista_id, status').not('analista_id', 'is', null);
  console.log("=== TICKETS COM ANALISTA ===");
  console.log(tickets);
}

check();
