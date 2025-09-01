'use client'

import { supabase } from '../supabase/client'

export interface GPSPosition {
  latitude: number
  longitude: number
  accuracy?: number
  altitude?: number
  speed?: number
  heading?: number
  timestamp: string
}

export interface GPSTrackingOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
  trackingInterval?: number // in milliseconds
}

export class GPSTracker {
  private watchId: number | null = null
  private trackingInterval: NodeJS.Timeout | null = null
  private userId: string
  private isTracking = false

  constructor(userId: string) {
    this.userId = userId
  }

  async startTracking(options: GPSTrackingOptions = {}): Promise<{ success: boolean; error?: string }> {
    if (this.isTracking) {
      return { success: false, error: 'Tracking already started' }
    }

    if (!navigator.geolocation) {
      return { success: false, error: 'Geolocation is not supported' }
    }

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
      trackingInterval: 600000 // 10 minutes
    }

    const config = { ...defaultOptions, ...options }

    try {
      // Start continuous location watching
      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          this.handlePositionUpdate(position)
        },
        (error) => {
          console.error('GPS tracking error:', error)
        },
        {
          enableHighAccuracy: config.enableHighAccuracy,
          timeout: config.timeout,
          maximumAge: config.maximumAge
        }
      )

      // Set up periodic position logging
      this.trackingInterval = setInterval(() => {
        this.getCurrentPosition()
      }, config.trackingInterval)

      this.isTracking = true
      return { success: true }
    } catch (error) {
      console.error('Failed to start GPS tracking:', error)
      return { success: false, error: 'Failed to start GPS tracking' }
    }
  }

  stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId)
      this.watchId = null
    }

    if (this.trackingInterval) {
      clearInterval(this.trackingInterval)
      this.trackingInterval = null
    }

    this.isTracking = false
  }

  private async getCurrentPosition(): Promise<void> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.handlePositionUpdate(position)
          resolve()
        },
        (error) => {
          console.error('Error getting current position:', error)
          reject(error)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      )
    })
  }

  private async handlePositionUpdate(position: GeolocationPosition): Promise<void> {
    try {
      const gpsData: GPSPosition = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude || undefined,
        speed: position.coords.speed || undefined,
        heading: position.coords.heading || undefined,
        timestamp: new Date().toISOString()
      }

      await this.savePosition(gpsData)
      
      // Emit event for real-time updates
      window.dispatchEvent(new CustomEvent('gps-update', { detail: gpsData }))
    } catch (error) {
      console.error('Error handling position update:', error)
    }
  }

  private async savePosition(position: GPSPosition): Promise<void> {
    try {
      // Get battery level if available
      let batteryLevel: number | undefined
      if ('getBattery' in navigator) {
        try {
          const battery = await (navigator as any).getBattery()
          batteryLevel = Math.round(battery.level * 100)
        } catch {
          // Battery API not available or failed
        }
      }

      const { error } = await supabase
        .from('gps_tracking')
        .insert({
          user_id: this.userId,
          latitude: position.latitude,
          longitude: position.longitude,
          accuracy: position.accuracy,
          altitude: position.altitude,
          speed: position.speed,
          heading: position.heading,
          battery_level: batteryLevel,
          timestamp: position.timestamp
        })

      if (error) {
        console.error('Error saving GPS position:', error)
      }
    } catch (error) {
      console.error('Error in savePosition:', error)
    }
  }

  // Get distance between two GPS coordinates (in meters)
  static calculateDistance(
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

  // Check if user is within geofence radius
  static isWithinGeofence(
    userLat: number,
    userLon: number,
    geofenceLat: number,
    geofenceLon: number,
    radius: number
  ): boolean {
    const distance = this.calculateDistance(userLat, userLon, geofenceLat, geofenceLon)
    return distance <= radius
  }

  isTrackingActive(): boolean {
    return this.isTracking
  }
}

// Hook for using GPS tracking in React components
export function useGPSTracking(userId: string) {
  const tracker = new GPSTracker(userId)

  const startTracking = async (options?: GPSTrackingOptions) => {
    return await tracker.startTracking(options)
  }

  const stopTracking = () => {
    tracker.stopTracking()
  }

  const isActive = () => {
    return tracker.isTrackingActive()
  }

  return {
    startTracking,
    stopTracking,
    isActive
  }
}

// Service for retrieving GPS tracking data
export class GPSTrackingService {
  // Get latest position for a user
  static async getLatestPosition(userId: string): Promise<GPSPosition | null> {
    try {
      const { data, error } = await supabase
        .from('gps_tracking')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single()

      if (error || !data) {
        return null
      }

      return {
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy,
        altitude: data.altitude,
        speed: data.speed,
        heading: data.heading,
        timestamp: data.timestamp
      }
    } catch (error) {
      console.error('Error getting latest position:', error)
      return null
    }
  }

  // Get position history for a user
  static async getPositionHistory(
    userId: string,
    startTime?: string,
    endTime?: string,
    limit: number = 100
  ): Promise<GPSPosition[]> {
    try {
      let query = supabase
        .from('gps_tracking')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (startTime) {
        query = query.gte('timestamp', startTime)
      }

      if (endTime) {
        query = query.lte('timestamp', endTime)
      }

      const { data, error } = await query

      if (error || !data) {
        return []
      }

      return data.map(item => ({
        latitude: item.latitude,
        longitude: item.longitude,
        accuracy: item.accuracy,
        altitude: item.altitude,
        speed: item.speed,
        heading: item.heading,
        timestamp: item.timestamp
      }))
    } catch (error) {
      console.error('Error getting position history:', error)
      return []
    }
  }

  // Get all active users with their latest positions
  static async getActiveUsersPositions(): Promise<Array<{
    userId: string
    userName: string
    position: GPSPosition
    batteryLevel?: number
  }>> {
    try {
      console.log('GPSTrackingService: Querying active users positions...')
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
      console.log('GPSTrackingService: Looking for GPS data after:', thirtyMinutesAgo)
      
      const { data, error } = await supabase
        .from('gps_tracking')
        .select(`
          user_id,
          latitude,
          longitude,
          accuracy,
          altitude,
          speed,
          heading,
          battery_level,
          timestamp,
          users:user_id (
            first_name,
            last_name
          )
        `)
        .gte('timestamp', thirtyMinutesAgo)
        .order('timestamp', { ascending: false })

      console.log('GPSTrackingService query result:', { data, error, count: data?.length })

      if (error || !data) {
        return []
      }

      // Group by user_id and get latest position
      const userPositions = new Map()

      data.forEach(item => {
        if (!userPositions.has(item.user_id) || 
            new Date(item.timestamp) > new Date(userPositions.get(item.user_id).timestamp)) {
          userPositions.set(item.user_id, item)
        }
      })

      return Array.from(userPositions.values()).map(item => ({
        userId: item.user_id,
        userName: `${item.users.first_name} ${item.users.last_name}`,
        position: {
          latitude: item.latitude,
          longitude: item.longitude,
          accuracy: item.accuracy,
          altitude: item.altitude,
          speed: item.speed,
          heading: item.heading,
          timestamp: item.timestamp
        },
        batteryLevel: item.battery_level
      }))
    } catch (error) {
      console.error('Error getting active users positions:', error)
      return []
    }
  }
}