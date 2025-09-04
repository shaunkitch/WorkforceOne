'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/hooks'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/layout/AdminLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase/client'
import { Settings, Plus, Trash2, Edit3, Shield, Clock, Camera, Route } from 'lucide-react'

interface PatrolRoute {
  id: string
  name: string
  description: string
  checkpoints: string[]
  is_active: boolean
}

interface PatrolRequirement {
  id: string
  route_id: string
  route_name?: string
  shift_duration_hours: number
  required_patrols_per_shift: number
  min_time_between_patrols_minutes: number
  max_time_between_patrols_minutes: number
  required_photos_per_checkpoint: number
  created_at: string
  updated_at: string
}

export default function PatrolRequirementsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [routes, setRoutes] = useState<PatrolRoute[]>([])
  const [requirements, setRequirements] = useState<PatrolRequirement[]>([])
  const [selectedRoute, setSelectedRoute] = useState('')
  const [formData, setFormData] = useState({
    shift_duration_hours: 8,
    required_patrols_per_shift: 4,
    min_time_between_patrols_minutes: 90,
    max_time_between_patrols_minutes: 150,
    required_photos_per_checkpoint: 2
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null)

  useEffect(() => {
    console.log('🎯 PatrolRequirements useEffect - authLoading:', authLoading, 'user:', user?.email || 'none')
    
    if (!authLoading && !user) {
      console.log('🔐 No user found, redirecting to login')
      router.push('/auth/login')
    } else if (user) {
      console.log('✅ User authenticated, loading data for organization:', user.organization_id)
      loadData()
    }
  }, [user, authLoading, router])

  const loadData = async () => {
    try {
      console.log('🔄 Starting loadData for user:', user?.email, 'organization:', user?.organization_id)
      setLoading(true)
      await Promise.all([loadRoutes(), loadRequirements()])
      console.log('✅ loadData completed successfully')
    } catch (error) {
      console.error('❌ Error in loadData:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadRoutes = async () => {
    try {
      console.log('🔍 Loading patrol routes via API for organization:', user?.organization_id)
      
      if (!user?.organization_id) {
        console.warn('⚠️ No organization_id found for user:', user)
        setRoutes([])
        return
      }

      const response = await fetch(`/api/patrol-routes?organizationId=${user.organization_id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ API request failed:', response.status, errorData)
        setRoutes([])
        return
      }

      const { routes } = await response.json()
      console.log('✅ Loaded patrol routes via API:', routes)
      setRoutes(routes || [])
      
      if (!routes || routes.length === 0) {
        console.warn('⚠️ No active patrol routes found for organization:', user.organization_id)
      }
    } catch (error) {
      console.error('❌ Fatal error in loadRoutes:', error)
      setRoutes([])
    }
  }

  const loadRequirements = async () => {
    try {
      console.log('🔍 Loading patrol requirements for organization:', user?.organization_id)
      
      if (!user?.organization_id) {
        console.warn('⚠️ No organization_id found for user:', user)
        setRequirements([])
        return
      }

      const { data, error } = await supabase
        .from('patrol_requirements')
        .select('*')
        .eq('organization_id', user.organization_id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error loading requirements:', error)
        setRequirements([])
        return
      }

      console.log('✅ Loaded patrol requirements:', data)

      // Map route IDs to route names using the already loaded routes data
      const formattedData = (data || []).map(req => {
        const route = routes.find(r => r.id === req.route_id)
        return {
          ...req,
          route_name: route?.name || 'Unknown Route'
        }
      })

      console.log('✅ Formatted requirements data with route names:', formattedData)
      setRequirements(formattedData)
    } catch (error) {
      console.error('❌ Fatal error in loadRequirements:', error)
      setRequirements([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedRoute) {
      alert('Please select a route')
      return
    }

    try {
      const submitData = {
        ...formData,
        route_id: selectedRoute,
        organization_id: user?.organization_id
      }

      let result
      if (editingId) {
        result = await supabase
          .from('patrol_requirements')
          .update(submitData)
          .eq('id', editingId)
          .select()
      } else {
        result = await supabase
          .from('patrol_requirements')
          .insert(submitData)
          .select()
      }

      if (result.error) {
        console.error('Error saving requirement:', result.error)
        alert('Error saving patrol requirement: ' + result.error.message)
        return
      }

      // Reset form
      setSelectedRoute('')
      setFormData({
        shift_duration_hours: 8,
        required_patrols_per_shift: 4,
        min_time_between_patrols_minutes: 90,
        max_time_between_patrols_minutes: 150,
        required_photos_per_checkpoint: 2
      })
      setEditingId(null)

      // Reload data
      await loadRequirements()

    } catch (error) {
      console.error('Error saving requirement:', error)
      alert('Error saving patrol requirement')
    }
  }

  const handleEdit = (requirement: PatrolRequirement) => {
    setSelectedRoute(requirement.route_id)
    setFormData({
      shift_duration_hours: requirement.shift_duration_hours,
      required_patrols_per_shift: requirement.required_patrols_per_shift,
      min_time_between_patrols_minutes: requirement.min_time_between_patrols_minutes,
      max_time_between_patrols_minutes: requirement.max_time_between_patrols_minutes,
      required_photos_per_checkpoint: requirement.required_photos_per_checkpoint
    })
    setEditingId(requirement.id)
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('patrol_requirements')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting requirement:', error)
        alert('Error deleting patrol requirement')
        return
      }

      await loadRequirements()
      setShowDeleteDialog(null)
    } catch (error) {
      console.error('Error deleting requirement:', error)
      alert('Error deleting patrol requirement')
    }
  }

  const formatDuration = (hours: number) => {
    return hours === 1 ? '1 hour' : `${hours} hours`
  }

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    
    if (hours === 0) return `${mins}m`
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}m`
  }

  if (loading || authLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Patrol Requirements</h1>
              <p className="text-blue-100">
                Configure patrol frequency and quality standards for each route and shift duration
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <Settings className="h-8 w-8" />
            </div>
          </div>
        </div>

        {/* Debug Information */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-4">
              <div className="text-sm text-yellow-800">
                <div className="font-semibold mb-2">🐛 Debug Information:</div>
                <div>User Email: {user?.email || 'N/A'}</div>
                <div>Organization ID: {user?.organization_id || 'N/A'}</div>
                <div>Auth Loading: {authLoading ? 'Yes' : 'No'}</div>
                <div>Routes Loaded: {routes.length}</div>
                <div>Requirements Loaded: {requirements.length}</div>
                <div>Loading: {loading ? 'Yes' : 'No'}</div>
                {routes.length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer">Available Routes</summary>
                    <pre className="mt-1 text-xs bg-yellow-100 p-2 rounded overflow-auto max-h-32">
                      {JSON.stringify(routes, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Configuration Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              {editingId ? 'Edit Patrol Requirement' : 'Add New Patrol Requirement'}
            </CardTitle>
            <CardDescription>
              Set the minimum patrol frequency and quality standards to prevent gaming and ensure consistent security coverage.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Route Selection */}
                <div className="space-y-2">
                  <Label htmlFor="route">Patrol Route *</Label>
                  <Select value={selectedRoute} onValueChange={setSelectedRoute}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a patrol route" />
                    </SelectTrigger>
                    <SelectContent>
                      {routes.map(route => (
                        <SelectItem key={route.id} value={route.id}>
                          <div className="flex items-center gap-2">
                            <Route className="h-4 w-4" />
                            <span>{route.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {route.checkpoints.length} checkpoints
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Shift Duration */}
                <div className="space-y-2">
                  <Label htmlFor="shift_duration">Shift Duration (hours) *</Label>
                  <Select 
                    value={formData.shift_duration_hours.toString()} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, shift_duration_hours: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4">4 hours</SelectItem>
                      <SelectItem value="8">8 hours</SelectItem>
                      <SelectItem value="12">12 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Required Patrols */}
                <div className="space-y-2">
                  <Label htmlFor="required_patrols">Required Patrols per Shift *</Label>
                  <Input
                    id="required_patrols"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.required_patrols_per_shift}
                    onChange={(e) => setFormData(prev => ({ ...prev, required_patrols_per_shift: parseInt(e.target.value) || 1 }))}
                    className="w-full"
                  />
                  <p className="text-sm text-gray-600">Minimum number of complete patrol rounds per shift</p>
                </div>

                {/* Photos per Checkpoint */}
                <div className="space-y-2">
                  <Label htmlFor="photos">Photos per Checkpoint *</Label>
                  <Input
                    id="photos"
                    type="number"
                    min="0"
                    max="5"
                    value={formData.required_photos_per_checkpoint}
                    onChange={(e) => setFormData(prev => ({ ...prev, required_photos_per_checkpoint: parseInt(e.target.value) || 1 }))}
                    className="w-full"
                  />
                  <p className="text-sm text-gray-600">Required photos at each checkpoint for quality assurance</p>
                </div>

                {/* Minimum Time Between Patrols */}
                <div className="space-y-2">
                  <Label htmlFor="min_time">Minimum Time Between Patrols (minutes) *</Label>
                  <Input
                    id="min_time"
                    type="number"
                    min="30"
                    max="300"
                    value={formData.min_time_between_patrols_minutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, min_time_between_patrols_minutes: parseInt(e.target.value) || 60 }))}
                    className="w-full"
                  />
                  <p className="text-sm text-gray-600">Prevents speed-running through patrols</p>
                </div>

                {/* Maximum Time Between Patrols */}
                <div className="space-y-2">
                  <Label htmlFor="max_time">Maximum Time Between Patrols (minutes) *</Label>
                  <Input
                    id="max_time"
                    type="number"
                    min="60"
                    max="480"
                    value={formData.max_time_between_patrols_minutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_time_between_patrols_minutes: parseInt(e.target.value) || 180 }))}
                    className="w-full"
                  />
                  <p className="text-sm text-gray-600">Ensures consistent patrol distribution throughout shift</p>
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingId ? 'Update Requirement' : 'Add Requirement'}
                </Button>
                {editingId && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setEditingId(null)
                      setSelectedRoute('')
                      setFormData({
                        shift_duration_hours: 8,
                        required_patrols_per_shift: 4,
                        min_time_between_patrols_minutes: 90,
                        max_time_between_patrols_minutes: 150,
                        required_photos_per_checkpoint: 2
                      })
                    }}
                  >
                    Cancel Edit
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Requirements Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Current Patrol Requirements
            </CardTitle>
            <CardDescription>
              Active patrol requirements for all routes and shift durations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {requirements.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No patrol requirements configured yet</p>
                <p className="text-sm text-gray-400">Add your first requirement above</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Route</TableHead>
                      <TableHead>Shift Duration</TableHead>
                      <TableHead>Required Patrols</TableHead>
                      <TableHead>Time Range</TableHead>
                      <TableHead>Photos</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requirements.map((requirement) => (
                      <TableRow key={requirement.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Route className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">{requirement.route_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {formatDuration(requirement.shift_duration_hours)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Shield className="h-4 w-4 text-green-600" />
                            <span className="font-medium">{requirement.required_patrols_per_shift}</span>
                            <span className="text-sm text-gray-500">patrols</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="h-4 w-4 text-orange-600" />
                            <span>{formatMinutes(requirement.min_time_between_patrols_minutes)}</span>
                            <span className="text-gray-400">-</span>
                            <span>{formatMinutes(requirement.max_time_between_patrols_minutes)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Camera className="h-4 w-4 text-purple-600" />
                            <span>{requirement.required_photos_per_checkpoint}</span>
                            <span className="text-sm text-gray-500">per checkpoint</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(requirement)}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowDeleteDialog(requirement.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        {showDeleteDialog && (
          <Dialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Patrol Requirement</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this patrol requirement? This action cannot be undone and will affect patrol performance tracking for this route and shift duration.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeleteDialog(null)}>Cancel</Button>
                <Button variant="destructive"
                  onClick={() => handleDelete(showDeleteDialog)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AdminLayout>
  )
}