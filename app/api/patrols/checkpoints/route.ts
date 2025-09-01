import { NextRequest, NextResponse } from 'next/server'
import { createApiClient, unauthorizedResponse } from '@/lib/supabase/api'
import { v4 as uuidv4 } from 'uuid'

export async function GET() {
  try {
    const supabase = await createApiClient()
    
    // Get session first
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return unauthorizedResponse()
    }

    // Get user profile to get organization_id
    const { data: userProfile } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', session.user.id)
      .single()

    if (!userProfile?.organization_id) {
      return NextResponse.json(
        { success: false, error: 'No organization found' },
        { status: 404 }
      )
    }

    // Get all checkpoints (using locations table with location_type='checkpoint')
    const { data: checkpoints, error } = await supabase
      .from('locations')
      .select('*')
      .eq('organization_id', userProfile.organization_id)
      .eq('location_type', 'checkpoint')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching checkpoints:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch checkpoints' },
        { status: 500 }
      )
    }

    // Transform data to include verification info from metadata
    const transformedCheckpoints = (checkpoints || []).map(cp => ({
      id: cp.id,
      name: cp.name,
      description: cp.metadata?.description || '',
      location_id: cp.id,
      location: {
        name: cp.name,
        latitude: cp.latitude,
        longitude: cp.longitude
      },
      qr_code: cp.metadata?.qr_code,
      nfc_tag: cp.metadata?.nfc_tag,
      verification_type: cp.metadata?.verification_type || 'qr',
      is_active: cp.metadata?.is_active !== false,
      created_at: cp.created_at
    }))

    return NextResponse.json({
      success: true,
      checkpoints: transformedCheckpoints
    })

  } catch (error) {
    console.error('Checkpoints API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createApiClient()
    
    // Get session first
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return unauthorizedResponse()
    }

    // Get user profile to get organization_id
    const { data: userProfile } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', session.user.id)
      .single()

    if (!userProfile?.organization_id) {
      return NextResponse.json(
        { success: false, error: 'No organization found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { name, description, latitude, longitude, verification_type, is_active } = body

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Checkpoint name is required' },
        { status: 400 }
      )
    }

    // Generate unique codes for QR and NFC
    const qrCode = `CP-${userProfile.organization_id.slice(0, 8)}-${uuidv4().slice(0, 8)}`.toUpperCase()
    const nfcTag = `NFC-${uuidv4().slice(0, 16)}`.toUpperCase()

    // Create checkpoint as a location with type 'checkpoint'
    const { data, error } = await supabase
      .from('locations')
      .insert({
        organization_id: userProfile.organization_id,
        name,
        address: description,
        latitude: latitude || null,
        longitude: longitude || null,
        location_type: 'checkpoint',
        geofence_radius: 50, // 50 meter radius for checkpoint verification
        metadata: {
          description,
          verification_type: verification_type || 'qr',
          qr_code: qrCode,
          nfc_tag: nfcTag,
          is_active: is_active !== false
        }
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating checkpoint:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create checkpoint' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      checkpoint: {
        id: data.id,
        name: data.name,
        description: data.metadata?.description,
        location_id: data.id,
        qr_code: qrCode,
        nfc_tag: nfcTag,
        verification_type: data.metadata?.verification_type,
        is_active: data.metadata?.is_active,
        created_at: data.created_at
      }
    })

  } catch (error) {
    console.error('Checkpoint creation API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}