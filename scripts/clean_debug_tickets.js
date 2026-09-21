const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanDebug() {
  const { data, error } = await supabase
    .from('tickets')
    .delete()
    .eq('cliente', 'DEBUG TOMTICKET');
    
  if (error) console.error('Error:', error);
  else console.log('Cleaned DEBUG tickets successfully.');
}

cleanDebug();
