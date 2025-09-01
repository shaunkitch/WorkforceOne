import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export interface QRCodeData {
  id: string
  code: string
  type: 'static' | 'random'
  siteId?: string
  validFrom: Date
  validUntil?: Date
  isActive: boolean
}

export interface AttendanceRecord {
  id: string
  userId: string
  shiftType: 'check_in' | 'check_out'
  timestamp: Date
  latitude: number
  longitude: number
  accuracy?: number
  qrCodeId?: string
  qrCodeType?: 'static' | 'random'
  deviceInfo?: any
}

export class QRCodeService {
  /**
   * Generate a unique QR code
   */
  static generateQRCode(type: 'static' | 'random', siteId?: string): string {
    const prefix = type === 'static' ? 'STC' : 'RND'
    const timestamp = Date.now().toString(36)
    const random = crypto.randomBytes(8).toString('hex')
    const sitePrefix = siteId ? siteId.slice(0, 8) : 'GENERAL'
    
    return `${prefix}-${sitePrefix}-${timestamp}-${random}`.toUpperCase()
  }

  /**
   * Create a new QR code in the database
   */
  static async createQRCode(
    type: 'static' | 'random',
    siteId?: string,
    validHours: number = 24
  ): Promise<QRCodeData | null> {
    const supabase = createClient()
    
    const code = this.generateQRCode(type, siteId)
    const validFrom = new Date()
    const validUntil = type === 'random' 
      ? new Date(Date.now() + validHours * 60 * 60 * 1000)
      : undefined

    const { data, error } = await supabase
      .from('qr_codes')
      .insert({
        code,
        type,
        site_id: siteId,
        valid_from: validFrom.toISOString(),
        valid_until: validUntil?.toISOString(),
        is_active: true,
        created_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating QR code:', error)
      return null
    }

    return {
      id: data.id,
      code: data.code,
      type: data.type,
      siteId: data.site_id,
      validFrom: new Date(data.valid_from),
      validUntil: data.valid_until ? new Date(data.valid_until) : undefined,
      isActive: data.is_active
    }
  }

  /**
   * Get active QR codes for a site
   */
  static async getActiveQRCodes(siteId?: string): Promise<QRCodeData[]> {
    const supabase = createClient()
    
    let query = supabase
      .from('qr_codes')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (siteId) {
      query = query.eq('site_id', siteId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching QR codes:', error)
      return []
    }

    return data.map(qr => ({
      id: qr.id,
      code: qr.code,
      type: qr.type,
      siteId: qr.site_id,
      validFrom: new Date(qr.valid_from),
      validUntil: qr.valid_until ? new Date(qr.valid_until) : undefined,
      isActive: qr.is_active
    }))
  }

  /**
   * Validate a QR code
   */
  static async validateQRCode(code: string): Promise<{
    valid: boolean
    qrCode?: QRCodeData
    error?: string
  }> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      return { valid: false, error: 'Invalid QR code' }
    }

    // Check if code has expired
    if (data.valid_until && new Date(data.valid_until) < new Date()) {
      return { valid: false, error: 'QR code has expired' }
    }

    return {
      valid: true,
      qrCode: {
        id: data.id,
        code: data.code,
        type: data.type,
        siteId: data.site_id,
        validFrom: new Date(data.valid_from),
        validUntil: data.valid_until ? new Date(data.valid_until) : undefined,
        isActive: data.is_active
      }
    }
  }

  /**
   * Deactivate expired QR codes
   */
  static async deactivateExpiredCodes(): Promise<void> {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('qr_codes')
      .update({ is_active: false })
      .eq('is_active', true)
      .lt('valid_until', new Date().toISOString())

    if (error) {
      console.error('Error deactivating expired codes:', error)
    }
  }

  /**
   * Record attendance (check-in or check-out)
   */
  static async recordAttendance(
    userId: string,
    shiftType: 'check_in' | 'check_out',
    location: { latitude: number; longitude: number; accuracy?: number },
    qrCodeId?: string,
    qrCodeType?: 'static' | 'random',
    deviceInfo?: any
  ): Promise<AttendanceRecord | null> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('shift_attendance')
      .insert({
        user_id: userId,
        shift_type: shiftType,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        qr_code_id: qrCodeId,
        qr_code_type: qrCodeType,
        device_info: deviceInfo
      })
      .select()
      .single()

    if (error) {
      console.error('Error recording attendance:', error)
      return null
    }

    return {
      id: data.id,
      userId: data.user_id,
      shiftType: data.shift_type,
      timestamp: new Date(data.timestamp),
      latitude: data.latitude,
      longitude: data.longitude,
      accuracy: data.accuracy,
      qrCodeId: data.qr_code_id,
      qrCodeType: data.qr_code_type,
      deviceInfo: data.device_info
    }
  }

  /**
   * Get attendance records for a user
   */
  static async getUserAttendance(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AttendanceRecord[]> {
    const supabase = createClient()
    
    let query = supabase
      .from('shift_attendance')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })

    if (startDate) {
      query = query.gte('timestamp', startDate.toISOString())
    }
    if (endDate) {
      query = query.lte('timestamp', endDate.toISOString())
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching attendance:', error)
      return []
    }

    return data.map(record => ({
      id: record.id,
      userId: record.user_id,
      shiftType: record.shift_type,
      timestamp: new Date(record.timestamp),
      latitude: record.latitude,
      longitude: record.longitude,
      accuracy: record.accuracy,
      qrCodeId: record.qr_code_id,
      qrCodeType: record.qr_code_type,
      deviceInfo: record.device_info
    }))
  }

  /**
   * Get all attendance records for admin view
   */
  static async getAllAttendance(
    startDate?: Date,
    endDate?: Date,
    limit: number = 100
  ): Promise<any[]> {
    const supabase = createClient()
    
    let query = supabase
      .from('shift_attendance')
      .select(`
        *,
        users (
          id,
          first_name,
          last_name,
          email,
          role
        )
      `)
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (startDate) {
      query = query.gte('timestamp', startDate.toISOString())
    }
    if (endDate) {
      query = query.lte('timestamp', endDate.toISOString())
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching all attendance:', error)
      return []
    }

    return data
  }

  /**
   * Get current shift status for a user
   */
  static async getCurrentShiftStatus(userId: string): Promise<{
    isCheckedIn: boolean
    lastAction?: 'check_in' | 'check_out'
    lastTimestamp?: Date
    durationHours?: number
  }> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .rpc('get_current_shift_status', { user_uuid: userId })
      .single()

    if (error || !data) {
      return { isCheckedIn: false }
    }

    return {
      isCheckedIn: data.is_checked_in,
      lastAction: data.last_action,
      lastTimestamp: data.last_timestamp ? new Date(data.last_timestamp) : undefined,
      durationHours: data.duration_hours
    }
  }
}