'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth/hooks'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import QRCode from 'react-qr-code'
import { 
  ArrowLeft, Shield, LogOut, QrCode, Users, Clock, MapPin, 
  Calendar, Download, RefreshCw, CheckCircle, XCircle, 
  UserCheck, UserX, Clipboard
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

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    } else if (user) {
      loadAttendanceData()
      loadQRCodes()
    }
  }, [user, authLoading, router])

  const loadAttendanceData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/attendance/records')
      const data = await response.json()
      
      if (data.success) {
        setAttendanceRecords(data.records || [])
        calculateStatistics(data.records || [])
      }
    } catch (error) {
      console.error('Error loading attendance data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadQRCodes = async () => {
    try {
      const response = await fetch('/api/attendance/qr-code')
      const data = await response.json()
      
      if (data.success) {
        setQrCodes(data.qrCodes || [])
      }
    } catch (error) {
      console.error('Error loading QR codes:', error)
    }
  }

  const generateNewQRCode = async () => {
    try {
      setGeneratingQR(true)
      const response = await fetch('/api/attendance/qr-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: qrType,
          validHours: qrType === 'random' ? 24 : undefined
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        await loadQRCodes()
      }
    } catch (error) {
      console.error('Error generating QR code:', error)
    } finally {
      setGeneratingQR(false)
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

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth/login')
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="p-2 bg-blue-100 rounded-full mr-3">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Guard Attendance Monitor</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user.first_name} {user.last_name}
              </span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                            <div>
                              <CardTitle className="text-sm">
                                {qr.type === 'static' ? 'Static' : 'Random'} QR Code
                              </CardTitle>
                              <CardDescription className="text-xs mt-1">
                                {qr.code}
                              </CardDescription>
                            </div>
                            <Badge variant={qr.type === 'static' ? 'default' : 'secondary'}>
                              {qr.type}
                            </Badge>
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
                      <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export as CSV
                      </Button>
                      <Button variant="outline">
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
      </main>
    </div>
  )
}