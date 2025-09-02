#!/bin/bash

# Script to fix Supabase initialization in API routes
# This moves the Supabase client creation inside the function handlers

echo "Fixing Supabase initialization in API routes..."

# List of files to fix
files=(
  "app/api/storage/init/route.ts"
  "app/api/patrols/mobile-checkpoint/route.ts"
  "app/api/patrols/checkpoint-visit/route.ts"
  "app/api/patrols/create/route.ts"
  "app/api/patrols/mobile/route.ts"
  "app/api/patrols/checkpoints/validate/route.ts"
  "app/api/patrols/routes/route.ts"
  "app/api/guards/route.ts"
  "app/api/guards/[id]/status/route.ts"
  "app/api/guards/[id]/route.ts"
  "app/api/guards/[id]/role/route.ts"
  "app/api/db/create-registration-tokens-table/route.ts"
  "app/api/db/update-policies/route.ts"
  "app/api/gps/sample/route.ts"
  "app/api/gps/test/route.ts"
  "app/api/gps/active/route.ts"
  "app/api/auth/test-signin/route.ts"
  "app/api/auth/simple-register/route.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."
    
    # Create a temporary file with the fixed content
    sed -i.bak '
      # Remove the global Supabase initialization
      /^const supabaseUrl = process\.env/d
      /^const supabaseServiceRoleKey = process\.env/d
      /^const supabaseAdmin = createClient/d
    ' "$file"
    
    echo "Fixed $file"
  fi
done

echo "Done!"