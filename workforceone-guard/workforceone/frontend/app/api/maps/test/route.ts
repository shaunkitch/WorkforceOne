import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  
  if (!apiKey) {
    return NextResponse.json({
      success: false,
      error: 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY not found',
      apiKey: null
    })
  }

  try {
    // Test the API key by making a simple request
    const testUrl = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=maps,marker`
    const response = await fetch(testUrl)
    
    const isValid = response.status === 200
    const responseText = await response.text()
    
    // Check if the response contains error indicators
    const hasError = responseText.includes('Google Maps JavaScript API error') || 
                     responseText.includes('InvalidKeyMapError') ||
                     responseText.includes('RefererNotAllowedMapError')

    return NextResponse.json({
      success: isValid && !hasError,
      apiKey: apiKey ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}` : null,
      httpStatus: response.status,
      hasError,
      errorIndicators: {
        invalidKey: responseText.includes('InvalidKeyMapError'),
        refererNotAllowed: responseText.includes('RefererNotAllowedMapError'),
        quotaExceeded: responseText.includes('QuotaExceeded'),
        apiError: responseText.includes('Google Maps JavaScript API error')
      },
      responseLength: responseText.length,
      responsePreview: responseText.substring(0, 200)
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      apiKey: apiKey ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}` : null
    })
  }
}