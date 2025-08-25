'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Camera, X, Check, AlertTriangle, Loader2, MapPin } from 'lucide-react'

interface QRScannerProps {
  onScanResult: (data: string, location?: { lat: number; lng: number }) => void
  onClose: () => void
  isVerifying?: boolean
}

export default function QRScanner({ onScanResult, onClose, isVerifying = false }: QRScannerProps) {
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manualEntry, setManualEntry] = useState('')
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [gettingLocation, setGettingLocation] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    // Get current location when component mounts
    getCurrentLocation()
    
    return () => {
      // Clean up camera stream when component unmounts
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported')
      return
    }

    setGettingLocation(true)
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
        setGettingLocation(false)
      },
      (error) => {
        console.error('Error getting location:', error)
        setGettingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )
  }

  const startCamera = async () => {
    try {
      setError(null)
      setIsActive(true)

      // Request camera permission and stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera if available
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        streamRef.current = stream
        
        // Start QR code detection (simplified version)
        // In a production app, you'd use a library like @zxing/library or qr-scanner
        startQRDetection()
      }
    } catch (error) {
      console.error('Camera access error:', error)
      setError('Cannot access camera. Please check permissions and try again.')
      setIsActive(false)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsActive(false)
  }

  const startQRDetection = () => {
    // This is a simplified version - in production you'd use a proper QR code library
    // For now, we'll simulate QR detection with a placeholder
    console.log('QR detection started (placeholder implementation)')
  }

  const handleManualSubmit = () => {
    if (manualEntry.trim()) {
      onScanResult(manualEntry.trim(), location || undefined)
    }
  }

  const simulateQRScan = (data: string) => {
    // For demo purposes - simulate scanning different types of QR codes
    onScanResult(data, location || undefined)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Camera className="h-5 w-5 mr-2" />
              Checkpoint Scanner
            </span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardTitle>
          <CardDescription>
            Scan a QR code or NFC tag to verify your checkpoint visit
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Location Status */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-gray-500" />
              <span className="text-sm text-gray-600">
                {gettingLocation ? 'Getting location...' : 
                 location ? 'Location acquired' : 'Location unavailable'}
              </span>
            </div>
            {gettingLocation && <Loader2 className="h-4 w-4 animate-spin" />}
            {location && <Check className="h-4 w-4 text-green-600" />}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Camera Scanner */}
          <div className="space-y-3">
            {!isActive ? (
              <div className="text-center py-8">
                <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  Position the QR code within the camera frame
                </p>
                <Button onClick={startCamera} disabled={isVerifying}>
                  {isVerifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Camera className="mr-2 h-4 w-4" />
                      Start Camera
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full h-64 bg-black rounded-lg"
                  playsInline
                  muted
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-white rounded-lg opacity-50">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white"></div>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={stopCamera}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Demo QR Codes for Testing */}
          {isActive && (
            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-3">Demo QR Codes (for testing):</p>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => simulateQRScan('checkpoint:main-entrance')}
                  disabled={isVerifying}
                >
                  Main Entrance
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => simulateQRScan('checkpoint:parking-lot-a')}
                  disabled={isVerifying}
                >
                  Parking Lot A
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => simulateQRScan('checkpoint:security-office')}
                  disabled={isVerifying}
                >
                  Security Office
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => simulateQRScan('checkpoint:emergency-exit')}
                  disabled={isVerifying}
                >
                  Emergency Exit
                </Button>
              </div>
            </div>
          )}

          {/* Manual Entry */}
          <div className="border-t pt-4">
            <Label htmlFor="manual-entry" className="text-sm font-medium">
              Manual Entry (if scanner isn't working)
            </Label>
            <div className="mt-2 space-y-2">
              <Textarea
                id="manual-entry"
                placeholder="Enter QR code data manually..."
                value={manualEntry}
                onChange={(e) => setManualEntry(e.target.value)}
                rows={3}
              />
              <Button 
                onClick={handleManualSubmit} 
                disabled={!manualEntry.trim() || isVerifying}
                variant="outline"
                size="sm"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Submit Manually'
                )}
              </Button>
            </div>
          </div>

          {/* NFC Support */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">NFC Tag Scanning</span>
              <Badge variant={('NDEFReader' in window) ? 'default' : 'secondary'}>
                {('NDEFReader' in window) ? 'Supported' : 'Not Available'}
              </Badge>
            </div>
            {('NDEFReader' in window) ? (
              <p className="text-sm text-gray-600 mt-1">
                Hold your device near an NFC-enabled checkpoint tag
              </p>
            ) : (
              <p className="text-sm text-gray-600 mt-1">
                NFC is not supported on this device or browser
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}