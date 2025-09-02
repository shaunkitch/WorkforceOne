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
import { Route, MapPin, Loader2, Plus, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Location {
  id: string
  name: string
  description?: string
  address?: string
}

interface CreateRouteModalProps {
  isOpen: boolean
  onClose: () => void
  onRouteCreated: () => void
  organizationId: string
}

export default function CreateRouteModal({
  isOpen,
  onClose,
  onRouteCreated,
  organizationId
}: CreateRouteModalProps) {
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

  const loadLocations = async () => {
    setLoadingLocations(true)
    try {
      const response = await fetch(`/api/checkpoints?organization_id=${organizationId}&active_only=true`)
      if (response.ok) {
        const data = await response.json()
        setLocations(data.locations || [])
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

    try {
      const response = await fetch('/api/patrols/routes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          organization_id: organizationId,
          checkpoints: selectedCheckpoints,
          estimated_duration: formData.estimated_duration ? parseInt(formData.estimated_duration) : null,
          is_active: true
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create route')
      }

      toast({
        title: "Success",
        description: "Patrol route created successfully",
      })

      // Reset form
      setFormData({
        name: '',
        description: '',
        estimated_duration: '',
        instructions: ''
      })
      setSelectedCheckpoints([])

      onRouteCreated()
      onClose()
    } catch (error) {
      console.error('Error creating route:', error)
      toast({
        title: "Error",
        description: "Failed to create route. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const removeCheckpoint = (checkpointId: string) => {
    setSelectedCheckpoints(prev => prev.filter(id => id !== checkpointId))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Route className="h-5 w-5" />
            Create New Patrol Route
          </DialogTitle>
          <DialogDescription>
            Create a new patrol route by selecting checkpoints and configuring the route details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Route Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Building Perimeter"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimated_duration">Estimated Duration (minutes)</Label>
                <Input
                  id="estimated_duration"
                  type="number"
                  value={formData.estimated_duration}
                  onChange={(e) => setFormData({ ...formData, estimated_duration: e.target.value })}
                  placeholder="e.g., 30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the patrol route"
                rows={3}
              />
            </div>
          </div>

          {/* Selected Checkpoints */}
          {selectedCheckpoints.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Checkpoints ({selectedCheckpoints.length})</Label>
              <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-md">
                {selectedCheckpoints.map(checkpointId => {
                  const checkpoint = locations.find(l => l.id === checkpointId)
                  return checkpoint ? (
                    <Badge key={checkpointId} variant="secondary" className="flex items-center gap-1">
                      {checkpoint.name}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-red-500"
                        onClick={() => removeCheckpoint(checkpointId)}
                      />
                    </Badge>
                  ) : null
                })}
              </div>
            </div>
          )}

          {/* Checkpoint Selection */}
          <div className="space-y-2">
            <Label>Select Checkpoints</Label>
            <ScrollArea className="h-64 border rounded-md p-3">
              {loadingLocations ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading checkpoints...</span>
                </div>
              ) : locations.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Checkpoints Found</h3>
                  <p className="text-gray-600 mb-4">Create some checkpoints first to build patrol routes.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {locations.map((location) => (
                    <div
                      key={location.id}
                      className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <Checkbox
                        id={`location-${location.id}`}
                        checked={selectedCheckpoints.includes(location.id)}
                        onCheckedChange={() => handleCheckpointToggle(location.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <label
                          htmlFor={`location-${location.id}`}
                          className="block text-sm font-medium text-gray-900 cursor-pointer"
                        >
                          {location.name}
                        </label>
                        {location.description && (
                          <p className="text-sm text-gray-600 mt-1">{location.description}</p>
                        )}
                        {location.address && (
                          <p className="text-xs text-gray-500 mt-1">{location.address}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <Label htmlFor="instructions">Route Instructions</Label>
            <Textarea
              id="instructions"
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              placeholder="Special instructions for guards following this route"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || selectedCheckpoints.length === 0}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Route
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}