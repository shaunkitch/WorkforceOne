'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Route, MapPin, Loader2, Plus, X, Edit } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'

interface Location {
  id: string
  name: string
  description?: string
  address?: string
}

interface PatrolRoute {
  id: string
  name: string
  description?: string
  checkpoints: string[]
  estimated_duration?: number
}

interface EditRouteModalProps {
  isOpen: boolean
  onClose: () => void
  onRouteUpdated: () => void
  organizationId: string
  route: PatrolRoute | null
  refreshTrigger?: number
}

export default function EditRouteModal({
  isOpen,
  onClose,
  onRouteUpdated,
  organizationId,
  route,
  refreshTrigger
}: EditRouteModalProps) {
  const [loading, setLoading] = useState(false)
  const [loadingLocations, setLoadingLocations] = useState(false)
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedCheckpoints, setSelectedCheckpoints] = useState<string[]>([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    estimated_duration: '',
    instructions: ''
  })
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      loadLocations()
    }
  }, [isOpen, organizationId])

  // Refresh checkpoints when a new checkpoint is created
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0 && isOpen) {
      loadLocations()
    }
  }, [refreshTrigger, isOpen])

  // Populate form when route is selected
  useEffect(() => {
    if (route && isOpen) {
      setFormData({
        name: route.name || '',
        description: route.description || '',
        estimated_duration: route.estimated_duration?.toString() || '',
        instructions: ''
      })
      setSelectedCheckpoints(route.checkpoints || [])
    }
  }, [route, isOpen])

  const loadLocations = async () => {
    setLoadingLocations(true)
    try {
      const response = await fetch(`/api/checkpoints?organization_id=${organizationId}&active_only=true`)
      if (response.ok) {
        const data = await response.json()
        setLocations(data.checkpoints || [])
      }
    } catch (error) {
      console.error('Error loading locations:', error)
      toast({
        title: "Error",
        description: "Failed to load checkpoints",
        variant: "destructive"
      })
    } finally {
      setLoadingLocations(false)
    }
  }

  const handleCheckpointToggle = (checkpointId: string) => {
    setSelectedCheckpoints(prev => 
      prev.includes(checkpointId)
        ? prev.filter(id => id !== checkpointId)
        : [...prev, checkpointId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (selectedCheckpoints.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one checkpoint for the route",
        variant: "destructive"
      })
      setLoading(false)
      return
    }

    if (!route) {
      toast({
        title: "Error",
        description: "No route selected for editing",
        variant: "destructive"
      })
      setLoading(false)
      return
    }

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      const response = await fetch('/api/patrols/routes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: route.id,
          name: formData.name,
          description: formData.description,
          organization_id: organizationId,
          checkpoints: selectedCheckpoints,
          estimated_duration: formData.estimated_duration ? parseInt(formData.estimated_duration) : null,
          updated_by: user.id,
          is_active: true
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Route update failed:', { status: response.status, error: errorData })
        throw new Error(errorData.error || 'Failed to update route')
      }

      toast({
        title: "Success",
        description: "Patrol route updated successfully",
      })

      // Reset form
      setFormData({
        name: '',
        description: '',
        estimated_duration: '',
        instructions: ''
      })
      setSelectedCheckpoints([])

      onRouteUpdated()
      onClose()
    } catch (error) {
      console.error('Error updating route:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update route. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const removeCheckpoint = (checkpointId: string) => {
    setSelectedCheckpoints(prev => prev.filter(id => id !== checkpointId))
  }

  const selectedLocationNames = selectedCheckpoints
    .map(id => locations.find(loc => loc.id === id)?.name)
    .filter(Boolean)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Patrol Route
          </DialogTitle>
          <DialogDescription>
            Update the route details and checkpoint assignments.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Route Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Night Security Round"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-duration">Estimated Duration (minutes)</Label>
              <Input
                id="edit-duration"
                type="number"
                value={formData.estimated_duration}
                onChange={(e) => setFormData({ ...formData, estimated_duration: e.target.value })}
                placeholder="e.g., 45"
                min="1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the patrol route"
              rows={3}
            />
          </div>

          {/* Selected Checkpoints */}
          {selectedCheckpoints.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Checkpoints ({selectedCheckpoints.length})</Label>
              <div className="flex flex-wrap gap-2">
                {selectedLocationNames.map((name, index) => (
                  <Badge
                    key={selectedCheckpoints[index]}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <MapPin className="h-3 w-3" />
                    {name}
                    <button
                      type="button"
                      onClick={() => removeCheckpoint(selectedCheckpoints[index])}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Available Checkpoints */}
          <div className="space-y-2">
            <Label>Available Checkpoints</Label>
            {loadingLocations ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                Loading checkpoints...
              </div>
            ) : locations.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No checkpoints available</p>
                <p className="text-sm">Create some checkpoints first</p>
              </div>
            ) : (
              <ScrollArea className="h-48 border rounded-md p-2">
                <div className="space-y-2">
                  {locations.map((location) => (
                    <div
                      key={location.id}
                      className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded"
                    >
                      <Checkbox
                        id={`edit-checkpoint-${location.id}`}
                        checked={selectedCheckpoints.includes(location.id)}
                        onCheckedChange={() => handleCheckpointToggle(location.id)}
                      />
                      <label
                        htmlFor={`edit-checkpoint-${location.id}`}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                          <div>
                            <div className="font-medium">{location.name}</div>
                            {location.address && (
                              <div className="text-sm text-gray-500">{location.address}</div>
                            )}
                          </div>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Route
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}