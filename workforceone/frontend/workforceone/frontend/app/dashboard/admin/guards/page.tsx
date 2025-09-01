'use client'

import { useAuth, usePermissions } from '@/lib/auth/hooks'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ArrowLeft, 
  Shield, 
  Users, 
  Edit, 
  Trash2, 
  UserPlus, 
  Search,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Settings
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Guard {
  id: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  role: {
    id: string
    name: string
    permissions: any
  }
  organization: {
    id: string
    name: string
  }
  department?: {
    id: string
    name: string
  }
  is_active: boolean
  last_login?: string
  created_at: string
  current_shift?: {
    id: string
    start_time: string
    end_time: string
    status: 'scheduled' | 'active' | 'completed'
    location?: string
  }
  total_hours_week?: number
  attendance_rate?: number
}

export default function GuardsManagementPage() {
  const { user, loading } = useAuth()
  const permissions = usePermissions()
  const router = useRouter()
  const [guards, setGuards] = useState<Guard[]>([])
  const [filteredGuards, setFilteredGuards] = useState<Guard[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingGuard, setEditingGuard] = useState<Guard | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [guardToDelete, setGuardToDelete] = useState<Guard | null>(null)
  
  // Available roles for role changes
  const availableRoles = [
    { id: '00000000-0000-0000-0000-000000000001', name: 'Super Admin' },
    { id: '00000000-0000-0000-0000-000000000002', name: 'Guard Supervisor' },
    { id: '00000000-0000-0000-0000-000000000003', name: 'Security Guard' },
    { id: '00000000-0000-0000-0000-000000000004', name: 'Dispatcher' }
  ]

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    // Check if user has admin permissions
    if (permissions && !permissions.canRead('admin')) {
      router.push('/dashboard')
    }
  }, [permissions, router])

  // Fetch guards data
  useEffect(() => {
    if (user?.organization_id) {
      fetchGuards()
    }
  }, [user])

  // Filter guards based on search and filters
  useEffect(() => {
    let filtered = guards

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(guard => 
        `${guard.first_name} ${guard.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guard.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (guard.phone && guard.phone.includes(searchTerm))
      )
    }

    // Role filter
    if (selectedRole !== 'all') {
      filtered = filtered.filter(guard => guard.role.id === selectedRole)
    }

    // Status filter
    if (selectedStatus !== 'all') {
      if (selectedStatus === 'active') {
        filtered = filtered.filter(guard => guard.is_active)
      } else if (selectedStatus === 'inactive') {
        filtered = filtered.filter(guard => !guard.is_active)
      }
    }

    setFilteredGuards(filtered)
  }, [guards, searchTerm, selectedRole, selectedStatus])

  const fetchGuards = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/guards?organization_id=${user?.organization_id}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch guards')
      }
      
      const data = await response.json()
      setGuards(data.guards || [])
    } catch (err) {
      setError('Failed to load guards data')
      console.error('Error fetching guards:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const updateGuardRole = async (guardId: string, newRoleId: string) => {
    try {
      const response = await fetch(`/api/guards/${guardId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role_id: newRoleId }),
      })

      if (!response.ok) {
        throw new Error('Failed to update guard role')
      }

      // Refresh guards data
      await fetchGuards()
    } catch (err) {
      setError('Failed to update guard role')
      console.error('Error updating guard role:', err)
    }
  }

  const updateGuardStatus = async (guardId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/guards/${guardId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: isActive }),
      })

      if (!response.ok) {
        throw new Error('Failed to update guard status')
      }

      // Refresh guards data
      await fetchGuards()
    } catch (err) {
      setError('Failed to update guard status')
      console.error('Error updating guard status:', err)
    }
  }

  const deleteGuard = async (guardId: string) => {
    try {
      const response = await fetch(`/api/guards/${guardId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete guard')
      }

      // Refresh guards data
      await fetchGuards()
      setIsDeleteDialogOpen(false)
      setGuardToDelete(null)
    } catch (err) {
      setError('Failed to delete guard')
      console.error('Error deleting guard:', err)
    }
  }

  const saveGuardChanges = async () => {
    if (!editingGuard) return

    try {
      const response = await fetch(`/api/guards/${editingGuard.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: editingGuard.first_name,
          last_name: editingGuard.last_name,
          email: editingGuard.email,
          phone: editingGuard.phone,
          role_id: editingGuard.role.id,
          department_id: editingGuard.department?.id || null,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update guard')
      }

      // Refresh guards data
      await fetchGuards()
      setIsEditDialogOpen(false)
      setEditingGuard(null)
    } catch (err) {
      setError('Failed to update guard details')
      console.error('Error updating guard:', err)
    }
  }

  const getStatusBadge = (guard: Guard) => {
    if (!guard.is_active) {
      return <Badge variant="secondary">Inactive</Badge>
    }

    if (guard.current_shift) {
      switch (guard.current_shift.status) {
        case 'active':
          return <Badge variant="default" className="bg-green-100 text-green-800">On Duty</Badge>
        case 'scheduled':
          return <Badge variant="outline">Scheduled</Badge>
        case 'completed':
          return <Badge variant="secondary">Off Duty</Badge>
      }
    }

    return <Badge variant="outline">Available</Badge>
  }

  const getRoleBadgeColor = (roleName: string) => {
    switch (roleName) {
      case 'Super Admin':
        return 'bg-red-100 text-red-800'
      case 'Guard Supervisor':
        return 'bg-blue-100 text-blue-800'
      case 'Dispatcher':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Show access denied if user doesn't have admin permissions
  if (permissions && !permissions.canRead('admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access guard management.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/dashboard">
              <Button>Return to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link href="/dashboard/admin">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Admin
                </Button>
              </Link>
              <div className="p-2 bg-blue-100 rounded-full mr-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Guards Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                {filteredGuards.filter(g => g.is_active).length} Active Guards
              </Badge>
              <span className="text-sm text-gray-600">
                {user.first_name} {user.last_name}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Header Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Security Personnel</h2>
          <p className="text-gray-600">
            Manage guard profiles, assignments, and permissions across your organization.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Guards</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{guards.length}</div>
              <p className="text-xs text-muted-foreground">Registered personnel</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Guards</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {guards.filter(g => g.is_active).length}
              </div>
              <p className="text-xs text-muted-foreground">Currently active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">On Duty</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {guards.filter(g => g.current_shift?.status === 'active').length}
              </div>
              <p className="text-xs text-muted-foreground">Working now</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Supervisors</CardTitle>
              <Shield className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {guards.filter(g => g.role.name.includes('Supervisor') || g.role.name.includes('Admin')).length}
              </div>
              <p className="text-xs text-muted-foreground">Management roles</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search guards by name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-80"
                  />
                </div>
                
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {availableRoles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Link href="/dashboard/admin/tokens">
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add New Guard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Guards Table */}
        <Card>
          <CardHeader>
            <CardTitle>Security Personnel ({filteredGuards.length})</CardTitle>
            <CardDescription>
              Manage guard details, roles, and assignments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guard Details</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Role & Status</TableHead>
                    <TableHead>Current Shift</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGuards.map((guard) => (
                    <TableRow key={guard.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                            guard.is_active ? 'bg-green-500' : 'bg-gray-400'
                          }`}>
                            {guard.first_name[0]}{guard.last_name[0]}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {guard.first_name} {guard.last_name}
                            </p>
                            <p className="text-sm text-gray-500">
                              ID: {guard.id.split('-')[0]}...
                            </p>
                            <p className="text-xs text-gray-400">
                              Joined {new Date(guard.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <Mail className="h-3 w-3 mr-1 text-gray-400" />
                            {guard.email}
                          </div>
                          {guard.phone && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="h-3 w-3 mr-1 text-gray-400" />
                              {guard.phone}
                            </div>
                          )}
                          {guard.last_login && (
                            <p className="text-xs text-gray-400">
                              Last login: {new Date(guard.last_login).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-2">
                          <Badge className={getRoleBadgeColor(guard.role.name)}>
                            {guard.role.name}
                          </Badge>
                          {getStatusBadge(guard)}
                          {guard.department && (
                            <div className="flex items-center text-xs text-gray-500">
                              <MapPin className="h-3 w-3 mr-1" />
                              {guard.department.name}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        {guard.current_shift ? (
                          <div className="space-y-1">
                            <p className="text-sm font-medium">
                              {new Date(guard.current_shift.start_time).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })} - {new Date(guard.current_shift.end_time).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            {guard.current_shift.location && (
                              <p className="text-xs text-gray-500">{guard.current_shift.location}</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400">No current shift</p>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          {guard.total_hours_week && (
                            <p className="text-sm">
                              <span className="font-medium">{guard.total_hours_week}h</span>
                              <span className="text-gray-500 text-xs ml-1">this week</span>
                            </p>
                          )}
                          {guard.attendance_rate && (
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-1.5 mr-2">
                                <div 
                                  className="bg-green-600 h-1.5 rounded-full" 
                                  style={{ width: `${guard.attendance_rate}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-500">{guard.attendance_rate}%</span>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => {
                              setEditingGuard(guard)
                              setIsEditDialogOpen(true)
                            }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                            {availableRoles.filter(role => role.id !== guard.role.id).map((role) => (
                              <DropdownMenuItem 
                                key={role.id}
                                onClick={() => updateGuardRole(guard.id, role.id)}
                              >
                                <Settings className="h-4 w-4 mr-2" />
                                Make {role.name}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => updateGuardStatus(guard.id, !guard.is_active)}>
                              {guard.is_active ? (
                                <><XCircle className="h-4 w-4 mr-2" />Deactivate</>
                              ) : (
                                <><CheckCircle className="h-4 w-4 mr-2" />Activate</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => {
                                setGuardToDelete(guard)
                                setIsDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Guard
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredGuards.length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No guards found matching your criteria.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Edit Guard Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Guard Details</DialogTitle>
              <DialogDescription>
                Update guard information and assignments.
              </DialogDescription>
            </DialogHeader>
            {editingGuard && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      value={editingGuard.first_name}
                      onChange={(e) => setEditingGuard({
                        ...editingGuard,
                        first_name: e.target.value
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={editingGuard.last_name}
                      onChange={(e) => setEditingGuard({
                        ...editingGuard,
                        last_name: e.target.value
                      })}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editingGuard.email}
                    onChange={(e) => setEditingGuard({
                      ...editingGuard,
                      email: e.target.value
                    })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={editingGuard.phone || ''}
                    onChange={(e) => setEditingGuard({
                      ...editingGuard,
                      phone: e.target.value
                    })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={editingGuard.role.id}
                    onValueChange={(value) => {
                      const role = availableRoles.find(r => r.id === value)
                      if (role) {
                        setEditingGuard({
                          ...editingGuard,
                          role: { ...editingGuard.role, id: role.id, name: role.name }
                        })
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveGuardChanges}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {guardToDelete?.first_name} {guardToDelete?.last_name}? 
                This action cannot be undone and will permanently remove all their data.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => guardToDelete && deleteGuard(guardToDelete.id)}
              >
                Delete Guard
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}