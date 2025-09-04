import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organizationId');
    
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    const { data: requirements, error } = await supabase
      .from('patrol_requirements')
      .select(`
        *,
        patrol_routes:route_id (
          id,
          name,
          checkpoints
        )
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching patrol requirements:', error);
      return NextResponse.json({ error: 'Failed to fetch patrol requirements' }, { status: 500 });
    }

    const response = NextResponse.json({ requirements });
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  } catch (error) {
    console.error('Error in patrol requirements GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      organizationId,
      routeId,
      shiftDurationHours,
      requiredPatrolsPerShift,
      minTimeBetweenPatrolsMinutes,
      maxTimeBetweenPatrolsMinutes,
      requiredPhotosPerCheckpoint,
      createdBy
    } = body;

    // Validate required fields
    if (!organizationId || !routeId || !shiftDurationHours || !requiredPatrolsPerShift) {
      return NextResponse.json({ 
        error: 'Missing required fields: organizationId, routeId, shiftDurationHours, requiredPatrolsPerShift' 
      }, { status: 400 });
    }

    const { data: requirement, error } = await supabase
      .from('patrol_requirements')
      .insert({
        organization_id: organizationId,
        route_id: routeId,
        shift_duration_hours: shiftDurationHours,
        required_patrols_per_shift: requiredPatrolsPerShift,
        min_time_between_patrols_minutes: minTimeBetweenPatrolsMinutes || 60,
        max_time_between_patrols_minutes: maxTimeBetweenPatrolsMinutes || 180,
        required_photos_per_checkpoint: requiredPhotosPerCheckpoint || 1,
        created_by: createdBy
      })
      .select(`
        *,
        patrol_routes:route_id (
          id,
          name,
          checkpoints
        )
      `)
      .single();

    if (error) {
      console.error('Error creating patrol requirement:', error);
      
      // Handle unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json({ 
          error: 'A requirement for this route and shift duration already exists' 
        }, { status: 409 });
      }
      
      return NextResponse.json({ error: 'Failed to create patrol requirement' }, { status: 500 });
    }

    const response = NextResponse.json({ requirement });
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  } catch (error) {
    console.error('Error in patrol requirements POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      shiftDurationHours,
      requiredPatrolsPerShift,
      minTimeBetweenPatrolsMinutes,
      maxTimeBetweenPatrolsMinutes,
      requiredPhotosPerCheckpoint
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Requirement ID is required' }, { status: 400 });
    }

    const { data: requirement, error } = await supabase
      .from('patrol_requirements')
      .update({
        shift_duration_hours: shiftDurationHours,
        required_patrols_per_shift: requiredPatrolsPerShift,
        min_time_between_patrols_minutes: minTimeBetweenPatrolsMinutes,
        max_time_between_patrols_minutes: maxTimeBetweenPatrolsMinutes,
        required_photos_per_checkpoint: requiredPhotosPerCheckpoint,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        patrol_routes:route_id (
          id,
          name,
          checkpoints
        )
      `)
      .single();

    if (error) {
      console.error('Error updating patrol requirement:', error);
      return NextResponse.json({ error: 'Failed to update patrol requirement' }, { status: 500 });
    }

    const response = NextResponse.json({ requirement });
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  } catch (error) {
    console.error('Error in patrol requirements PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Requirement ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('patrol_requirements')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting patrol requirement:', error);
      return NextResponse.json({ error: 'Failed to delete patrol requirement' }, { status: 500 });
    }

    const response = NextResponse.json({ success: true });
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  } catch (error) {
    console.error('Error in patrol requirements DELETE:', error);
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