'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertTriangle, MapPin, Clock, User, FileText, Printer, Eye, Search, Filter } from 'lucide-react'
import { useAuth } from '@/lib/auth/hooks'
import { IncidentReportModal } from '@/components/admin/IncidentReportModal'
import { IncidentReportPrintModal } from '@/components/admin/IncidentReportPrintModal'

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

export default function IncidentReportsPage() {
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

  const fetchIncidentReports = async () => {
    if (!user?.organization_id) return

    try {
      const url = `/api/incident-reports?organization_id=${user.organization_id}&status=${statusFilter === 'all' ? '' : statusFilter}`
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

  const handleViewReport = (report: IncidentReport) => {
    setSelectedReport(report)
    setShowModal(true)
  }

  const handlePrintReport = (report: IncidentReport) => {
    setSelectedReport(report)
    setShowPrintModal(true)
  }

  const updateReportStatus = async (reportId: string, status: string, actions?: string, followUp?: boolean, notes?: string) => {
    try {
      const response = await fetch('/api/incident-reports', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: reportId,
          status,
          actions_taken: actions,
          follow_up_required: followUp,
          follow_up_notes: notes,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Incident Reports</h1>
          <p className="text-gray-600">Monitor and manage security incident reports</p>
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
                  <SelectItem value="security_breach">Security Breach</SelectItem>
                  <SelectItem value="medical_emergency">Medical Emergency</SelectItem>
                  <SelectItem value="fire_hazard">Fire Hazard</SelectItem>
                  <SelectItem value="suspicious_activity">Suspicious Activity</SelectItem>
                  <SelectItem value="property_damage">Property Damage</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
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
              <p className="text-gray-600">No reports match your current filters.</p>
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
                    <Button variant="outline" size="sm" onClick={() => handlePrintReport(report)}>
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

      {/* Modals */}
      {selectedReport && (
        <>
          <IncidentReportModal
            report={selectedReport}
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            onUpdateStatus={updateReportStatus}
          />
          <IncidentReportPrintModal
            report={selectedReport}
            isOpen={showPrintModal}
            onClose={() => setShowPrintModal(false)}
          />
        </>
      )}
    </div>
  )
}