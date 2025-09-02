const fs = require('fs');
const path = require('path');

// List of files to fix
const filesToFix = [
  'app/api/storage/init/route.ts',
  'app/api/patrols/checkpoint-visit/route.ts',
  'app/api/patrols/create/route.ts',
  'app/api/patrols/checkpoints/validate/route.ts',
  'app/api/patrols/routes/route.ts',
  'app/api/guards/route.ts',
  'app/api/guards/[id]/status/route.ts',
  'app/api/guards/[id]/route.ts',
  'app/api/guards/[id]/role/route.ts',
  'app/api/db/create-registration-tokens-table/route.ts',
  'app/api/db/update-policies/route.ts',
  'app/api/gps/sample/route.ts',
  'app/api/gps/test/route.ts',
  'app/api/gps/active/route.ts',
  'app/api/auth/test-signin/route.ts',
  'app/api/auth/simple-register/route.ts',
];

const projectRoot = '/home/shaunkitch/WorkforceOne/WorkforceOne';

filesToFix.forEach(file => {
  const filePath = path.join(projectRoot, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${file} - file not found`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if file has the old pattern
  if (content.includes('const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!')) {
    console.log(`Fixing ${file}...`);
    
    // Remove old Supabase initialization
    content = content.replace(
      /import { createClient } from '@supabase\/supabase-js'/g,
      "import { getSupabaseAdmin } from '@/lib/supabase-admin'"
    );
    
    // Remove the global constants
    content = content.replace(
      /\/\/ Create Supabase client.*\n/g,
      ''
    );
    content = content.replace(
      /const supabaseUrl = process\.env\.NEXT_PUBLIC_SUPABASE_URL!?\n/g,
      ''
    );
    content = content.replace(
      /const supabaseServiceRoleKey = process\.env\.SUPABASE_SERVICE_ROLE_KEY!?\n/g,
      ''
    );
    content = content.replace(
      /const supabaseAdmin = createClient\(supabaseUrl, supabaseServiceRoleKey.*?\}\)\n/gs,
      ''
    );
    content = content.replace(
      /const supabaseAdmin = createClient\(supabaseUrl, supabaseServiceRoleKey\)\n/g,
      ''
    );
    
    // Add supabaseAdmin initialization in the first function
    const functionPattern = /export async function (GET|POST|PUT|DELETE|PATCH|OPTIONS)\([^)]*\) {/;
    const match = content.match(functionPattern);
    if (match) {
      const functionStart = match[0];
      const insertPosition = content.indexOf(functionStart) + functionStart.length;
      
      // Check if we need to add try-catch
      const functionContent = content.substring(insertPosition);
      if (!functionContent.trim().startsWith('\n  try {')) {
        // Add supabaseAdmin after the function opening
        content = content.substring(0, insertPosition) + 
          '\n  const supabaseAdmin = getSupabaseAdmin()' +
          content.substring(insertPosition);
      } else {
        // Add supabaseAdmin after try {
        const tryPosition = content.indexOf('try {', insertPosition) + 5;
        content = content.substring(0, tryPosition) + 
          '\n    const supabaseAdmin = getSupabaseAdmin()' +
          content.substring(tryPosition);
      }
    }
    
    fs.writeFileSync(filePath, content);
    console.log(`Fixed ${file}`);
  } else {
    console.log(`${file} already fixed or doesn't match pattern`);
  }
});

console.log('Done!');