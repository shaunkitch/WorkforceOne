'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  QrCode, Smartphone, MapPin, Clock, CheckCircle, XCircle, 
  AlertTriangle, RefreshCw, ArrowLeft, User, Camera, Navigation,
  Loader2, Shield
} from 'lucide-react'
import Link from 'next/link'
import { NFCScannerService, NFCScanResult } from '@/lib/services/nfc-scanner'
import { useLocationService } from '@/lib/services/location'
import QRAuthGuard from '@/components/auth/QRAuthGuard'
import { QRAuthUser } from '@/lib/auth/qr-auth'

interface Checkpoint {
  id: string
  name: string
  siteId: string
  routeId?: string
  instructions?: string
  requiredActions?: string[]
  qrCode?: string
  nfcEnabled: boolean
  location?: {
    lat: number
    lng: number
  }
}

const CheckpointScanContent: React.FC<{ user: QRAuthUser }> = ({ user }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { getCurrentLocation } = useLocationService()
  const qrCode = searchParams.get('code')
  
  const [checkpoint, setCheckpoint] = useState<Checkpoint | null>(null)
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [scanMethod, setScanMethod] = useState<'qr' | 'nfc'>('qr')
  const [nfcSupported, setNfcSupported] = useState(false)
  const [location, setLocation] = useState<any>(null)

  useEffect(() => {
    // Check NFC support
    setNfcSupported(NFCScannerService.isNFCSupported())
    
    if (qrCode) {
      validateCheckpoint(qrCode, 'qr')
    } else {
      setError('No checkpoint code provided')
      setLoading(false)
    }
  }, [qrCode])

  const validateCheckpoint = async (code: string, method: 'qr' | 'nfc') => {
    try {
      setLoading(true)
      setError(null)

      console.log(`[Checkpoint] Validating ${method.toUpperCase()} code:`, code)

      // Get checkpoint data from API
      const response = await fetch(`/api/patrols/checkpoints/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          method,
          userId: user.id
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Checkpoint validation failed')
      }

      setCheckpoint(result.checkpoint)
      
      // Get current location for verification
      try {
        const currentLocation = await getCurrentLocation()
        setLocation(currentLocation)
      } catch (locError) {
        console.warn('Location not available:', locError)
      }

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Validation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleQRScan = async () => {
    if (!qrCode) return
    await validateCheckpoint(qrCode, 'qr')
  }

  const handleNFCScan = async () => {
    try {
      setScanning(true)
      setError(null)

      const scanResult = await NFCScannerService.startScanning(
        (result: NFCScanResult) => {
          setScanning(false)
          
          if (result.success && result.data) {
            validateCheckpoint(result.data.checkpointId, 'nfc')
          } else {
            setError(result.error || 'NFC scan failed')
          }
        },
        15000 // 15 second timeout
      )

      if (!scanResult.success) {
        setScanning(false)
        setError(scanResult.error || 'Failed to start NFC scanning')
      }

    } catch (error) {
      setScanning(false)
      setError(error instanceof Error ? error.message : 'NFC scan failed')
    }
  }

  const handleCheckpointVisit = async () => {
    if (!checkpoint) return

    try {
      setLoading(true)
      
      const response = await fetch('/api/patrols/checkpoint-visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkpointId: checkpoint.id,
          siteId: checkpoint.siteId,
          routeId: checkpoint.routeId,
          userId: user.id,
          scanMethod,
          location,
          notes: ''
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to record checkpoint visit')
      }

      setSuccess('Checkpoint scan successful! Visit recorded.')
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/dashboard/patrols')
      }, 2000)

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to record visit')
    } finally {
      setLoading(false)
    }
  }

  const stopNFCScanning = async () => {
    await NFCScannerService.stopScanning()
    setScanning(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <h3 className="text-lg font-medium">Validating Checkpoint...</h3>
            <p className="text-sm text-gray-600 mt-2">Please wait while we verify your scan</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error && !checkpoint) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="p-3 bg-red-100 rounded-full w-fit mx-auto mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-red-900">Checkpoint Error</CardTitle>
            <CardDescription className="text-red-700">
              Unable to validate checkpoint
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            
            <div className="flex flex-col space-y-2">
              <Button onClick={() => window.location.reload()} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Link href="/dashboard/patrols">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Patrols
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="p-3 bg-green-100 rounded-full w-fit mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-green-900">Checkpoint Scanned!</CardTitle>
            <CardDescription className="text-green-700">
              Your visit has been recorded
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">{success}</p>
            </div>
            <p className="text-sm text-gray-600">
              Redirecting to patrol dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard/patrols">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Patrols
            </Button>
          </Link>
          
          <div className="flex items-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full mr-4">
              <MapPin className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Checkpoint Scan</h1>
              <p className="text-gray-600">Record your visit to this patrol checkpoint</p>
            </div>
          </div>
        </div>

        {/* Checkpoint Info */}
        {checkpoint && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                    {checkpoint.name}
                  </CardTitle>
                  <CardDescription>Site: {checkpoint.siteId}</CardDescription>
                </div>
                <Badge variant={checkpoint.nfcEnabled ? "default" : "secondary"}>
                  {checkpoint.nfcEnabled ? "QR + NFC" : "QR Only"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {checkpoint.instructions && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Instructions:</h4>
                  <p className="text-sm text-blue-800">{checkpoint.instructions}</p>
                </div>
              )}

              {checkpoint.requiredActions && checkpoint.requiredActions.length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h4 className="font-medium text-amber-900 mb-2">Required Actions:</h4>
                  <ul className="text-sm text-amber-800 space-y-1">
                    {checkpoint.requiredActions.map((action, index) => (
                      <li key={index} className="flex items-center">
                        <CheckCircle className="h-3 w-3 mr-2" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {location && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Your Location:</h4>
                  <p className="text-sm text-green-800">
                    <Navigation className="h-3 w-3 inline mr-1" />
                    {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                    {location.accuracy && ` (±${Math.round(location.accuracy)}m)`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Scanning Options */}
        <Card>
          <CardHeader>
            <CardTitle>Scan Checkpoint</CardTitle>
            <CardDescription>
              Choose your scanning method to record your visit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={scanMethod} onValueChange={(value: any) => setScanMethod(value)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="qr" className="flex items-center">
                  <QrCode className="h-4 w-4 mr-2" />
                  QR Code
                </TabsTrigger>
                <TabsTrigger 
                  value="nfc" 
                  disabled={!nfcSupported}
                  className="flex items-center"
                >
                  <Smartphone className="h-4 w-4 mr-2" />
                  NFC {!nfcSupported && "(Not Supported)"}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="qr" className="space-y-4">
                <div className="text-center space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <QrCode className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                    <h3 className="font-medium text-blue-900 mb-2">QR Code Detected</h3>
                    <p className="text-sm text-blue-800">
                      {checkpoint ? 'Checkpoint validated successfully' : 'Validating checkpoint...'}
                    </p>
                  </div>

                  {checkpoint && (
                    <Button 
                      onClick={handleCheckpointVisit}
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Recording Visit...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Record Checkpoint Visit
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="nfc" className="space-y-4">
                <div className="text-center space-y-4">
                  {!scanning ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <Smartphone className="h-12 w-12 mx-auto mb-4 text-purple-600" />
                        <h3 className="font-medium text-purple-900 mb-2">NFC Scanning</h3>
                        <p className="text-sm text-purple-800">
                          Tap the NFC tag at this checkpoint to record your visit
                        </p>
                      </div>

                      <Button 
                        onClick={handleNFCScan}
                        disabled={!nfcSupported}
                        className="w-full"
                      >
                        <Smartphone className="h-4 w-4 mr-2" />
                        Start NFC Scan
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="animate-pulse">
                          <Smartphone className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                        </div>
                        <h3 className="font-medium text-blue-900 mb-2">Scanning for NFC Tag...</h3>
                        <p className="text-sm text-blue-800">
                          Hold your device near the NFC tag
                        </p>
                      </div>

                      <Button 
                        onClick={stopNFCScanning}
                        variant="outline"
                        className="w-full"
                      >
                        Cancel Scan
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Guard Info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Guard Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">Name:</span> {user.first_name} {user.last_name}
              </p>
              <p className="text-sm">
                <span className="font-medium">Role:</span> {user.role?.name}
              </p>
              <p className="text-sm">
                <span className="font-medium">Time:</span> {new Date().toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function CheckpointPageContent() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = searchParams.get('code')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const authContext = {
    returnUrl: typeof window !== 'undefined' ? window.location.href : `/patrols/checkpoint?code=${code}`,
    qrCode: code || undefined,
    action: 'patrol' as const
  }

  return (
    <QRAuthGuard context={authContext}>
      {(user: QRAuthUser) => <CheckpointScanContent user={user} />}
    </QRAuthGuard>
  )
}

export default function CheckpointPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <CheckpointPageContent />
    </Suspense>
  )
}