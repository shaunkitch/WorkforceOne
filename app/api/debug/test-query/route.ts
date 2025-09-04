import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const organizationId = '10f27663-8c3f-4b44-8a3e-4c34563b603f';
    
    console.log('🧪 Testing exact query from frontend for org:', organizationId);

    const { data, error } = await supabase
      .from('patrol_routes')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('name');

    console.log('Query result - data:', data);
    console.log('Query result - error:', error);

    if (error) {
      return NextResponse.json({ 
        error: 'Query failed', 
        details: error,
        organizationId 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      organizationId,
      routeCount: data?.length || 0,
      routes: data,
      debug: {
        query: {
          table: 'patrol_routes',
          filters: {
            organization_id: organizationId,
            is_active: true
          },
          order: 'name'
        }
      }
    });
  } catch (error) {
    console.error('Error in test query:', error);
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 });
  }
}