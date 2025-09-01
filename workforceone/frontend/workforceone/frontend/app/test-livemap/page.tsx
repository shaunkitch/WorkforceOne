'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Users, Battery, Clock, RefreshCw } from 'lucide-react'

interface GPSPosition {
  userId: string
  userName: string
  position: {
    latitude: number
    longitude: number
    accuracy?: number
    altitude?: number
    speed?: number
    heading?: number
    timestamp: string
  }
  batteryLevel?: number
}

export default function TestLiveMapPage() {
  const [positions, setPositions] = useState<GPSPosition[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadGPSData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Loading GPS data...')
      const response = await fetch('/api/gps/active')
      const result = await response.json()
      
      console.log('GPS API result:', result)
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to load GPS data')
      }
      
      setPositions(result.positions || [])
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Error loading GPS data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load GPS data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGPSData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadGPSData, 30000)
    
    return () => clearInterval(interval)
  }, [])

  if (loading && positions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Live Map Test - GPS Tracking</h1>
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading GPS data...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Live Map Test - GPS Tracking</h1>
        
        {/* Status Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="flex items-center space-x-1">
              <Users className="h-3 w-3" />
              <span>{positions.length} Active Guards</span>
            </Badge>
            {lastUpdate && (
              <Badge variant="outline" className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>Updated {lastUpdate.toLocaleTimeString()}</span>
              </Badge>
            )}
            {error && (
              <Badge variant="destructive" className="flex items-center space-x-1">
                <span>⚠️ {error}</span>
              </Badge>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadGPSData()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* GPS Data Display */}
        <div className="grid gap-6">
          {/* API Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-green-600" />
                GPS Tracking System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{positions.length}</div>
                  <div className="text-sm text-gray-500">Active Guards</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {positions.reduce((sum, p) => sum + (p.batteryLevel || 0), 0) / positions.length || 0}%
                  </div>
                  <div className="text-sm text-gray-500">Avg Battery</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {lastUpdate ? new Date().getTime() - lastUpdate.getTime() < 60000 ? 'Live' : 'Stale' : 'Unknown'}
                  </div>
                  <div className="text-sm text-gray-500">Data Status</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* GPS Positions Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                Live Guard Positions
              </CardTitle>
              <CardDescription>
                Real-time GPS locations - Updates every 30 seconds
              </CardDescription>
            </CardHeader>
            <CardContent>
              {positions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <MapPin className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">No Active Guards</h3>
                  <p>Guards will appear here when they start GPS tracking</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left py-3 px-4 font-medium">Guard</th>
                        <th className="text-left py-3 px-4 font-medium">GPS Coordinates</th>
                        <th className="text-left py-3 px-4 font-medium">Battery</th>
                        <th className="text-left py-3 px-4 font-medium">Last Update</th>
                        <th className="text-left py-3 px-4 font-medium">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {positions.map((pos, index) => (
                        <tr key={pos.userId} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="font-medium">{pos.userName}</div>
                            <div className="text-xs text-gray-500">{pos.userId.slice(0, 8)}...</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-xs space-y-1">
                              <div><strong>Lat:</strong> {pos.position.latitude.toFixed(6)}</div>
                              <div><strong>Lng:</strong> {pos.position.longitude.toFixed(6)}</div>
                              {pos.position.accuracy && (
                                <div><strong>Accuracy:</strong> ±{pos.position.accuracy.toFixed(1)}m</div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <Battery 
                                className={`h-4 w-4 ${
                                  (pos.batteryLevel || 100) > 50 ? 'text-green-600' :
                                  (pos.batteryLevel || 100) > 20 ? 'text-orange-600' : 'text-red-600'
                                }`} 
                              />
                              <span 
                                className={`font-medium ${
                                  (pos.batteryLevel || 100) > 50 ? 'text-green-600' :
                                  (pos.batteryLevel || 100) > 20 ? 'text-orange-600' : 'text-red-600'
                                }`}
                              >
                                {pos.batteryLevel || 'N/A'}%
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-xs">
                              <div>{new Date(pos.position.timestamp).toLocaleString()}</div>
                              <div className="text-gray-500">
                                ({Math.round((Date.now() - new Date(pos.position.timestamp).getTime()) / 60000)} min ago)
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-xs space-y-1">
                              {pos.position.speed && (
                                <div><strong>Speed:</strong> {Math.round((pos.position.speed || 0) * 3.6)} km/h</div>
                              )}
                              {pos.position.heading && (
                                <div><strong>Heading:</strong> {Math.round(pos.position.heading)}°</div>
                              )}
                              {pos.position.altitude && (
                                <div><strong>Altitude:</strong> {Math.round(pos.position.altitude)}m</div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">🗺️ Google Maps Integration Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p><strong>⚠️ Google Maps API Issue:</strong> Quota exceeded - billing required</p>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <p><strong>✅ GPS Tracking Working:</strong> Real-time position data is fully functional</p>
                </div>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                  <p><strong>🔧 To Fix Maps:</strong> Enable billing in Google Cloud Console</p>
                  <p className="text-xs text-gray-600 mt-1">Visit: https://console.cloud.google.com/billing</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}