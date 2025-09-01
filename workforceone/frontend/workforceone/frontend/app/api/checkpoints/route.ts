import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Create Supabase client with service role key to bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// GET - Fetch checkpoints for an organization
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')
    const activeOnly = searchParams.get('active_only') === 'true'

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('locations')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name')

    if (activeOnly) {
      // Assuming active checkpoints have location_type of 'checkpoint'
      query = query.eq('location_type', 'checkpoint')
    }

    const { data: checkpoints, error } = await query

    if (error) {
      console.error('Error fetching checkpoints:', error)
      return NextResponse.json(
        { error: 'Failed to fetch checkpoints' },
        { status: 500 }
      )
    }

    return NextResponse.json({ checkpoints })
  } catch (error) {
    console.error('Error in GET /api/checkpoints:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new checkpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      organization_id,
      name,
      description,
      address,
      latitude,
      longitude,
      location_type,
      qr_code,
      nfc_tag,
      is_active = true,
      verification_methods,
      geofence_radius,
      visit_instructions,
      created_by
    } = body

    // Validate required fields
    if (!organization_id || !name || !created_by) {
      return NextResponse.json(
        { error: 'Organization ID, name, and created_by are required' },
        { status: 400 }
      )
    }

    // Prepare metadata
    const metadata = {
      qr_code,
      nfc_tag_id: nfc_tag,
      special_instructions: visit_instructions,
      verification_methods: verification_methods || ['qr'],
      expected_visit_duration: 5 // default 5 minutes
    }

    // Insert checkpoint into locations table
    const { data: checkpoint, error } = await supabase
      .from('locations')
      .insert([{
        organization_id,
        name,
        address,
        latitude,
        longitude,
        geofence_radius: geofence_radius || 50,
        location_type: location_type || 'checkpoint',
        metadata,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating checkpoint:', error)
      return NextResponse.json(
        { error: 'Failed to create checkpoint', details: error.message },
        { status: 500 }
      )
    }

    // Log the activity
    await supabase
      .from('activity_logs')
      .insert({
        organization_id,
        user_id: created_by,
        module: 'guard',
        action: 'checkpoint_created',
        entity_type: 'location',
        entity_id: checkpoint.id,
        metadata: {
          checkpoint_name: name,
          location_type,
          verification_methods
        }
      })

    return NextResponse.json({ 
      success: true, 
      checkpoint 
    })
  } catch (error) {
    console.error('Error in POST /api/checkpoints:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update an existing checkpoint
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      organization_id,
      name,
      description,
      address,
      latitude,
      longitude,
      location_type,
      qr_code,
      nfc_tag,
      is_active,
      verification_methods,
      geofence_radius,
      visit_instructions,
      updated_by
    } = body

    if (!id || !organization_id) {
      return NextResponse.json(
        { error: 'Checkpoint ID and organization ID are required' },
        { status: 400 }
      )
    }

    // Prepare metadata
    const metadata = {
      qr_code,
      nfc_tag_id: nfc_tag,
      special_instructions: visit_instructions,
      verification_methods: verification_methods || ['qr'],
      expected_visit_duration: 5
    }

    const { data: checkpoint, error } = await supabase
      .from('locations')
      .update({
        name,
        address,
        latitude,
        longitude,
        geofence_radius,
        location_type,
        metadata
      })
      .eq('id', id)
      .eq('organization_id', organization_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating checkpoint:', error)
      return NextResponse.json(
        { error: 'Failed to update checkpoint', details: error.message },
        { status: 500 }
      )
    }

    // Log the activity
    if (updated_by) {
      await supabase
        .from('activity_logs')
        .insert({
          organization_id,
          user_id: updated_by,
          module: 'guard',
          action: 'checkpoint_updated',
          entity_type: 'location',
          entity_id: checkpoint.id,
          metadata: {
            checkpoint_name: name,
            location_type
          }
        })
    }

    return NextResponse.json({ 
      success: true, 
      checkpoint 
    })
  } catch (error) {
    console.error('Error in PUT /api/checkpoints:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a checkpoint
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const organizationId = searchParams.get('organization_id')
    const deletedBy = searchParams.get('deleted_by')

    if (!id || !organizationId) {
      return NextResponse.json(
        { error: 'Checkpoint ID and organization ID are required' },
        { status: 400 }
      )
    }

    // First get the checkpoint details for logging
    const { data: existingCheckpoint } = await supabase
      .from('locations')
      .select('name, location_type')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single()

    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error deleting checkpoint:', error)
      return NextResponse.json(
        { error: 'Failed to delete checkpoint', details: error.message },
        { status: 500 }
      )
    }

    // Log the activity
    if (deletedBy && existingCheckpoint) {
      await supabase
        .from('activity_logs')
        .insert({
          organization_id: organizationId,
          user_id: deletedBy,
          module: 'guard',
          action: 'checkpoint_deleted',
          entity_type: 'location',
          entity_id: id,
          metadata: {
            checkpoint_name: existingCheckpoint.name,
            location_type: existingCheckpoint.location_type
          }
        })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/checkpoints:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}