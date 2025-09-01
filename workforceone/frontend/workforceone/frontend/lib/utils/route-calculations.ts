export interface RouteMetrics {
  totalDistance: number // in meters
  estimatedWalkingTime: number // in minutes
  estimatedDrivingTime: number // in minutes
  checkpointCount: number
}

export interface Coordinate {
  latitude: number
  longitude: number
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point  
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

/**
 * Calculate total route metrics for a series of checkpoints
 * @param checkpoints Array of checkpoints with coordinates
 * @returns Route metrics including distance and estimated times
 */
export function calculateRouteMetrics(
  checkpoints: Array<{
    id: string
    name: string
    latitude?: number
    longitude?: number
  }>
): RouteMetrics {
  let totalDistance = 0
  const validCheckpoints = checkpoints.filter(
    cp => cp.latitude && cp.longitude
  )

  // Calculate total distance by connecting consecutive checkpoints
  for (let i = 0; i < validCheckpoints.length - 1; i++) {
    const current = validCheckpoints[i]
    const next = validCheckpoints[i + 1]
    
    const distance = calculateDistance(
      current.latitude!,
      current.longitude!,
      next.latitude!,
      next.longitude!
    )
    
    totalDistance += distance
  }

  // Estimated times (rough estimates)
  const walkingSpeedMps = 1.4 // 1.4 m/s average walking speed
  const drivingSpeedMps = 8.33 // 30 km/h = 8.33 m/s for security patrol driving

  // Add time for checkpoint visits (2-5 minutes per checkpoint)
  const avgCheckpointTime = 3 // minutes
  const checkpointVisitTime = validCheckpoints.length * avgCheckpointTime

  const estimatedWalkingTime = Math.ceil(
    totalDistance / walkingSpeedMps / 60 + checkpointVisitTime
  )
  const estimatedDrivingTime = Math.ceil(
    totalDistance / drivingSpeedMps / 60 + checkpointVisitTime
  )

  return {
    totalDistance: Math.round(totalDistance),
    estimatedWalkingTime,
    estimatedDrivingTime,
    checkpointCount: validCheckpoints.length
  }
}

/**
 * Format distance for display
 * @param meters Distance in meters
 * @returns Formatted string (e.g., "1.2 km" or "450 m")
 */
export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`
  }
  return `${Math.round(meters)} m`
}

/**
 * Format time duration for display
 * @param minutes Time in minutes
 * @returns Formatted string (e.g., "1h 30m" or "45m")
 */
export function formatDuration(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }
  return `${minutes}m`
}

/**
 * Calculate the center point (centroid) of a set of coordinates
 * @param coordinates Array of lat/lng coordinates
 * @returns Center coordinate
 */
export function calculateCenter(coordinates: Coordinate[]): Coordinate {
  if (coordinates.length === 0) {
    return { latitude: 40.7128, longitude: -74.0060 } // Default to NYC
  }

  const sum = coordinates.reduce(
    (acc, coord) => ({
      latitude: acc.latitude + coord.latitude,
      longitude: acc.longitude + coord.longitude
    }),
    { latitude: 0, longitude: 0 }
  )

  return {
    latitude: sum.latitude / coordinates.length,
    longitude: sum.longitude / coordinates.length
  }
}

/**
 * Calculate appropriate zoom level based on the bounding box of coordinates
 * @param coordinates Array of coordinates
 * @returns Zoom level (1-20)
 */
export function calculateZoomLevel(coordinates: Coordinate[]): number {
  if (coordinates.length <= 1) return 15

  const lats = coordinates.map(c => c.latitude)
  const lngs = coordinates.map(c => c.longitude)
  
  const latRange = Math.max(...lats) - Math.min(...lats)
  const lngRange = Math.max(...lngs) - Math.min(...lngs)
  
  const maxRange = Math.max(latRange, lngRange)
  
  // Rough zoom level calculation
  if (maxRange > 10) return 5
  if (maxRange > 5) return 7
  if (maxRange > 1) return 9
  if (maxRange > 0.5) return 11
  if (maxRange > 0.1) return 13
  if (maxRange > 0.05) return 15
  if (maxRange > 0.01) return 16
  return 17
}