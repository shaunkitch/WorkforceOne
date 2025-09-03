import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// OPTIONS - Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 })
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  return response
}

// POST - Validate checkpoint QR code and record visit
export async function POST(request: NextRequest) {
  try {
    console.log('[Mobile Checkpoint API] POST request received');
    
    const body = await request.json()
    const {
      action,
      guard_id,
      organization_id,
      qr_code,
      patrol_id,
      latitude,
      longitude
    } = body

    console.log('[Mobile Checkpoint API] Parameters:', { 
      action, 
      guard_id, 
      organization_id, 
      qr_code: qr_code?.substring(0, 20) + '...', 
      patrol_id 
    });

    if (!guard_id || !organization_id || !qr_code) {
      return NextResponse.json(
        { error: 'Guard ID, organization ID, and QR code are required' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()

    if (action === 'validate') {
      // Validate checkpoint QR code
      console.log('[Mobile Checkpoint API] Validating QR code...');
      
      // Try multiple query approaches
      let checkpoint = null
      
      // First try: Direct QR code match
      const { data: qrResult, error: qrError } = await supabaseAdmin
        .from('locations')
        .select('*')
        .eq('location_type', 'checkpoint')
        .eq('organization_id', organization_id)
        .eq('metadata->>qr_code', qr_code)
        .maybeSingle()

      if (qrResult && !qrError) {
        checkpoint = qrResult
        console.log('[Mobile Checkpoint API] Found checkpoint via QR code:', checkpoint.name);
      } else {
        console.log('[Mobile Checkpoint API] QR code query failed:', { qrError });
        
        // Second try: NFC tag match
        const { data: nfcResult, error: nfcError } = await supabaseAdmin
          .from('locations')
          .select('*')
          .eq('location_type', 'checkpoint')
          .eq('organization_id', organization_id)
          .eq('metadata->>nfc_tag_id', qr_code)
          .maybeSingle()

        if (nfcResult && !nfcError) {
          checkpoint = nfcResult
          console.log('[Mobile Checkpoint API] Found checkpoint via NFC:', checkpoint.name);
        } else {
          console.log('[Mobile Checkpoint API] NFC query failed:', { nfcError });
          
          // Third try: Client-side filtering
          const { data: allCheckpoints, error: allError } = await supabaseAdmin
            .from('locations')
            .select('*')
            .eq('location_type', 'checkpoint')
            .eq('organization_id', organization_id)

          console.log('[Mobile Checkpoint API] All checkpoints query:', { 
            error: allError, 
            count: allCheckpoints?.length 
          });
          
          if (!allError && allCheckpoints) {
            checkpoint = allCheckpoints.find(cp => 
              cp.metadata?.qr_code === qr_code || 
              cp.metadata?.nfc_tag_id === qr_code
            )
            
            if (checkpoint) {
              console.log('[Mobile Checkpoint API] Found checkpoint via filtering:', checkpoint.name);
            }
          }
        }
      }

      if (!checkpoint) {
        console.log('[Mobile Checkpoint API] No checkpoint found for QR code:', qr_code);
        return NextResponse.json({
          success: false,
          error: 'This QR code is not a valid checkpoint for patrols.'
        })
      }

      return NextResponse.json({
        success: true,
        checkpoint: {
          id: checkpoint.id,
          name: checkpoint.name,
          address: checkpoint.address
        }
      })
    }

    if (action === 'visit' && patrol_id) {
      // Record checkpoint visit
      console.log('[Mobile Checkpoint API] Recording checkpoint visit...');
      
      // First validate the checkpoint exists
      const { data: checkpoint, error: checkpointError } = await supabaseAdmin
        .from('locations')
        .select('*')
        .eq('location_type', 'checkpoint')
        .eq('organization_id', organization_id)
        .eq('metadata->>qr_code', qr_code)
        .maybeSingle()

      if (checkpointError || !checkpoint) {
        console.log('[Mobile Checkpoint API] Checkpoint validation failed:', checkpointError);
        return NextResponse.json({
          success: false,
          error: 'Invalid checkpoint'
        })
      }

      // Record the visit
      const { error: visitError } = await supabaseAdmin
        .from('checkpoint_visits')
        .insert({
          patrol_id,
          location_id: checkpoint.id,
          guard_id,
          visited_at: new Date().toISOString(),
          verification_method: 'qr',
          verification_data: qr_code,
          latitude,
          longitude
        })

      if (visitError) {
        console.error('[Mobile Checkpoint API] Error recording visit:', visitError);
        return NextResponse.json({
          success: false,
          error: 'Failed to record checkpoint visit'
        })
      }

      // Update patrol checkpoints completed - first get current count
      const { data: currentPatrol } = await supabaseAdmin
        .from('patrols')
        .select('checkpoints_completed')
        .eq('id', patrol_id)
        .single()
      
      const newCount = (currentPatrol?.checkpoints_completed || 0) + 1
      
      const { error: patrolError } = await supabaseAdmin
        .from('patrols')
        .update({ 
          checkpoints_completed: newCount
        })
        .eq('id', patrol_id)

      if (patrolError) {
        console.error('[Mobile Checkpoint API] Error updating patrol:', patrolError);
      }

      console.log('[Mobile Checkpoint API] Checkpoint visit recorded successfully - patrol updated to', newCount);
      return NextResponse.json({
        success: true,
        checkpoint: {
          id: checkpoint.id,
          name: checkpoint.name,
          address: checkpoint.address
        }
      })
    }

    return NextResponse.json(
      { error: 'Invalid action specified' },
      { status: 400 }
    )

  } catch (error: any) {
    console.error('[Mobile Checkpoint API] Error:', error);
    console.error('[Mobile Checkpoint API] Error stack:', error.stack);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message, stack: error.stack },
      { status: 500 }
    )
  }
}