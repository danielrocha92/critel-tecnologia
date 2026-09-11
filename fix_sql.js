const fs = require('fs');
let sql = fs.readFileSync('supabase_schema.sql', 'utf8');
// Drop existing policies before creating them
sql = sql.replace(/CREATE POLICY ("[^\"]+")[\s\n]+ON\s+([^\s;]+)/g, 'DROP POLICY IF EXISTS $1 ON $2;\nCREATE POLICY $1 \nON $2');
fs.writeFileSync('supabase_schema.sql', sql);
console.log('Schema atualizado com regras DROP POLICY IF EXISTS.');
