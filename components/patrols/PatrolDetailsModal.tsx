'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  MapPin, 
  Clock, 
  User, 
  CheckCircle, 
  PlayCircle, 
  Route, 
  Calendar,
  MapIcon,
  Target,
  Timer,
  FileText,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { PatrolService, Patrol, CheckpointVisit } from '@/lib/patrols/service'
import { useToast } from '@/hooks/use-toast'

interface PatrolDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  patrol: Patrol | null
}

export default function PatrolDetailsModal({
  isOpen,
  onClose,
  patrol
}: PatrolDetailsModalProps) {
  const [checkpointVisits, setCheckpointVisits] = useState<CheckpointVisit[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen && patrol) {
      loadCheckpointVisits()
    }
  }, [isOpen, patrol])

  const loadCheckpointVisits = async () => {
    if (!patrol) return
    
    setLoading(true)
    try {
      const visits = await PatrolService.getCheckpointVisits(patrol.id)
      setCheckpointVisits(visits)
    } catch (error) {
      console.error('Error loading checkpoint visits:', error)
      toast({
        title: "Error",
        description: "Failed to load checkpoint visits",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
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

  const formatDateTime = (dateString: string | undefined) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleString()
  }

  const formatDuration = (startTime?: string, endTime?: string) => {
    if (!startTime) return 'Not started'
    if (!endTime) return 'In progress'
    
    const start = new Date(startTime)
    const end = new Date(endTime)
    const diffMs = end.getTime() - start.getTime()
    const diffMins = Math.round(diffMs / (1000 * 60))
    
    const hours = Math.floor(diffMins / 60)
    const minutes = diffMins % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const getProgressPercentage = (completed: number, total: number) => {
    if (total === 0) return 0
    return Math.round((completed / total) * 100)
  }

  if (!patrol) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Route className="h-5 w-5" />
            Patrol Details
          </DialogTitle>
          <DialogDescription>
            Detailed information for patrol {patrol.id.slice(0, 8)}...
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Patrol Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    Guard
                  </div>
                  <div className="font-medium">
                    {patrol.guard ? `${patrol.guard.first_name} ${patrol.guard.last_name}` : 'Unknown'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {patrol.guard?.email}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Target className="h-4 w-4" />
                    Status
                  </div>
                  <div>
                    {getStatusBadge(patrol.status)}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4" />
                    Progress
                  </div>
                  <div className="font-medium">
                    {patrol.checkpoints_completed}/{patrol.total_checkpoints} checkpoints
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {getProgressPercentage(patrol.checkpoints_completed, patrol.total_checkpoints)}% complete
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Timer className="h-4 w-4" />
                    Duration
                  </div>
                  <div className="font-medium">
                    {formatDuration(patrol.start_time, patrol.end_time)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Route Information */}
          {patrol.route && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Route Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapIcon className="h-4 w-4" />
                      Route Name
                    </div>
                    <div className="font-medium">{patrol.route.name}</div>
                    {patrol.route.description && (
                      <div className="text-sm text-muted-foreground">{patrol.route.description}</div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Estimated Duration
                    </div>
                    <div className="font-medium">
                      {patrol.route.estimated_duration ? `${patrol.route.estimated_duration} minutes` : 'Not set'}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    Checkpoints ({patrol.route.checkpoints.length})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {patrol.route.checkpoints.map((checkpoint, index) => (
                      <Badge key={checkpoint} variant="outline">
                        {index + 1}. {checkpoint.slice(0, 8)}...
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Created
                  </div>
                  <div className="font-medium">{formatDateTime(patrol.created_at)}</div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <PlayCircle className="h-4 w-4" />
                    Started
                  </div>
                  <div className="font-medium">{formatDateTime(patrol.start_time)}</div>
                </div>

                {patrol.end_time && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4" />
                      Completed
                    </div>
                    <div className="font-medium">{formatDateTime(patrol.end_time)}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {patrol.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <p className="text-sm">{patrol.notes}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Checkpoint Visits */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Checkpoint Visits</CardTitle>
              <CardDescription>
                Detailed log of checkpoint visits during this patrol
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading checkpoint visits...</span>
                </div>
              ) : checkpointVisits.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Location</TableHead>
                      <TableHead>Visited At</TableHead>
                      <TableHead>Verification</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {checkpointVisits.map((visit) => (
                      <TableRow key={visit.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">
                                {visit.location?.name || 'Unknown Location'}
                              </div>
                              {visit.location?.address && (
                                <div className="text-xs text-muted-foreground">
                                  {visit.location.address}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{formatDateTime(visit.visited_at)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {visit.verification_method || 'Manual'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {visit.notes || 'No notes'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No checkpoint visits recorded</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}