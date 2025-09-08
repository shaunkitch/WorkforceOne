import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userIds = url.searchParams.get('userIds');
    
    if (!userIds) {
      return NextResponse.json({ error: 'User IDs are required' }, { status: 400 });
    }

    const userIdArray = userIds.split(',').filter(Boolean);
    console.log('🔍 Fetching users for IDs:', userIdArray);

    const { data, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, email')
      .in('id', userIdArray);

    if (error) {
      console.error('❌ Error fetching users:', error);
      return NextResponse.json({ error: 'Failed to fetch users', details: error }, { status: 500 });
    }

    console.log('✅ Successfully fetched users:', data?.length || 0);

    const response = NextResponse.json({ users: data || [] });
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  } catch (error) {
    console.error('❌ Error in users GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}