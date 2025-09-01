'use client'

import { useAuth } from '@/lib/auth/hooks'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PatrolService, PatrolRoute } from '@/lib/patrols/service'
import { CheckpointService, Location as CheckpointLocation } from '@/lib/checkpoints/service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Shield, LogOut, Plus, Route, MapPin, Clock, Eye, Edit, Trash2, Navigation } from 'lucide-react'
import RouteMap from '@/components/patrol/RouteMap'
import { calculateRouteMetrics, formatDistance, formatDuration } from '@/lib/utils/route-calculations'

// Use CheckpointLocation from the service instead of local interface

export default function PatrolRoutesPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [routes, setRoutes] = useState<PatrolRoute[]>([])
  const [locations, setLocations] = useState<CheckpointLocation[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedRoute, setSelectedRoute] = useState<PatrolRoute | null>(null)
  const [newRoute, setNewRoute] = useState({
    name: '',
    description: '',
    checkpoints: [] as string[],
    estimated_duration: 60
  })
  const [editRoute, setEditRoute] = useState({
    id: '',
    name: '',
    description: '',
    checkpoints: [] as string[],
    estimated_duration: 60,
    is_active: true
  })

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
      const [routesData, locationsData] = await Promise.all([
        PatrolService.getPatrolRoutes(user.organization_id, false),
        CheckpointService.getCheckpoints(user.organization_id)
      ])

      setRoutes(routesData)
      setLocations(locationsData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  // Removed loadLocations function - now using CheckpointService.getCheckpoints directly

  const handleCreateRoute = async () => {
    if (!newRoute.name || newRoute.checkpoints.length === 0) {
      alert('Please provide route name and select at least one checkpoint')
      return
    }

    try {
      const result = await PatrolService.createPatrolRoute({
        organization_id: user!.organization_id,
        name: newRoute.name,
        description: newRoute.description,
        checkpoints: newRoute.checkpoints,
        estimated_duration: newRoute.estimated_duration,
        created_by: user!.id
      })

      if (result.success) {
        setShowCreateDialog(false)
        setNewRoute({
          name: '',
          description: '',
          checkpoints: [],
          estimated_duration: 60
        })
        loadData()
      } else {
        alert('Failed to create route: ' + result.error)
      }
    } catch (error) {
      console.error('Error creating route:', error)
      alert('Failed to create route')
    }
  }

  const handleCheckpointToggle = (locationId: string) => {
    setNewRoute(prev => ({
      ...prev,
      checkpoints: prev.checkpoints.includes(locationId)
        ? prev.checkpoints.filter(id => id !== locationId)
        : [...prev.checkpoints, locationId]
    }))
  }

  const handleViewRoute = (route: PatrolRoute) => {
    setSelectedRoute(route)
    setShowViewDialog(true)
  }

  const handleEditRoute = (route: PatrolRoute) => {
    setEditRoute({
      id: route.id,
      name: route.name,
      description: route.description || '',
      checkpoints: route.checkpoints,
      estimated_duration: route.estimated_duration || 60,
      is_active: route.is_active
    })
    setShowEditDialog(true)
  }

  const handleUpdateRoute = async () => {
    if (!editRoute.name || editRoute.checkpoints.length === 0) {
      alert('Please provide route name and select at least one checkpoint')
      return
    }

    try {
      const result = await PatrolService.updatePatrolRoute(
        editRoute.id,
        user!.organization_id,
        {
          name: editRoute.name,
          description: editRoute.description,
          checkpoints: editRoute.checkpoints,
          estimated_duration: editRoute.estimated_duration,
          is_active: editRoute.is_active,
          updated_by: user!.id
        }
      )

      if (result.success) {
        setShowEditDialog(false)
        setEditRoute({
          id: '',
          name: '',
          description: '',
          checkpoints: [],
          estimated_duration: 60,
          is_active: true
        })
        loadData()
      } else {
        alert('Failed to update route: ' + result.error)
      }
    } catch (error) {
      console.error('Error updating route:', error)
      alert('Failed to update route')
    }
  }

  const handleDeleteRoute = (route: PatrolRoute) => {
    setSelectedRoute(route)
    setShowDeleteDialog(true)
  }

  const confirmDeleteRoute = async () => {
    if (!selectedRoute) return

    try {
      const result = await PatrolService.deletePatrolRoute(
        selectedRoute.id,
        user!.organization_id,
        user!.id
      )

      if (result.success) {
        setShowDeleteDialog(false)
        setSelectedRoute(null)
        loadData()
      } else {
        alert('Failed to delete route: ' + result.error)
      }
    } catch (error) {
      console.error('Error deleting route:', error)
      alert('Failed to delete route')
    }
  }

  const handleEditCheckpointToggle = (locationId: string) => {
    setEditRoute(prev => ({
      ...prev,
      checkpoints: prev.checkpoints.includes(locationId)
        ? prev.checkpoints.filter(id => id !== locationId)
        : [...prev.checkpoints, locationId]
    }))
  }

  const getRouteBadge = (isActive: boolean) => {
    return (
      <Badge variant="secondary" className={isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
        {isActive ? 'Active' : 'Inactive'}
      </Badge>
    )
  }

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'Not set'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
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
              <div className="p-2 bg-blue-100 rounded-full mr-3">
                <Route className="h-6 w-6 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Patrol Routes</h1>
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
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Route Management</h2>
            <p className="text-gray-600">
              Create and manage patrol routes with customizable checkpoints and schedules.
            </p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <div className="flex space-x-3">
              <Link href="/dashboard/checkpoints/manage">
                <Button variant="outline">
                  <MapPin className="h-4 w-4 mr-2" />
                  Manage Checkpoints
                </Button>
              </Link>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Route
                </Button>
              </DialogTrigger>
            </div>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Patrol Route</DialogTitle>
                <DialogDescription>
                  Define a patrol route with checkpoints and estimated duration.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  <Label htmlFor="name">Route Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Main Building Perimeter"
                    value={newRoute.name}
                    onChange={(e) => setNewRoute({ ...newRoute, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the patrol route purpose and instructions..."
                    value={newRoute.description}
                    onChange={(e) => setNewRoute({ ...newRoute, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Estimated Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="5"
                    max="480"
                    value={newRoute.estimated_duration}
                    onChange={(e) => setNewRoute({ ...newRoute, estimated_duration: parseInt(e.target.value) || 60 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Checkpoints</Label>
                  <p className="text-sm text-gray-600 mb-3">
                    Select the checkpoints to include in this patrol route:
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                    {locations.map((location) => (
                      <div key={location.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`checkpoint-${location.id}`}
                          checked={newRoute.checkpoints.includes(location.id)}
                          onCheckedChange={() => handleCheckpointToggle(location.id)}
                        />
                        <Label htmlFor={`checkpoint-${location.id}`} className="flex-1">
                          <div className="font-medium">{location.name}</div>
                          {location.address && (
                            <div className="text-xs text-gray-500">{location.address}</div>
                          )}
                          <div className="flex items-center space-x-2 mt-1">
                            {location.metadata?.qr_code && (
                              <Badge variant="secondary" className="text-xs">QR</Badge>
                            )}
                            {location.metadata?.nfc_tag_id && (
                              <Badge variant="secondary" className="text-xs">NFC</Badge>
                            )}
                            <Badge variant="outline" className="text-xs">{location.location_type}</Badge>
                          </div>
                        </Label>
                        <MapPin className="h-4 w-4 text-gray-400" />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    Selected: {newRoute.checkpoints.length} checkpoint{newRoute.checkpoints.length !== 1 ? 's' : ''}
                  </p>
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateRoute} 
                    disabled={!newRoute.name || newRoute.checkpoints.length === 0}
                  >
                    Create Route
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Routes</CardTitle>
              <Route className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{routes.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Routes</CardTitle>
              <Navigation className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {routes.filter(r => r.is_active).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Checkpoints</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {routes.length > 0 
                  ? Math.round(routes.reduce((sum, r) => sum + r.checkpoints.length, 0) / routes.length)
                  : 0
                }
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {routes.length > 0 
                  ? Math.round(routes.reduce((sum, r) => sum + (r.estimated_duration || 0), 0) / routes.length) + 'm'
                  : '0m'
                }
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Distance</CardTitle>
              <Navigation className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {(() => {
                  const totalDistance = routes.reduce((sum, route) => {
                    if (route.locations && route.locations.length > 1) {
                      const metrics = calculateRouteMetrics(route.locations)
                      return sum + metrics.totalDistance
                    }
                    return sum
                  }, 0)
                  return formatDistance(totalDistance)
                })()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Routes Table */}
        <Card>
          <CardHeader>
            <CardTitle>Patrol Routes</CardTitle>
            <CardDescription>
              Manage your organization's patrol routes and checkpoints
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Route Name</TableHead>
                  <TableHead>Route Map & Metrics</TableHead>
                  <TableHead>Checkpoints</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routes.map((route) => (
                  <TableRow key={route.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{route.name}</div>
                        {route.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {route.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="w-80">
                      <div className="space-y-2">
                        <RouteMap
                          checkpoints={route.locations || []}
                          routeName={route.name}
                          height={150}
                          className="border-0 shadow-none"
                        />
                        {(!route.locations || route.locations.filter(loc => loc.latitude && loc.longitude).length === 0) && (
                          <div className="text-center">
                            <Link href="/dashboard/checkpoints/manage">
                              <Button variant="outline" size="sm" className="text-xs">
                                <MapPin className="h-3 w-3 mr-1" />
                                Add GPS Coordinates
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                        {route.checkpoints.length} checkpoint{route.checkpoints.length !== 1 ? 's' : ''}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getRouteBadge(route.is_active)}
                    </TableCell>
                    <TableCell>
                      {new Date(route.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewRoute(route)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditRoute(route)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteRoute(route)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {routes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No patrol routes created yet. Create your first route to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      {/* Route Details Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedRoute?.name}</DialogTitle>
            <DialogDescription>
              Route details and checkpoint information
            </DialogDescription>
          </DialogHeader>
          {selectedRoute && (
            <div className="space-y-4">
              {/* Route Map */}
              <div>
                <RouteMap
                  checkpoints={selectedRoute.locations || []}
                  routeName={selectedRoute.name}
                  height={250}
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedRoute.description || 'No description provided'}
                </p>
              </div>
              
              {/* Route Metrics */}
              {selectedRoute.locations && selectedRoute.locations.length > 0 && (
                <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  {(() => {
                    const metrics = calculateRouteMetrics(selectedRoute.locations || [])
                    return (
                      <>
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">
                            {formatDistance(metrics.totalDistance)}
                          </div>
                          <div className="text-sm text-gray-600">Total Distance</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">
                            {formatDuration(metrics.estimatedWalkingTime)}
                          </div>
                          <div className="text-sm text-gray-600">Walking Time</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-orange-600">
                            {formatDuration(metrics.estimatedDrivingTime)}
                          </div>
                          <div className="text-sm text-gray-600">Driving Time</div>
                        </div>
                      </>
                    )
                  })()}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Checkpoints</Label>
                  <p className="text-lg font-semibold">{selectedRoute.checkpoints.length}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Estimated Duration</Label>
                  <p className="text-lg font-semibold">{formatDuration(selectedRoute.estimated_duration)}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Checkpoints</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedRoute.locations?.map((location, index) => (
                    <div key={location.id} className="flex items-center space-x-3 p-2 border rounded">
                      <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{location.name}</div>
                        {location.address && (
                          <div className="text-xs text-gray-500">{location.address}</div>
                        )}
                      </div>
                      <MapPin className="h-4 w-4 text-gray-400" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowViewDialog(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setShowViewDialog(false)
                  handleEditRoute(selectedRoute!)
                }}>
                  Edit Route
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Route Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Patrol Route</DialogTitle>
            <DialogDescription>
              Update route details, checkpoints, and settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Route Name</Label>
              <Input
                id="edit-name"
                placeholder="e.g., Main Building Perimeter"
                value={editRoute.name}
                onChange={(e) => setEditRoute({ ...editRoute, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Textarea
                id="edit-description"
                placeholder="Describe the patrol route purpose and instructions..."
                value={editRoute.description}
                onChange={(e) => setEditRoute({ ...editRoute, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-duration">Estimated Duration (minutes)</Label>
              <Input
                id="edit-duration"
                type="number"
                min="5"
                max="480"
                value={editRoute.estimated_duration}
                onChange={(e) => setEditRoute({ ...editRoute, estimated_duration: parseInt(e.target.value) || 60 })}
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={editRoute.is_active.toString()} 
                onValueChange={(value) => setEditRoute({ ...editRoute, is_active: value === 'true' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Checkpoints</Label>
              <p className="text-sm text-gray-600 mb-3">
                Select the checkpoints to include in this patrol route:
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                {locations.map((location) => (
                  <div key={location.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-checkpoint-${location.id}`}
                      checked={editRoute.checkpoints.includes(location.id)}
                      onCheckedChange={() => handleEditCheckpointToggle(location.id)}
                    />
                    <Label htmlFor={`edit-checkpoint-${location.id}`} className="flex-1">
                      <div className="font-medium">{location.name}</div>
                      {location.address && (
                        <div className="text-xs text-gray-500">{location.address}</div>
                      )}
                      <div className="flex items-center space-x-2 mt-1">
                        {location.metadata?.qr_code && (
                          <Badge variant="secondary" className="text-xs">QR</Badge>
                        )}
                        {location.metadata?.nfc_tag_id && (
                          <Badge variant="secondary" className="text-xs">NFC</Badge>
                        )}
                        <Badge variant="outline" className="text-xs">{location.location_type}</Badge>
                      </div>
                    </Label>
                    <MapPin className="h-4 w-4 text-gray-400" />
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                Selected: {editRoute.checkpoints.length} checkpoint{editRoute.checkpoints.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateRoute} 
                disabled={!editRoute.name || editRoute.checkpoints.length === 0}
              >
                Update Route
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Patrol Route</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this patrol route? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedRoute && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="font-medium text-sm">{selectedRoute.name}</div>
                {selectedRoute.description && (
                  <div className="text-sm text-gray-600 mt-1">{selectedRoute.description}</div>
                )}
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  <span>{selectedRoute.checkpoints.length} checkpoints</span>
                  <span>{formatDuration(selectedRoute.estimated_duration)}</span>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={confirmDeleteRoute}>
                  Delete Route
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}