'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserCheck, Route, MapPin, Clock, Loader2, User, Shield } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Guard {
  id: string
  first_name: string
  last_name: string
  email: string
  is_active: boolean
}

interface PatrolRoute {
  id: string
  name: string
  description?: string
  checkpoints: string[]
  estimated_duration?: number
  locations?: Array<{
    id: string
    name: string
  }>
}

interface AssignRouteModalProps {
  isOpen: boolean
  onClose: () => void
  onRouteAssigned: () => void
  organizationId: string
}

export default function AssignRouteModal({
  isOpen,
  onClose,
  onRouteAssigned,
  organizationId
}: AssignRouteModalProps) {
  const [loading, setLoading] = useState(false)
  const [loadingGuards, setLoadingGuards] = useState(false)
  const [loadingRoutes, setLoadingRoutes] = useState(false)
  const [guards, setGuards] = useState<Guard[]>([])
  const [routes, setRoutes] = useState<PatrolRoute[]>([])
  const [selectedGuard, setSelectedGuard] = useState('')
  const [selectedRoute, setSelectedRoute] = useState('')
  const [notes, setNotes] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      loadGuards()
      loadRoutes()
    }
  }, [isOpen, organizationId])

  const loadGuards = async () => {
    setLoadingGuards(true)
    try {
      const response = await fetch(`/api/guards?organization_id=${organizationId}`)
      if (response.ok) {
        const data = await response.json()
        setGuards(data.guards?.filter((g: Guard) => g.is_active) || [])
      }
    } catch (error) {
      console.error('Error loading guards:', error)
      toast({
        title: "Error",
        description: "Failed to load guards",
        variant: "destructive"
      })
    } finally {
      setLoadingGuards(false)
    }
  }

  const loadRoutes = async () => {
    setLoadingRoutes(true)
    try {
      const response = await fetch(`/api/patrols/routes?organization_id=${organizationId}&include_checkpoints=true`)
      if (response.ok) {
        const data = await response.json()
        setRoutes(data.routes || [])
      }
    } catch (error) {
      console.error('Error loading routes:', error)
      toast({
        title: "Error",
        description: "Failed to load routes",
        variant: "destructive"
      })
    } finally {
      setLoadingRoutes(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!selectedGuard || !selectedRoute) {
      toast({
        title: "Error",
        description: "Please select both a guard and a route",
        variant: "destructive"
      })
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/patrols/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organization_id: organizationId,
          guard_id: selectedGuard,
          route_id: selectedRoute,
          status: 'scheduled',
          notes: notes.trim() || null
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to assign patrol route')
      }

      const selectedGuardData = guards.find(g => g.id === selectedGuard)
      const selectedRouteData = routes.find(r => r.id === selectedRoute)

      toast({
        title: "Success",
        description: `Patrol route "${selectedRouteData?.name}" assigned to ${selectedGuardData?.first_name} ${selectedGuardData?.last_name}`,
      })

      // Reset form
      setSelectedGuard('')
      setSelectedRoute('')
      setNotes('')

      onRouteAssigned()
      onClose()
    } catch (error) {
      console.error('Error assigning route:', error)
      toast({
        title: "Error",
        description: "Failed to assign patrol route. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const selectedRouteData = routes.find(r => r.id === selectedRoute)
  const selectedGuardData = guards.find(g => g.id === selectedGuard)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Assign Patrol Route
          </DialogTitle>
          <DialogDescription>
            Assign a patrol route to a guard. The guard will be notified of their new assignment.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Guard Selection */}
          <div className="space-y-2">
            <Label htmlFor="guard">Select Guard *</Label>
            {loadingGuards ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading guards...</span>
              </div>
            ) : (
              <Select value={selectedGuard} onValueChange={setSelectedGuard}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a guard to assign the patrol" />
                </SelectTrigger>
                <SelectContent>
                  {guards.map((guard) => (
                    <SelectItem key={guard.id} value={guard.id}>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        <span>{guard.first_name} {guard.last_name}</span>
                        <span className="text-gray-500 text-sm">({guard.email})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Route Selection */}
          <div className="space-y-2">
            <Label htmlFor="route">Select Patrol Route *</Label>
            {loadingRoutes ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading routes...</span>
              </div>
            ) : (
              <Select value={selectedRoute} onValueChange={setSelectedRoute}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a patrol route to assign" />
                </SelectTrigger>
                <SelectContent>
                  {routes.map((route) => (
                    <SelectItem key={route.id} value={route.id}>
                      <div className="flex items-center gap-2">
                        <Route className="h-4 w-4" />
                        <span>{route.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {route.checkpoints.length} checkpoints
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Assignment Preview */}
          {selectedGuardData && selectedRouteData && (
            <Card className="border-2 border-dashed border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">Assignment Preview</CardTitle>
                <CardDescription>Review the assignment details below</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <User className="h-4 w-4" />
                      Assigned Guard
                    </div>
                    <div className="pl-6">
                      <p className="font-medium">{selectedGuardData.first_name} {selectedGuardData.last_name}</p>
                      <p className="text-sm text-gray-500">{selectedGuardData.email}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Route className="h-4 w-4" />
                      Patrol Route
                    </div>
                    <div className="pl-6">
                      <p className="font-medium">{selectedRouteData.name}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {selectedRouteData.checkpoints.length} checkpoints
                        </span>
                        {selectedRouteData.estimated_duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            ~{selectedRouteData.estimated_duration} min
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {selectedRouteData.description && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-gray-600">{selectedRouteData.description}</p>
                  </div>
                )}

                {selectedRouteData.locations && selectedRouteData.locations.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium text-gray-700 mb-2">Checkpoints:</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedRouteData.locations.map((location) => (
                        <Badge key={location.id} variant="outline" className="text-xs">
                          {location.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions or notes for this assignment"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedGuard || !selectedRoute}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign Patrol
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}