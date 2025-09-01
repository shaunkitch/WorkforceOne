// QR Code Type Detection and Routing Service

import { supabase } from '@/lib/supabase/client'

export interface QRDetectionResult {
  type: 'attendance' | 'registration' | 'patrol' | 'unknown'
  isValid: boolean
  data?: any
  error?: string
  redirectUrl?: string
}

export class QRDetectionService {
  /**
   * Analyze a QR code and determine its type and validity
   */
  static async detectQRType(code: string): Promise<QRDetectionResult> {
    if (!code || code.trim().length === 0) {
      return {
        type: 'unknown',
        isValid: false,
        error: 'Empty QR code'
      }
    }

    const cleanCode = code.trim()

    // Try to detect registration token (UUID format or 5-letter code)
    const isRegistrationToken = await this.checkRegistrationToken(cleanCode)
    if (isRegistrationToken.isValid) {
      return {
        type: 'registration',
        isValid: true,
        data: isRegistrationToken.data,
        redirectUrl: `/register?token=${encodeURIComponent(cleanCode)}`
      }
    }

    // Try to detect attendance QR code
    const isAttendanceQR = await this.checkAttendanceQR(cleanCode)
    if (isAttendanceQR.isValid) {
      return {
        type: 'attendance',
        isValid: true,
        data: isAttendanceQR.data
      }
    }

    // Try to detect patrol checkpoint
    const isPatrolQR = await this.checkPatrolQR(cleanCode)
    if (isPatrolQR.isValid) {
      return {
        type: 'patrol',
        isValid: true,
        data: isPatrolQR.data,
        redirectUrl: `/patrols/checkpoint?code=${encodeURIComponent(cleanCode)}`
      }
    }

    return {
      type: 'unknown',
      isValid: false,
      error: 'QR code not recognized'
    }
  }

  /**
   * Check if code is a registration token
   */
  private static async checkRegistrationToken(code: string): Promise<{ isValid: boolean; data?: any }> {
    try {
      // First check if it matches registration token patterns
      const isAccessCode = /^[A-Z0-9]{5}$/.test(code)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(code)
      
      if (!isAccessCode && !isUUID) {
        return { isValid: false }
      }

      // Validate with the registration token API
      const response = await fetch(`/api/registration/validate-token?token=${encodeURIComponent(code)}`)
      const result = await response.json()

      return {
        isValid: result.valid,
        data: result.tokenData
      }
    } catch (error) {
      console.error('Error checking registration token:', error)
      return { isValid: false }
    }
  }

  /**
   * Check if code is an attendance QR code
   */
  private static async checkAttendanceQR(code: string): Promise<{ isValid: boolean; data?: any }> {
    try {
      // Extract code from URL if a full URL was passed
      let cleanCode = code
      if (code.includes('scan?code=')) {
        try {
          const url = new URL(code)
          cleanCode = url.searchParams.get('code') || code
        } catch {
          // If URL parsing fails, check if it contains the pattern
          const match = code.match(/scan\?code=([^&]+)/)
          if (match) {
            cleanCode = match[1]
          }
        }
      }

      const { data, error } = await supabase
        .from('qr_codes')
        .select('*')
        .eq('code', cleanCode)
        .eq('is_active', true)
        .single()

      if (error || !data) {
        return { isValid: false }
      }

      // Check if QR code is expired
      if (data.valid_until && new Date(data.valid_until) < new Date()) {
        return { isValid: false }
      }

      return {
        isValid: true,
        data
      }
    } catch (error) {
      console.error('Error checking attendance QR:', error)
      return { isValid: false }
    }
  }

  /**
   * Check if code is a patrol checkpoint QR
   */
  private static async checkPatrolQR(code: string): Promise<{ isValid: boolean; data?: any }> {
    try {
      // Check patrol_checkpoints table by QR code
      const { data: qrData, error: qrError } = await supabase
        .from('patrol_checkpoints')
        .select('*')
        .eq('qr_code', code)
        .eq('is_active', true)
        .single()

      if (!qrError && qrData) {
        return { isValid: true, data: qrData }
      }

      // If not found by QR code, try by checkpoint ID
      const { data: idData, error: idError } = await supabase
        .from('patrol_checkpoints')
        .select('*')
        .eq('id', code)
        .eq('is_active', true)
        .single()

      if (!idError && idData) {
        return { isValid: true, data: idData }
      }

      // Check if it matches checkpoint pattern (CP-XXXX or similar)
      if (/^(CP|CHECKPOINT|CHK)-[A-Z0-9]+$/i.test(code)) {
        // Try to find by name or reference
        const { data: nameData, error: nameError } = await supabase
          .from('patrol_checkpoints')
          .select('*')
          .ilike('name', `%${code}%`)
          .eq('is_active', true)
          .limit(1)
          .single()

        if (!nameError && nameData) {
          return { isValid: true, data: nameData }
        }
      }

      return { isValid: false }
    } catch (error) {
      console.error('Error checking patrol QR:', error)
      return { isValid: false }
    }
  }

  /**
   * Get a user-friendly description of the QR code type
   */
  static getQRTypeDescription(type: string): string {
    switch (type) {
      case 'attendance':
        return 'Attendance Check-In/Out'
      case 'registration':
        return 'Guard Registration'
      case 'patrol':
        return 'Patrol Checkpoint'
      default:
        return 'Unknown QR Code'
    }
  }

  /**
   * Get appropriate icon for QR code type
   */
  static getQRTypeIcon(type: string) {
    switch (type) {
      case 'attendance':
        return Clock
      case 'registration':
        return User
      case 'patrol':
        return MapPin
      default:
        return QrCode
    }
  }
}