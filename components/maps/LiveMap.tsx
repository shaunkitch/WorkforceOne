'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Loader } from '@googlemaps/js-api-loader'
import { GPSTrackingService } from '@/lib/gps/tracking'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Users, Battery, Clock } from 'lucide-react'

interface UserMarker {
  userId: string
  userName: string
  marker: google.maps.Marker
  position: { lat: number; lng: number }
  lastUpdate: string
  batteryLevel?: number
}

export default function LiveMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [userMarkers, setUserMarkers] = useState<Map<string, UserMarker>>(new Map())
  const [loading, setLoading] = useState(true)
  const [activeUsers, setActiveUsers] = useState(0)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fallbackMode, setFallbackMode] = useState(false)
  const [fallbackPositions, setFallbackPositions] = useState<any[]>([])

  // Show fallback GPS data table when Maps API is not available
  const showFallbackView = async () => {
    try {
      console.log('LiveMap: Loading fallback GPS data...')
      
      // Fetch GPS data directly from API
      const response = await fetch('/api/gps/active')
      const result = await response.json()
      
      console.log('LiveMap: Fallback GPS data loaded:', result)
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load GPS data')
      }
      
      setFallbackPositions(result.positions || [])
      setActiveUsers(result.count || 0)
      setLastUpdate(new Date())
      setFallbackMode(true)
      setLoading(false)
    } catch (error) {
      console.error('LiveMap: Error loading fallback data:', error)
      setError(`Failed to load GPS data: ${error}`)
      setLoading(false)
    }
  }

  // Initialize Google Maps
  const initializeMap = useCallback(async () => {
    if (!mapRef.current) return

    console.log('LiveMap: Initializing map...')
    
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    console.log('LiveMap: API Key status:', apiKey ? 'Present' : 'Missing')
    
    if (!apiKey) {
      console.error('LiveMap: Google Maps API key is missing!')
      const error = new Error('Google Maps API key is missing. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment variables.')
      setError(error.message)
      setLoading(false)
      throw error // Re-throw to trigger fallback in useEffect
    }

    try {
      const loader = new Loader({
        apiKey: apiKey,
        version: 'weekly',
        libraries: ['maps', 'marker']
      })

      console.log('LiveMap: Loading Google Maps API...')
      const google = await loader.load()
      console.log('LiveMap: Google Maps API loaded successfully')
      
      // Default center (you can make this configurable)
      const defaultCenter = { lat: 40.7128, lng: -74.0060 } // New York City

      const mapInstance = new google.maps.Map(mapRef.current, {
        zoom: 12,
        center: defaultCenter,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      })

      console.log('LiveMap: Map instance created successfully')
      setMap(mapInstance)
      setLoading(false)
      
      // Start loading user positions
      console.log('LiveMap: Loading user positions...')
      loadUserPositions(mapInstance)
      
      // Set up auto-refresh
      const interval = setInterval(() => {
        loadUserPositions(mapInstance)
      }, 30000) // Refresh every 30 seconds

      return () => clearInterval(interval)
    } catch (error) {
      console.error('LiveMap: Error initializing map:', error)
      setError(`Failed to initialize Google Maps: ${error}`)
      setLoading(false)
      throw error // Re-throw to trigger fallback in useEffect
    }
  }, [])

  // Load and update user positions
  const loadUserPositions = useCallback(async (mapInstance: google.maps.Map) => {
    try {
      console.log('LiveMap: Fetching active user positions...')
      const positions = await GPSTrackingService.getActiveUsersPositions()
      console.log('LiveMap: Fetched positions:', positions)
      
      if (positions.length === 0) {
        console.log('LiveMap: No active users found')
        setActiveUsers(0)
        return
      }

      console.log('LiveMap: Processing', positions.length, 'user positions')

      const newMarkers = new Map<string, UserMarker>()
      const bounds = new google.maps.LatLngBounds()

      positions.forEach((userPos) => {
        const position = {
          lat: userPos.position.latitude,
          lng: userPos.position.longitude
        }

        // Extend bounds to include this position
        bounds.extend(position)

        // Check if marker already exists
        const existingMarker = userMarkers.get(userPos.userId)
        
        if (existingMarker) {
          // Update existing marker position
          existingMarker.marker.setPosition(position)
          existingMarker.position = position
          existingMarker.lastUpdate = userPos.position.timestamp
          existingMarker.batteryLevel = userPos.batteryLevel
          newMarkers.set(userPos.userId, existingMarker)
        } else {
          // Create new marker
          const marker = new google.maps.Marker({
            position,
            map: mapInstance,
            title: userPos.userName,
            icon: {
              url: createMarkerIcon(userPos.batteryLevel || 100),
              size: new google.maps.Size(32, 32),
              origin: new google.maps.Point(0, 0),
              anchor: new google.maps.Point(16, 32)
            }
          })

          // Add info window
          const infoWindow = new google.maps.InfoWindow({
            content: createInfoWindowContent(userPos)
          })

          marker.addListener('click', () => {
            // Close other info windows
            newMarkers.forEach((userMarker) => {
              if (userMarker.marker !== marker) {
                // Close info window if it exists
              }
            })
            infoWindow.open(mapInstance, marker)
          })

          newMarkers.set(userPos.userId, {
            userId: userPos.userId,
            userName: userPos.userName,
            marker,
            position,
            lastUpdate: userPos.position.timestamp,
            batteryLevel: userPos.batteryLevel
          })
        }
      })

      // Remove markers for users no longer active
      userMarkers.forEach((userMarker, userId) => {
        if (!newMarkers.has(userId)) {
          userMarker.marker.setMap(null)
        }
      })

      setUserMarkers(newMarkers)
      setActiveUsers(positions.length)
      setLastUpdate(new Date())

      // Adjust map view to show all markers if we have positions
      if (positions.length > 0 && !bounds.isEmpty()) {
        mapInstance.fitBounds(bounds, { padding: 50 })
      }
    } catch (error) {
      console.error('LiveMap: Error loading user positions:', error)
      setError(`Failed to load user positions: ${error}`)
    }
  }, [userMarkers])

  // Create custom marker icon based on battery level
  const createMarkerIcon = (batteryLevel: number): string => {
    const color = batteryLevel > 50 ? '4CAF50' : batteryLevel > 20 ? 'FF9800' : 'F44336'
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="12" fill="#${color}" stroke="#ffffff" stroke-width="2"/>
        <circle cx="16" cy="16" r="6" fill="#ffffff"/>
        <text x="16" y="20" text-anchor="middle" fill="#${color}" font-family="Arial" font-size="10" font-weight="bold">
          ${Math.round(batteryLevel)}
        </text>
      </svg>
    `)}`
  }

  // Create info window content
  const createInfoWindowContent = (userPos: any): string => {
    const lastUpdateTime = new Date(userPos.position.timestamp).toLocaleTimeString()
    const batteryColor = (userPos.batteryLevel || 100) > 50 ? '#4CAF50' : 
                        (userPos.batteryLevel || 100) > 20 ? '#FF9800' : '#F44336'
    
    return `
      <div style="padding: 8px; min-width: 200px;">
        <h3 style="margin: 0 0 8px 0; color: #333;">${userPos.userName}</h3>
        <div style="margin-bottom: 4px;">
          <strong>Location:</strong> ${userPos.position.latitude.toFixed(6)}, ${userPos.position.longitude.toFixed(6)}
        </div>
        <div style="margin-bottom: 4px;">
          <strong>Last Update:</strong> ${lastUpdateTime}
        </div>
        <div style="margin-bottom: 4px;">
          <strong>Battery:</strong> 
          <span style="color: ${batteryColor}; font-weight: bold;">
            ${userPos.batteryLevel || 'Unknown'}${userPos.batteryLevel ? '%' : ''}
          </span>
        </div>
        ${userPos.position.speed ? `
          <div style="margin-bottom: 4px;">
            <strong>Speed:</strong> ${Math.round((userPos.position.speed || 0) * 3.6)} km/h
          </div>
        ` : ''}
      </div>
    `
  }

  useEffect(() => {
    // Try Google Maps first, fallback to table view if it fails
    initializeMap().catch((error) => {
      console.warn('Google Maps failed, using fallback view:', error)
      showFallbackView()
    })
  }, [])

  if (loading) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-red-50 rounded-lg border border-red-200">
        <div className="text-center max-w-md">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-red-800 mb-2">Map Configuration Error</h3>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <div className="text-xs text-red-500 bg-red-100 p-3 rounded mb-4">
            <p><strong>To fix this:</strong></p>
            <p>1. Get a Google Maps API key from Google Cloud Console</p>
            <p>2. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable</p>
            <p>3. Restart the development server</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setError(null)
              setLoading(true)
              // Show fallback view instead
              showFallbackView()
            }}
            className="text-red-600 border-red-600 hover:bg-red-50"
          >
            Show GPS Data Table Instead
          </Button>
        </div>
      </div>
    )
  }

  // Fallback GPS data table view
  if (fallbackMode) {
    return (
      <div className="space-y-4">
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
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => showFallbackView()}
            >
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFallbackMode(false)
                setLoading(true)
                initializeMap()
              }}
            >
              Try Map View
            </Button>
          </div>
        </div>

        {/* GPS Data Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-blue-600" />
              Live Guard Positions (Table View)
            </CardTitle>
            <CardDescription>
              Real-time GPS locations - Map view temporarily unavailable
            </CardDescription>
          </CardHeader>
          <CardContent>
            {fallbackPositions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
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
                      <th className="text-left py-2">Location</th>
                      <th className="text-left py-2">Battery</th>
                      <th className="text-left py-2">Last Update</th>
                      <th className="text-left py-2">Speed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fallbackPositions.map((pos, index) => (
                      <tr key={pos.userId} className="border-b hover:bg-gray-50">
                        <td className="py-3">
                          <div className="font-medium">{pos.userName}</div>
                          <div className="text-xs text-gray-500">{pos.userId.slice(0, 8)}...</div>
                        </td>
                        <td className="py-3">
                          <div className="text-xs">
                            <div>Lat: {pos.position.latitude.toFixed(6)}</div>
                            <div>Lng: {pos.position.longitude.toFixed(6)}</div>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center space-x-1">
                            <Battery className="h-3 w-3" />
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
                            {new Date(pos.position.timestamp).toLocaleString()}
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="text-xs">
                            {pos.position.speed ? `${Math.round((pos.position.speed || 0) * 3.6)} km/h` : 'N/A'}
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

        {/* Legend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Battery Status Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-green-500"></div>
                <span>High Battery (&gt;50%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                <span>Medium Battery (20-50%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-red-500"></div>
                <span>Low Battery (&lt;20%)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
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
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => map && loadUserPositions(map)}
        >
          Refresh
        </Button>
      </div>

      {/* Map Container */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-blue-600" />
            Live Guard Tracking
          </CardTitle>
          <CardDescription>
            Real-time GPS locations of active security personnel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            ref={mapRef}
            className="w-full h-96 rounded-lg"
            style={{ minHeight: '400px' }}
          />
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span>High Battery (&gt;50%)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-orange-500"></div>
              <span>Medium Battery (20-50%)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <span>Low Battery (&lt;20%)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}