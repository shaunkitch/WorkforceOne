import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  // Set up Server-Sent Events for real-time GPS updates
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    start(controller) {
      const supabaseAdmin = getSupabaseAdmin()
      
      // Send initial connection message
      const sendData = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }
      
      sendData({ type: 'connected', timestamp: new Date().toISOString() })
      
      // Set up interval to fetch and send updates
      const interval = setInterval(async () => {
        try {
          const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
          
          const { data, error } = await supabaseAdmin
            .from('gps_tracking')
            .select(`
              user_id,
              latitude,
              longitude,
              accuracy,
              altitude,
              speed,
              heading,
              battery_level,
              timestamp,
              users:user_id (
                first_name,
                last_name
              )
            `)
            .gte('timestamp', thirtyMinutesAgo)
            .order('timestamp', { ascending: false })

          if (error) {
            sendData({ type: 'error', error: error.message })
            return
          }

          // Group by user_id and get latest position
          const userPositions = new Map()
          data?.forEach(item => {
            if (!userPositions.has(item.user_id) || 
                new Date(item.timestamp) > new Date(userPositions.get(item.user_id).timestamp)) {
              userPositions.set(item.user_id, item)
            }
          })

          const positions = Array.from(userPositions.values()).map(item => ({
            userId: item.user_id,
            userName: `${item.users?.first_name || 'Unknown'} ${item.users?.last_name || 'User'}`,
            position: {
              latitude: item.latitude,
              longitude: item.longitude,
              accuracy: item.accuracy,
              altitude: item.altitude,
              speed: item.speed,
              heading: item.heading,
              timestamp: item.timestamp
            },
            batteryLevel: item.battery_level
          }))

          sendData({
            type: 'update',
            timestamp: new Date().toISOString(),
            count: positions.length,
            positions
          })

        } catch (error) {
          sendData({ 
            type: 'error', 
            error: error instanceof Error ? error.message : 'Unknown error' 
          })
        }
      }, 10000) // Update every 10 seconds

      // Clean up on connection close
      request.signal?.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  })
}