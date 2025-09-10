import { NextResponse } from 'next/server'

// Test endpoint to simulate mobile app sending GPS data
export async function POST() {
  try {
    console.log('Testing mobile GPS data simulation...')
    
    // Gawie Charcoal's user ID from our debug data
    const testGPSData = {
      user_id: '1282a420-0534-4586-8a96-70e6798a9079',
      latitude: -25.7461,  // Pretoria area coordinates
      longitude: 28.1881,
      accuracy: 10,
      altitude: 1350,
      speed: 0,
      heading: 180,
      battery_level: 85,
      timestamp: new Date().toISOString()
    }
    
    // Send GPS data to our mobile API endpoint
    const response = await fetch(`https://www.workforceone.co.za/api/mobile/gps`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testGPSData)
    })
    
    const result = await response.json()
    
    console.log('GPS data submission result:', result)
    
    // Also test patrol status update
    const testPatrolUpdate = {
      patrol_id: '083ac981-6eb6-420e-81cf-5db9846c3200', // One of Gawie's patrol IDs
      status: 'active',
      user_id: '1282a420-0534-4586-8a96-70e6798a9079'
    }
    
    const patrolResponse = await fetch(`https://www.workforceone.co.za/api/mobile/gps`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPatrolUpdate)
    })
    
    const patrolResult = await patrolResponse.json()
    
    console.log('Patrol status update result:', patrolResult)
    
    return NextResponse.json({
      success: true,
      message: 'Mobile GPS simulation completed',
      results: {
        gpsData: result,
        patrolUpdate: patrolResult
      }
    })
  } catch (error) {
    console.error('Error in mobile GPS test:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}