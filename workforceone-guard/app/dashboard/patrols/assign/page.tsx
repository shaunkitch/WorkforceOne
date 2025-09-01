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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ArrowLeft, Shield, LogOut, Plus, Calendar as CalendarIcon, Clock, User, Play, Square, UserCheck } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface Guard {
  id: string
  first_name: string
  last_name: string
  email: string
}

export default function PatrolAssignPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [patrols, setPatrols] = useState<Patrol[]>([])
  const [routes, setRoutes] = useState<PatrolRoute[]>([])
  const [guards, setGuards] = useState<Guard[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [newPatrol, setNewPatrol] = useState({
    guard_id: '',
    route_id: '',
    start_time: '',
    notes: ''
  })
  const [selectedDate, setSelectedDate] = useState<Date>()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.organization_id) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    if (!user?.organization_id) return

    setLoadingData(true)
    try {
      const [patrolsData, routesData, guardsData] = await Promise.all([
        PatrolService.getPatrols(user.organization_id, undefined, undefined, 100),
        PatrolService.getPatrolRoutes(user.organization_id),
        loadGuards()
      ])

      console.log('Loaded data:', { patrolsData, routesData, guardsData })

      setPatrols(patrolsData)
      setRoutes(routesData)
      setGuards(guardsData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const loadGuards = async (): Promise<Guard[]> => {
    try {
      if (!user?.organization_id) return []

      const response = await fetch(`/api/guards?organization_id=${user.organization_id}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch guards')
      }

      const data = await response.json()
      return data.guards || []
    } catch (error) {
      console.error('Error loading guards:', error)
      return []
    }
  }

  const handleAssignPatrol = async () => {
    if (!newPatrol.guard_id || !newPatrol.route_id) {
      alert('Please select both a guard and a route')
      return
    }

    const selectedRoute = routes.find(r => r.id === newPatrol.route_id)
    
    try {
      const result = await PatrolService.createPatrol({
        organization_id: user!.organization_id,
        guard_id: newPatrol.guard_id,
        route_id: newPatrol.route_id,
        start_time: newPatrol.start_time || new Date().toISOString(),
        total_checkpoints: selectedRoute?.checkpoints.length || 0,
        notes: newPatrol.notes,
        created_by: user!.id
      })

      if (result.success) {
        setShowAssignDialog(false)
        setNewPatrol({
          guard_id: '',
          route_id: '',
          start_time: '',
          notes: ''
        })
        setSelectedDate(undefined)
        loadData()
      } else {
        alert('Failed to assign patrol: ' + result.error)
      }
    } catch (error) {
      console.error('Error assigning patrol:', error)
      alert('Failed to assign patrol')
    }
  }

  const handleStartPatrol = async (patrolId: string) => {
    if (confirm('Start this patrol now?')) {
      const result = await PatrolService.startPatrol(patrolId)
      if (result.success) {
        loadData()
      } else {
        alert('Failed to start patrol: ' + result.error)
      }
    }
  }

  const handleCompletePatrol = async (patrolId: string) => {
    const notes = prompt('Enter completion notes (optional):')
    const result = await PatrolService.completePatrol(patrolId, notes || undefined)
    if (result.success) {
      loadData()
    } else {
      alert('Failed to complete patrol: ' + result.error)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { color: 'bg-blue-100 text-blue-800', text: 'Scheduled', icon: Clock },
      in_progress: { color: 'bg-green-100 text-green-800', text: 'In Progress', icon: Play },
      completed: { color: 'bg-gray-100 text-gray-800', text: 'Completed', icon: Square },
      cancelled: { color: 'bg-red-100 text-red-800', text: 'Cancelled', icon: Square }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled
    const IconComponent = config.icon

    return (
      <Badge variant="secondary" className={config.color}>
        <IconComponent className="h-3 w-3 mr-1" />
        {config.text}
      </Badge>
    )
  }

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleString()
  }

  const getGuardName = (guardId: string) => {
    const guard = guards.find(g => g.id === guardId)
    return guard ? `${guard.first_name} ${guard.last_name}` : 'Unknown'
  }

  const getRouteName = (routeId?: string) => {
    if (!routeId) return 'No route'
    const route = routes.find(r => r.id === routeId)
    return route?.name || 'Unknown route'
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
              <Link href="/dashboard/patrols">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Patrols
                </Button>
              </Link>
              <div className="p-2 bg-green-100 rounded-full mr-3">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Patrol Assignment</h1>
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
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Patrol Scheduling</h2>
            <p className="text-gray-600">
              Assign patrols to guards and manage patrol schedules.
            </p>
          </div>
          <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Assign Patrol
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Assign New Patrol</DialogTitle>
                <DialogDescription>
                  Schedule a patrol assignment for a guard on a specific route.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="guard">Select Guard</Label>
                  <Select
                    value={newPatrol.guard_id}
                    onValueChange={(value) => setNewPatrol({ ...newPatrol, guard_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a guard" />
                    </SelectTrigger>
                    <SelectContent>
                      {guards.map((guard) => (
                        <SelectItem key={guard.id} value={guard.id}>
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2" />
                            {guard.first_name} {guard.last_name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="route">Select Route</Label>
                  <Select
                    value={newPatrol.route_id}
                    onValueChange={(value) => setNewPatrol({ ...newPatrol, route_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a route" />
                    </SelectTrigger>
                    <SelectContent>
                      {routes.map((route) => (
                        <SelectItem key={route.id} value={route.id}>
                          <div>
                            <div className="font-medium">{route.name}</div>
                            <div className="text-xs text-gray-500">
                              {route.checkpoints.length} checkpoints • {route.estimated_duration}m
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Scheduled Start Time</Label>
                  <div className="flex space-x-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "justify-start text-left font-normal flex-1",
                            !selectedDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <Input
                      type="time"
                      className="w-32"
                      onChange={(e) => {
                        if (selectedDate) {
                          const [hours, minutes] = e.target.value.split(':')
                          const dateTime = new Date(selectedDate)
                          dateTime.setHours(parseInt(hours), parseInt(minutes))
                          setNewPatrol({ ...newPatrol, start_time: dateTime.toISOString() })
                        }
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Leave empty to schedule for immediate start
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Special instructions or notes for this patrol..."
                    value={newPatrol.notes}
                    onChange={(e) => setNewPatrol({ ...newPatrol, notes: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAssignPatrol} 
                    disabled={!newPatrol.guard_id || !newPatrol.route_id}
                  >
                    Assign Patrol
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Patrols</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{patrols.length}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {patrols.filter(p => p.status === 'in_progress').length}
              </div>
              <p className="text-xs text-muted-foreground">In progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {patrols.filter(p => p.status === 'scheduled').length}
              </div>
              <p className="text-xs text-muted-foreground">Upcoming</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Square className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">
                {patrols.filter(p => p.status === 'completed').length}
              </div>
              <p className="text-xs text-muted-foreground">Finished</p>
            </CardContent>
          </Card>
        </div>

        {/* Patrols Table */}
        <Card>
          <CardHeader>
            <CardTitle>Patrol Assignments</CardTitle>
            <CardDescription>
              Manage patrol assignments and monitor their progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Guard</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patrols.map((patrol) => (
                  <TableRow key={patrol.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-400" />
                        <div>
                          <div className="font-medium">{getGuardName(patrol.guard_id)}</div>
                          <div className="text-sm text-gray-500">{patrol.guard?.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{getRouteName(patrol.route_id)}</div>
                        <div className="text-sm text-gray-500">
                          {patrol.total_checkpoints} checkpoint{patrol.total_checkpoints !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Start: {formatDateTime(patrol.start_time)}</div>
                        {patrol.end_time && (
                          <div>End: {formatDateTime(patrol.end_time)}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {patrol.checkpoints_completed} / {patrol.total_checkpoints}
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full"
                            style={{
                              width: `${(patrol.checkpoints_completed / patrol.total_checkpoints) * 100}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(patrol.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {patrol.status === 'scheduled' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStartPatrol(patrol.id)}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Start
                          </Button>
                        )}
                        {patrol.status === 'in_progress' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCompletePatrol(patrol.id)}
                          >
                            <Square className="h-3 w-3 mr-1" />
                            Complete
                          </Button>
                        )}
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {patrols.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No patrols assigned yet. Create your first patrol assignment.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}