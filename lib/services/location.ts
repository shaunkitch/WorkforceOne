// Location Services with Error Handling

import { QRScanErrors, QRScannerError } from '@/lib/errors/qr-scanner'

export interface LocationCoordinates {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

export interface LocationOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
  requiredAccuracy?: number // meters
}

export class LocationService {
  private static defaultOptions: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 15000, // 15 seconds
    maximumAge: 60000 // 1 minute
  }

  static async getCurrentLocation(options?: LocationOptions): Promise<LocationCoordinates> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new QRScannerError(
          'LOCATION_UNAVAILABLE' as any,
          'Geolocation not supported',
          'Your device does not support location services.',
          {},
          {}
        ))
        return
      }

      const positionOptions: PositionOptions = {
        ...this.defaultOptions,
        ...options
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: LocationCoordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          }

          // Check accuracy if required
          if (options?.requiredAccuracy && coords.accuracy > options.requiredAccuracy) {
            reject(new QRScannerError(
              'INVALID_LOCATION' as any,
              `Location accuracy too low: ${coords.accuracy}m`,
              `Location accuracy is too low (${Math.round(coords.accuracy)}m). Please move to an area with better GPS signal.`,
              { accuracy: coords.accuracy, required: options.requiredAccuracy },
              { location: coords }
            ))
            return
          }

          resolve(coords)
        },
        (error) => {
          let qrError: QRScannerError

          switch (error.code) {
            case error.PERMISSION_DENIED:
              qrError = QRScanErrors.locationPermissionDenied()
              break
            case error.POSITION_UNAVAILABLE:
              qrError = new QRScannerError(
                'LOCATION_UNAVAILABLE' as any,
                'Position unavailable',
                'Unable to determine your location. Please check your GPS settings.',
                { code: error.code, message: error.message },
                {}
              )
              break
            case error.TIMEOUT:
              qrError = QRScanErrors.locationTimeout()
              break
            default:
              qrError = new QRScannerError(
                'LOCATION_UNAVAILABLE' as any,
                `Geolocation error: ${error.message}`,
                'Unable to get your location. Please try again.',
                { code: error.code, message: error.message },
                {}
              )
          }

          reject(qrError)
        },
        positionOptions
      )
    })
  }

  static async watchLocation(
    callback: (location: LocationCoordinates) => void,
    errorCallback: (error: QRScannerError) => void,
    options?: LocationOptions
  ): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new QRScannerError(
          'LOCATION_UNAVAILABLE' as any,
          'Geolocation not supported',
          'Your device does not support location services.',
          {},
          {}
        ))
        return
      }

      const positionOptions: PositionOptions = {
        ...this.defaultOptions,
        ...options
      }

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const coords: LocationCoordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          }
          callback(coords)
        },
        (error) => {
          const qrError = this.mapGeolocationError(error)
          errorCallback(qrError)
        },
        positionOptions
      )

      resolve(watchId)
    })
  }

  static clearWatch(watchId: number): void {
    navigator.geolocation.clearWatch(watchId)
  }

  private static mapGeolocationError(error: GeolocationPositionError): QRScannerError {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return QRScanErrors.locationPermissionDenied()
      case error.POSITION_UNAVAILABLE:
        return new QRScannerError(
          'LOCATION_UNAVAILABLE' as any,
          'Position unavailable',
          'Unable to determine your location. Please check your GPS settings.',
          { code: error.code, message: error.message },
          {}
        )
      case error.TIMEOUT:
        return QRScanErrors.locationTimeout()
      default:
        return new QRScannerError(
          'LOCATION_UNAVAILABLE' as any,
          `Geolocation error: ${error.message}`,
          'Unable to get your location. Please try again.',
          { code: error.code, message: error.message },
          {}
        )
    }
  }

  // Calculate distance between two coordinates (Haversine formula)
  static calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lng2 - lng1) * Math.PI) / 180

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c // Distance in meters
  }

  // Validate location is within allowed radius
  static validateLocationRadius(
    currentLocation: LocationCoordinates,
    allowedLocation: { latitude: number; longitude: number },
    radiusMeters: number
  ): { valid: boolean; distance: number } {
    const distance = this.calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      allowedLocation.latitude,
      allowedLocation.longitude
    )

    return {
      valid: distance <= radiusMeters,
      distance: Math.round(distance)
    }
  }
}

// React Hook for Location Services
export const useLocationService = () => {
  const getCurrentLocation = async (options?: LocationOptions): Promise<LocationCoordinates> => {
    try {
      return await LocationService.getCurrentLocation(options)
    } catch (error) {
      if (error instanceof QRScannerError) {
        throw error
      }
      throw QRScanErrors.networkError(error as Error)
    }
  }

  const watchLocation = async (
    callback: (location: LocationCoordinates) => void,
    errorCallback: (error: QRScannerError) => void,
    options?: LocationOptions
  ): Promise<number> => {
    return LocationService.watchLocation(callback, errorCallback, options)
  }

  const clearWatch = (watchId: number) => {
    LocationService.clearWatch(watchId)
  }

  const calculateDistance = LocationService.calculateDistance

  const validateLocationRadius = LocationService.validateLocationRadius

  return {
    getCurrentLocation,
    watchLocation,
    clearWatch,
    calculateDistance,
    validateLocationRadius
  }
}