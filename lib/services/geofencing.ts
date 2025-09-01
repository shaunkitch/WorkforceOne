// Advanced Geofencing Service for Attendance Verification

import { LocationCoordinates } from './location'

export interface GeofenceZone {
  id: string
  name: string
  center: LocationCoordinates
  radius: number // meters
  shape: 'circle' | 'polygon'
  coordinates?: LocationCoordinates[] // for polygon shapes
  metadata?: any
}

export interface GeofenceResult {
  isInside: boolean
  zone?: GeofenceZone
  distance?: number
  accuracy?: number
  confidence: 'high' | 'medium' | 'low'
}

export class GeofencingService {
  /**
   * Check if a location is within any defined geofence zones
   */
  static async verifyLocationInGeofence(
    location: LocationCoordinates, 
    siteId: string
  ): Promise<GeofenceResult> {
    try {
      // Get geofence zones for the site
      const zones = await this.getGeofenceZones(siteId)
      
      if (zones.length === 0) {
        // No geofences defined - use default radius check
        return await this.performDefaultLocationCheck(location, siteId)
      }

      for (const zone of zones) {
        const result = this.checkLocationInZone(location, zone)
        if (result.isInside) {
          return {
            ...result,
            zone,
            confidence: this.calculateConfidence(location.accuracy, zone.radius)
          }
        }
      }

      // Not in any zone
      const nearestZone = this.findNearestZone(location, zones)
      const distance = this.calculateDistance(location, nearestZone.center)

      return {
        isInside: false,
        zone: nearestZone,
        distance,
        accuracy: location.accuracy,
        confidence: 'high'
      }

    } catch (error) {
      console.error('Geofencing error:', error)
      return {
        isInside: false,
        confidence: 'low'
      }
    }
  }

  /**
   * Check if location is within a specific geofence zone
   */
  private static checkLocationInZone(
    location: LocationCoordinates, 
    zone: GeofenceZone
  ): GeofenceResult {
    if (zone.shape === 'circle') {
      const distance = this.calculateDistance(location, zone.center)
      const isInside = distance <= zone.radius

      return {
        isInside,
        distance,
        accuracy: location.accuracy,
        confidence: this.calculateConfidence(location.accuracy, zone.radius)
      }
    }

    if (zone.shape === 'polygon' && zone.coordinates) {
      const isInside = this.pointInPolygon(location, zone.coordinates)
      const distance = this.distanceToPolygon(location, zone.coordinates)

      return {
        isInside,
        distance,
        accuracy: location.accuracy,
        confidence: this.calculateConfidence(location.accuracy, distance)
      }
    }

    return {
      isInside: false,
      confidence: 'low'
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private static calculateDistance(
    point1: LocationCoordinates,
    point2: LocationCoordinates
  ): number {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = point1.lat * Math.PI/180
    const φ2 = point2.lat * Math.PI/180
    const Δφ = (point2.lat - point1.lat) * Math.PI/180
    const Δλ = (point2.lng - point1.lng) * Math.PI/180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c
  }

  /**
   * Check if point is inside polygon using ray casting algorithm
   */
  private static pointInPolygon(
    point: LocationCoordinates, 
    polygon: LocationCoordinates[]
  ): boolean {
    let inside = false
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      if (((polygon[i].lat > point.lat) !== (polygon[j].lat > point.lat)) &&
          (point.lng < (polygon[j].lng - polygon[i].lng) * (point.lat - polygon[i].lat) / (polygon[j].lat - polygon[i].lat) + polygon[i].lng)) {
        inside = !inside
      }
    }
    
    return inside
  }

  /**
   * Calculate minimum distance from point to polygon edge
   */
  private static distanceToPolygon(
    point: LocationCoordinates,
    polygon: LocationCoordinates[]
  ): number {
    let minDistance = Infinity

    for (let i = 0; i < polygon.length; i++) {
      const j = (i + 1) % polygon.length
      const distance = this.distanceToLineSegment(point, polygon[i], polygon[j])
      minDistance = Math.min(minDistance, distance)
    }

    return minDistance
  }

  /**
   * Calculate distance from point to line segment
   */
  private static distanceToLineSegment(
    point: LocationCoordinates,
    lineStart: LocationCoordinates,
    lineEnd: LocationCoordinates
  ): number {
    const A = point.lng - lineStart.lng
    const B = point.lat - lineStart.lat
    const C = lineEnd.lng - lineStart.lng
    const D = lineEnd.lat - lineStart.lat

    const dot = A * C + B * D
    const lenSq = C * C + D * D
    let param = -1

    if (lenSq !== 0) {
      param = dot / lenSq
    }

    let xx, yy

    if (param < 0) {
      xx = lineStart.lng
      yy = lineStart.lat
    } else if (param > 1) {
      xx = lineEnd.lng
      yy = lineEnd.lat
    } else {
      xx = lineStart.lng + param * C
      yy = lineStart.lat + param * D
    }

    const dx = point.lng - xx
    const dy = point.lat - yy

    return this.calculateDistance(point, { lat: yy, lng: xx })
  }

  /**
   * Calculate confidence level based on GPS accuracy and distance
   */
  private static calculateConfidence(
    gpsAccuracy: number, 
    referenceDistance: number
  ): 'high' | 'medium' | 'low' {
    const ratio = gpsAccuracy / referenceDistance

    if (ratio < 0.1) return 'high'    // GPS accuracy is 10% or less of distance
    if (ratio < 0.3) return 'medium'  // GPS accuracy is 30% or less of distance
    return 'low'                      // GPS accuracy is more than 30% of distance
  }

  /**
   * Find the nearest geofence zone to a location
   */
  private static findNearestZone(
    location: LocationCoordinates,
    zones: GeofenceZone[]
  ): GeofenceZone {
    let nearest = zones[0]
    let minDistance = Infinity

    for (const zone of zones) {
      const distance = this.calculateDistance(location, zone.center)
      if (distance < minDistance) {
        minDistance = distance
        nearest = zone
      }
    }

    return nearest
  }

  /**
   * Get geofence zones for a specific site
   */
  private static async getGeofenceZones(siteId: string): Promise<GeofenceZone[]> {
    try {
      // For now, return a default zone based on site data
      // In full implementation, this would fetch from database
      const response = await fetch(`/api/sites/${siteId}/geofences`)
      if (response.ok) {
        const data = await response.json()
        return data.zones || []
      }
      
      return []
    } catch (error) {
      console.error('Error fetching geofence zones:', error)
      return []
    }
  }

  /**
   * Fallback location check using simple radius
   */
  private static async performDefaultLocationCheck(
    location: LocationCoordinates,
    siteId: string
  ): Promise<GeofenceResult> {
    try {
      // Get site coordinates from database or config
      const siteLocation = await this.getSiteLocation(siteId)
      if (!siteLocation) {
        return {
          isInside: true, // Allow if no site location configured
          confidence: 'low'
        }
      }

      const distance = this.calculateDistance(location, siteLocation)
      const defaultRadius = 100 // 100 meters default

      return {
        isInside: distance <= defaultRadius,
        distance,
        accuracy: location.accuracy,
        confidence: this.calculateConfidence(location.accuracy, defaultRadius)
      }
    } catch (error) {
      console.error('Default location check error:', error)
      return {
        isInside: true, // Allow if check fails
        confidence: 'low'
      }
    }
  }

  /**
   * Get site location coordinates
   */
  private static async getSiteLocation(siteId: string): Promise<LocationCoordinates | null> {
    try {
      const response = await fetch(`/api/sites/${siteId}`)
      if (response.ok) {
        const data = await response.json()
        return data.location ? {
          lat: data.location.lat,
          lng: data.location.lng,
          accuracy: 0
        } : null
      }
      return null
    } catch (error) {
      console.error('Error fetching site location:', error)
      return null
    }
  }

  /**
   * Create a new geofence zone
   */
  static async createGeofenceZone(
    siteId: string,
    zone: Omit<GeofenceZone, 'id'>
  ): Promise<{ success: boolean; zone?: GeofenceZone; error?: string }> {
    try {
      const response = await fetch(`/api/sites/${siteId}/geofences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(zone)
      })

      const result = await response.json()

      if (!response.ok) {
        return { success: false, error: result.error }
      }

      return { success: true, zone: result.zone }
    } catch (error) {
      console.error('Error creating geofence zone:', error)
      return { success: false, error: 'Failed to create geofence zone' }
    }
  }
}