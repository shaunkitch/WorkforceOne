'use client'

import { useAuth } from '@/lib/auth/hooks'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PatrolService, Patrol, PatrolRoute } from '@/lib/patrols/service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Shield, LogOut, Plus, MapPin, Clock, User, CheckCircle, Circle, Play, Square } from 'lucide-react'

export default function PatrolsPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [patrols, setPatrols] = useState<Patrol[]>([])
  const [activePatrols, setActivePatrols] = useState<Patrol[]>([])
  const [routes, setRoutes] = useState<PatrolRoute[]>([])
  const [statistics, setStatistics] = useState({
    totalPatrols: 0,
    completedPatrols: 0,
    activePatrols: 0,
    averageCheckpoints: 0,
    completionRate: 0
  })
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.organization_id) {
      loadPatrolData()
    }
  }, [user])

  const loadPatrolData = async () => {
    if (!user?.organization_id) return

    setLoadingData(true)
    try {
      const [patrolsData, activePatrolsData, routesData, statsData] = await Promise.all([
        PatrolService.getPatrols(user.organization_id),
        PatrolService.getActivePatrols(user.organization_id),
        PatrolService.getPatrolRoutes(user.organization_id),
        PatrolService.getPatrolStatistics(user.organization_id)
      ])

      setPatrols(patrolsData)
      setActivePatrols(activePatrolsData)
      setRoutes(routesData)
      setStatistics(statsData)
    } catch (error) {
      console.error('Error loading patrol data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { color: 'bg-blue-100 text-blue-800', text: 'Scheduled' },
      in_progress: { color: 'bg-green-100 text-green-800', text: 'In Progress' },
      completed: { color: 'bg-gray-100 text-gray-800', text: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-800', text: 'Cancelled' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled

    return (
      <Badge variant="secondary" className={config.color}>
        {config.text}
      </Badge>
    )
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
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

  if (!user) {
    return null
  }

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
              <h1 className="text-2xl font-bold text-gray-900">Patrol Management</h1>
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
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Patrol Operations</h2>
            <p className="text-gray-600">
              Monitor and manage security patrol activities and routes.
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Patrol
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Patrols</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalPatrols}</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Now</CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.activePatrols}</div>
              <p className="text-xs text-muted-foreground">In progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.completedPatrols}</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <Circle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.completionRate}%</div>
              <p className="text-xs text-muted-foreground">Success rate</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Checkpoints</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.averageCheckpoints}</div>
              <p className="text-xs text-muted-foreground">Per patrol</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="active" className="space-y-6">
          <TabsList>
            <TabsTrigger value="active">Active Patrols ({activePatrols.length})</TabsTrigger>
            <TabsTrigger value="all">All Patrols ({patrols.length})</TabsTrigger>
            <TabsTrigger value="routes">Routes ({routes.length})</TabsTrigger>
          </TabsList>

          {/* Active Patrols */}
          <TabsContent value="active">
            <Card>
              <CardHeader>
                <CardTitle>Active Patrols</CardTitle>
                <CardDescription>
                  Currently active patrol operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activePatrols.length === 0 ? (
                  <div className="text-center py-8">
                    <Square className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Patrols</h3>
                    <p className="text-gray-600">No patrols are currently in progress.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Guard</TableHead>
                        <TableHead>Route</TableHead>
                        <TableHead>Started</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activePatrols.map((patrol) => (
                        <TableRow key={patrol.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-2 text-gray-400" />
                              {patrol.guard ? `${patrol.guard.first_name} ${patrol.guard.last_name}` : 'Unknown'}
                            </div>
                          </TableCell>
                          <TableCell>
                            {patrol.route?.name || 'No route assigned'}
                          </TableCell>
                          <TableCell>
                            {patrol.start_time ? formatDateTime(patrol.start_time) : 'Not started'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{
                                    width: `${patrol.total_checkpoints > 0 
                                      ? (patrol.checkpoints_completed / patrol.total_checkpoints) * 100 
                                      : 0}%`
                                  }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-600">
                                {patrol.checkpoints_completed}/{patrol.total_checkpoints}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(patrol.status)}
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Patrols */}
          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>All Patrols</CardTitle>
                <CardDescription>
                  Complete history of patrol operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {patrols.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Patrols Found</h3>
                    <p className="text-gray-600">No patrol records found for your organization.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Guard</TableHead>
                        <TableHead>Route</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Checkpoints</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {patrols.map((patrol) => (
                        <TableRow key={patrol.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-2 text-gray-400" />
                              {patrol.guard ? `${patrol.guard.first_name} ${patrol.guard.last_name}` : 'Unknown'}
                            </div>
                          </TableCell>
                          <TableCell>
                            {patrol.route?.name || 'No route assigned'}
                          </TableCell>
                          <TableCell>
                            {formatDateTime(patrol.created_at)}
                          </TableCell>
                          <TableCell>
                            {patrol.start_time && patrol.end_time ? (
                              `${Math.round((new Date(patrol.end_time).getTime() - new Date(patrol.start_time).getTime()) / 60000)} min`
                            ) : patrol.start_time ? (
                              `${Math.round((Date.now() - new Date(patrol.start_time).getTime()) / 60000)} min`
                            ) : (
                              'N/A'
                            )}
                          </TableCell>
                          <TableCell>
                            {patrol.checkpoints_completed}/{patrol.total_checkpoints}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(patrol.status)}
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Routes */}
          <TabsContent value="routes">
            <Card>
              <CardHeader>
                <CardTitle>Patrol Routes</CardTitle>
                <CardDescription>
                  Configured patrol routes and checkpoints
                </CardDescription>
              </CardHeader>
              <CardContent>
                {routes.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Routes Configured</h3>
                    <p className="text-gray-600">No patrol routes have been set up yet.</p>
                    <Button className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Route
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {routes.map((route) => (
                      <Card key={route.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <CardTitle className="text-lg">{route.name}</CardTitle>
                          <CardDescription>
                            {route.description || 'No description provided'}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center text-sm text-gray-600">
                              <MapPin className="h-4 w-4 mr-2" />
                              {route.checkpoints.length} checkpoints
                            </div>
                            {route.estimated_duration && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Clock className="h-4 w-4 mr-2" />
                                ~{route.estimated_duration} minutes
                              </div>
                            )}
                            <div className="pt-2">
                              <Button variant="outline" size="sm" className="w-full">
                                View Route
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}