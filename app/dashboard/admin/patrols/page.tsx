'use client'
// Version: 0.1.1 - Fixed imports for Vercel deployment

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  MapPin, 
  QrCode, 
  Wifi, 
  Plus, 
  Edit, 
  Trash2, 
  Printer,
  Route,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'
// import PatrolCheckpointDialog from '@/components/patrols/PatrolCheckpointDialog'
// import PatrolRouteDialog from '@/components/patrols/PatrolRouteDialog'
// import CheckpointQRGenerator from '@/components/patrols/CheckpointQRGenerator'
// import { useAuth } from '@/hooks/useAuth'

interface Checkpoint {
  id: string
  name: string
  description?: string
  location_id?: string
  location?: {
    name: string
    latitude: number
    longitude: number
  }
  qr_code?: string
  nfc_tag?: string
  verification_type: 'qr' | 'nfc' | 'both'
  is_active: boolean
  created_at: string
}

interface PatrolRoute {
  id: string
  name: string
  description?: string
  checkpoints: string[]
  checkpoint_details?: Checkpoint[]
  estimated_duration: number
  is_active: boolean
  created_at: string
}

interface ActivePatrol {
  id: string
  guard: {
    id: string
    first_name: string
    last_name: string
  }
  route: PatrolRoute
  status: 'scheduled' | 'in_progress' | 'completed' | 'missed'
  checkpoints_completed: number
  total_checkpoints: number
  start_time: string
  end_time?: string
}

export default function PatrolsPage() {
  // const { user } = useAuth()
  const user = null // Temporary fix for build
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([])
  const [routes, setRoutes] = useState<PatrolRoute[]>([])
  const [activePatrols, setActivePatrols] = useState<ActivePatrol[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('checkpoints')
  // const [showCheckpointDialog, setShowCheckpointDialog] = useState(false)
  // const [showRouteDialog, setShowRouteDialog] = useState(false)
  // const [selectedCheckpoint, setSelectedCheckpoint] = useState<Checkpoint | null>(null)
  // const [selectedRoute, setSelectedRoute] = useState<PatrolRoute | null>(null)
  // const [showQRGenerator, setShowQRGenerator] = useState(false)

  useEffect(() => {
    loadPatrolData()
  }, [])

  const loadPatrolData = async () => {
    try {
      setLoading(true)
      
      // Load checkpoints
      const checkpointsRes = await fetch('/api/patrols/checkpoints', {
        credentials: 'include'
      })
      if (checkpointsRes.ok) {
        const data = await checkpointsRes.json()
        setCheckpoints(data.checkpoints || [])
      }

      // Load routes
      const routesRes = await fetch('/api/patrols/routes', {
        credentials: 'include'
      })
      if (routesRes.ok) {
        const data = await routesRes.json()
        setRoutes(data.routes || [])
      }

      // Load active patrols
      const patrolsRes = await fetch('/api/patrols/active', {
        credentials: 'include'
      })
      if (patrolsRes.ok) {
        const data = await patrolsRes.json()
        setActivePatrols(data.patrols || [])
      }

    } catch (error) {
      console.error('Error loading patrol data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCheckpoint = () => {
    // setSelectedCheckpoint(null)
    // setShowCheckpointDialog(true)
    console.log('Create checkpoint - dialog not implemented')
  }

  const handleEditCheckpoint = (checkpoint: Checkpoint) => {
    // setSelectedCheckpoint(checkpoint)
    // setShowCheckpointDialog(true)
    console.log('Edit checkpoint - dialog not implemented', checkpoint)
  }

  const handleDeleteCheckpoint = async (id: string) => {
    if (!confirm('Are you sure you want to delete this checkpoint?')) return

    try {
      const res = await fetch(`/api/patrols/checkpoints/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (res.ok) {
        await loadPatrolData()
      }
    } catch (error) {
      console.error('Error deleting checkpoint:', error)
    }
  }

  const handleCreateRoute = () => {
    // setSelectedRoute(null)
    // setShowRouteDialog(true)
    console.log('Create route - dialog not implemented')
  }

  const handleEditRoute = (route: PatrolRoute) => {
    // setSelectedRoute(route)
    // setShowRouteDialog(true)
    console.log('Edit route - dialog not implemented', route)
  }

  const handleDeleteRoute = async (id: string) => {
    if (!confirm('Are you sure you want to delete this route?')) return

    try {
      const res = await fetch(`/api/patrols/routes/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (res.ok) {
        await loadPatrolData()
      }
    } catch (error) {
      console.error('Error deleting route:', error)
    }
  }

  const handlePrintCheckpoints = () => {
    // setShowQRGenerator(true)
    console.log('Print checkpoints - QR generator not implemented')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500'
      case 'in_progress':
        return 'bg-blue-500'
      case 'scheduled':
        return 'bg-gray-500'
      case 'missed':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'in_progress':
        return <Clock className="h-4 w-4" />
      case 'scheduled':
        return <Clock className="h-4 w-4" />
      case 'missed':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Patrol Management</h1>
          <p className="text-muted-foreground">
            Configure checkpoints, routes, and monitor active patrols
          </p>
        </div>
        <Button onClick={handlePrintCheckpoints} variant="outline">
          <Printer className="mr-2 h-4 w-4" />
          Print QR/NFC Labels
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="checkpoints">Checkpoints</TabsTrigger>
          <TabsTrigger value="routes">Routes</TabsTrigger>
          <TabsTrigger value="monitoring">Active Patrols</TabsTrigger>
        </TabsList>

        <TabsContent value="checkpoints" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Patrol Checkpoints</CardTitle>
                  <CardDescription>
                    Define locations that guards must visit during patrols
                  </CardDescription>
                </div>
                <Button onClick={handleCreateCheckpoint}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Checkpoint
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {checkpoints.map((checkpoint) => (
                  <Card key={checkpoint.id} className="relative">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{checkpoint.name}</h3>
                          {checkpoint.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {checkpoint.description}
                            </p>
                          )}
                        </div>
                        <Badge variant={checkpoint.is_active ? "default" : "secondary"}>
                          {checkpoint.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm">
                        {checkpoint.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{checkpoint.location.name}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          {checkpoint.verification_type === 'qr' && (
                            <div className="flex items-center gap-1">
                              <QrCode className="h-4 w-4 text-muted-foreground" />
                              <span>QR Code</span>
                            </div>
                          )}
                          {checkpoint.verification_type === 'nfc' && (
                            <div className="flex items-center gap-1">
                              <Wifi className="h-4 w-4 text-muted-foreground" />
                              <span>NFC Tag</span>
                            </div>
                          )}
                          {checkpoint.verification_type === 'both' && (
                            <>
                              <div className="flex items-center gap-1">
                                <QrCode className="h-4 w-4 text-muted-foreground" />
                                <span>QR</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Wifi className="h-4 w-4 text-muted-foreground" />
                                <span>NFC</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditCheckpoint(checkpoint)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteCheckpoint(checkpoint.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="routes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Patrol Routes</CardTitle>
                  <CardDescription>
                    Create patrol routes by combining checkpoints
                  </CardDescription>
                </div>
                <Button onClick={handleCreateRoute}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Route
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {routes.map((route) => (
                  <Card key={route.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Route className="h-5 w-5 text-primary" />
                            <h3 className="font-semibold text-lg">{route.name}</h3>
                            <Badge variant={route.is_active ? "default" : "secondary"}>
                              {route.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          {route.description && (
                            <p className="text-sm text-muted-foreground mb-3">
                              {route.description}
                            </p>
                          )}
                          <div className="flex gap-4 text-sm">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {route.checkpoints.length} checkpoints
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {route.estimated_duration} mins
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditRoute(route)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteRoute(route.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Patrols</CardTitle>
              <CardDescription>
                Monitor ongoing patrols in real-time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activePatrols.map((patrol) => (
                  <Card key={patrol.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge className={getStatusColor(patrol.status)}>
                              <span className="flex items-center gap-1">
                                {getStatusIcon(patrol.status)}
                                {patrol.status.replace('_', ' ').toUpperCase()}
                              </span>
                            </Badge>
                            <h3 className="font-semibold">
                              {patrol.guard.first_name} {patrol.guard.last_name}
                            </h3>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            Route: {patrol.route.name}
                          </p>
                          <div className="flex gap-4 text-sm">
                            <span>
                              Progress: {patrol.checkpoints_completed}/{patrol.total_checkpoints}
                            </span>
                            <span>
                              Started: {new Date(patrol.start_time).toLocaleTimeString()}
                            </span>
                            {patrol.end_time && (
                              <span>
                                Ended: {new Date(patrol.end_time).toLocaleTimeString()}
                              </span>
                            )}
                          </div>
                          <div className="mt-3">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{
                                  width: `${(patrol.checkpoints_completed / patrol.total_checkpoints) * 100}%`
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {activePatrols.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No active patrols at the moment
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* {showCheckpointDialog && (
        <PatrolCheckpointDialog
          checkpoint={selectedCheckpoint}
          checkpoints={checkpoints}
          onClose={() => setShowCheckpointDialog(false)}
          onSave={loadPatrolData}
        />
      )}

      {showRouteDialog && (
        <PatrolRouteDialog
          route={selectedRoute}
          checkpoints={checkpoints}
          onClose={() => setShowRouteDialog(false)}
          onSave={loadPatrolData}
        />
      )} */}

      {/* {showQRGenerator && (
        <CheckpointQRGenerator
          checkpoints={checkpoints}
          onClose={() => setShowQRGenerator(false)}
        />
      )} */}
    </div>
  )
}