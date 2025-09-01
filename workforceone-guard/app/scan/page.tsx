'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, MapPin, Clock, User, QrCode, ArrowLeft, AlertTriangle, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useQRErrorHandler, QRScanErrors, QRScannerError } from '@/lib/errors/qr-scanner'
import { useLocationService, LocationCoordinates } from '@/lib/services/location'
import { QRDetectionService } from '@/lib/services/qr-detection'
import QRAuthGuard from '@/components/auth/QRAuthGuard'
import { QRAuthUser } from '@/lib/auth/qr-auth'

interface QRCodeData {
  id: string
  code: string
  type: 'static' | 'random' | 'registration'
  site_id?: string
  valid_from: string
  valid_until?: string
  is_active: boolean
  metadata?: any
}

const QRScanContent: React.FC<{ user: QRAuthUser }> = ({ user }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { handleError } = useQRErrorHandler()
  const { getCurrentLocation } = useLocationService()
  const rawCode = searchParams.get('code')
  
  // Extract just the code if a full URL was passed
  const getCodeFromParam = (param: string | null): string | null => {
    if (!param) return null
    
    // If param looks like a URL, extract the code parameter from it
    if (param.startsWith('http')) {
      try {
        const url = new URL(param)
        return url.searchParams.get('code')
      } catch {
        // If URL parsing fails, treat as regular code
        return param
      }
    }
    
    return param
  }
  
  const code = getCodeFromParam(rawCode)

  const [loading, setLoading] = useState(true)
  const [qrCodeData, setQrCodeData] = useState<QRCodeData | null>(null)
  const [error, setError] = useState<QRScannerError | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [shiftType, setShiftType] = useState<'check_in' | 'check_out'>('check_in')
  const [location, setLocation] = useState<LocationCoordinates | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)

  useEffect(() => {
    if (!code) {
      setError(QRScanErrors.invalidCode())
      setLoading(false)
      return
    }
    
    if (user && code) {
      validateQRCode()
    }
  }, [code])

  const validateQRCode = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('[QR Validation] Starting validation for code:', code)

      // Detect QR code type and validity
      const detection = await QRDetectionService.detectQRType(code!)
      
      console.log('[QR Detection] Result:', detection)

      if (!detection.isValid) {
        throw QRScanErrors.invalidCode(detection.error)
      }

      // Handle registration QR codes - redirect to registration page
      if (detection.type === 'registration') {
        console.log('[QR Detection] Registration token detected, redirecting...')
        if (detection.redirectUrl) {
          router.push(detection.redirectUrl)
          return
        }
      }

      // Handle patrol QR codes - redirect to patrol checkpoint
      if (detection.type === 'patrol') {
        console.log('[QR Detection] Patrol checkpoint detected, redirecting...')
        if (detection.redirectUrl) {
          router.push(detection.redirectUrl)
          return
        }
      }

      // Handle attendance QR codes
      if (detection.type === 'attendance') {
        console.log('[QR Validation] Attendance QR code validated:', detection.data)
        setQrCodeData(detection.data)
        
        // Get user location for attendance verification
        await requestLocationAccess()
        
        setLoading(false)
        return
      }

      // Unknown QR type
      throw QRScanErrors.invalidCode('QR code type not supported')

    } catch (error) {
      const qrError = handleError(error, { qrCode: code, userId: user?.id })
      setError(qrError)
      setLoading(false)
    }
  }

  const requestLocationAccess = async () => {
    try {
      setLocationLoading(true)
      const locationData = await getCurrentLocation({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
        requiredAccuracy: 100 // 100 meters
      })
      setLocation(locationData)
    } catch (error) {
      const qrError = handleError(error, { userId: user?.id, action: 'location_request' })
      setError(qrError)
    } finally {
      setLocationLoading(false)
    }
  }

  const retryLocationAccess = async () => {
    await requestLocationAccess()
  }

  const submitAttendance = async () => {
    if (!user || !qrCodeData) return

    try {
      setSubmitting(true)
      setError(null)
      setSuccess(null)

      if (!location) {
        throw new QRScannerError(
          'LOCATION_REQUIRED' as any,
          'Location is required for attendance verification',
          'Location is required for attendance verification. Please enable location services and try again.',
          {},
          { userId: user.id, qrCode: qrCodeData.code }
        )
      }
      
      // Submit attendance record
      const { error: attendanceError } = await supabase
        .from('shift_attendance')
        .insert({
          user_id: user.id,
          shift_type: shiftType,
          timestamp: new Date().toISOString(),
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          qr_code_id: qrCodeData.id,
          qr_code_type: qrCodeData.type,
        })

      if (attendanceError) {
        console.error('Error submitting attendance:', attendanceError)
        throw QRScanErrors.recordCreationFailed({
          error: attendanceError.message,
          code: attendanceError.code,
          details: attendanceError.details
        })
      }

      setSuccess(`Successfully ${shiftType === 'check_in' ? 'checked in' : 'checked out'}!`)
      
      // Redirect after a delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 3000)

    } catch (error: any) {
      const qrError = handleError(error, { 
        userId: user.id, 
        qrCode: qrCodeData.code, 
        action: 'submit_attendance',
        shiftType,
        location 
      })
      setError(qrError)
    } finally {
      setSubmitting(false)
    }
  }

  const handleRegistration = () => {
    // Redirect to registration with QR code
    router.push(`/auth/register?token=${code}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Validating QR code...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="p-2 bg-blue-100 rounded-full mr-3">
                <QrCode className="h-6 w-6 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">QR Code Scanner</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">QR Code Scan</CardTitle>
            <CardDescription className="text-center">
              Processing your QR code scan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-red-800">
                      <p className="font-medium">Error</p>
                      <p className="text-sm mt-1">{error.userMessage}</p>
                      {error.errorCode === 'LOCATION_PERMISSION_DENIED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={retryLocationAccess}
                          className="mt-2 text-red-800 border-red-300 hover:bg-red-100"
                          disabled={locationLoading}
                        >
                          {locationLoading ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <MapPin className="h-4 w-4 mr-2" />
                          )}
                          Retry Location Access
                        </Button>
                      )}
                      {process.env.NODE_ENV === 'development' && (
                        <details className="mt-2">
                          <summary className="text-xs cursor-pointer">Debug Info</summary>
                          <pre className="text-xs mt-1 p-2 bg-red-100 rounded overflow-auto">
                            {JSON.stringify(error, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="flex items-center justify-center p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" />
                <div className="text-green-800">
                  <p className="font-medium">Success!</p>
                  <p className="text-sm">{success}</p>
                  <p className="text-xs mt-1">Redirecting to dashboard...</p>
                </div>
              </div>
            )}

            {locationLoading && (
              <div className="flex items-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <RefreshCw className="h-5 w-5 text-blue-600 mr-2 animate-spin flex-shrink-0" />
                <div className="text-blue-800">
                  <p className="font-medium">Getting Location</p>
                  <p className="text-sm">Requesting location access for attendance verification...</p>
                </div>
              </div>
            )}

            {qrCodeData && !success && (
              <>
                {/* QR Code Info */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <QrCode className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-blue-900">Valid QR Code</p>
                        <p className="text-sm text-blue-700">{qrCodeData.code}</p>
                      </div>
                    </div>
                    <Badge variant={qrCodeData.type === 'static' ? 'default' : 'secondary'}>
                      {qrCodeData.type}
                    </Badge>
                  </div>

                  {/* Handle Registration QR Code */}
                  {qrCodeData.type === 'registration' && (
                    <div className="text-center space-y-4">
                      <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
                        <h3 className="text-lg font-medium text-green-900 mb-2">
                          Guard Registration
                        </h3>
                        <p className="text-green-700 mb-4">
                          This QR code is for new guard registration. Click below to complete your registration.
                        </p>
                        <Button onClick={handleRegistration} size="lg" className="w-full">
                          Complete Registration
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Handle Attendance QR Code */}
                  {qrCodeData.type !== 'registration' && (
                    <>
                      {/* User Info */}
                      <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                        <User className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="font-medium">{user.first_name} {user.last_name}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      </div>

                      {/* Current Time and Location Status */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                          <Clock className="h-5 w-5 text-gray-600" />
                          <div>
                            <p className="font-medium">Current Time</p>
                            <p className="text-sm text-gray-600">{new Date().toLocaleString()}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                          <MapPin className={`h-5 w-5 ${
                            location 
                              ? 'text-green-600' 
                              : locationLoading 
                                ? 'text-blue-600' 
                                : 'text-red-600'
                          }`} />
                          <div>
                            <p className="font-medium">Location</p>
                            <p className="text-sm text-gray-600">
                              {location 
                                ? `Verified (${Math.round(location.accuracy)}m accuracy)` 
                                : locationLoading 
                                  ? 'Getting location...' 
                                  : 'Required'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Shift Type Selection */}
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-700">Select Action:</label>
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            onClick={() => setShiftType('check_in')}
                            className={`p-4 rounded-lg border-2 transition-colors ${
                              shiftType === 'check_in'
                                ? 'border-green-500 bg-green-50 text-green-900'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-green-300'
                            }`}
                          >
                            <CheckCircle className="h-6 w-6 mx-auto mb-2" />
                            <div className="text-center">
                              <p className="font-medium">Check In</p>
                              <p className="text-xs">Start your shift</p>
                            </div>
                          </button>
                          
                          <button
                            onClick={() => setShiftType('check_out')}
                            className={`p-4 rounded-lg border-2 transition-colors ${
                              shiftType === 'check_out'
                                ? 'border-red-500 bg-red-50 text-red-900'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-red-300'
                            }`}
                          >
                            <XCircle className="h-6 w-6 mx-auto mb-2" />
                            <div className="text-center">
                              <p className="font-medium">Check Out</p>
                              <p className="text-xs">End your shift</p>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Submit Button */}
                      <Button
                        onClick={submitAttendance}
                        disabled={submitting || !location}
                        className="w-full"
                        size="lg"
                      >
                        {submitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Submitting...
                          </>
                        ) : (
                          <>
                            {shiftType === 'check_in' ? (
                              <CheckCircle className="h-5 w-5 mr-2" />
                            ) : (
                              <XCircle className="h-5 w-5 mr-2" />
                            )}
                            {shiftType === 'check_in' ? 'Check In' : 'Check Out'}
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </>
            )}

            {!qrCodeData && !error && !loading && (
              <div className="text-center py-8">
                <QrCode className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No valid QR code found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

function QRScanPageContent() {
  const searchParams = useSearchParams()
  const code = searchParams.get('code')
  
  const authContext = {
    returnUrl: typeof window !== 'undefined' ? window.location.href : `/scan?code=${code}`,
    qrCode: code || undefined,
    action: 'attendance' as const
  }

  return (
    <QRAuthGuard 
      context={authContext}
      onAuthSuccess={(user: QRAuthUser) => {
        console.log('[QR Scan] User authenticated:', user.email)
      }}
      onAuthError={(error) => {
        console.error('[QR Scan] Auth error:', error.userMessage)
      }}
    >
      {(user: QRAuthUser) => <QRScanContent user={user} />}
    </QRAuthGuard>
  )
}

function LoadingScanFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading QR scanner...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function QRScanPage() {
  return (
    <Suspense fallback={<LoadingScanFallback />}>
      <QRScanPageContent />
    </Suspense>
  )
}