'use client'

import { useAuth } from '@/lib/auth/hooks'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { QRCodeSVG } from 'qrcode.react'
import { 
  ArrowLeft, Shield, LogOut, Plus, QrCode, Download, Users, 
  MapPin, Calendar, Clock, BarChart3, FileText, Settings,
  Smartphone, Copy, Trash2, Eye, Building, Activity
} from 'lucide-react'
import Link from 'next/link'
import { AttendanceAnalyticsService } from '@/lib/services/attendance-analytics'

interface ClientPortalStats {
  totalGuards: number
  activeGuards: number
  totalSites: number
  monthlyCheckIns: number
  averageShiftDuration: number
  punctualityRate: number
}

interface QRCodeRequest {
  type: 'attendance' | 'registration' | 'checkpoint'
  siteName?: string
  siteAddress?: string
  location?: { lat: number; lng: number }
  duration?: number // hours for temporary codes
  description?: string
}

export default function ClientPortalPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<ClientPortalStats | null>(null)
  const [qrCodes, setQrCodes] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newQRRequest, setNewQRRequest] = useState<QRCodeRequest>({
    type: 'attendance',
    duration: 24
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    } else if (user) {
      loadPortalData()
    }
  }, [user, loading, router])

  const loadPortalData = async () => {
    setLoadingData(true)
    try {
      // Load client statistics
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)

      const metrics = await AttendanceAnalyticsService.getAttendanceMetrics(
        user!.organization_id,
        startDate,
        endDate
      )

      const liveStatus = await AttendanceAnalyticsService.getLiveAttendanceStatus(user!.organization_id)

      setStats({
        totalGuards: liveStatus.totalGuards,
        activeGuards: liveStatus.guardsOnDuty,
        totalSites: 0, // TODO: Implement site counting
        monthlyCheckIns: metrics.totalCheckIns,
        averageShiftDuration: metrics.averageShiftDuration,
        punctualityRate: metrics.punctualityRate
      })

      // Load existing QR codes
      const response = await fetch(`/api/client-portal/qr-codes?organization_id=${user!.organization_id}`)
      const qrResult = await response.json()
      setQrCodes(qrResult.qrCodes || [])

    } catch (error) {
      console.error('Error loading portal data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleCreateQRCode = async () => {
    try {
      const response = await fetch('/api/client-portal/qr-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: user!.organization_id,
          createdBy: user!.id,
          ...newQRRequest
        })
      })

      const result = await response.json()

      if (result.success) {
        setShowCreateDialog(false)
        setNewQRRequest({ type: 'attendance', duration: 24 })
        loadPortalData()
      } else {
        alert('Failed to create QR code: ' + result.error)
      }
    } catch (error) {
      console.error('Error creating QR code:', error)
      alert('Failed to create QR code')
    }
  }

  const downloadQRCode = (qrData: any) => {
    // Create download link for QR code
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    canvas.width = 400
    canvas.height = 400

    // This is a simplified version - in production you'd use a proper QR code library
    const dataUrl = `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">
        <rect width="400" height="400" fill="white"/>
        <text x="200" y="200" text-anchor="middle" fill="black">QR Code: ${qrData.code}</text>
      </svg>
    `)}`

    const link = document.createElement('a')
    link.download = `qr-code-${qrData.code}.svg`
    link.href = dataUrl
    link.click()
  }

  const copyQRUrl = (qrData: any) => {
    const url = `https://www.workforceone.co.za/scan?code=${qrData.code}`
    navigator.clipboard.writeText(url)
    alert('QR code URL copied to clipboard!')
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth/login')
  }

  if (loading || loadingData) {
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
              <div className="p-2 bg-blue-100 rounded-full mr-3">
                <Building className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Client Portal</h1>
                <p className="text-sm text-gray-600">Self-service management for your organization</p>
              </div>
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
        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Guards</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalGuards || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.activeGuards || 0} currently on duty
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Check-ins</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.monthlyCheckIns || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.punctualityRate?.toFixed(1) || 0}% punctuality rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Shift Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.averageShiftDuration ? Math.round(stats.averageShiftDuration / 60) : 0}h
              </div>
              <p className="text-xs text-muted-foreground">
                Per guard per shift
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="qr-codes" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="qr-codes">QR Codes</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="qr-codes" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">QR Code Management</h2>
                <p className="text-gray-600">Create and manage QR codes for attendance and checkpoints</p>
              </div>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create QR Code
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Create New QR Code</DialogTitle>
                    <DialogDescription>
                      Generate a QR code for attendance tracking or checkpoint scanning
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>QR Code Type</Label>
                      <Select
                        value={newQRRequest.type}
                        onValueChange={(value: any) => setNewQRRequest({ ...newQRRequest, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="attendance">Attendance Tracking</SelectItem>
                          <SelectItem value="checkpoint">Patrol Checkpoint</SelectItem>
                          <SelectItem value="registration">Guard Registration</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Site/Location Name</Label>
                      <Input
                        placeholder="e.g., Main Entrance, Building A"
                        value={newQRRequest.siteName || ''}
                        onChange={(e) => setNewQRRequest({ ...newQRRequest, siteName: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Address (Optional)</Label>
                      <Input
                        placeholder="Physical address for reference"
                        value={newQRRequest.siteAddress || ''}
                        onChange={(e) => setNewQRRequest({ ...newQRRequest, siteAddress: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        placeholder="Additional details or instructions"
                        value={newQRRequest.description || ''}
                        onChange={(e) => setNewQRRequest({ ...newQRRequest, description: e.target.value })}
                        rows={3}
                      />
                    </div>

                    {newQRRequest.type === 'attendance' && (
                      <div className="space-y-2">
                        <Label>Code Duration (Hours)</Label>
                        <Select
                          value={newQRRequest.duration?.toString()}
                          onValueChange={(value) => setNewQRRequest({ ...newQRRequest, duration: parseInt(value) })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="24">24 Hours</SelectItem>
                            <SelectItem value="72">3 Days</SelectItem>
                            <SelectItem value="168">1 Week</SelectItem>
                            <SelectItem value="720">1 Month</SelectItem>
                            <SelectItem value="0">Permanent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateQRCode}>
                        Create QR Code
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* QR Codes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {qrCodes.map((qr) => (
                <Card key={qr.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{qr.siteName || 'Unnamed Site'}</CardTitle>
                      <Badge variant={qr.type === 'attendance' ? 'default' : qr.type === 'checkpoint' ? 'secondary' : 'outline'}>
                        {qr.type}
                      </Badge>
                    </div>
                    {qr.siteAddress && (
                      <CardDescription>{qr.siteAddress}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-center">
                      <QRCodeSVG
                        value={`https://www.workforceone.co.za/scan?code=${qr.code}`}
                        size={120}
                        level="M"
                        includeMargin={true}
                      />
                    </div>
                    
                    <div className="text-center">
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {qr.code}
                      </code>
                    </div>

                    <div className="flex justify-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyQRUrl(qr)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadQRCode(qr)}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {/* TODO: View details */}}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>

                    {qr.validUntil && (
                      <p className="text-xs text-gray-500 text-center">
                        Expires: {new Date(qr.validUntil).toLocaleDateString()}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}

              {qrCodes.length === 0 && (
                <Card className="col-span-full">
                  <CardContent className="p-8 text-center">
                    <QrCode className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No QR Codes Yet</h3>
                    <p className="text-gray-600 mb-4">
                      Create your first QR code to start tracking attendance or setting up checkpoints
                    </p>
                    <Button onClick={() => setShowCreateDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create QR Code
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Reports & Exports</h2>
              <p className="text-gray-600">Download attendance reports and analytics</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Attendance Report
                  </CardTitle>
                  <CardDescription>Export attendance data for payroll or analysis</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Date Range</Label>
                    <Select defaultValue="month">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="week">Last 7 Days</SelectItem>
                        <SelectItem value="month">Last 30 Days</SelectItem>
                        <SelectItem value="quarter">Last 3 Months</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Format</Label>
                    <Select defaultValue="csv">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">CSV File</SelectItem>
                        <SelectItem value="excel">Excel File</SelectItem>
                        <SelectItem value="pdf">PDF Report</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Analytics Dashboard
                  </CardTitle>
                  <CardDescription>View detailed performance metrics and trends</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Punctuality Rate</span>
                      <Badge variant="outline">{stats?.punctualityRate?.toFixed(1) || 0}%</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Active Guards</span>
                      <Badge>{stats?.activeGuards || 0}/{stats?.totalGuards || 0}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Avg Shift Length</span>
                      <Badge variant="outline">
                        {stats?.averageShiftDuration ? Math.round(stats.averageShiftDuration / 60) : 0}h
                      </Badge>
                    </div>
                  </div>

                  <Link href="/dashboard/attendance">
                    <Button variant="outline" className="w-full">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Full Analytics
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Advanced Analytics</h2>
              <p className="text-gray-600">Detailed insights into your security operations</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Guard Performance</CardTitle>
                  <CardDescription>Top performing guards this month</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* This would be populated with real data */}
                    <div className="flex items-center justify-between py-2 border-b">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          <Users className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">Sample Guard</p>
                          <p className="text-xs text-gray-600">98% punctuality</p>
                        </div>
                      </div>
                      <Badge variant="outline">Excellent</Badge>
                    </div>
                    
                    <Link href="/dashboard/admin/guards">
                      <Button variant="outline" className="w-full">
                        View All Guards
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest check-ins and patrol updates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 text-center py-4">
                      Real-time activity feed will appear here
                    </p>
                    <Link href="/dashboard/live-tracking">
                      <Button variant="outline" className="w-full">
                        <Activity className="h-4 w-4 mr-2" />
                        View Live Tracking
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Portal Settings</h2>
              <p className="text-gray-600">Configure your client portal preferences</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Manage how you receive updates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-gray-600">Receive real-time alerts on your device</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Smartphone className="h-4 w-4 mr-2" />
                    Enable
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Reports</p>
                    <p className="text-sm text-gray-600">Daily/weekly attendance summaries</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}