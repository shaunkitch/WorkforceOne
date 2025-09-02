// Server-side Attendance Analytics Service
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { AttendanceMetrics, GuardPerformance, AttendanceTrend } from './attendance-analytics'

export class AttendanceAnalyticsServerService {
  /**
   * Get overall attendance metrics for date range (server-side)
   */
  static async getAttendanceMetrics(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AttendanceMetrics> {
    try {
      console.log('Server getAttendanceMetrics called with:', {
        organizationId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      })

      const supabase = getSupabaseAdmin()
      
      // First, test basic table access
      const { data: testData, error: testError } = await supabase
        .from('shift_attendance')
        .select('count')
        .limit(1)
      
      console.log('Server basic table test:', { testData, testError: testError ? {
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
        console.error('Server error fetching attendance records:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: JSON.stringify(error, null, 2)
        })
        return this.getEmptyMetrics()
      }

      console.log('Server records fetched:', records?.length || 0)
      return this.calculateMetrics(records || [])
    } catch (error) {
      console.error('Server error in getAttendanceMetrics:', error)
      return this.getEmptyMetrics()
    }
  }

  /**
   * Get guard performance rankings (server-side)
   */
  static async getGuardPerformance(
    organizationId: string,
    startDate: Date,
    endDate: Date,
    limit: number = 20
  ): Promise<GuardPerformance[]> {
    try {
      console.log('Server getGuardPerformance called with:', {
        organizationId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit
      })

      const supabase = getSupabaseAdmin()
      
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
        console.error('Server error fetching guard performance:', {
          message: error?.message,
          details: error?.details,
          hint: error?.hint,
          code: error?.code,
          fullError: JSON.stringify(error, null, 2),
          hasRecords: !!records
        })
        return []
      }

      console.log('Server guard performance records:', records?.length || 0)
      return this.calculateGuardPerformance(records, limit)
    } catch (error) {
      console.error('Server error in getGuardPerformance:', error)
      return []
    }
  }

  /**
   * Get attendance trends over time (server-side)
   */
  static async getAttendanceTrends(
    organizationId: string,
    days: number = 30
  ): Promise<AttendanceTrend[]> {
    try {
      console.log('Server getAttendanceTrends called with:', {
        organizationId,
        days
      })

      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const supabase = getSupabaseAdmin()
      
      const { data: records, error } = await supabase
        .from('shift_attendance')
        .select(`
          *,
          users!inner (organization_id)
        `)
        .eq('users.organization_id', organizationId)
        .gte('timestamp', startDate.toISOString())

      if (error || !records) {
        console.error('Server error fetching attendance trends:', {
          message: error?.message,
          details: error?.details,
          hint: error?.hint,
          code: error?.code,
          fullError: JSON.stringify(error, null, 2),
          hasRecords: !!records
        })
        return []
      }

      console.log('Server trends records:', records?.length || 0)
      return this.calculateTrends(records, days)
    } catch (error) {
      console.error('Server error in getAttendanceTrends:', error)
      return []
    }
  }

  /**
   * Get real-time attendance status (server-side)
   */
  static async getLiveAttendanceStatus(organizationId: string): Promise<{
    guardsOnDuty: number
    totalGuards: number
    activeShifts: Array<{
      guardId: string
      guardName: string
      checkInTime: Date
      siteId?: string
      duration: number
    }>
  }> {
    try {
      console.log('Server getLiveAttendanceStatus called with:', { organizationId })

      const supabase = getSupabaseAdmin()
      
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
        console.error('Server error fetching live status:', error)
        return { guardsOnDuty: 0, totalGuards: 0, activeShifts: [] }
      }

      const activeShifts = this.findActiveShifts(records)

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
      console.error('Server error in getLiveAttendanceStatus:', error)
      return { guardsOnDuty: 0, totalGuards: 0, activeShifts: [] }
    }
  }

  // Copy the calculation methods from the original service
  private static calculateMetrics(records: any[]): AttendanceMetrics {
    const checkIns = records.filter(r => r.shift_type === 'check_in')
    const checkOuts = records.filter(r => r.shift_type === 'check_out')

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
            const duration = (new Date(checkOut.timestamp).getTime() - 
                            new Date(checkIn.timestamp).getTime()) / (1000 * 60)
            totalShiftDuration += duration
            completedShifts++

            if (duration > 8 * 60) {
              overtimeMinutes += (duration - 8 * 60)
            }
          } else {
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

  private static calculateGuardPerformance(records: any[], limit: number): GuardPerformance[] {
    const guardMap = new Map<string, any[]>()

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

      for (let i = 0; i < sorted.length; i++) {
        const record = sorted[i]
        
        if (record.shift_type === 'check_in') {
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
}