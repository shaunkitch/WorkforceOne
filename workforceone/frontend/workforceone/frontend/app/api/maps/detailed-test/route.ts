import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  
  console.log('=== DETAILED GOOGLE MAPS API TEST ===')
  console.log('API Key present:', !!apiKey)
  console.log('API Key prefix:', apiKey ? apiKey.substring(0, 15) + '...' : 'NONE')
  
  if (!apiKey) {
    return NextResponse.json({
      success: false,
      error: 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable not found'
    })
  }

  try {
    // Test 1: Basic API response
    const testUrl = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=maps,marker`
    console.log('Testing URL:', testUrl.replace(apiKey, 'API_KEY_HIDDEN'))
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; API-Test/1.0)'
      }
    })
    
    const responseText = await response.text()
    console.log('HTTP Status:', response.status)
    console.log('Content-Type:', response.headers.get('content-type'))
    console.log('Response length:', responseText.length)
    
    // Test 2: Look for specific error patterns
    const errors = {
      invalidKey: responseText.includes('InvalidKeyMapError'),
      refererNotAllowed: responseText.includes('RefererNotAllowedMapError'),
      quotaExceeded: responseText.includes('QuotaExceeded') || responseText.includes('OVER_QUERY_LIMIT'),
      billingNotEnabled: responseText.includes('billing') || responseText.includes('BILLING_NOT_ENABLED'),
      apiNotEnabled: responseText.includes('API_NOT_ACTIVATED') || responseText.includes('not activated'),
      requestDenied: responseText.includes('REQUEST_DENIED'),
      generalError: responseText.includes('Google Maps JavaScript API error')
    }
    
    console.log('Error analysis:', errors)
    
    // Test 3: Alternative simple Maps API test
    const simpleTestUrl = `https://maps.googleapis.com/maps/api/staticmap?center=40.714728,-73.998672&zoom=12&size=400x400&key=${apiKey}`
    const simpleResponse = await fetch(simpleTestUrl)
    
    console.log('Static Maps API test status:', simpleResponse.status)
    console.log('Static Maps content-type:', simpleResponse.headers.get('content-type'))
    
    // Extract any error messages from the response
    const errorMatches = responseText.match(/error[^"']*["']([^"']+)/gi) || []
    const messageMatches = responseText.match(/message[^"']*["']([^"']+)/gi) || []
    
    return NextResponse.json({
      success: response.status === 200 && !Object.values(errors).some(Boolean),
      apiKey: `${apiKey.substring(0, 12)}...${apiKey.substring(apiKey.length - 4)}`,
      tests: {
        jsApi: {
          status: response.status,
          contentType: response.headers.get('content-type'),
          responseSize: responseText.length
        },
        staticApi: {
          status: simpleResponse.status,
          contentType: simpleResponse.headers.get('content-type')
        }
      },
      errors,
      errorMessages: errorMatches.slice(0, 3),
      messages: messageMatches.slice(0, 3),
      diagnosis: getDiagnosis(errors, response.status, simpleResponse.status),
      recommendations: getRecommendations(errors)
    })
    
  } catch (error) {
    console.error('API test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      apiKey: `${apiKey.substring(0, 12)}...${apiKey.substring(apiKey.length - 4)}`
    }, { status: 500 })
  }
}

function getDiagnosis(errors: any, jsApiStatus: number, staticApiStatus: number): string {
  if (errors.billingNotEnabled) return 'Billing not enabled on Google Cloud project'
  if (errors.apiNotEnabled) return 'Maps JavaScript API not enabled'
  if (errors.invalidKey) return 'API key is invalid or malformed'
  if (errors.refererNotAllowed) return 'Referrer restrictions blocking localhost'
  if (errors.quotaExceeded) return 'API quota exceeded - need billing or higher limits'
  if (errors.requestDenied) return 'Request denied - check API restrictions'
  if (jsApiStatus !== 200) return `HTTP error: ${jsApiStatus}`
  if (staticApiStatus !== 200) return 'API key works for JS API but not Static Maps'
  return 'API key appears to be working correctly'
}

function getRecommendations(errors: any): string[] {
  const recommendations = []
  
  if (errors.billingNotEnabled) {
    recommendations.push('Enable billing in Google Cloud Console')
    recommendations.push('Visit: https://console.cloud.google.com/billing')
  }
  
  if (errors.apiNotEnabled) {
    recommendations.push('Enable Maps JavaScript API in Google Cloud Console')
    recommendations.push('Visit: APIs & Services → Library → Maps JavaScript API')
  }
  
  if (errors.invalidKey) {
    recommendations.push('Generate a new API key in Google Cloud Console')
    recommendations.push('Ensure key is copied correctly without extra spaces')
  }
  
  if (errors.refererNotAllowed) {
    recommendations.push('Add http://localhost:3001/* to referrer restrictions')
    recommendations.push('Or temporarily remove referrer restrictions for testing')
  }
  
  if (errors.quotaExceeded) {
    recommendations.push('Enable billing to increase quotas')
    recommendations.push('Check quota usage in Google Cloud Console')
  }
  
  if (recommendations.length === 0) {
    recommendations.push('API key looks good - check browser console for client-side errors')
    recommendations.push('Verify Maps JavaScript API is enabled')
  }
  
  return recommendations
}