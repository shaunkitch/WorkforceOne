// Attendance Analytics and Reporting Service

import { supabase } from '@/lib/supabase/client'

export interface AttendanceMetrics {
  totalCheckIns: number
  totalCheckOuts: number
  averageShiftDuration: number // minutes
  punctualityRate: number // percentage
  overtimeHours: number
  lateArrivals: number
  earlyDepartures: number
  missedCheckOuts: number
}

export interface GuardPerformance {
  guardId: string
  guardName: string
  shiftsWorked: number
  totalHours: number
  punctualityRate: number
  averageShiftDuration: number
  lateCount: number
  overtimeHours: number
  reliability: 'excellent' | 'good' | 'fair' | 'poor'
}

export interface AttendanceTrend {
  date: string
  checkIns: number
  checkOuts: number
  uniqueGuards: number
  averageShiftLength: number
}

export interface SiteActivity {
  siteId: string
  siteName: string
  totalActivity: number
  uniqueGuards: number
  averageResponseTime: number
  lastActivity: Date
}

export class AttendanceAnalyticsService {
  /**
   * Get overall attendance metrics for date range
   */
  static async getAttendanceMetrics(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AttendanceMetrics> {
    try {
      console.log('getAttendanceMetrics called with:', {
        organizationId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      })
      
      // First, test basic table access
      const { data: testData, error: testError } = await supabase
        .from('shift_attendance')
        .select('count')
        .limit(1)
      
      console.log('Basic table test:', { testData, testError: testError ? {
        message: testError.message,
        details: testError.details,
        hint: testError.hint,
        code: testError.code
      } : null })
      
      const { data: records, error } = await supabase
        .from('shift_attendance')
        .select(`
          *,
          users!inner (first_name, last_name, organization_id)
        `)
        .eq('users.organization_id', organizationId)
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString())

      if (error) {
        console.error('Error fetching attendance records:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: JSON.stringify(error, null, 2)
        })
        return this.getEmptyMetrics()
      }

      return this.calculateMetrics(records || [])
    } catch (error) {
      console.error('Error in getAttendanceMetrics:', error)
      return this.getEmptyMetrics()
    }
  }

  /**
   * Get guard performance rankings
   */
  static async getGuardPerformance(
    organizationId: string,
    startDate: Date,
    endDate: Date,
    limit: number = 20
  ): Promise<GuardPerformance[]> {
    try {
      console.log('getGuardPerformance called with:', {
        organizationId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit
      })
      const { data: records, error } = await supabase
        .from('shift_attendance')
        .select(`
          *,
          users!inner (id, first_name, last_name, organization_id)
        `)
        .eq('users.organization_id', organizationId)
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString())

      if (error || !records) {
        console.error('Error fetching guard performance:', {
          message: error?.message,
          details: error?.details,
          hint: error?.hint,
          code: error?.code,
          fullError: JSON.stringify(error, null, 2),
          hasRecords: !!records
        })
        return []
      }

      return this.calculateGuardPerformance(records, limit)
    } catch (error) {
      console.error('Error in getGuardPerformance:', error)
      return []
    }
  }

  /**
   * Get attendance trends over time
   */
  static async getAttendanceTrends(
    organizationId: string,
    days: number = 30
  ): Promise<AttendanceTrend[]> {
    try {
      console.log('getAttendanceTrends called with:', {
        organizationId,
        days
      })
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data: records, error } = await supabase
        .from('shift_attendance')
        .select(`
          *,
          users!inner (organization_id)
        `)
        .eq('users.organization_id', organizationId)
        .gte('timestamp', startDate.toISOString())

      if (error || !records) {
        console.error('Error fetching attendance trends:', {
          message: error?.message,
          details: error?.details,
          hint: error?.hint,
          code: error?.code,
          fullError: JSON.stringify(error, null, 2),
          hasRecords: !!records
        })
        return []
      }

      return this.calculateTrends(records, days)
    } catch (error) {
      console.error('Error in getAttendanceTrends:', error)
      return []
    }
  }

  /**
   * Get site activity summary
   */
  static async getSiteActivity(
    organizationId: string,
    days: number = 7
  ): Promise<SiteActivity[]> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data: records, error } = await supabase
        .from('shift_attendance')
        .select(`
          *,
          users!inner (organization_id)
        `)
        .eq('users.organization_id', organizationId)
        .gte('timestamp', startDate.toISOString())

      if (error || !records) {
        return []
      }

      return this.calculateSiteActivity(records)
    } catch (error) {
      console.error('Error in getSiteActivity:', error)
      return []
    }
  }

  /**
   * Calculate metrics from attendance records
   */
  private static calculateMetrics(records: any[]): AttendanceMetrics {
    const checkIns = records.filter(r => r.shift_type === 'check_in')
    const checkOuts = records.filter(r => r.shift_type === 'check_out')

    // Group by user and calculate shifts
    const userShifts = new Map<string, any[]>()
    
    records.forEach(record => {
      const userId = record.user_id
      if (!userShifts.has(userId)) {
        userShifts.set(userId, [])
      }
      userShifts.get(userId)!.push(record)
    })

    let totalShiftDuration = 0
    let completedShifts = 0
    let lateArrivals = 0
    let earlyDepartures = 0
    let missedCheckOuts = 0
    let overtimeMinutes = 0

    userShifts.forEach(userRecords => {
      const sortedRecords = userRecords.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )

      for (let i = 0; i < sortedRecords.length - 1; i += 2) {
        const checkIn = sortedRecords[i]
        const checkOut = sortedRecords[i + 1]

        if (checkIn?.shift_type === 'check_in') {
          if (checkOut?.shift_type === 'check_out') {
            // Complete shift
            const duration = (new Date(checkOut.timestamp).getTime() - 
                            new Date(checkIn.timestamp).getTime()) / (1000 * 60)
            totalShiftDuration += duration
            completedShifts++

            // Check for overtime (shifts > 8 hours)
            if (duration > 8 * 60) {
              overtimeMinutes += (duration - 8 * 60)
            }
          } else {
            // Missed check out
            missedCheckOuts++
          }
        }
      }
    })

    const averageShiftDuration = completedShifts > 0 ? totalShiftDuration / completedShifts : 0
    const punctualityRate = checkIns.length > 0 ? 
      ((checkIns.length - lateArrivals) / checkIns.length) * 100 : 100

    return {
      totalCheckIns: checkIns.length,
      totalCheckOuts: checkOuts.length,
      averageShiftDuration,
      punctualityRate,
      overtimeHours: overtimeMinutes / 60,
      lateArrivals,
      earlyDepartures,
      missedCheckOuts
    }
  }

  /**
   * Calculate individual guard performance
   */
  private static calculateGuardPerformance(records: any[], limit: number): GuardPerformance[] {
    const guardMap = new Map<string, any[]>()

    // Group records by guard
    records.forEach(record => {
      const guardId = record.user_id
      if (!guardMap.has(guardId)) {
        guardMap.set(guardId, [])
      }
      guardMap.get(guardId)!.push(record)
    })

    const performances: GuardPerformance[] = []

    guardMap.forEach((guardRecords, guardId) => {
      const guard = guardRecords[0]?.users
      if (!guard) return

      const checkIns = guardRecords.filter(r => r.shift_type === 'check_in')
      const checkOuts = guardRecords.filter(r => r.shift_type === 'check_out')

      let totalHours = 0
      let completedShifts = 0
      let lateCount = 0

      // Calculate shift pairs
      const sortedRecords = guardRecords.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )

      for (let i = 0; i < sortedRecords.length - 1; i += 2) {
        const checkIn = sortedRecords[i]
        const checkOut = sortedRecords[i + 1]

        if (checkIn?.shift_type === 'check_in' && checkOut?.shift_type === 'check_out') {
          const duration = (new Date(checkOut.timestamp).getTime() - 
                          new Date(checkIn.timestamp).getTime()) / (1000 * 60 * 60)
          totalHours += duration
          completedShifts++
        }
      }

      const averageShiftDuration = completedShifts > 0 ? (totalHours * 60) / completedShifts : 0
      const punctualityRate = checkIns.length > 0 ? 
        ((checkIns.length - lateCount) / checkIns.length) * 100 : 100

      let reliability: 'excellent' | 'good' | 'fair' | 'poor' = 'good'
      if (punctualityRate >= 95) reliability = 'excellent'
      else if (punctualityRate >= 85) reliability = 'good'
      else if (punctualityRate >= 70) reliability = 'fair'
      else reliability = 'poor'

      performances.push({
        guardId,
        guardName: `${guard.first_name} ${guard.last_name}`,
        shiftsWorked: completedShifts,
        totalHours,
        punctualityRate,
        averageShiftDuration,
        lateCount,
        overtimeHours: Math.max(0, totalHours - completedShifts * 8),
        reliability
      })
    })

    return performances
      .sort((a, b) => b.punctualityRate - a.punctualityRate)
      .slice(0, limit)
  }

  /**
   * Calculate daily trends
   */
  private static calculateTrends(records: any[], days: number): AttendanceTrend[] {
    const trends: AttendanceTrend[] = []
    const today = new Date()

    for (let i = 0; i < days; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      const dayRecords = records.filter(r => 
        r.timestamp.startsWith(dateStr)
      )

      const checkIns = dayRecords.filter(r => r.shift_type === 'check_in')
      const checkOuts = dayRecords.filter(r => r.shift_type === 'check_out')
      const uniqueGuards = new Set(dayRecords.map(r => r.user_id)).size

      // Calculate average shift length for the day
      let totalDuration = 0
      let completedShifts = 0

      const userMap = new Map<string, any[]>()
      dayRecords.forEach(record => {
        const userId = record.user_id
        if (!userMap.has(userId)) {
          userMap.set(userId, [])
        }
        userMap.get(userId)!.push(record)
      })

      userMap.forEach(userRecords => {
        const sorted = userRecords.sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        )

        for (let j = 0; j < sorted.length - 1; j += 2) {
          const checkIn = sorted[j]
          const checkOut = sorted[j + 1]

          if (checkIn?.shift_type === 'check_in' && checkOut?.shift_type === 'check_out') {
            const duration = (new Date(checkOut.timestamp).getTime() - 
                            new Date(checkIn.timestamp).getTime()) / (1000 * 60)
            totalDuration += duration
            completedShifts++
          }
        }
      })

      trends.unshift({
        date: dateStr,
        checkIns: checkIns.length,
        checkOuts: checkOuts.length,
        uniqueGuards,
        averageShiftLength: completedShifts > 0 ? totalDuration / completedShifts : 0
      })
    }

    return trends
  }

  /**
   * Calculate site activity metrics
   */
  private static calculateSiteActivity(records: any[]): SiteActivity[] {
    const siteMap = new Map<string, any[]>()

    records.forEach(record => {
      const siteId = record.qr_code_id || 'unknown'
      if (!siteMap.has(siteId)) {
        siteMap.set(siteId, [])
      }
      siteMap.get(siteId)!.push(record)
    })

    const activities: SiteActivity[] = []

    siteMap.forEach((siteRecords, siteId) => {
      const uniqueGuards = new Set(siteRecords.map(r => r.user_id)).size
      const lastActivity = new Date(Math.max(...siteRecords.map(r => 
        new Date(r.timestamp).getTime()
      )))

      // Calculate average response time (time between consecutive scans)
      const sortedRecords = siteRecords.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )

      let totalResponseTime = 0
      let responseCount = 0

      for (let i = 1; i < sortedRecords.length; i++) {
        const current = sortedRecords[i]
        const previous = sortedRecords[i - 1]
        
        if (current.user_id === previous.user_id) {
          const responseTime = (new Date(current.timestamp).getTime() - 
                              new Date(previous.timestamp).getTime()) / (1000 * 60)
          if (responseTime < 60) { // Only count if within 1 hour
            totalResponseTime += responseTime
            responseCount++
          }
        }
      }

      const averageResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0

      activities.push({
        siteId,
        siteName: `Site ${siteId}`,
        totalActivity: siteRecords.length,
        uniqueGuards,
        averageResponseTime,
        lastActivity
      })
    })

    return activities.sort((a, b) => b.totalActivity - a.totalActivity)
  }

  /**
   * Get real-time attendance status
   */
  static async getLiveAttendanceStatus(organizationId: string): Promise<{
    guardsOnDuty: number
    totalGuards: number
    activeShifts: Array<{
      guardId: string
      guardName: string
      checkInTime: Date
      siteId?: string
      duration: number // minutes
    }>
  }> {
    try {
      // Get all check-ins from today that don't have corresponding check-outs
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data: records, error } = await supabase
        .from('shift_attendance')
        .select(`
          *,
          users!inner (id, first_name, last_name, organization_id)
        `)
        .eq('users.organization_id', organizationId)
        .gte('timestamp', today.toISOString())
        .order('timestamp', { ascending: false })

      if (error || !records) {
        return { guardsOnDuty: 0, totalGuards: 0, activeShifts: [] }
      }

      const activeShifts = this.findActiveShifts(records)

      // Get total guard count
      const { count: totalGuards } = await supabase
        .from('users')
        .select('id', { count: 'exact' })
        .eq('organization_id', organizationId)
        .eq('is_active', true)

      return {
        guardsOnDuty: activeShifts.length,
        totalGuards: totalGuards || 0,
        activeShifts
      }
    } catch (error) {
      console.error('Error in getLiveAttendanceStatus:', error)
      return { guardsOnDuty: 0, totalGuards: 0, activeShifts: [] }
    }
  }

  /**
   * Find currently active shifts
   */
  private static findActiveShifts(records: any[]): Array<{
    guardId: string
    guardName: string
    checkInTime: Date
    siteId?: string
    duration: number
  }> {
    const userMap = new Map<string, any[]>()
    
    records.forEach(record => {
      const userId = record.user_id
      if (!userMap.has(userId)) {
        userMap.set(userId, [])
      }
      userMap.get(userId)!.push(record)
    })

    const activeShifts: any[] = []

    userMap.forEach(userRecords => {
      const sorted = userRecords.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )

      // Find the most recent check-in without a subsequent check-out
      for (let i = 0; i < sorted.length; i++) {
        const record = sorted[i]
        
        if (record.shift_type === 'check_in') {
          // Check if there's a check-out after this check-in
          const hasCheckOut = sorted.slice(0, i).some(r => r.shift_type === 'check_out')
          
          if (!hasCheckOut) {
            const duration = (Date.now() - new Date(record.timestamp).getTime()) / (1000 * 60)
            
            activeShifts.push({
              guardId: record.user_id,
              guardName: `${record.users.first_name} ${record.users.last_name}`,
              checkInTime: new Date(record.timestamp),
              siteId: record.qr_code_id,
              duration: Math.round(duration)
            })
          }
          break
        }
      }
    })

    return activeShifts
  }

  /**
   * Get empty metrics structure
   */
  private static getEmptyMetrics(): AttendanceMetrics {
    return {
      totalCheckIns: 0,
      totalCheckOuts: 0,
      averageShiftDuration: 0,
      punctualityRate: 100,
      overtimeHours: 0,
      lateArrivals: 0,
      earlyDepartures: 0,
      missedCheckOuts: 0
    }
  }

  /**
   * Export attendance data for reporting
   */
  static async exportAttendanceData(
    organizationId: string,
    startDate: Date,
    endDate: Date,
    format: 'csv' | 'json' = 'csv'
  ): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      const { data: records, error } = await supabase
        .from('shift_attendance')
        .select(`
          *,
          users!inner (first_name, last_name, email, organization_id)
        `)
        .eq('users.organization_id', organizationId)
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString())
        .order('timestamp', { ascending: true })

      if (error || !records) {
        return { success: false, error: 'Failed to fetch attendance data' }
      }

      if (format === 'csv') {
        const csv = this.convertToCSV(records)
        return { success: true, data: csv }
      } else {
        return { success: true, data: JSON.stringify(records, null, 2) }
      }
    } catch (error) {
      console.error('Error exporting attendance data:', error)
      return { success: false, error: 'Export failed' }
    }
  }

  /**
   * Convert records to CSV format
   */
  private static convertToCSV(records: any[]): string {
    const headers = [
      'Date',
      'Time',
      'Guard Name',
      'Email',
      'Action',
      'QR Code',
      'Location (Lat)',
      'Location (Lng)', 
      'Location Accuracy',
      'Duration (if checkout)'
    ]

    const rows = records.map(record => {
      const date = new Date(record.timestamp)
      const guardName = `${record.users.first_name} ${record.users.last_name}`
      
      return [
        date.toLocaleDateString(),
        date.toLocaleTimeString(),
        guardName,
        record.users.email,
        record.shift_type,
        record.qr_code_id || '',
        record.latitude || '',
        record.longitude || '',
        record.accuracy || '',
        record.device_info || ''
      ]
    })

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    return csvContent
  }
}