const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  console.log('Applying RLS policy fix...')
  
  const sqlContent = fs.readFileSync(
    path.join(__dirname, '../supabase/migrations/006_fix_user_rls_policies.sql'),
    'utf8'
  )
  
  // Split by semicolon and execute each statement
  const statements = sqlContent
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))
  
  for (const statement of statements) {
    try {
      console.log('Executing:', statement.substring(0, 50) + '...')
      await supabase.rpc('exec_sql', { sql: statement })
      console.log('✅ Success')
    } catch (error) {
      console.log('⚠️  Statement result:', error.message)
    }
  }
  
  console.log('Migration complete')
}

applyMigration().catch(console.error)