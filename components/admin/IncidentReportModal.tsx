'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertTriangle, MapPin, Clock, User, Camera, FileText, CheckCircle } from 'lucide-react'

interface IncidentReport {
  id: string
  guard_id: string
  organization_id: string
  patrol_id?: string
  incident_type: string
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'reported' | 'investigating' | 'resolved' | 'closed'
  incident_date: string
  location_latitude?: number
  location_longitude?: number
  location_address?: string
  photos: any[]
  actions_taken?: string
  follow_up_required: boolean
  follow_up_notes?: string
  created_at: string
  guard: {
    first_name: string
    last_name: string
    email: string
  }
  location?: {
    name: string
    address?: string
  }
}

interface IncidentReportModalProps {
  report: IncidentReport
  isOpen: boolean
  onClose: () => void
  onUpdateStatus: (reportId: string, status: string, actions?: string, followUp?: boolean, notes?: string) => void
}

export function IncidentReportModal({ report, isOpen, onClose, onUpdateStatus }: IncidentReportModalProps) {
  const [newStatus, setNewStatus] = useState(report.status)
  const [actionsTaken, setActionsTaken] = useState(report.actions_taken || '')
  const [followUpRequired, setFollowUpRequired] = useState(report.follow_up_required)
  const [followUpNotes, setFollowUpNotes] = useState(report.follow_up_notes || '')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    await onUpdateStatus(report.id, newStatus, actionsTaken, followUpRequired, followUpNotes)
    setLoading(false)
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'reported': return 'destructive'
      case 'investigating': return 'default'
      case 'resolved': return 'secondary'
      case 'closed': return 'outline'
      default: return 'default'
    }
  }

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'low': return 'outline'
      case 'medium': return 'secondary'  
      case 'high': return 'default'
      case 'critical': return 'destructive'
      default: return 'default'
    }
  }

  const getIncidentTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'security_breach': 'Security Breach',
      'medical_emergency': 'Medical Emergency',
      'fire_hazard': 'Fire Hazard',
      'suspicious_activity': 'Suspicious Activity',
      'property_damage': 'Property Damage',
      'other': 'Other'
    }
    return types[type] || type
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Incident Report Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Type Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant={getStatusBadgeVariant(report.status)}>
              {report.status.toUpperCase()}
            </Badge>
            <Badge variant={getSeverityBadgeVariant(report.severity)}>
              {report.severity.toUpperCase()} SEVERITY
            </Badge>
            <Badge variant="outline">
              {getIncidentTypeLabel(report.incident_type)}
            </Badge>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{report.title}</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{report.description}</p>
            </div>

            {/* Guard and Time Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-600" />
                <div>
                  <div className="font-semibold text-gray-900">
                    {report.guard.first_name} {report.guard.last_name}
                  </div>
                  <div className="text-sm text-gray-600">{report.guard.email}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-600" />
                <div>
                  <div className="font-semibold text-gray-900">
                    Incident Time: {new Date(report.incident_date).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">
                    Reported: {new Date(report.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Location Information */}
            {(report.location_latitude || report.location || report.location_address) && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </h4>
                <div className="space-y-2 text-sm">
                  {report.location && (
                    <div>
                      <span className="font-medium">Nearest Checkpoint:</span> {report.location.name}
                      {report.location.address && <div className="text-gray-600">{report.location.address}</div>}
                    </div>
                  )}
                  {report.location_address && (
                    <div>
                      <span className="font-medium">Address:</span> {report.location_address}
                    </div>
                  )}
                  {report.location_latitude && report.location_longitude && (
                    <div className="font-mono text-xs text-gray-500">
                      Coordinates: {report.location_latitude.toFixed(6)}, {report.location_longitude.toFixed(6)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Photos */}
            {report.photos && report.photos.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Photos ({report.photos.length})
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {report.photos.map((photo: any, index: number) => (
                    <div key={index} className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                      {photo.uri ? (
                        <img 
                          src={photo.uri} 
                          alt={`Incident photo ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="text-gray-400 text-center">
                          <Camera className="h-8 w-8 mx-auto mb-2" />
                          <span className="text-sm">Photo {index + 1}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Existing Actions */}
            {report.actions_taken && (
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Actions Taken</h4>
                <p className="text-gray-700 whitespace-pre-wrap">{report.actions_taken}</p>
              </div>
            )}

            {/* Follow-up Notes */}
            {report.follow_up_notes && (
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Follow-up Notes</h4>
                <p className="text-gray-700 whitespace-pre-wrap">{report.follow_up_notes}</p>
              </div>
            )}
          </div>

          {/* Status Update Form */}
          <div className="border-t pt-6 space-y-4">
            <h4 className="font-semibold text-gray-900">Update Status</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reported">Reported</SelectItem>
                    <SelectItem value="investigating">Investigating</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2 pt-8">
                <Checkbox 
                  id="followup"
                  checked={followUpRequired}
                  onCheckedChange={setFollowUpRequired}
                />
                <label htmlFor="followup" className="text-sm font-medium text-gray-700">
                  Follow-up required
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Actions Taken</label>
              <Textarea
                value={actionsTaken}
                onChange={(e) => setActionsTaken(e.target.value)}
                placeholder="Describe the actions taken to address this incident..."
                rows={4}
              />
            </div>

            {followUpRequired && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Follow-up Notes</label>
                <Textarea
                  value={followUpNotes}
                  onChange={(e) => setFollowUpNotes(e.target.value)}
                  placeholder="Add any follow-up instructions or notes..."
                  rows={3}
                />
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  'Updating...'
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Update Report
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}