'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { GPSTrackingService } from '@/lib/gps/tracking'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Users, Battery, Clock, Map } from 'lucide-react'

interface UserPosition {
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
  source?: string
  locationName?: string
  patrolStatus?: string
}

export default function SimpleLiveMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const [positions, setPositions] = useState<UserPosition[]>([])
  const [loading, setLoading] = useState(true)
  const [activeUsers, setActiveUsers] = useState(0)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [viewMode, setViewMode] = useState<'visual' | 'table'>('visual')
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(30) // seconds

  // Load user positions with enhanced error handling
  const loadUserPositions = useCallback(async () => {
    try {
      setError(null) // Clear previous errors
      console.log('SimpleLiveMap: Fetching active user positions...')
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout
      
      const response = await fetch('/api/gps/active', {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      console.log('SimpleLiveMap: API result:', result)
      
      if (!result.success) {
        throw new Error(result.error || 'API returned error')
      }
      
      const positions = result.positions || []
      
      // Validate position data
      const validPositions = positions.filter(pos => 
        pos.position?.latitude !== undefined && 
        pos.position?.longitude !== undefined &&
        typeof pos.position.latitude === 'number' &&
        typeof pos.position.longitude === 'number' &&
        Math.abs(pos.position.latitude) <= 90 &&
        Math.abs(pos.position.longitude) <= 180
      )
      
      if (validPositions.length !== positions.length) {
        console.warn(`Filtered ${positions.length - validPositions.length} invalid positions`)
      }
      
      console.log('SimpleLiveMap: Processing', validPositions.length, 'valid user positions')
      setPositions(validPositions)
      setActiveUsers(validPositions.length)
      setLastUpdate(new Date())
      
      // Show success message if recovering from error
      if (error) {
        setError(null)
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('SimpleLiveMap: Error loading user positions:', errorMessage)
      setError(errorMessage)
      
      // Don't clear positions on error - keep showing last known positions
      if (positions.length === 0) {
        setActiveUsers(0)
      }
    } finally {
      setLoading(false)
    }
  }, [error, positions.length])

  // Create a visual map representation using CSS and coordinates
  const createVisualMap = () => {
    if (positions.length === 0) return null

    // Calculate bounds
    const latitudes = positions.map(p => p.position.latitude)
    const longitudes = positions.map(p => p.position.longitude)
    const minLat = Math.min(...latitudes)
    const maxLat = Math.max(...latitudes)
    const minLng = Math.min(...longitudes)
    const maxLng = Math.max(...longitudes)

    // Add padding to bounds
    const latPadding = (maxLat - minLat) * 0.1 || 0.01
    const lngPadding = (maxLng - minLng) * 0.1 || 0.01
    const bounds = {
      minLat: minLat - latPadding,
      maxLat: maxLat + latPadding,
      minLng: minLng - lngPadding,
      maxLng: maxLng + lngPadding
    }

    const mapWidth = 800
    const mapHeight = 600

    return (
      <div className="relative bg-gray-100 rounded-lg overflow-hidden border" style={{ width: mapWidth, height: mapHeight }}>
        {/* Background grid */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, #e5e7eb 1px, transparent 1px),
              linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        />
        
        {/* Coordinate labels */}
        <div className="absolute top-2 left-2 text-xs text-gray-600 bg-white px-2 py-1 rounded shadow">
          {bounds.maxLat.toFixed(6)}, {bounds.minLng.toFixed(6)}
        </div>
        <div className="absolute bottom-2 right-2 text-xs text-gray-600 bg-white px-2 py-1 rounded shadow">
          {bounds.minLat.toFixed(6)}, {bounds.maxLng.toFixed(6)}
        </div>

        {/* User markers */}
        {positions.map((pos, index) => {
          // Convert GPS coordinates to pixel positions
          const x = ((pos.position.longitude - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * mapWidth
          const y = ((bounds.maxLat - pos.position.latitude) / (bounds.maxLat - bounds.minLat)) * mapHeight

          const batteryColor = (pos.batteryLevel || 100) > 50 ? 'bg-green-500' :
                              (pos.batteryLevel || 100) > 20 ? 'bg-orange-500' : 'bg-red-500'

          return (
            <div
              key={pos.userId}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
              style={{ left: x, top: y }}
            >
              {/* Marker */}
              <div className={`w-6 h-6 rounded-full ${batteryColor} border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold`}>
                {index + 1}
              </div>
              
              {/* Enhanced Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                <div className="bg-black text-white text-xs rounded py-2 px-3 whitespace-nowrap min-w-max">
                  <div className="font-bold text-center">{pos.userName}</div>
                  <hr className="my-1 border-gray-600" />
                  <div>📍 {pos.position.latitude.toFixed(6)}, {pos.position.longitude.toFixed(6)}</div>
                  {pos.locationName && (
                    <div>🏢 {pos.locationName}</div>
                  )}
                  <div>🔋 Battery: {pos.batteryLevel || 'Unknown'}%</div>
                  <div>🕒 {new Date(pos.position.timestamp).toLocaleTimeString()}</div>
                  {pos.position.speed && <div>⚡ Speed: {Math.round((pos.position.speed || 0) * 3.6)} km/h</div>}
                  {pos.position.accuracy && <div>🎯 Accuracy: ±{pos.position.accuracy.toFixed(1)}m</div>}
                  <div className="text-gray-300 border-t border-gray-600 pt-1 mt-1">
                    📊 Source: {pos.source === 'checkpoint_visit' ? '🚪 Checkpoint Visit' : '📱 GPS Tracking'}
                  </div>
                  {pos.patrolStatus && (
                    <div className="text-green-300">🛡️ Status: {pos.patrolStatus}</div>
                  )}
                  {/* Tooltip arrow */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black"></div>
                </div>
              </div>
              
              {/* Accuracy circle */}
              {pos.position.accuracy && (
                <div 
                  className="absolute border border-blue-300 rounded-full opacity-30 bg-blue-100"
                  style={{
                    width: Math.max(10, Math.min(100, pos.position.accuracy * 2)), // Scale accuracy to pixels
                    height: Math.max(10, Math.min(100, pos.position.accuracy * 2)),
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: -1
                  }}
                />
              )}
            </div>
          )
        })}

        {/* Center crosshair */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-4 h-0.5 bg-gray-400"></div>
          <div className="w-0.5 h-4 bg-gray-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>
      </div>
    )
  }

  useEffect(() => {
    loadUserPositions()
    
    // Set up auto-refresh only if enabled
    if (!autoRefresh) return

    const interval = setInterval(() => {
      loadUserPositions()
    }, refreshInterval * 1000) // Convert seconds to milliseconds

    return () => clearInterval(interval)
  }, [loadUserPositions, autoRefresh, refreshInterval])

  if (loading) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading GPS tracking data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <h4 className="font-medium text-red-900">Connection Error</h4>
          </div>
          <p className="text-red-700 text-sm mt-1">{error}</p>
          <div className="mt-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => loadUserPositions()}
              className="text-red-700 border-red-300 hover:bg-red-50"
            >
              Retry Connection
            </Button>
          </div>
        </div>
      )}
      
      {/* Map Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Badge variant="secondary" className="flex items-center space-x-1">
            <Users className="h-3 w-3" />
            <span>{activeUsers} Active Guards</span>
          </Badge>
          {lastUpdate && (
            <Badge variant="outline" className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>Updated {lastUpdate.toLocaleTimeString()}</span>
            </Badge>
          )}
          {!autoRefresh && (
            <Badge variant="destructive" className="text-xs">
              Auto-refresh OFF
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 mr-4">
            <label htmlFor="auto-refresh" className="text-sm text-gray-600">Auto-refresh:</label>
            <input 
              id="auto-refresh"
              type="checkbox" 
              checked={autoRefresh} 
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4"
            />
            <select 
              value={refreshInterval} 
              onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
              className="text-xs border rounded px-1 py-1"
              disabled={!autoRefresh}
            >
              <option value={10}>10s</option>
              <option value={30}>30s</option>
              <option value={60}>1m</option>
              <option value={300}>5m</option>
            </select>
          </div>
          <Button
            variant={viewMode === 'visual' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('visual')}
          >
            <Map className="h-4 w-4 mr-2" />
            Map View
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            <MapPin className="h-4 w-4 mr-2" />
            Table View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadUserPositions()}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {viewMode === 'visual' ? (
        /* Visual Map View */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-blue-600" />
              Live Guard Tracking - Visual Map
            </CardTitle>
            <CardDescription>
              Real-time GPS positions plotted on coordinate map (Google Maps alternative)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {positions.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <MapPin className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">No Active Guards</h3>
                <p>Guards will appear on the map when they start tracking</p>
              </div>
            ) : (
              <div className="flex justify-center">
                {createVisualMap()}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Table View */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-blue-600" />
              Live Guard Positions - Data Table
            </CardTitle>
            <CardDescription>
              Detailed GPS tracking information and guard status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {positions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No active guards found</p>
                <p className="text-sm">Guards will appear here when they start tracking</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Guard</th>
                      <th className="text-left py-2">Location/GPS</th>
                      <th className="text-left py-2">Battery</th>
                      <th className="text-left py-2">Last Update</th>
                      <th className="text-left py-2">Source & Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((pos, index) => (
                      <tr key={pos.userId} className="border-b hover:bg-gray-50">
                        <td className="py-3">
                          <div className="font-medium">{pos.userName}</div>
                          <div className="text-xs text-gray-500">#{index + 1} • {pos.userId.slice(0, 8)}...</div>
                        </td>
                        <td className="py-3">
                          <div className="text-xs space-y-1">
                            {pos.locationName && (
                              <div className="font-medium text-blue-600">🏢 {pos.locationName}</div>
                            )}
                            <div><strong>Lat:</strong> {pos.position.latitude.toFixed(6)}</div>
                            <div><strong>Lng:</strong> {pos.position.longitude.toFixed(6)}</div>
                            {pos.position.accuracy && (
                              <div><strong>Accuracy:</strong> ±{pos.position.accuracy.toFixed(1)}m</div>
                            )}
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center space-x-1">
                            <Battery 
                              className={`h-3 w-3 ${
                                (pos.batteryLevel || 100) > 50 ? 'text-green-600' :
                                (pos.batteryLevel || 100) > 20 ? 'text-orange-600' : 'text-red-600'
                              }`} 
                            />
                            <span 
                              className={`text-xs font-medium ${
                                (pos.batteryLevel || 100) > 50 ? 'text-green-600' :
                                (pos.batteryLevel || 100) > 20 ? 'text-orange-600' : 'text-red-600'
                              }`}
                            >
                              {pos.batteryLevel || 'N/A'}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="text-xs">
                            <div>{new Date(pos.position.timestamp).toLocaleString()}</div>
                            <div className="text-gray-500">
                              {Math.round((Date.now() - new Date(pos.position.timestamp).getTime()) / 60000)} min ago
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="text-xs space-y-1">
                            <div className="font-medium text-purple-600">
                              📊 {pos.source === 'checkpoint_visit' ? '🚪 Checkpoint' : '📱 GPS Track'}
                            </div>
                            {pos.patrolStatus && (
                              <div className="text-green-600">🛡️ {pos.patrolStatus}</div>
                            )}
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
      )}

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Status & Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Battery Status</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>High Battery (&gt;50%)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span>Medium Battery (20-50%)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>Low Battery (&lt;20%)</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">System Status</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${error ? 'bg-red-500' : 'bg-green-500'}`}></div>
                  <span>Connection: {error ? 'Error' : 'Active'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${autoRefresh ? 'bg-blue-500' : 'bg-gray-500'}`}></div>
                  <span>Auto-Refresh: {autoRefresh ? `${refreshInterval}s` : 'Disabled'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span>Active Guards: {activeUsers}</span>
                </div>
                {lastUpdate && (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span>Last Update: {Math.round((Date.now() - lastUpdate.getTime()) / 1000)}s ago</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}