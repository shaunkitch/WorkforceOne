'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertTriangle, MapPin, Clock, User, FileText, Printer, Eye, Search, Filter, CheckCircle, Camera, Plus } from 'lucide-react'
import { useAuth } from '@/lib/auth/hooks'
import AdminLayout from '@/components/layout/AdminLayout'

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
  closest_checkpoint_id?: string
  photos: any[]
  actions_taken?: string
  follow_up_required: boolean
  follow_up_notes?: string
  resolved_by?: string
  resolved_at?: string
  created_at: string
  updated_at: string
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

const INCIDENT_TYPES = [
  { id: 'security_breach', label: 'Security Breach', icon: 'shield-outline', description: 'Unauthorized access, break-in, or security violation' },
  { id: 'medical_emergency', label: 'Medical Emergency', icon: 'medical-outline', description: 'Injury, illness, or medical assistance required' },
  { id: 'fire_hazard', label: 'Fire Hazard', icon: 'flame-outline', description: 'Fire risk, smoke, or fire safety concern' },
  { id: 'suspicious_activity', label: 'Suspicious Activity', icon: 'eye-outline', description: 'Unusual behavior or activity requiring attention' },
  { id: 'property_damage', label: 'Property Damage', icon: 'hammer-outline', description: 'Vandalism, damage, or maintenance issue' },
  { id: 'other', label: 'Other', icon: 'document-outline', description: 'Other incident not covered above' }
]

export default function IncidentsPage() {
  const { user } = useAuth()
  const [incidentReports, setIncidentReports] = useState<IncidentReport[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<IncidentReport | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [severityFilter, setSeverityFilter] = useState('all')

  // Modal state for updating reports
  const [newStatus, setNewStatus] = useState('')
  const [actionsTaken, setActionsTaken] = useState('')
  const [followUpRequired, setFollowUpRequired] = useState(false)
  const [followUpNotes, setFollowUpNotes] = useState('')
  const [updating, setUpdating] = useState(false)

  const fetchIncidentReports = async () => {
    if (!user?.organization_id) return

    try {
      const url = `/api/incident-report?organization_id=${user.organization_id}&status=${statusFilter === 'all' ? '' : statusFilter}`
      const response = await fetch(url)

      if (response.ok) {
        const data = await response.json()
        setIncidentReports(data.incidentReports || [])
      } else {
        console.error('Failed to fetch incident reports:', response.status)
      }
    } catch (error) {
      console.error('Error fetching incident reports:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchIncidentReports()
  }, [user?.organization_id, statusFilter])

  const filteredReports = incidentReports.filter(report => {
    const matchesSearch = !searchTerm || 
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.guard.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.guard.last_name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = typeFilter === 'all' || report.incident_type === typeFilter
    const matchesSeverity = severityFilter === 'all' || report.severity === severityFilter

    return matchesSearch && matchesType && matchesSeverity
  })

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
    const incidentType = INCIDENT_TYPES.find(t => t.id === type)
    return incidentType?.label || type
  }

  const handleViewReport = (report: IncidentReport) => {
    setSelectedReport(report)
    setNewStatus(report.status)
    setActionsTaken(report.actions_taken || '')
    setFollowUpRequired(report.follow_up_required)
    setFollowUpNotes(report.follow_up_notes || '')
    setShowModal(true)
  }

  const handlePrintReport = (report: IncidentReport) => {
    setSelectedReport(report)
    setShowPrintModal(true)
  }

  const updateReportStatus = async () => {
    if (!selectedReport) return

    setUpdating(true)
    try {
      const response = await fetch('/api/incident-report', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedReport.id,
          status: newStatus,
          actions_taken: actionsTaken,
          follow_up_required: followUpRequired,
          follow_up_notes: followUpNotes,
          resolved_by: user?.id
        })
      })

      if (response.ok) {
        fetchIncidentReports()
        setShowModal(false)
      } else {
        console.error('Failed to update incident report')
      }
    } catch (error) {
      console.error('Error updating incident report:', error)
    } finally {
      setUpdating(false)
    }
  }

  const getStatusCounts = () => {
    return {
      all: incidentReports.length,
      reported: incidentReports.filter(r => r.status === 'reported').length,
      investigating: incidentReports.filter(r => r.status === 'investigating').length,
      resolved: incidentReports.filter(r => r.status === 'resolved').length,
      closed: incidentReports.filter(r => r.status === 'closed').length
    }
  }

  const statusCounts = getStatusCounts()

  const printReport = (report: IncidentReport) => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Incident Report - ${report.title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.4; }
          .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
          .header h1 { margin: 0; color: #333; }
          .section { margin-bottom: 20px; }
          .section h3 { color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
          .field { margin-bottom: 10px; }
          .field-label { font-weight: bold; color: #555; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>SECURITY INCIDENT REPORT</h1>
          <div>WorkforceOne Security Management System</div>
          <div>Report ID: ${report.id} | Generated: ${new Date().toLocaleString()}</div>
        </div>
        
        <div class="section">
          <h3>Incident Information</h3>
          <div class="field"><div class="field-label">Title:</div><div>${report.title}</div></div>
          <div class="field"><div class="field-label">Type:</div><div>${getIncidentTypeLabel(report.incident_type)}</div></div>
          <div class="field"><div class="field-label">Severity:</div><div>${report.severity.toUpperCase()}</div></div>
          <div class="field"><div class="field-label">Status:</div><div>${report.status.toUpperCase()}</div></div>
          <div class="field"><div class="field-label">Description:</div><div>${report.description}</div></div>
        </div>

        <div class="section">
          <h3>Reporter Information</h3>
          <div class="field"><div class="field-label">Guard:</div><div>${report.guard.first_name} ${report.guard.last_name}</div></div>
          <div class="field"><div class="field-label">Email:</div><div>${report.guard.email}</div></div>
          <div class="field"><div class="field-label">Incident Date:</div><div>${new Date(report.incident_date).toLocaleString()}</div></div>
          <div class="field"><div class="field-label">Report Submitted:</div><div>${new Date(report.created_at).toLocaleString()}</div></div>
        </div>

        ${report.location_address || (report.location_latitude && report.location_longitude) ? `
        <div class="section">
          <h3>Location</h3>
          ${report.location_address ? `<div class="field"><div class="field-label">Address:</div><div>${report.location_address}</div></div>` : ''}
          ${report.location ? `<div class="field"><div class="field-label">Nearest Checkpoint:</div><div>${report.location.name}</div></div>` : ''}
          ${report.location_latitude && report.location_longitude ? `<div class="field"><div class="field-label">Coordinates:</div><div>${report.location_latitude.toFixed(6)}, ${report.location_longitude.toFixed(6)}</div></div>` : ''}
        </div>
        ` : ''}

        ${report.photos && report.photos.length > 0 ? `
        <div class="section">
          <h3>Evidence Photos</h3>
          <div class="field"><div class="field-label">Photos Attached:</div><div>${report.photos.length} photo(s)</div></div>
        </div>
        ` : ''}

        ${report.actions_taken ? `
        <div class="section">
          <h3>Actions Taken</h3>
          <div>${report.actions_taken}</div>
        </div>
        ` : ''}

        <div class="section">
          <div style="font-size: 12px; color: #666; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 10px;">
            Generated by: ${user?.first_name} ${user?.last_name} on ${new Date().toLocaleString()}
          </div>
        </div>
      </body>
      </html>
    `

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.print()
      printWindow.close()
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="bg-gradient-to-r from-red-600 to-pink-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Incident Reports</h1>
              <p className="text-red-100">
                Monitor and manage security incident reports from mobile guards
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <AlertTriangle className="h-8 w-8" />
            </div>
          </div>
        </div>

        {/* Status Tabs */}
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
            <TabsTrigger value="reported">New ({statusCounts.reported})</TabsTrigger>
            <TabsTrigger value="investigating">Investigating ({statusCounts.investigating})</TabsTrigger>
            <TabsTrigger value="resolved">Resolved ({statusCounts.resolved})</TabsTrigger>
            <TabsTrigger value="closed">Closed ({statusCounts.closed})</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search reports..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {INCIDENT_TYPES.map(type => (
                      <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All severities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('')
                    setTypeFilter('all')
                    setSeverityFilter('all')
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports List */}
        <div className="space-y-4">
          {filteredReports.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No incident reports found</h3>
                <p className="text-gray-600">
                  {incidentReports.length === 0 
                    ? 'No reports have been submitted yet. Guards can report incidents from the mobile app.'
                    : 'No reports match your current filters.'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredReports.map((report) => (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={getStatusBadgeVariant(report.status)}>
                          {report.status.toUpperCase()}
                        </Badge>
                        <Badge variant={getSeverityBadgeVariant(report.severity)}>
                          {report.severity.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">
                          {getIncidentTypeLabel(report.incident_type)}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{report.title}</CardTitle>
                      <CardDescription className="mt-2 line-clamp-2">
                        {report.description}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button variant="outline" size="sm" onClick={() => handleViewReport(report)}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => printReport(report)}>
                        <Printer className="h-4 w-4 mr-1" />
                        Print
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{report.guard.first_name} {report.guard.last_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{new Date(report.incident_date).toLocaleString()}</span>
                    </div>
                    {report.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{report.location.name}</span>
                      </div>
                    )}
                  </div>
                  {report.photos && report.photos.length > 0 && (
                    <div className="mt-3">
                      <span className="text-sm text-gray-500">
                        📸 {report.photos.length} photo{report.photos.length !== 1 ? 's' : ''} attached
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Incident Details Modal */}
        {selectedReport && (
          <Dialog open={showModal} onOpenChange={setShowModal}>
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
                  <Badge variant={getStatusBadgeVariant(selectedReport.status)}>
                    {selectedReport.status.toUpperCase()}
                  </Badge>
                  <Badge variant={getSeverityBadgeVariant(selectedReport.severity)}>
                    {selectedReport.severity.toUpperCase()} SEVERITY
                  </Badge>
                  <Badge variant="outline">
                    {getIncidentTypeLabel(selectedReport.incident_type)}
                  </Badge>
                </div>

                {/* Basic Information */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedReport.title}</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedReport.description}</p>
                  </div>

                  {/* Guard and Time Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-600" />
                      <div>
                        <div className="font-semibold text-gray-900">
                          {selectedReport.guard.first_name} {selectedReport.guard.last_name}
                        </div>
                        <div className="text-sm text-gray-600">{selectedReport.guard.email}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-600" />
                      <div>
                        <div className="font-semibold text-gray-900">
                          Incident: {new Date(selectedReport.incident_date).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">
                          Reported: {new Date(selectedReport.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Location Information */}
                  {(selectedReport.location_latitude || selectedReport.location || selectedReport.location_address) && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Location
                      </h4>
                      <div className="space-y-2 text-sm">
                        {selectedReport.location && (
                          <div>
                            <span className="font-medium">Nearest Checkpoint:</span> {selectedReport.location.name}
                            {selectedReport.location.address && <div className="text-gray-600">{selectedReport.location.address}</div>}
                          </div>
                        )}
                        {selectedReport.location_address && (
                          <div>
                            <span className="font-medium">Address:</span> {selectedReport.location_address}
                          </div>
                        )}
                        {selectedReport.location_latitude && selectedReport.location_longitude && (
                          <div className="font-mono text-xs text-gray-500">
                            Coordinates: {selectedReport.location_latitude.toFixed(6)}, {selectedReport.location_longitude.toFixed(6)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Photos */}
                  {selectedReport.photos && selectedReport.photos.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        Photos ({selectedReport.photos.length})
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {selectedReport.photos.map((photo: any, index: number) => (
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
                  {selectedReport.actions_taken && (
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">Actions Taken</h4>
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedReport.actions_taken}</p>
                    </div>
                  )}

                  {/* Follow-up Notes */}
                  {selectedReport.follow_up_notes && (
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">Follow-up Notes</h4>
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedReport.follow_up_notes}</p>
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
                    <Button onClick={updateReportStatus} disabled={updating}>
                      {updating ? (
                        'Updating...'
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Update Report
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={() => setShowModal(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AdminLayout>
  )
}