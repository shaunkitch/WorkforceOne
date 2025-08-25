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

  // Initialize Google Maps
  const initializeMap = useCallback(async () => {
    if (!mapRef.current) return

    console.log('Initializing map...')
    console.log('API Key:', process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 'Present' : 'Missing')

    try {
      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        version: 'weekly',
        libraries: ['maps', 'marker']
      })

      console.log('Loading Google Maps API...')
      const google = await loader.load()
      console.log('Google Maps API loaded successfully')
      
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

      console.log('Map instance created successfully')
      setMap(mapInstance)
      setLoading(false)
      
      // Start loading user positions
      console.log('Loading user positions...')
      loadUserPositions(mapInstance)
      
      // Set up auto-refresh
      const interval = setInterval(() => {
        loadUserPositions(mapInstance)
      }, 30000) // Refresh every 30 seconds

      return () => clearInterval(interval)
    } catch (error) {
      console.error('Error initializing map:', error)
      setLoading(false)
    }
  }, [])

  // Load and update user positions
  const loadUserPositions = useCallback(async (mapInstance: google.maps.Map) => {
    try {
      console.log('Fetching active user positions...')
      const positions = await GPSTrackingService.getActiveUsersPositions()
      console.log('Fetched positions:', positions)
      
      if (positions.length === 0) {
        console.log('No active users found')
        setActiveUsers(0)
        return
      }

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
      console.error('Error loading user positions:', error)
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
    initializeMap()
  }, [initializeMap])

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