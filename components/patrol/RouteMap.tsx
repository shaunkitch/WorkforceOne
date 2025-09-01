'use client'

import { useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Navigation, Clock, Route as RouteIcon } from 'lucide-react'
import { 
  calculateRouteMetrics, 
  calculateCenter, 
  calculateZoomLevel,
  formatDistance,
  formatDuration,
  type RouteMetrics 
} from '@/lib/utils/route-calculations'
import { 
  loadGoogleMapsAPI, 
  createPatrolMap, 
  createCheckpointMarker, 
  createRoutePath 
} from '@/lib/utils/google-maps'

interface RouteMapProps {
  checkpoints: Array<{
    id: string
    name: string
    address?: string
    latitude?: number
    longitude?: number
  }>
  routeName: string
  className?: string
  height?: number
}

export function RouteMap({ 
  checkpoints, 
  routeName, 
  className = '',
  height = 200 
}: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)

  // Calculate route metrics
  const validCheckpoints = checkpoints.filter(cp => cp.latitude && cp.longitude)
  const metrics = calculateRouteMetrics(validCheckpoints)
  
  // Get center and zoom for map
  const center = calculateCenter(
    validCheckpoints.map(cp => ({
      latitude: cp.latitude!,
      longitude: cp.longitude!
    }))
  )
  const zoom = calculateZoomLevel(
    validCheckpoints.map(cp => ({
      latitude: cp.latitude!,
      longitude: cp.longitude!
    }))
  )

  useEffect(() => {
    if (!mapRef.current || validCheckpoints.length === 0) return

    const initMap = async () => {
      // Load Google Maps API
      const isLoaded = await loadGoogleMapsAPI()
      if (!isLoaded || !mapRef.current) return

      // Create the map
      const map = createPatrolMap(
        mapRef.current,
        { lat: center.latitude, lng: center.longitude },
        zoom
      )

      if (!map) return
      mapInstanceRef.current = map

      // Add markers for each checkpoint
      const markers: google.maps.Marker[] = []
      validCheckpoints.forEach((checkpoint, index) => {
        const marker = createCheckpointMarker(
          map,
          { lat: checkpoint.latitude!, lng: checkpoint.longitude! },
          index,
          checkpoint.name,
          index === 0, // isStart
          index === validCheckpoints.length - 1 // isEnd
        )
        markers.push(marker)
      })

      // Draw route path if more than one checkpoint
      if (validCheckpoints.length > 1) {
        createRoutePath(
          map,
          validCheckpoints.map(cp => ({
            lat: cp.latitude!,
            lng: cp.longitude!
          }))
        )
      }
    }

    initMap()

    return () => {
      mapInstanceRef.current = null
    }
  }, [checkpoints, center.latitude, center.longitude, zoom, validCheckpoints])

  if (validCheckpoints.length === 0) {
    const totalCheckpoints = checkpoints.length
    const checkpointsWithCoords = validCheckpoints.length
    const missingCoords = totalCheckpoints - checkpointsWithCoords

    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div 
            className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300"
            style={{ height: `${height}px` }}
          >
            <div className="text-center text-gray-500 px-4">
              <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">No GPS coordinates available</p>
              {totalCheckpoints > 0 ? (
                <div className="text-xs mt-2 space-y-1">
                  <p>{totalCheckpoints} checkpoint{totalCheckpoints !== 1 ? 's' : ''} in route</p>
                  <p className="text-orange-600">
                    {missingCoords} missing coordinates
                  </p>
                  <p className="text-blue-600 mt-2">
                    💡 Edit checkpoints to add GPS coordinates
                  </p>
                </div>
              ) : (
                <p className="text-xs mt-1">Add checkpoints with GPS coordinates</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardContent className="p-0">
        {/* Map Container */}
        <div className="relative">
          <div 
            ref={mapRef} 
            className="w-full rounded-t-lg"
            style={{ height: `${height}px` }}
          />
          
          {/* Route Info Overlay */}
          <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-sm">
            <div className="flex items-center space-x-2 text-xs">
              <RouteIcon className="h-3 w-3 text-blue-600" />
              <span className="font-medium text-gray-700 max-w-[100px] truncate">
                {routeName}
              </span>
            </div>
          </div>

          {/* Checkpoint Count Badge */}
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="text-xs bg-white/90">
              <MapPin className="h-3 w-3 mr-1" />
              {validCheckpoints.length} stops
            </Badge>
          </div>
        </div>

        {/* Route Metrics */}
        <div className="p-3 border-t bg-gray-50">
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Navigation className="h-3 w-3 text-blue-600 mr-1" />
              </div>
              <div className="font-semibold text-gray-900">
                {formatDistance(metrics.totalDistance)}
              </div>
              <div className="text-gray-500">Distance</div>
            </div>
            
            <div className="text-center border-x border-gray-200">
              <div className="flex items-center justify-center mb-1">
                <Clock className="h-3 w-3 text-green-600 mr-1" />
              </div>
              <div className="font-semibold text-gray-900">
                {formatDuration(metrics.estimatedWalkingTime)}
              </div>
              <div className="text-gray-500">Walking</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Clock className="h-3 w-3 text-orange-600 mr-1" />
              </div>
              <div className="font-semibold text-gray-900">
                {formatDuration(metrics.estimatedDrivingTime)}
              </div>
              <div className="text-gray-500">Driving</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default RouteMap