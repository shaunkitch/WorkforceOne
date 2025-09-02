#!/bin/bash

# Find all route.ts files with the problematic pattern and fix them
echo "Finding and fixing all API routes with Supabase initialization issues..."

cd /home/shaunkitch/WorkforceOne/WorkforceOne

# Find all route.ts files
find app/api -name "route.ts" -type f | while read file; do
  # Check if file has the problematic pattern
  if grep -q "const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL" "$file" || \
     grep -q "const supabaseAdmin = createClient" "$file"; then
    
    echo "Fixing $file..."
    
    # Create a backup
    cp "$file" "$file.bak"
    
    # Remove problematic lines
    sed -i '/^const supabaseUrl = process\.env\.NEXT_PUBLIC_SUPABASE_URL/d' "$file"
    sed -i '/^const supabaseServiceRoleKey = process\.env\.SUPABASE_SERVICE_ROLE_KEY/d' "$file"
    sed -i '/^const supabaseServiceKey = process\.env\.SUPABASE_SERVICE_ROLE_KEY/d' "$file"
    sed -i '/^const supabaseAdmin = createClient/d' "$file"
    
    # Check if the import needs to be changed
    if grep -q "import { createClient }" "$file" && ! grep -q "import { getSupabaseAdmin }" "$file"; then
      sed -i "s/import { createClient } from '@supabase\/supabase-js'/import { getSupabaseAdmin } from '@\/lib\/supabase-admin'/" "$file"
    fi
    
    # Add supabaseAdmin initialization in functions if needed
    # This is a simple approach - adds it at the beginning of POST/GET/PUT/DELETE functions
    sed -i '/^export async function \(GET\|POST\|PUT\|DELETE\|PATCH\)(/ {
      n
      /const supabaseAdmin = getSupabaseAdmin()/! {
        s/^/  const supabaseAdmin = getSupabaseAdmin()\n/
      }
    }' "$file"
    
    echo "Fixed $file"
  fi
done

echo "Done!"