import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug: Checking patrol_routes table...');

    // First, check all organizations
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .limit(10);

    if (orgsError) {
      console.error('Error fetching organizations:', orgsError);
      return NextResponse.json({ error: 'Failed to fetch organizations', details: orgsError }, { status: 500 });
    }

    console.log('Organizations found:', orgs);

    // Check all patrol routes
    const { data: allRoutes, error: allRoutesError } = await supabase
      .from('patrol_routes')
      .select('*')
      .limit(10);

    if (allRoutesError) {
      console.error('Error fetching all patrol routes:', allRoutesError);
      return NextResponse.json({ error: 'Failed to fetch patrol routes', details: allRoutesError }, { status: 500 });
    }

    console.log('All patrol routes found:', allRoutes);

    // Try to create a sample route if none exist
    if (!allRoutes || allRoutes.length === 0) {
      console.log('No patrol routes found, creating sample data...');
      
      if (orgs && orgs.length > 0) {
        const sampleRoutes = [
          {
            organization_id: orgs[0].id,
            name: 'Main Building Perimeter',
            description: 'Security patrol around the main building perimeter',
            checkpoints: ['Front Entrance', 'North Side', 'Loading Dock', 'Parking Lot', 'South Entrance'],
            estimated_duration: 45,
            is_active: true
          },
          {
            organization_id: orgs[0].id,
            name: 'Interior Floor Check',
            description: 'Internal security check of all floors',
            checkpoints: ['Lobby', '1st Floor East', '1st Floor West', '2nd Floor', 'Roof Access'],
            estimated_duration: 30,
            is_active: true
          }
        ];

        const { data: newRoutes, error: insertError } = await supabase
          .from('patrol_routes')
          .insert(sampleRoutes)
          .select();

        if (insertError) {
          console.error('Error creating sample routes:', insertError);
        } else {
          console.log('Sample routes created:', newRoutes);
        }
      }
    }

    // Final check - get all routes again
    const { data: finalRoutes, error: finalError } = await supabase
      .from('patrol_routes')
      .select(`
        *,
        organizations (
          name,
          slug
        )
      `);

    return NextResponse.json({
      success: true,
      organizations: orgs,
      totalRoutes: finalRoutes?.length || 0,
      routes: finalRoutes,
      debug: {
        timestamp: new Date().toISOString(),
        message: 'Debug information for patrol routes'
      }
    });
  } catch (error) {
    console.error('Error in debug route:', error);
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { organizationId, routeName, description, checkpoints } = await request.json();

    if (!organizationId || !routeName || !checkpoints) {
      return NextResponse.json({ 
        error: 'Missing required fields: organizationId, routeName, checkpoints' 
      }, { status: 400 });
    }

    const { data: route, error } = await supabase
      .from('patrol_routes')
      .insert({
        organization_id: organizationId,
        name: routeName,
        description: description || 'Test patrol route',
        checkpoints: checkpoints,
        estimated_duration: 30,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating test route:', error);
      return NextResponse.json({ error: 'Failed to create route', details: error }, { status: 500 });
    }

    return NextResponse.json({ success: true, route });
  } catch (error) {
    console.error('Error in POST debug route:', error);
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 });
  }
}