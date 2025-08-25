'use client'

import { useAuth } from '@/lib/auth/hooks'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { IncidentService, Incident, INCIDENT_TYPES } from '@/lib/incidents/service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Shield, LogOut, Plus, AlertTriangle, Clock, User, MapPin, Camera, FileText } from 'lucide-react'
import { FileUpload } from '@/components/ui/file-upload'

export default function IncidentsPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [openIncidents, setOpenIncidents] = useState<Incident[]>([])
  const [criticalIncidents, setCriticalIncidents] = useState<Incident[]>([])
  const [statistics, setStatistics] = useState({
    totalIncidents: 0,
    openIncidents: 0,
    resolvedIncidents: 0,
    criticalIncidents: 0,
    averageResolutionTime: 0,
    incidentsByType: [] as Array<{ type: string; count: number }>,
    incidentsBySeverity: [] as Array<{ severity: string; count: number }>
  })
  const [loadingData, setLoadingData] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newIncident, setNewIncident] = useState({
    incident_type: '',
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    title: '',
    description: '',
    location_id: '',
    attachments: [] as string[]
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.organization_id) {
      loadIncidentData()
    }
  }, [user])

  const loadIncidentData = async () => {
    if (!user?.organization_id) return

    setLoadingData(true)
    try {
      const [incidentsData, openIncidentsData, criticalIncidentsData, statsData] = await Promise.all([
        IncidentService.getIncidents(user.organization_id),
        IncidentService.getOpenIncidents(user.organization_id),
        IncidentService.getCriticalIncidents(user.organization_id),
        IncidentService.getIncidentStatistics(user.organization_id)
      ])

      setIncidents(incidentsData)
      setOpenIncidents(openIncidentsData)
      setCriticalIncidents(criticalIncidentsData)
      setStatistics(statsData)
    } catch (error) {
      console.error('Error loading incident data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleCreateIncident = async () => {
    if (!user?.organization_id || !newIncident.incident_type || !newIncident.title) {
      return
    }

    try {
      const result = await IncidentService.createIncident({
        organization_id: user.organization_id,
        reported_by: user.id,
        incident_type: newIncident.incident_type,
        severity: newIncident.severity,
        title: newIncident.title,
        description: newIncident.description,
        attachments: newIncident.attachments
      })

      if (result.success) {
        setShowCreateDialog(false)
        setNewIncident({
          incident_type: '',
          severity: 'medium',
          title: '',
          description: '',
          location_id: '',
          attachments: []
        })
        loadIncidentData() // Refresh data
      }
    } catch (error) {
      console.error('Error creating incident:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { color: 'bg-red-100 text-red-800', text: 'Open' },
      in_progress: { color: 'bg-yellow-100 text-yellow-800', text: 'In Progress' },
      resolved: { color: 'bg-green-100 text-green-800', text: 'Resolved' },
      closed: { color: 'bg-gray-100 text-gray-800', text: 'Closed' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open

    return (
      <Badge variant="secondary" className={config.color}>
        {config.text}
      </Badge>
    )
  }

  const getSeverityBadge = (severity: string) => {
    const severityConfig = {
      low: { color: 'bg-green-100 text-green-800', text: 'Low' },
      medium: { color: 'bg-yellow-100 text-yellow-800', text: 'Medium' },
      high: { color: 'bg-orange-100 text-orange-800', text: 'High' },
      critical: { color: 'bg-red-100 text-red-800', text: 'Critical' }
    }

    const config = severityConfig[severity as keyof typeof severityConfig] || severityConfig.medium

    return (
      <Badge variant="secondary" className={config.color}>
        {config.text}
      </Badge>
    )
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getIncidentTypeName = (type: string) => {
    const incidentType = INCIDENT_TYPES.find(t => t.id === type)
    return incidentType?.name || type
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
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="p-2 bg-red-100 rounded-full mr-3">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Incident Management</h1>
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
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Security Incidents</h2>
            <p className="text-gray-600">
              Report, track, and manage security incidents and emergencies.
            </p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Report Incident
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Report New Incident</DialogTitle>
                <DialogDescription>
                  Provide details about the security incident or emergency.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="incident_type">Incident Type</Label>
                  <Select
                    value={newIncident.incident_type}
                    onValueChange={(value) => setNewIncident({ ...newIncident, incident_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select incident type" />
                    </SelectTrigger>
                    <SelectContent>
                      {INCIDENT_TYPES.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="severity">Severity Level</Label>
                  <Select
                    value={newIncident.severity}
                    onValueChange={(value: 'low' | 'medium' | 'high' | 'critical') => 
                      setNewIncident({ ...newIncident, severity: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Incident Title</Label>
                  <Input
                    id="title"
                    placeholder="Brief description of the incident"
                    value={newIncident.title}
                    onChange={(e) => setNewIncident({ ...newIncident, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Detailed Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Provide detailed information about what happened..."
                    value={newIncident.description}
                    onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                    rows={4}
                  />
                </div>

                <FileUpload
                  onUpload={(urls) => setNewIncident({ ...newIncident, attachments: [...newIncident.attachments, ...urls] })}
                  maxFiles={5}
                />

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateIncident} disabled={!newIncident.incident_type || !newIncident.title}>
                    Report Incident
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Critical Incidents Alert */}
        {criticalIncidents.length > 0 && (
          <Card className="mb-8 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center text-red-800">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Critical Incidents Requiring Attention
              </CardTitle>
              <CardDescription className="text-red-600">
                {criticalIncidents.length} critical incident{criticalIncidents.length > 1 ? 's' : ''} need immediate attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {criticalIncidents.slice(0, 3).map((incident) => (
                  <div key={incident.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div>
                      <p className="font-medium text-gray-900">{incident.title}</p>
                      <p className="text-sm text-gray-600">
                        {getIncidentTypeName(incident.incident_type)} • {formatDateTime(incident.created_at)}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Incidents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalIncidents}</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.openIncidents}</div>
              <p className="text-xs text-muted-foreground">Requiring attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{statistics.criticalIncidents}</div>
              <p className="text-xs text-muted-foreground">High priority</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.resolvedIncidents}</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Resolution</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.averageResolutionTime}h</div>
              <p className="text-xs text-muted-foreground">Average time</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="open" className="space-y-6">
          <TabsList>
            <TabsTrigger value="open">Open Incidents ({openIncidents.length})</TabsTrigger>
            <TabsTrigger value="all">All Incidents ({incidents.length})</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Open Incidents */}
          <TabsContent value="open">
            <Card>
              <CardHeader>
                <CardTitle>Open Incidents</CardTitle>
                <CardDescription>
                  Incidents that require attention or are being investigated
                </CardDescription>
              </CardHeader>
              <CardContent>
                {openIncidents.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Open Incidents</h3>
                    <p className="text-gray-600">All incidents have been resolved or closed.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Incident</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Reporter</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {openIncidents.map((incident) => (
                        <TableRow key={incident.id}>
                          <TableCell className="font-medium">
                            <div>
                              <p className="font-medium">{incident.title}</p>
                              {incident.description && (
                                <p className="text-sm text-gray-600 truncate max-w-xs">
                                  {incident.description}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getIncidentTypeName(incident.incident_type)}</TableCell>
                          <TableCell>{getSeverityBadge(incident.severity)}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-2 text-gray-400" />
                              {incident.reporter ? `${incident.reporter.first_name} ${incident.reporter.last_name}` : 'Unknown'}
                            </div>
                          </TableCell>
                          <TableCell>{formatDateTime(incident.created_at)}</TableCell>
                          <TableCell>{getStatusBadge(incident.status)}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Incidents */}
          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>All Incidents</CardTitle>
                <CardDescription>
                  Complete incident history and records
                </CardDescription>
              </CardHeader>
              <CardContent>
                {incidents.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Incidents Reported</h3>
                    <p className="text-gray-600">No security incidents have been reported yet.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Incident</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Reporter</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {incidents.map((incident) => (
                        <TableRow key={incident.id}>
                          <TableCell className="font-medium">
                            <div>
                              <p className="font-medium">{incident.title}</p>
                              {incident.description && (
                                <p className="text-sm text-gray-600 truncate max-w-xs">
                                  {incident.description}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getIncidentTypeName(incident.incident_type)}</TableCell>
                          <TableCell>{getSeverityBadge(incident.severity)}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-2 text-gray-400" />
                              {incident.reporter ? `${incident.reporter.first_name} ${incident.reporter.last_name}` : 'Unknown'}
                            </div>
                          </TableCell>
                          <TableCell>{formatDateTime(incident.created_at)}</TableCell>
                          <TableCell>{getStatusBadge(incident.status)}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Incidents by Type</CardTitle>
                  <CardDescription>Distribution of incident types</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {statistics.incidentsByType.map((item) => (
                      <div key={item.type} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{getIncidentTypeName(item.type)}</span>
                        <div className="flex items-center">
                          <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${statistics.totalIncidents > 0 ? (item.count / statistics.totalIncidents) * 100 : 0}%`
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{item.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Incidents by Severity</CardTitle>
                  <CardDescription>Severity level distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {statistics.incidentsBySeverity.map((item) => (
                      <div key={item.severity} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 capitalize">{item.severity}</span>
                        <div className="flex items-center">
                          <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-red-600 h-2 rounded-full"
                              style={{
                                width: `${statistics.totalIncidents > 0 ? (item.count / statistics.totalIncidents) * 100 : 0}%`
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{item.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}