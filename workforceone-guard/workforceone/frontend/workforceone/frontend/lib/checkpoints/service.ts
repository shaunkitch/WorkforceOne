import { supabase } from '../supabase/client'
import { useState } from 'react'

export interface Location {
  id: string
  organization_id: string
  name: string
  address?: string
  latitude?: number
  longitude?: number
  geofence_radius?: number
  location_type: 'checkpoint' | 'outlet' | 'site'
  metadata?: {
    qr_code?: string
    nfc_tag_id?: string
    expected_visit_duration?: number
    special_instructions?: string
  }
  created_at: string
}

export interface CheckpointScan {
  id: string
  patrol_id: string
  location_id: string
  guard_id: string
  visited_at: string
  verification_method: 'qr' | 'nfc' | 'manual'
  verification_data?: string
  latitude?: number
  longitude?: number
  photos?: string[]
  notes?: string
  created_at: string
  location?: {
    name: string
    address?: string
  }
}

export class CheckpointService {
  // Create a new checkpoint via API
  static async createCheckpoint(data: {
    organization_id: string
    name: string
    description?: string
    address?: string
    latitude?: number | null
    longitude?: number | null
    location_type: 'checkpoint' | 'waypoint' | 'emergency'
    qr_code: string
    nfc_tag?: string
    is_active: boolean
    verification_methods: ('qr' | 'nfc' | 'manual')[]
    geofence_radius?: number
    visit_instructions?: string
    created_by: string
  }): Promise<{ success: boolean; checkpoint?: Location; error?: string }> {
    try {
      const response = await fetch('/api/checkpoints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('Error creating checkpoint:', result)
        return { success: false, error: result.error || 'Failed to create checkpoint' }
      }

      return { success: result.success, checkpoint: result.checkpoint }
    } catch (error) {
      console.error('Error creating checkpoint:', error)
      return { success: false, error: 'Failed to create checkpoint' }
    }
  }

  // Get all checkpoints for an organization via API
  static async getCheckpoints(organizationId: string, activeOnly = false): Promise<Location[]> {
    try {
      const params = new URLSearchParams({
        organization_id: organizationId,
        active_only: activeOnly.toString()
      })

      const response = await fetch(`/api/checkpoints?${params}`)
      const result = await response.json()

      if (!response.ok) {
        console.error('Error fetching checkpoints:', result)
        return []
      }

      return result.checkpoints || []
    } catch (error) {
      console.error('Error in getCheckpoints:', error)
      return []
    }
  }

  // Update checkpoint via API
  static async updateCheckpoint(
    id: string,
    organizationId: string,
    data: {
      name?: string
      description?: string
      address?: string
      latitude?: number | null
      longitude?: number | null
      location_type?: 'checkpoint' | 'waypoint' | 'emergency'
      qr_code?: string
      nfc_tag?: string
      is_active?: boolean
      verification_methods?: ('qr' | 'nfc' | 'manual')[]
      geofence_radius?: number
      visit_instructions?: string
      updated_by: string
    }
  ): Promise<{ success: boolean; checkpoint?: Location; error?: string }> {
    try {
      const response = await fetch('/api/checkpoints', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          organization_id: organizationId,
          ...data
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('Error updating checkpoint:', result)
        return { success: false, error: result.error || 'Failed to update checkpoint' }
      }

      return { success: result.success, checkpoint: result.checkpoint }
    } catch (error) {
      console.error('Error updating checkpoint:', error)
      return { success: false, error: 'Failed to update checkpoint' }
    }
  }

  // Delete checkpoint via API
  static async deleteCheckpoint(
    id: string,
    organizationId: string,
    deletedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const params = new URLSearchParams({
        id,
        organization_id: organizationId,
        deleted_by: deletedBy
      })

      const response = await fetch(`/api/checkpoints?${params}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('Error deleting checkpoint:', result)
        return { success: false, error: result.error || 'Failed to delete checkpoint' }
      }

      return { success: result.success }
    } catch (error) {
      console.error('Error deleting checkpoint:', error)
      return { success: false, error: 'Failed to delete checkpoint' }
    }
  }

  // Verify QR code scan
  static async verifyQRCode(
    qrCodeData: string,
    patrolId: string,
    guardId: string,
    latitude?: number,
    longitude?: number
  ): Promise<{ 
    success: boolean
    location?: Location
    distance?: number
    error?: string 
  }> {
    try {
      // Parse QR code data (expected format: checkpoint:{locationId} or custom data)
      let locationId: string

      if (qrCodeData.startsWith('checkpoint:')) {
        locationId = qrCodeData.replace('checkpoint:', '')
      } else {
        // Try to find location by QR code data
        const { data: locations, error } = await supabase
          .from('locations')
          .select('*')
          .eq('location_type', 'checkpoint')
          .contains('metadata', { qr_code: qrCodeData })

        if (error || !locations || locations.length === 0) {
          return { success: false, error: 'Invalid QR code or checkpoint not found' }
        }

        locationId = locations[0].id
      }

      // Get location details
      const { data: location, error: locationError } = await supabase
        .from('locations')
        .select('*')
        .eq('id', locationId)
        .eq('location_type', 'checkpoint')
        .single()

      if (locationError || !location) {
        return { success: false, error: 'Checkpoint not found' }
      }

      // Verify proximity if GPS coordinates are available
      let distance: number | undefined
      if (latitude && longitude && location.latitude && location.longitude) {
        distance = this.calculateDistance(
          latitude,
          longitude,
          location.latitude,
          location.longitude
        )

        // Check if within geofence radius
        const allowedRadius = location.geofence_radius || 50 // Default 50 meters
        if (distance > allowedRadius) {
          return { 
            success: false, 
            error: `You are ${Math.round(distance)}m away from checkpoint. Please get closer (within ${allowedRadius}m).`,
            distance 
          }
        }
      }

      return { success: true, location, distance }
    } catch (error) {
      console.error('Error in verifyQRCode:', error)
      return { success: false, error: 'QR code verification failed' }
    }
  }

  // Verify NFC tag scan
  static async verifyNFCTag(
    nfcTagId: string,
    patrolId: string,
    guardId: string,
    latitude?: number,
    longitude?: number
  ): Promise<{ 
    success: boolean
    location?: Location
    distance?: number
    error?: string 
  }> {
    try {
      // Find location by NFC tag ID
      const { data: locations, error } = await supabase
        .from('locations')
        .select('*')
        .eq('location_type', 'checkpoint')
        .contains('metadata', { nfc_tag_id: nfcTagId })

      if (error || !locations || locations.length === 0) {
        return { success: false, error: 'Invalid NFC tag or checkpoint not found' }
      }

      const location = locations[0]

      // Verify proximity if GPS coordinates are available
      let distance: number | undefined
      if (latitude && longitude && location.latitude && location.longitude) {
        distance = this.calculateDistance(
          latitude,
          longitude,
          location.latitude,
          location.longitude
        )

        // Check if within geofence radius
        const allowedRadius = location.geofence_radius || 20 // NFC requires closer proximity
        if (distance > allowedRadius) {
          return { 
            success: false, 
            error: `You are ${Math.round(distance)}m away from checkpoint. Please get closer (within ${allowedRadius}m).`,
            distance 
          }
        }
      }

      return { success: true, location, distance }
    } catch (error) {
      console.error('Error in verifyNFCTag:', error)
      return { success: false, error: 'NFC tag verification failed' }
    }
  }

  // Record checkpoint visit
  static async recordCheckpointVisit(
    patrolId: string,
    locationId: string,
    guardId: string,
    verificationMethod: 'qr' | 'nfc' | 'manual',
    verificationData?: string,
    latitude?: number,
    longitude?: number,
    photos?: string[],
    notes?: string
  ): Promise<{ success: boolean; visit?: CheckpointScan; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('checkpoint_visits')
        .insert({
          patrol_id: patrolId,
          location_id: locationId,
          guard_id: guardId,
          verification_method: verificationMethod,
          verification_data: verificationData,
          latitude,
          longitude,
          photos,
          notes,
          visited_at: new Date().toISOString()
        })
        .select(`
          *,
          location:location_id (name, address)
        `)
        .single()

      if (error) {
        console.error('Error recording checkpoint visit:', error)
        return { success: false, error: error.message }
      }

      // Update patrol progress
      await this.updatePatrolProgress(patrolId)

      // Log activity
      await supabase
        .from('activity_logs')
        .insert({
          organization_id: await this.getOrganizationId(patrolId),
          user_id: guardId,
          module: 'guard',
          action: 'checkpoint_visited',
          entity_type: 'checkpoint_visit',
          entity_id: data.id,
          location_id: locationId,
          latitude,
          longitude,
          metadata: {
            patrol_id: patrolId,
            verification_method: verificationMethod,
            verification_data: verificationData,
            photos_count: photos?.length || 0
          }
        })

      return { success: true, visit: data }
    } catch (error) {
      console.error('Error in recordCheckpointVisit:', error)
      return { success: false, error: 'Failed to record checkpoint visit' }
    }
  }

  // Get checkpoint visits for a patrol
  static async getPatrolCheckpointVisits(patrolId: string): Promise<CheckpointScan[]> {
    try {
      const { data, error } = await supabase
        .from('checkpoint_visits')
        .select(`
          *,
          location:location_id (name, address)
        `)
        .eq('patrol_id', patrolId)
        .order('visited_at')

      if (error) {
        console.error('Error fetching checkpoint visits:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getPatrolCheckpointVisits:', error)
      return []
    }
  }

  // Generate QR code for checkpoint
  static generateCheckpointQRCode(locationId: string): string {
    return `checkpoint:${locationId}`
  }

  // Generate QR code URL for display
  static generateQRCodeURL(data: string, size: number = 200): string {
    const encodedData = encodeURIComponent(data)
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedData}`
  }

  // Validate checkpoint photos
  static async uploadCheckpointPhoto(
    file: File,
    checkpointVisitId: string
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      // Create unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = `checkpoint-photos/${checkpointVisitId}/${timestamp}-${file.name}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('checkpoint-photos')
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Error uploading photo:', error)
        return { success: false, error: 'Failed to upload photo' }
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('checkpoint-photos')
        .getPublicUrl(filename)

      return { success: true, url: urlData.publicUrl }
    } catch (error) {
      console.error('Error in uploadCheckpointPhoto:', error)
      return { success: false, error: 'Photo upload failed' }
    }
  }

  // Get checkpoint visit statistics
  static async getCheckpointStatistics(
    organizationId: string,
    days: number = 30
  ): Promise<{
    totalVisits: number
    uniqueCheckpoints: number
    averageVisitsPerDay: number
    topCheckpoints: Array<{ name: string; visits: number }>
    verificationMethods: Array<{ method: string; count: number }>
  }> {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

      const { data: visits, error } = await supabase
        .from('checkpoint_visits')
        .select(`
          verification_method,
          location_id,
          visited_at,
          location:location_id (name)
        `)
        .gte('visited_at', startDate)

      if (error || !visits) {
        return {
          totalVisits: 0,
          uniqueCheckpoints: 0,
          averageVisitsPerDay: 0,
          topCheckpoints: [],
          verificationMethods: []
        }
      }

      const totalVisits = visits.length
      const uniqueCheckpoints = new Set(visits.map(v => v.location_id)).size
      const averageVisitsPerDay = Math.round((totalVisits / days) * 10) / 10

      // Top checkpoints
      const locationCounts = new Map<string, { name: string; count: number }>()
      visits.forEach(visit => {
        const locationName = visit.location?.name || 'Unknown'
        const current = locationCounts.get(visit.location_id) || { name: locationName, count: 0 }
        locationCounts.set(visit.location_id, { ...current, count: current.count + 1 })
      })
      
      const topCheckpoints = Array.from(locationCounts.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map(item => ({ name: item.name, visits: item.count }))

      // Verification methods
      const methodCounts = new Map<string, number>()
      visits.forEach(visit => {
        methodCounts.set(visit.verification_method, (methodCounts.get(visit.verification_method) || 0) + 1)
      })
      
      const verificationMethods = Array.from(methodCounts.entries())
        .map(([method, count]) => ({ method, count }))

      return {
        totalVisits,
        uniqueCheckpoints,
        averageVisitsPerDay,
        topCheckpoints,
        verificationMethods
      }
    } catch (error) {
      console.error('Error in getCheckpointStatistics:', error)
      return {
        totalVisits: 0,
        uniqueCheckpoints: 0,
        averageVisitsPerDay: 0,
        topCheckpoints: [],
        verificationMethods: []
      }
    }
  }

  // Helper method to update patrol progress
  private static async updatePatrolProgress(patrolId: string): Promise<void> {
    try {
      // Get current checkpoint count
      const { data: visits } = await supabase
        .from('checkpoint_visits')
        .select('id')
        .eq('patrol_id', patrolId)

      const checkpointsCompleted = visits?.length || 0

      // Update patrol
      await supabase
        .from('patrols')
        .update({ checkpoints_completed: checkpointsCompleted })
        .eq('id', patrolId)
    } catch (error) {
      console.error('Error updating patrol progress:', error)
    }
  }

  // Helper method to get organization ID from patrol
  private static async getOrganizationId(patrolId: string): Promise<string | undefined> {
    try {
      const { data } = await supabase
        .from('patrols')
        .select('organization_id')
        .eq('id', patrolId)
        .single()

      return data?.organization_id
    } catch (error) {
      console.error('Error getting organization ID:', error)
      return undefined
    }
  }

  // Calculate distance between two points (Haversine formula)
  private static calculateDistance(
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
}

// Hook for using camera/scanner in React components
export function useQRScanner() {
  const [isScanning, setIsScanning] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const startScanning = () => {
    setIsScanning(true)
    setResult(null)
    setError(null)
  }

  const stopScanning = () => {
    setIsScanning(false)
  }

  const handleScanResult = (data: string) => {
    setResult(data)
    setIsScanning(false)
  }

  const handleScanError = (error: string) => {
    setError(error)
    setIsScanning(false)
  }

  return {
    isScanning,
    result,
    error,
    startScanning,
    stopScanning,
    handleScanResult,
    handleScanError
  }
}

// NFC support detection
export function isNFCSupported(): boolean {
  return 'NDEFReader' in window
}

// Start NFC scanning
export async function startNFCScanning(): Promise<{
  success: boolean
  reader?: NDEFReader
  error?: string
}> {
  if (!isNFCSupported()) {
    return { success: false, error: 'NFC is not supported on this device' }
  }

  try {
    const ndef = new (window as any).NDEFReader()
    await ndef.scan()
    return { success: true, reader: ndef }
  } catch (error) {
    console.error('NFC scanning error:', error)
    return { success: false, error: 'Failed to start NFC scanning' }
  }
}