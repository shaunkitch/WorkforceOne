#!/bin/bash

echo "Final comprehensive fix for all Supabase initialization issues..."

cd /home/shaunkitch/WorkforceOne/WorkforceOne

# Fix patrols/routes/route.ts
if [ -f "app/api/patrols/routes/route.ts" ]; then
  echo "Fixing app/api/patrols/routes/route.ts..."
  sed -i 's/const supabase = createClient.*//' app/api/patrols/routes/route.ts
  sed -i 's/supabase\./supabaseAdmin\./g' app/api/patrols/routes/route.ts
fi

# Fix gps/active/route.ts  
if [ -f "app/api/gps/active/route.ts" ]; then
  echo "Fixing app/api/gps/active/route.ts..."
  sed -i 's/const supabase = createClient.*//' app/api/gps/active/route.ts
  sed -i 's/supabase\./supabaseAdmin\./g' app/api/gps/active/route.ts
fi

# Fix auth/server-login/route.ts
if [ -f "app/api/auth/server-login/route.ts" ]; then
  echo "Fixing app/api/auth/server-login/route.ts..."
  sed -i '/const supabaseAnonKey = process\.env/d' app/api/auth/server-login/route.ts
  sed -i 's/const supabase = createClient.*//' app/api/auth/server-login/route.ts
fi

# Fix attendance/check-in/route.ts
if [ -f "app/api/attendance/check-in/route.ts" ]; then
  echo "Fixing app/api/attendance/check-in/route.ts..."
  sed -i 's/const supabase = createClient()/const supabaseAdmin = getSupabaseAdmin()/' app/api/attendance/check-in/route.ts
fi

# Find any remaining createClient references in route files
echo "Looking for any remaining issues..."
grep -r "const supabase = createClient\|const supabaseAdmin = createClient" app/api --include="*.ts" 2>/dev/null | while read line; do
  file=$(echo "$line" | cut -d: -f1)
  echo "Found issue in $file - fixing..."
  sed -i 's/const supabase = createClient.*//' "$file"
  sed -i 's/const supabaseAdmin = createClient.*//' "$file"
done

echo "Done!"