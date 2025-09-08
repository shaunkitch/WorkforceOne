'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth/hooks'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminLayout from '@/components/layout/AdminLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import QRCode from 'react-qr-code'
import { supabase } from '@/lib/supabase/client'
import { AttendanceAnalyticsClient } from '@/lib/services/attendance-analytics-client'
import { AttendanceMetrics, GuardPerformance, AttendanceTrend } from '@/lib/services/attendance-analytics'
import { OfflineAttendanceService } from '@/lib/services/offline-attendance'
import { 
  Shield, QrCode, Users, Clock, MapPin, 
  Calendar, Download, RefreshCw, CheckCircle, XCircle, 
  UserCheck, UserX, Clipboard, Trash2
} from 'lucide-react'

interface AttendanceRecord {
  id: string
  userId: string
  userName?: string
  userEmail?: string
  shiftType: 'check_in' | 'check_out'
  timestamp: string
  latitude: number
  longitude: number
  accuracy?: number
  qrCodeId?: string
  qrCodeType?: 'static' | 'random'
}

interface QRCodeData {
  id: string
  code: string
  type: 'static' | 'random'
  siteId?: string
  validFrom: string
  validUntil?: string
  isActive: boolean
  dataUrl: string
}

interface Statistics {
  totalCheckIns: number
  currentlyOnDuty: number
  averageShiftDuration: number
  todayAttendance: number
}

export default function AttendancePage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([])
  const [statistics, setStatistics] = useState<Statistics>({
    totalCheckIns: 0,
    currentlyOnDuty: 0,
    averageShiftDuration: 0,
    todayAttendance: 0
  })
  const [qrType, setQrType] = useState<'static' | 'random'>('static')
  const [activeTab, setActiveTab] = useState('overview')
  const [generatingQR, setGeneratingQR] = useState(false)
  const [deletingQR, setDeletingQR] = useState<string | null>(null)
  
  // Enhanced analytics state
  const [metrics, setMetrics] = useState<AttendanceMetrics | null>(null)
  const [guardPerformance, setGuardPerformance] = useState<GuardPerformance[]>([])
  const [trends, setTrends] = useState<AttendanceTrend[]>([])
  const [liveStatus, setLiveStatus] = useState<any>(null)
  const [offlineStats, setOfflineStats] = useState<any>(null)
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('week')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    } else if (user) {
      loadAttendanceData()
      loadQRCodes()
      loadEnhancedAnalytics()
      
      // Setup offline sync and real-time updates
      OfflineAttendanceService.setupAutoSync()
      
      // Refresh data every 30 seconds
      const interval = setInterval(() => {
        loadLiveStatus()
        loadOfflineStats()
      }, 30000)
      
      return () => clearInterval(interval)
    }
  }, [user, authLoading, router, dateRange])

  const loadAttendanceData = async () => {
    try {
      setLoading(true)
      
      // Get attendance records without joins to avoid foreign key issues
      const { data: records, error } = await supabase
        .from('shift_attendance')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100)
      
      if (error) {
        console.error('Error fetching attendance records:', error)
        return
      }
      
      // Get unique user IDs from records
      const userIds = [...new Set((records || []).map(r => r.user_id).filter(Boolean))]
      
      // Fetch user details separately
      let userMap: Record<string, any> = {}
      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, first_name, last_name, email')
          .in('id', userIds)
        
        if (users) {
          userMap = users.reduce((acc, user) => {
            acc[user.id] = user
            return acc
          }, {} as Record<string, any>)
        }
      }
      
      // Transform records to match component format
      const transformedRecords = (records || []).map(record => {
        const userData = userMap[record.user_id]
        return {
          id: record.id,
          userId: record.user_id,
          userName: userData ? `${userData.first_name} ${userData.last_name}` : 'Guest User',
          userEmail: userData?.email || '',
          shiftType: record.shift_type,
          timestamp: record.timestamp,
          latitude: record.latitude,
          longitude: record.longitude,
          accuracy: record.accuracy,
          qrCodeId: record.qr_code_id,
          qrCodeType: record.qr_code_type
        }
      })
      
      setAttendanceRecords(transformedRecords)
      calculateStatistics(transformedRecords)
    } catch (error) {
      console.error('Error loading attendance data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadQRCodes = async () => {
    try {
      // Get QR codes directly from Supabase
      const { data: qrData, error } = await supabase
        .from('qr_codes')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching QR codes:', error)
        return
      }
      
      // Transform QR codes to match component format
      const transformedCodes = (qrData || []).map(qr => ({
        id: qr.id,
        code: qr.code,
        type: qr.type,
        siteId: qr.site_id,
        validFrom: qr.valid_from,
        validUntil: qr.valid_until,
        isActive: qr.is_active,
        dataUrl: `${window.location.origin}/scan?code=${qr.code}`
      }))
      
      setQrCodes(transformedCodes)
    } catch (error) {
      console.error('Error loading QR codes:', error)
    }
  }

  const generateNewQRCode = async () => {
    try {
      setGeneratingQR(true)
      
      // Generate QR code directly with Supabase
      const timestamp = Date.now().toString(36)
      const random = Math.random().toString(36).substr(2, 8)
      const prefix = qrType === 'static' ? 'STC' : 'RND'
      const code = `${prefix}-GENERAL-${timestamp}-${random}`.toUpperCase()
      
      const validFrom = new Date()
      const validUntil = qrType === 'random' 
        ? new Date(Date.now() + 24 * 60 * 60 * 1000)
        : null
      
      const { data, error } = await supabase
        .from('qr_codes')
        .insert({
          code,
          type: qrType,
          valid_from: validFrom.toISOString(),
          valid_until: validUntil?.toISOString(),
          is_active: true,
          created_by: user?.id
        })
        .select()
        .single()
      
      if (error) {
        console.error('Error creating QR code:', error)
        return
      }
      
      // Reload QR codes
      await loadQRCodes()
    } catch (error) {
      console.error('Error generating QR code:', error)
    } finally {
      setGeneratingQR(false)
    }
  }

  const deleteQRCode = async (qrId: string) => {
    try {
      setDeletingQR(qrId)
      
      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from('qr_codes')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', qrId)
      
      if (error) {
        console.error('Error deleting QR code:', error)
        alert('Failed to delete QR code. Please try again.')
        return
      }
      
      // Reload QR codes to update the display
      await loadQRCodes()
    } catch (error) {
      console.error('Error deleting QR code:', error)
      alert('Failed to delete QR code. Please try again.')
    } finally {
      setDeletingQR(null)
    }
  }

  const confirmDeleteQR = (qrId: string, qrCode: string) => {
    if (confirm(`Are you sure you want to delete QR code "${qrCode}"? This action cannot be undone.`)) {
      deleteQRCode(qrId)
    }
  }

  const calculateStatistics = (records: AttendanceRecord[]) => {
    const today = new Date().toDateString()
    const todayRecords = records.filter(r => 
      new Date(r.timestamp).toDateString() === today
    )
    
    const checkIns = todayRecords.filter(r => r.shiftType === 'check_in')
    const checkOuts = todayRecords.filter(r => r.shiftType === 'check_out')
    
    // Calculate currently on duty (checked in but not checked out)
    const onDuty = new Set()
    records.forEach(record => {
      if (record.shiftType === 'check_in') {
        onDuty.add(record.userId)
      } else if (record.shiftType === 'check_out') {
        onDuty.delete(record.userId)
      }
    })
    
    setStatistics({
      totalCheckIns: checkIns.length,
      currentlyOnDuty: onDuty.size,
      averageShiftDuration: 8.5, // Calculate from actual data
      todayAttendance: new Set(todayRecords.map(r => r.userId)).size
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // Could add a toast notification here
  }


  // Enhanced analytics functions
  const loadEnhancedAnalytics = async () => {
    if (!user?.organization_id) return
    
    try {
      const { startDate, endDate } = getDateRange()
      
      // Load comprehensive metrics
      const metricsData = await AttendanceAnalyticsClient.getAttendanceMetrics(
        user.organization_id,
        startDate,
        endDate
      )
      setMetrics(metricsData)
      
      // Load guard performance
      const performanceData = await AttendanceAnalyticsClient.getGuardPerformance(
        user.organization_id,
        startDate,
        endDate
      )
      setGuardPerformance(performanceData)
      
      // Load trends
      const trendsData = await AttendanceAnalyticsClient.getAttendanceTrends(
        user.organization_id,
        dateRange === 'today' ? 1 : dateRange === 'week' ? 7 : 30
      )
      setTrends(trendsData)
      
    } catch (error) {
      console.error('Error loading enhanced analytics:', error)
    }
  }

  const loadLiveStatus = async () => {
    if (!user?.organization_id) return
    
    try {
      const status = await AttendanceAnalyticsClient.getLiveAttendanceStatus(user.organization_id)
      setLiveStatus(status)
    } catch (error) {
      console.error('Error loading live status:', error)
    }
  }

  const loadOfflineStats = () => {
    const stats = OfflineAttendanceService.getSyncStats()
    setOfflineStats(stats)
  }

  const getDateRange = () => {
    const endDate = new Date()
    const startDate = new Date()
    
    switch (dateRange) {
      case 'today':
        startDate.setHours(0, 0, 0, 0)
        break
      case 'week':
        startDate.setDate(startDate.getDate() - 7)
        break
      case 'month':
        startDate.setDate(startDate.getDate() - 30)
        break
    }
    
    return { startDate, endDate }
  }

  const handleSyncOfflineRecords = async () => {
    try {
      const result = await OfflineAttendanceService.syncPendingRecords()
      console.log('Sync result:', result)
      loadOfflineStats()
      loadEnhancedAnalytics()
    } catch (error) {
      console.error('Sync error:', error)
    }
  }

  const exportToCSV = () => {
    if (attendanceRecords.length === 0) {
      alert('No records to export')
      return
    }

    // Prepare CSV content
    const headers = ['Guard Name', 'Email', 'Action', 'Date', 'Time', 'Location', 'QR Type']
    const rows = attendanceRecords.map(record => [
      record.userName || 'Unknown',
      record.userEmail || '',
      record.shiftType === 'check_in' ? 'Check In' : 'Check Out',
      new Date(record.timestamp).toLocaleDateString(),
      new Date(record.timestamp).toLocaleTimeString(),
      `${record.latitude.toFixed(4)}, ${record.longitude.toFixed(4)}`,
      record.qrCodeType || 'N/A'
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance-report-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const exportToPDF = () => {
    alert('PDF export will be implemented soon. For now, please use CSV export.')
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!user) return null

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Guard Attendance Monitor</h1>
              <p className="text-blue-100">
                Track guard check-ins, shifts, and QR code attendance monitoring
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <UserCheck className="h-8 w-8" />
            </div>
          </div>
        </div>
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Check-ins</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalCheckIns}</div>
              <p className="text-xs text-muted-foreground">Guards checked in today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Currently On Duty</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{statistics.currentlyOnDuty}</div>
              <p className="text-xs text-muted-foreground">Guards on shift now</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Shift Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.averageShiftDuration}h</div>
              <p className="text-xs text-muted-foreground">Average today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Attendance</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.todayAttendance}</div>
              <p className="text-xs text-muted-foreground">Unique guards today</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="qr-codes">QR Codes</TabsTrigger>
            <TabsTrigger value="records">Attendance Records</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Real-Time Attendance Status</CardTitle>
                <CardDescription>
                  Live view of guard check-ins and check-outs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {attendanceRecords.slice(0, 10).map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-full ${
                          record.shiftType === 'check_in' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {record.shiftType === 'check_in' ? 
                            <CheckCircle className="h-5 w-5 text-green-600" /> :
                            <XCircle className="h-5 w-5 text-red-600" />
                          }
                        </div>
                        <div>
                          <p className="font-medium">{record.userName || 'Unknown Guard'}</p>
                          <p className="text-sm text-gray-500">
                            {record.shiftType === 'check_in' ? 'Checked In' : 'Checked Out'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {new Date(record.timestamp).toLocaleTimeString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(record.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="qr-codes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>QR Code Management</CardTitle>
                <CardDescription>
                  Generate and manage QR codes for guard check-ins
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* QR Code Generation Controls */}
                  <div className="flex items-center space-x-4">
                    <Select value={qrType} onValueChange={(value: 'static' | 'random') => setQrType(value)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select QR type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="static">Static QR Code</SelectItem>
                        <SelectItem value="random">Random QR Code (24h)</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={generateNewQRCode} disabled={generatingQR}>
                      {generatingQR ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <QrCode className="h-4 w-4 mr-2" />
                      )}
                      Generate New QR Code
                    </Button>
                  </div>

                  {/* Active QR Codes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {qrCodes.map((qr) => (
                      <Card key={qr.id}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <CardTitle className="text-sm">
                                {qr.type === 'static' ? 'Static' : 'Random'} QR Code
                              </CardTitle>
                              <CardDescription className="text-xs mt-1">
                                {qr.code}
                              </CardDescription>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant={qr.type === 'static' ? 'default' : 'secondary'}>
                                {qr.type}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => confirmDeleteQR(qr.id, qr.code)}
                                disabled={deletingQR === qr.id}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                {deletingQR === qr.id ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="bg-white p-4 rounded border">
                              <QRCode
                                value={qr.dataUrl}
                                size={150}
                                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                              />
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-500">Valid From:</span>
                                <span>{new Date(qr.validFrom).toLocaleString()}</span>
                              </div>
                              {qr.validUntil && (
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Valid Until:</span>
                                  <span>{new Date(qr.validUntil).toLocaleString()}</span>
                                </div>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => copyToClipboard(qr.dataUrl)}
                            >
                              <Clipboard className="h-4 w-4 mr-2" />
                              Copy URL
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="records" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Records</CardTitle>
                <CardDescription>
                  Complete history of all check-ins and check-outs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left py-3 px-4">Guard</th>
                        <th className="text-left py-3 px-4">Action</th>
                        <th className="text-left py-3 px-4">Time</th>
                        <th className="text-left py-3 px-4">Location</th>
                        <th className="text-left py-3 px-4">QR Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceRecords.map((record) => (
                        <tr key={record.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium">{record.userName || 'Unknown'}</p>
                              <p className="text-xs text-gray-500">{record.userEmail}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={record.shiftType === 'check_in' ? 'default' : 'secondary'}>
                              {record.shiftType === 'check_in' ? 'Check In' : 'Check Out'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <p>{new Date(record.timestamp).toLocaleTimeString()}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(record.timestamp).toLocaleDateString()}
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3 text-gray-400" />
                              <span className="text-xs">
                                {record.latitude.toFixed(4)}, {record.longitude.toFixed(4)}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {record.qrCodeType && (
                              <Badge variant="outline" className="text-xs">
                                {record.qrCodeType}
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Reports</CardTitle>
                <CardDescription>
                  Generate and download attendance reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-8 border-2 border-dashed rounded-lg text-center">
                    <Download className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">Export Attendance Data</h3>
                    <p className="text-gray-500 mb-4">
                      Download attendance records for reporting and analysis
                    </p>
                    <div className="flex justify-center space-x-4">
                      <Button variant="outline" onClick={exportToCSV}>
                        <Download className="h-4 w-4 mr-2" />
                        Export as CSV
                      </Button>
                      <Button variant="outline" onClick={exportToPDF}>
                        <Download className="h-4 w-4 mr-2" />
                        Export as PDF
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}