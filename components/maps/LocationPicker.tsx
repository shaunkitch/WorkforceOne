'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Navigation, Search, Loader2 } from 'lucide-react'

interface LocationPickerProps {
  latitude?: number | null
  longitude?: number | null
  onLocationChange: (lat: number, lng: number) => void
  onAddressChange?: (address: string) => void
}

export default function LocationPicker({ 
  latitude, 
  longitude, 
  onLocationChange, 
  onAddressChange 
}: LocationPickerProps) {
  const [searchAddress, setSearchAddress] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(
    latitude && longitude ? { lat: latitude, lng: longitude } : null
  )
  const [gettingCurrentLocation, setGettingCurrentLocation] = useState(false)

  // Update internal state when props change
  useEffect(() => {
    if (latitude && longitude) {
      setCurrentLocation({ lat: latitude, lng: longitude })
    }
  }, [latitude, longitude])

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser')
      return
    }

    setGettingCurrentLocation(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        setCurrentLocation({ lat, lng })
        onLocationChange(lat, lng)
        
        // Try to get address from coordinates (reverse geocoding simulation)
        reverseGeocode(lat, lng)
        setGettingCurrentLocation(false)
      },
      (error) => {
        console.error('Error getting current location:', error)
        alert('Unable to get current location. Please check your location permissions.')
        setGettingCurrentLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )
  }, [onLocationChange])

  const searchLocation = async () => {
    if (!searchAddress.trim()) return

    setIsSearching(true)
    try {
      // In a real implementation, you would use a geocoding service like:
      // - Google Maps Geocoding API
      // - Mapbox Geocoding API
      // - OpenStreetMap Nominatim API
      
      // For now, we'll simulate the search with some sample locations
      const mockResults = [
        { address: '123 Main St, Downtown', lat: 40.7128, lng: -74.0060 },
        { address: '456 Oak Ave, Business District', lat: 40.7589, lng: -73.9851 },
        { address: '789 Pine Rd, Residential Area', lat: 40.6892, lng: -74.0445 },
      ]
      
      const result = mockResults.find(r => 
        r.address.toLowerCase().includes(searchAddress.toLowerCase())
      ) || mockResults[0] // Default to first result if no match

      setCurrentLocation({ lat: result.lat, lng: result.lng })
      onLocationChange(result.lat, result.lng)
      if (onAddressChange) {
        onAddressChange(result.address)
      }
    } catch (error) {
      console.error('Error searching location:', error)
      alert('Unable to search location. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      // In a real implementation, you would use reverse geocoding
      // For now, we'll generate a mock address
      const mockAddress = `${Math.floor(Math.abs(lat * 1000))} Location St, City`
      if (onAddressChange) {
        onAddressChange(mockAddress)
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error)
    }
  }

  const handleManualCoordinateChange = (field: 'lat' | 'lng', value: string) => {
    const numValue = parseFloat(value)
    if (!isNaN(numValue)) {
      const newLocation = field === 'lat' 
        ? { lat: numValue, lng: currentLocation?.lng || 0 }
        : { lat: currentLocation?.lat || 0, lng: numValue }
      
      setCurrentLocation(newLocation)
      onLocationChange(newLocation.lat, newLocation.lng)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <MapPin className="h-5 w-5 mr-2" />
          Location Selection
        </CardTitle>
        <CardDescription>
          Choose the checkpoint location by searching, using current location, or entering coordinates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Location Button */}
        <div className="flex items-center space-x-2">
          <Button 
            onClick={getCurrentLocation}
            disabled={gettingCurrentLocation}
            variant="outline"
            className="flex-1"
          >
            {gettingCurrentLocation ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Getting Location...
              </>
            ) : (
              <>
                <Navigation className="h-4 w-4 mr-2" />
                Use Current Location
              </>
            )}
          </Button>
        </div>

        {/* Address Search */}
        <div className="space-y-2">
          <Label>Search by Address</Label>
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Enter address to search..."
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
              className="flex-1"
            />
            <Button 
              onClick={searchLocation}
              disabled={isSearching || !searchAddress.trim()}
              variant="outline"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Manual Coordinate Entry */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="manual-lat">Latitude</Label>
            <Input
              id="manual-lat"
              type="number"
              step="0.000001"
              placeholder="40.7128"
              value={currentLocation?.lat || ''}
              onChange={(e) => handleManualCoordinateChange('lat', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="manual-lng">Longitude</Label>
            <Input
              id="manual-lng"
              type="number"
              step="0.000001"
              placeholder="-74.0060"
              value={currentLocation?.lng || ''}
              onChange={(e) => handleManualCoordinateChange('lng', e.target.value)}
            />
          </div>
        </div>

        {/* Selected Location Display */}
        {currentLocation && (
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center text-green-800 mb-1">
              <MapPin className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">Selected Location</span>
            </div>
            <div className="text-sm text-green-700">
              Latitude: {currentLocation.lat.toFixed(6)}<br />
              Longitude: {currentLocation.lng.toFixed(6)}
            </div>
          </div>
        )}

        {/* Map Placeholder */}
        <div className="border rounded-lg p-8 text-center bg-gray-50">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 text-sm mb-2">Interactive Map</p>
          <p className="text-xs text-gray-500">
            In a production environment, this would show an interactive map<br />
            (Google Maps, Mapbox, or OpenStreetMap) where you can click to select location
          </p>
          {currentLocation && (
            <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs">
              <MapPin className="h-3 w-3 mr-1" />
              Location Selected
            </div>
          )}
        </div>

        {/* Sample Locations for Testing */}
        <div className="space-y-2">
          <Label className="text-sm">Sample Locations (for testing)</Label>
          <div className="grid grid-cols-1 gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setCurrentLocation({ lat: 40.7128, lng: -74.0060 })
                onLocationChange(40.7128, -74.0060)
                if (onAddressChange) onAddressChange('123 Main St, New York, NY')
              }}
              className="justify-start text-xs"
            >
              📍 New York City Center (40.7128, -74.0060)
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setCurrentLocation({ lat: 34.0522, lng: -118.2437 })
                onLocationChange(34.0522, -118.2437)
                if (onAddressChange) onAddressChange('456 Corporate Blvd, Los Angeles, CA')
              }}
              className="justify-start text-xs"
            >
              📍 Los Angeles Downtown (34.0522, -118.2437)
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setCurrentLocation({ lat: 41.8781, lng: -87.6298 })
                onLocationChange(41.8781, -87.6298)
                if (onAddressChange) onAddressChange('789 Business Ave, Chicago, IL')
              }}
              className="justify-start text-xs"
            >
              📍 Chicago Loop (41.8781, -87.6298)
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}