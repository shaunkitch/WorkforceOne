'use client'

import { useAuth } from '@/lib/auth/hooks'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import AdminLayout from '@/components/layout/AdminLayout'
import LiveMap from '@/components/maps/LiveMap'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, Users, MapPin, AlertTriangle, TrendingUp, Activity, QrCode, Zap, Clock, UserCheck } from 'lucide-react'
import BackupRequestAlert from '@/components/admin/BackupRequestAlert'

interface AdminStats {
  activePatrols: number
  openIncidents: number
  guardsOnDuty: number
  checkpointsToday: number
  averageResponseTime: string
  systemStatus: string
  recentActivity: Array<{
    type: string
    message: string
    timestamp: string
    status: string
  }>
  detailedIncidents: Array<{
    id: string
    title: string
    description: string
    status: string
    severity: string
    created_at: string
    location: { name: string } | null
    reported_by: { first_name: string; last_name: string } | null
  }>
  analytics: {
    patrolsCompleted: number
    totalPatrols: number
    incidentsResolved: number
    totalIncidents: number
    checkpointCoverage: number
  }
}

export default function AdminConsolePage() {
  const { user } = useAuth()
  const [realTimeStats, setRealTimeStats] = useState<AdminStats>({
    activePatrols: 0,
    openIncidents: 0,
    guardsOnDuty: 0,
    checkpointsToday: 0,
    averageResponseTime: '0 min',
    systemStatus: 'loading',
    recentActivity: [],
    detailedIncidents: [],
    analytics: {
      patrolsCompleted: 0,
      totalPatrols: 0,
      incidentsResolved: 0,
      totalIncidents: 0,
      checkpointCoverage: 0
    }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats')
        const result = await response.json()
        
        if (result.success) {
          setRealTimeStats(result.data)
        } else {
        }
      } catch (error) {
      } finally {
        setLoading(false)
      }
    }

    fetchAdminStats()
    
    // Refresh data every 30 seconds for real-time updates
    const interval = setInterval(fetchAdminStats, 30000)
    return () => clearInterval(interval)
  }, [])


  return (
    <AdminLayout>
      {/* Backup Request Alert - Fixed position overlay */}
      <BackupRequestAlert />
      
      <div className="p-6 space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.first_name || 'Admin'}!</h1>
              <p className="text-blue-100 text-lg">
                Security Operations Center - Real-time monitoring and management
              </p>
            </div>
            <div className="hidden md:block">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center">
                <Shield className="h-10 w-10 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Critical Alerts - Only show if there are open incidents */}
        {realTimeStats.openIncidents > 5 && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                {realTimeStats.openIncidents} incident{realTimeStats.openIncidents > 1 ? 's' : ''} require immediate attention
              </span>
              <Button variant="outline" size="sm">
                View Incidents
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Real-time Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-sm font-medium text-green-800">Active Guards</CardTitle>
                <div className="text-3xl font-bold text-green-600 mt-2">{loading ? '...' : realTimeStats.guardsOnDuty}</div>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-green-700">Currently on duty</p>
              <div className="w-full bg-green-200 rounded-full h-2 mt-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: `${Math.min(100, (realTimeStats.guardsOnDuty / 30) * 100)}%` }}></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-sm font-medium text-blue-800">Active Patrols</CardTitle>
                <div className="text-3xl font-bold text-blue-600 mt-2">{loading ? '...' : realTimeStats.activePatrols}</div>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-blue-700">Routes in progress</p>
              <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min(100, (realTimeStats.activePatrols / 15) * 100)}%` }}></div>
              </div>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br hover:shadow-lg transition-all duration-200 ${realTimeStats.openIncidents > 5 ? 'from-red-50 to-pink-50 border-red-200' : realTimeStats.openIncidents > 0 ? 'from-yellow-50 to-orange-50 border-yellow-200' : 'from-green-50 to-emerald-50 border-green-200'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className={`text-sm font-medium ${realTimeStats.openIncidents > 5 ? 'text-red-800' : realTimeStats.openIncidents > 0 ? 'text-yellow-800' : 'text-green-800'}`}>Open Incidents</CardTitle>
                <div className={`text-3xl font-bold mt-2 ${realTimeStats.openIncidents > 5 ? 'text-red-600' : realTimeStats.openIncidents > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {loading ? '...' : realTimeStats.openIncidents}
                </div>
              </div>
              <div className={`p-3 rounded-full ${realTimeStats.openIncidents > 5 ? 'bg-red-100' : realTimeStats.openIncidents > 0 ? 'bg-yellow-100' : 'bg-green-100'}`}>
                <AlertTriangle className={`h-6 w-6 ${realTimeStats.openIncidents > 5 ? 'text-red-600' : realTimeStats.openIncidents > 0 ? 'text-yellow-600' : 'text-green-600'}`} />
              </div>
            </CardHeader>
            <CardContent>
              <p className={`text-sm ${realTimeStats.openIncidents > 5 ? 'text-red-700' : realTimeStats.openIncidents > 0 ? 'text-yellow-700' : 'text-green-700'}`}>
                {realTimeStats.openIncidents === 0 ? 'All clear' : 'Requiring attention'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Response Time</p>
                  <p className="text-2xl font-bold text-gray-900">{loading ? '...' : realTimeStats.averageResponseTime}</p>
                  <p className="text-xs text-gray-500">Average response</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">System Status</p>
                  <p className="text-2xl font-bold text-gray-900">99.9%</p>
                  <p className="text-xs text-gray-500">Uptime today</p>
                </div>
                <div className="p-3 bg-emerald-100 rounded-full">
                  <Activity className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Alerts</p>
                  <p className={`text-2xl font-bold ${realTimeStats.openIncidents > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    {loading ? '...' : realTimeStats.openIncidents}
                  </p>
                  <p className="text-xs text-gray-500">Open incidents</p>
                </div>
                <div className={`p-3 rounded-full ${realTimeStats.openIncidents > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
                  <Zap className={`h-6 w-6 ${realTimeStats.openIncidents > 0 ? 'text-red-600' : 'text-gray-400'}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="live-map" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1 rounded-xl">
            <TabsTrigger value="live-map" className="rounded-lg font-medium">Live Map</TabsTrigger>
            <TabsTrigger value="incidents" className="rounded-lg font-medium">Incidents</TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-lg font-medium">Analytics</TabsTrigger>
            <TabsTrigger value="quick-actions" className="rounded-lg font-medium">Quick Actions</TabsTrigger>
          </TabsList>

          {/* Live Map */}
          <TabsContent value="live-map">
            <LiveMap />
          </TabsContent>

          {/* Recent Incidents */}
          <TabsContent value="incidents">
            <Card>
              <CardHeader>
                <CardTitle>Recent Security Incidents</CardTitle>
                <CardDescription>
                  Latest security events and their current status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    <div className="text-sm text-gray-500">Loading incidents...</div>
                  ) : realTimeStats.detailedIncidents.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No incidents reported</p>
                      <p className="text-sm text-gray-400">All systems operating normally</p>
                    </div>
                  ) : (
                    realTimeStats.detailedIncidents.map((incident) => {
                      const getSeverityStyle = (severity: string, status: string) => {
                        if (status === 'resolved') return {
                          bg: 'bg-green-50',
                          border: 'border-green-200',
                          dot: 'bg-green-500',
                          text: 'text-green-900',
                          subtitle: 'text-green-700'
                        }
                        
                        switch (severity?.toLowerCase()) {
                          case 'critical':
                            return {
                              bg: 'bg-red-50',
                              border: 'border-red-200',
                              dot: 'bg-red-500',
                              text: 'text-red-900',
                              subtitle: 'text-red-700'
                            }
                          case 'high':
                            return {
                              bg: 'bg-orange-50',
                              border: 'border-orange-200',
                              dot: 'bg-orange-500',
                              text: 'text-orange-900',
                              subtitle: 'text-orange-700'
                            }
                          case 'medium':
                            return {
                              bg: 'bg-yellow-50',
                              border: 'border-yellow-200',
                              dot: 'bg-yellow-500',
                              text: 'text-yellow-900',
                              subtitle: 'text-yellow-700'
                            }
                          default:
                            return {
                              bg: 'bg-blue-50',
                              border: 'border-blue-200',
                              dot: 'bg-blue-500',
                              text: 'text-blue-900',
                              subtitle: 'text-blue-700'
                            }
                        }
                      }

                      const getBadgeVariant = (severity: string, status: string) => {
                        if (status === 'resolved') return 'default'
                        if (severity === 'critical') return 'destructive'
                        return 'outline'
                      }

                      const formatTime = (timestamp: string) => {
                        const now = new Date()
                        const incidentTime = new Date(timestamp)
                        const diffMs = now.getTime() - incidentTime.getTime()
                        const diffMinutes = Math.floor(diffMs / (1000 * 60))
                        
                        if (diffMinutes < 1) return 'Just now'
                        if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`
                        if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hour${Math.floor(diffMinutes / 60) > 1 ? 's' : ''} ago`
                        return `${Math.floor(diffMinutes / 1440)} day${Math.floor(diffMinutes / 1440) > 1 ? 's' : ''} ago`
                      }

                      const style = getSeverityStyle(incident.severity, incident.status)

                      return (
                        <div key={incident.id} className={`flex items-center justify-between p-4 ${style.bg} rounded-lg border ${style.border}`}>
                          <div className="flex items-center flex-1">
                            <div className={`w-3 h-3 ${style.dot} rounded-full mr-3 flex-shrink-0`}></div>
                            <div className="flex-1 min-w-0">
                              <p className={`font-medium ${style.text} truncate`}>{incident.title}</p>
                              <p className={`text-sm ${style.subtitle} truncate`}>
                                {incident.location?.name || 'Unknown location'} • {formatTime(incident.created_at)}
                              </p>
                              {incident.description && (
                                <p className={`text-xs ${style.subtitle} mt-1 line-clamp-2`}>
                                  {incident.description}
                                </p>
                              )}
                              {incident.reported_by && (
                                <p className={`text-xs ${style.subtitle} mt-1`}>
                                  Reported by {incident.reported_by.first_name} {incident.reported_by.last_name}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="ml-4 flex-shrink-0">
                            <Badge 
                              variant={getBadgeVariant(incident.severity, incident.status)}
                              className={incident.severity === 'critical' ? '' : `border-${incident.severity === 'high' ? 'orange' : incident.severity === 'medium' ? 'yellow' : 'blue'}-200 text-${incident.severity === 'high' ? 'orange' : incident.severity === 'medium' ? 'yellow' : 'blue'}-700`}
                            >
                              {incident.severity?.charAt(0).toUpperCase() + incident.severity?.slice(1) || 'Low'}
                            </Badge>
                            <div className="text-xs text-gray-500 mt-1 capitalize">
                              {incident.status}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Security Metrics (Last 24 Hours)</CardTitle>
                  <CardDescription>Key performance indicators</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {loading ? (
                      <div className="text-sm text-gray-500">Loading metrics...</div>
                    ) : (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Patrols Completed</span>
                          <div className="flex items-center">
                            <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full" 
                                style={{ width: `${realTimeStats.analytics.totalPatrols > 0 ? Math.round((realTimeStats.analytics.patrolsCompleted / realTimeStats.analytics.totalPatrols) * 100) : 0}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">
                              {realTimeStats.analytics.patrolsCompleted}/{realTimeStats.analytics.totalPatrols}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Incidents Resolved</span>
                          <div className="flex items-center">
                            <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${realTimeStats.analytics.totalIncidents > 0 ? Math.round((realTimeStats.analytics.incidentsResolved / realTimeStats.analytics.totalIncidents) * 100) : 0}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">
                              {realTimeStats.analytics.incidentsResolved}/{realTimeStats.analytics.totalIncidents}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Response Time Target</span>
                          <div className="flex items-center">
                            <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                              <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '76%' }}></div>
                            </div>
                            <span className="text-sm font-medium">{realTimeStats.averageResponseTime}/5.0 min</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Checkpoint Coverage</span>
                          <div className="flex items-center">
                            <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full" 
                                style={{ width: `${realTimeStats.analytics.checkpointCoverage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">{realTimeStats.analytics.checkpointCoverage}%</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                  <CardDescription>Infrastructure monitoring</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">GPS Tracking</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">Online</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Communication Systems</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">Online</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Database</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">Online</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Backup Systems</span>
                      <Badge variant="outline" className="border-yellow-200 text-yellow-700">Standby</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Mobile App Sync</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Quick Actions */}
          <TabsContent value="quick-actions">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:shadow-lg transition-all duration-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-blue-800">
                    <Users className="h-5 w-5 mr-2" />
                    Guard Management
                  </CardTitle>
                  <CardDescription>Manage security personnel</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Link href="/dashboard/admin/guards">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      <Users className="h-4 w-4 mr-2" />
                      Manage Guards
                    </Button>
                  </Link>
                  <Link href="/dashboard/admin/tokens">
                    <Button variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50">
                      <QrCode className="h-4 w-4 mr-2" />
                      Registration Tokens
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:shadow-lg transition-all duration-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-green-800">
                    <Shield className="h-5 w-5 mr-2" />
                    Security Operations
                  </CardTitle>
                  <CardDescription>Monitor and control security</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Link href="/dashboard/attendance">
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      <UserCheck className="h-4 w-4 mr-2" />
                      Attendance Logs
                    </Button>
                  </Link>
                  <Link href="/dashboard/patrols">
                    <Button variant="outline" className="w-full border-green-200 text-green-700 hover:bg-green-50">
                      <MapPin className="h-4 w-4 mr-2" />
                      Patrol Routes
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 hover:shadow-lg transition-all duration-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-purple-800">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Incident Response
                  </CardTitle>
                  <CardDescription>Emergency and incident handling</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Link href="/dashboard/incidents">
                    <Button className="w-full bg-purple-600 hover:bg-purple-700">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      View Incidents
                    </Button>
                  </Link>
                  <Link href="/dashboard/live-tracking">
                    <Button variant="outline" className="w-full border-purple-200 text-purple-700 hover:bg-purple-50">
                      <Activity className="h-4 w-4 mr-2" />
                      Live Tracking
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}