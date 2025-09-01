'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Smartphone, X, Check, AlertTriangle, Loader2, MapPin, Zap } from 'lucide-react'

interface NFCScannerProps {
  onScanResult: (nfcData: string, location?: { lat: number; lng: number }) => void
  onClose: () => void
  isVerifying?: boolean
}

export default function NFCScanner({ onScanResult, onClose, isVerifying = false }: NFCScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [nfcSupported, setNfcSupported] = useState(false)
  const [reader, setReader] = useState<NDEFReader | null>(null)

  useEffect(() => {
    // Check NFC support
    const checkNFCSupport = () => {
      const isSupported = 'NDEFReader' in window
      setNfcSupported(isSupported)
      
      if (isSupported) {
        try {
          const ndefReader = new (window as any).NDEFReader()
          setReader(ndefReader)
        } catch (error) {
          console.error('Error creating NDEFReader:', error)
          setError('NFC is not available on this device')
        }
      }
    }

    checkNFCSupport()
    getCurrentLocation()
    
    return () => {
      if (reader && isScanning) {
        try {
          reader.scan().catch(() => {}) // Stop scanning
        } catch (error) {
          console.error('Error stopping NFC scan:', error)
        }
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

  const startNFCScanning = async () => {
    if (!reader) {
      setError('NFC reader not available')
      return
    }

    try {
      setError(null)
      setIsScanning(true)

      // Request NFC permission and start scanning
      await reader.scan()
      
      reader.addEventListener('reading', ({ message }: any) => {
        console.log('NFC tag detected:', message)
        
        // Extract the data from the NFC message
        if (message.records.length > 0) {
          const record = message.records[0]
          let nfcData = ''
          
          if (record.recordType === 'text') {
            const textDecoder = new TextDecoder(record.encoding)
            nfcData = textDecoder.decode(record.data)
          } else if (record.recordType === 'url') {
            nfcData = new TextDecoder().decode(record.data)
          } else {
            // For other types, try to decode as text
            try {
              nfcData = new TextDecoder().decode(record.data)
            } catch {
              nfcData = Array.from(new Uint8Array(record.data))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('')
            }
          }
          
          if (nfcData) {
            onScanResult(nfcData, location || undefined)
          }
        }
      })

      reader.addEventListener('readingerror', () => {
        setError('Failed to read NFC tag. Please try again.')
        setIsScanning(false)
      })

    } catch (error: any) {
      console.error('NFC scanning error:', error)
      let errorMessage = 'Failed to start NFC scanning'
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'NFC permission denied. Please allow NFC access.'
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'NFC is not supported on this device or browser'
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'NFC hardware is not available'
      }
      
      setError(errorMessage)
      setIsScanning(false)
    }
  }

  const stopNFCScanning = () => {
    if (reader) {
      try {
        // Stop scanning by starting a new scan (this cancels the previous one)
        reader.scan().catch(() => {})
      } catch (error) {
        console.error('Error stopping NFC scan:', error)
      }
    }
    setIsScanning(false)
  }

  const simulateNFCRead = (tagId: string) => {
    // For demo purposes - simulate reading different NFC tags
    onScanResult(tagId, location || undefined)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Smartphone className="h-5 w-5 mr-2" />
              NFC Tag Scanner
            </span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardTitle>
          <CardDescription>
            Hold your device close to an NFC-enabled checkpoint tag
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* NFC Support Status */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <Smartphone className="h-4 w-4 mr-2 text-gray-500" />
              <span className="text-sm text-gray-600">NFC Support</span>
            </div>
            <Badge variant={nfcSupported ? 'default' : 'secondary'}>
              {nfcSupported ? 'Available' : 'Not Supported'}
            </Badge>
          </div>

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

          {!nfcSupported ? (
            <Alert>
              <Smartphone className="h-4 w-4" />
              <AlertDescription>
                NFC is not supported on this device or browser. Please use QR code scanning instead.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {/* NFC Scanner Interface */}
              <div className="text-center py-8">
                {!isScanning ? (
                  <>
                    <div className="relative mx-auto w-32 h-32 mb-6">
                      <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center">
                        <Smartphone className="h-16 w-16 text-blue-600" />
                      </div>
                      <div className="absolute inset-0 border-4 border-blue-200 rounded-full animate-ping"></div>
                    </div>
                    <p className="text-gray-600 mb-4">
                      Tap to start NFC scanning
                    </p>
                    <Button onClick={startNFCScanning} disabled={isVerifying}>
                      {isVerifying ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <Zap className="mr-2 h-4 w-4" />
                          Start NFC Scan
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="relative mx-auto w-32 h-32 mb-6">
                      <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center">
                        <Smartphone className="h-16 w-16 text-green-600" />
                      </div>
                      <div className="absolute inset-0 border-4 border-green-400 rounded-full animate-pulse"></div>
                    </div>
                    <p className="text-green-600 font-medium mb-2">
                      NFC Scanner Active
                    </p>
                    <p className="text-gray-600 mb-4">
                      Hold your device close to the NFC tag
                    </p>
                    <Button onClick={stopNFCScanning} variant="outline">
                      <X className="mr-2 h-4 w-4" />
                      Stop Scanning
                    </Button>
                  </>
                )}
              </div>

              {/* Demo NFC Tags for Testing */}
              {isScanning && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-3">Demo NFC Tags (for testing):</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => simulateNFCRead('NFC-A1B2C3D4')}
                      disabled={isVerifying}
                    >
                      Main Gate
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => simulateNFCRead('NFC-E5F6G7H8')}
                      disabled={isVerifying}
                    >
                      Guard Station
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => simulateNFCRead('NFC-I9J0K1L2')}
                      disabled={isVerifying}
                    >
                      Loading Dock
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => simulateNFCRead('NFC-M3N4O5P6')}
                      disabled={isVerifying}
                    >
                      Exit B
                    </Button>
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-2">How to use NFC scanning:</h4>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>Ensure NFC is enabled on your device</li>
                  <li>Hold your device within 4cm of the NFC tag</li>
                  <li>Keep the device steady until the tag is read</li>
                  <li>You'll feel a vibration when the tag is detected</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}