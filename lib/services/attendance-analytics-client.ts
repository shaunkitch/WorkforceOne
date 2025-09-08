// Client-side Attendance Analytics Service that uses API endpoints
import { AttendanceMetrics, GuardPerformance, AttendanceTrend } from './attendance-analytics'

export class AttendanceAnalyticsClient {
  /**
   * Get overall attendance metrics for date range (via API)
   */
  static async getAttendanceMetrics(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AttendanceMetrics> {
    try {
      const params = new URLSearchParams({
        type: 'metrics',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      })

      const response = await fetch(`/api/attendance/analytics?${params}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      const result = await response.json()

      if (!result.success) {
        console.error('API error fetching attendance metrics:', result.error)
        return this.getEmptyMetrics()
      }

      return result.data
    } catch (error) {
      console.error('Client error in getAttendanceMetrics:', error)
      return this.getEmptyMetrics()
    }
  }

  /**
   * Get guard performance rankings (via API)
   */
  static async getGuardPerformance(
    organizationId: string,
    startDate: Date,
    endDate: Date,
    limit: number = 20
  ): Promise<GuardPerformance[]> {
    try {
      const params = new URLSearchParams({
        type: 'performance',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: limit.toString()
      })

      const response = await fetch(`/api/attendance/analytics?${params}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      const result = await response.json()

      if (!result.success) {
        console.error('API error fetching guard performance:', result.error)
        return []
      }

      return result.data || []
    } catch (error) {
      console.error('Client error in getGuardPerformance:', error)
      return []
    }
  }

  /**
   * Get attendance trends over time (via API)
   */
  static async getAttendanceTrends(
    organizationId: string,
    days: number = 30
  ): Promise<AttendanceTrend[]> {
    try {
      const params = new URLSearchParams({
        type: 'trends',
        days: days.toString()
      })

      const response = await fetch(`/api/attendance/analytics?${params}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      const result = await response.json()

      if (!result.success) {
        console.error('API error fetching attendance trends:', result.error)
        return []
      }

      return result.data || []
    } catch (error) {
      console.error('Client error in getAttendanceTrends:', error)
      return []
    }
  }

  /**
   * Get real-time attendance status (via API)
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
      const params = new URLSearchParams({
        type: 'live'
      })

      const response = await fetch(`/api/attendance/analytics?${params}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      const result = await response.json()

      if (!result.success) {
        console.error('API error fetching live status:', result.error)
        return { guardsOnDuty: 0, totalGuards: 0, activeShifts: [] }
      }

      return result.data || { guardsOnDuty: 0, totalGuards: 0, activeShifts: [] }
    } catch (error) {
      console.error('Client error in getLiveAttendanceStatus:', error)
      return { guardsOnDuty: 0, totalGuards: 0, activeShifts: [] }
    }
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
}