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

export default function AdminConsolePage() {
  const { user } = useAuth()
  const [realTimeStats, setRealTimeStats] = useState({
    activeGuards: 12,
    ongoingPatrols: 8,
    openIncidents: 3,
    criticalAlerts: 1,
    averageResponseTime: '4.2 min',
    systemStatus: 'operational'
  })

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeStats(prev => ({
        ...prev,
        activeGuards: prev.activeGuards + Math.floor(Math.random() * 3) - 1,
        ongoingPatrols: Math.max(0, prev.ongoingPatrols + Math.floor(Math.random() * 3) - 1),
        openIncidents: Math.max(0, prev.openIncidents + Math.floor(Math.random() * 2) - 1),
      }))
    }, 10000) // Update every 10 seconds

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

        {/* Critical Alerts */}
        {realTimeStats.criticalAlerts > 0 && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                {realTimeStats.criticalAlerts} critical alert{realTimeStats.criticalAlerts > 1 ? 's' : ''} require immediate attention
              </span>
              <Button variant="outline" size="sm">
                View Alerts
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
                <div className="text-3xl font-bold text-green-600 mt-2">{realTimeStats.activeGuards}</div>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-green-700">Currently on duty</p>
              <div className="w-full bg-green-200 rounded-full h-2 mt-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '78%' }}></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-sm font-medium text-blue-800">Active Patrols</CardTitle>
                <div className="text-3xl font-bold text-blue-600 mt-2">{realTimeStats.ongoingPatrols}</div>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-blue-700">Routes in progress</p>
              <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br hover:shadow-lg transition-all duration-200 ${realTimeStats.openIncidents > 5 ? 'from-red-50 to-pink-50 border-red-200' : realTimeStats.openIncidents > 0 ? 'from-yellow-50 to-orange-50 border-yellow-200' : 'from-green-50 to-emerald-50 border-green-200'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className={`text-sm font-medium ${realTimeStats.openIncidents > 5 ? 'text-red-800' : realTimeStats.openIncidents > 0 ? 'text-yellow-800' : 'text-green-800'}`}>Open Incidents</CardTitle>
                <div className={`text-3xl font-bold mt-2 ${realTimeStats.openIncidents > 5 ? 'text-red-600' : realTimeStats.openIncidents > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {realTimeStats.openIncidents}
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
                  <p className="text-2xl font-bold text-gray-900">{realTimeStats.averageResponseTime}</p>
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
                  <p className={`text-2xl font-bold ${realTimeStats.criticalAlerts > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    {realTimeStats.criticalAlerts}
                  </p>
                  <p className="text-xs text-gray-500">Critical priority</p>
                </div>
                <div className={`p-3 rounded-full ${realTimeStats.criticalAlerts > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
                  <Zap className={`h-6 w-6 ${realTimeStats.criticalAlerts > 0 ? 'text-red-600' : 'text-gray-400'}`} />
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
                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                      <div>
                        <p className="font-medium text-red-900">Unauthorized Access Attempt</p>
                        <p className="text-sm text-red-700">Main Entrance - 2 minutes ago</p>
                      </div>
                    </div>
                    <Badge variant="destructive">Critical</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                      <div>
                        <p className="font-medium text-yellow-900">Equipment Malfunction</p>
                        <p className="text-sm text-yellow-700">Camera System B - 15 minutes ago</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-yellow-200 text-yellow-700">Medium</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                      <div>
                        <p className="font-medium text-blue-900">Patrol Check Complete</p>
                        <p className="text-sm text-blue-700">Parking Lot A - 22 minutes ago</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-blue-200 text-blue-700">Info</Badge>
                  </div>
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
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Patrols Completed</span>
                      <div className="flex items-center">
                        <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                          <div className="bg-green-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                        </div>
                        <span className="text-sm font-medium">46/50</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Incidents Resolved</span>
                      <div className="flex items-center">
                        <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: '87%' }}></div>
                        </div>
                        <span className="text-sm font-medium">13/15</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Response Time Target</span>
                      <div className="flex items-center">
                        <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                          <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '78%' }}></div>
                        </div>
                        <span className="text-sm font-medium">4.2/5.0 min</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Checkpoint Coverage</span>
                      <div className="flex items-center">
                        <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                          <div className="bg-green-600 h-2 rounded-full" style={{ width: '95%' }}></div>
                        </div>
                        <span className="text-sm font-medium">95%</span>
                      </div>
                    </div>
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