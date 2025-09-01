'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth/hooks'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, MapPin, Clock, User, QrCode, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface QRCodeData {
  id: string
  code: string
  type: 'static' | 'random'
  site_id?: string
  valid_from: string
  valid_until?: string
  is_active: boolean
}

function AttendanceScanContent() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
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
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [shiftType, setShiftType] = useState<'check_in' | 'check_out'>('check_in')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    } else if (user && code) {
      validateQRCode()
    } else if (!code) {
      setError('No QR code provided')
      setLoading(false)
    }
  }, [user, authLoading, code, router])

  const validateQRCode = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('[Debug] Raw code from URL:', rawCode)
      console.log('[Debug] Processed code:', code)

      // Validate QR code exists and is active
      const { data: qrData, error: qrError } = await supabase
        .from('qr_codes')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .single()

      console.log('[Debug] Query result:', { qrData, qrError })

      if (qrError || !qrData) {
        setError(`Invalid QR code. Searched for: "${code}"`)
        setLoading(false)
        return
      }

      // Check if QR code is still valid (for random codes)
      if (qrData.type === 'random' && qrData.valid_until) {
        const validUntil = new Date(qrData.valid_until)
        if (new Date() > validUntil) {
          setError('QR code has expired')
          setLoading(false)
          return
        }
      }

      setQrCodeData(qrData)
      setLoading(false)

    } catch (error) {
      console.error('Error validating QR code:', error)
      setError('Failed to validate QR code')
      setLoading(false)
    }
  }

  const submitAttendance = async () => {
    if (!user || !qrCodeData) return

    try {
      setSubmitting(true)
      setError(null)
      setSuccess(null)

      // Get current location
      const position = await getCurrentPosition()
      
      // Submit attendance record
      const { error: attendanceError } = await supabase
        .from('shift_attendance')
        .insert({
          user_id: user.id,
          shift_type: shiftType,
          timestamp: new Date().toISOString(),
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          qr_code_id: qrCodeData.id,
          qr_code_type: qrCodeData.type,
        })

      if (attendanceError) {
        console.error('Error submitting attendance:', attendanceError)
        setError('Failed to submit attendance')
        return
      }

      setSuccess(`Successfully ${shiftType === 'check_in' ? 'checked in' : 'checked out'}!`)
      
      // Redirect after a delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)

    } catch (error: any) {
      console.error('Error submitting attendance:', error)
      setError(error.message || 'Failed to submit attendance')
    } finally {
      setSubmitting(false)
    }
  }

  const getCurrentPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => reject(new Error('Location access denied')),
        { 
          enableHighAccuracy: true, 
          timeout: 10000, 
          maximumAge: 60000 
        }
      )
    })
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) return null

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
            <CardTitle className="text-center">Attendance Check-in/out</CardTitle>
            <CardDescription className="text-center">
              Scan QR code to record your attendance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="flex items-center justify-center p-4 bg-red-50 border border-red-200 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-red-800">{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center justify-center p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-green-800">{success}</span>
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

                  {/* User Info */}
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                    <User className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-medium">{user.first_name} {user.last_name}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                  </div>

                  {/* Current Time */}
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                    <Clock className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-medium">Current Time</p>
                      <p className="text-sm text-gray-600">{new Date().toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Shift Type Selection */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700">Select Action:</label>
                    <div className="flex space-x-4">
                      <button
                        onClick={() => setShiftType('check_in')}
                        className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                          shiftType === 'check_in'
                            ? 'border-green-500 bg-green-50 text-green-900'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-green-300'
                        }`}
                      >
                        <CheckCircle className="h-5 w-5 mx-auto mb-2" />
                        <div className="text-center">
                          <p className="font-medium">Check In</p>
                          <p className="text-xs">Start your shift</p>
                        </div>
                      </button>
                      <button
                        onClick={() => setShiftType('check_out')}
                        className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                          shiftType === 'check_out'
                            ? 'border-red-500 bg-red-50 text-red-900'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-red-300'
                        }`}
                      >
                        <XCircle className="h-5 w-5 mx-auto mb-2" />
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
                    disabled={submitting}
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

                  {/* Location Notice */}
                  <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <MapPin className="h-4 w-4 text-yellow-600" />
                    <p className="text-sm text-yellow-800">
                      Location access required for attendance verification
                    </p>
                  </div>
                </div>
              </>
            )}

            {!qrCodeData && !error && (
              <div className="text-center py-8">
                <QrCode className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">Validating QR code...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )
}

export default function AttendanceScanPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AttendanceScanContent />
    </Suspense>
  )
}