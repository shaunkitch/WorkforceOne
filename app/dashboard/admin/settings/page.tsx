'use client'

import { useAuth, usePermissions } from '@/lib/auth/hooks'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Settings, 
  Users, 
  Shield, 
  Building, 
  Clock, 
  MapPin, 
  Bell, 
  Database,
  Key,
  Plus,
  Edit,
  Trash2,
  Save,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

interface Organization {
  id: string
  name: string
  address?: string
  phone?: string
  email?: string
  timezone: string
  created_at: string
  settings: {
    auto_logout_minutes: number
    require_gps_for_checkin: boolean
    allow_offline_mode: boolean
    max_shift_hours: number
    break_reminder_interval: number
  }
}

interface Role {
  id: string
  name: string
  permissions: string[]
  created_at: string
}

interface Department {
  id: string
  name: string
  description?: string
  manager_id?: string
  organization_id: string
  created_at: string
}

export default function SettingsPage() {
  const { user } = useAuth()
  const permissions = usePermissions()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('organization')
  
  // State for different settings sections
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [roles, setRoles] = useState<Role[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [systemSettings, setSystemSettings] = useState({
    maintenance_mode: false,
    registration_enabled: true,
    max_failed_logins: 5,
    session_timeout_minutes: 60,
    backup_enabled: true,
    email_notifications: true,
    sms_notifications: false
  })

  // Dialog states
  const [showRoleDialog, setShowRoleDialog] = useState(false)
  const [showDepartmentDialog, setShowDepartmentDialog] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)

  useEffect(() => {
    if (!permissions?.canRead('admin')) {
      router.push('/dashboard')
      return
    }
    loadSettings()
  }, [permissions, router])

  const loadSettings = async () => {
    try {
      setLoading(true)
      
      // Load organization settings
      const orgResponse = await fetch('/api/admin/organization', {
        credentials: 'include'
      })
      if (orgResponse.ok) {
        const orgData = await orgResponse.json()
        setOrganization(orgData.organization)
      }

      // Load roles
      const rolesResponse = await fetch('/api/admin/roles', {
        credentials: 'include'
      })
      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json()
        setRoles(rolesData.roles || [])
      }

      // Load departments
      const deptResponse = await fetch('/api/admin/departments', {
        credentials: 'include'
      })
      if (deptResponse.ok) {
        const deptData = await deptResponse.json()
        setDepartments(deptData.departments || [])
      }

      // Load system settings
      const systemResponse = await fetch('/api/admin/system-settings', {
        credentials: 'include'
      })
      if (systemResponse.ok) {
        const systemData = await systemResponse.json()
        setSystemSettings(prev => ({ ...prev, ...systemData.settings }))
      }

    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveOrganizationSettings = async () => {
    if (!organization) return

    try {
      setSaving(true)
      const response = await fetch('/api/admin/organization', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(organization)
      })

      if (response.ok) {
        // Show success message
        console.log('Organization settings saved')
      }
    } catch (error) {
      console.error('Error saving organization settings:', error)
    } finally {
      setSaving(false)
    }
  }

  const saveSystemSettings = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/admin/system-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ settings: systemSettings })
      })

      if (response.ok) {
        console.log('System settings saved')
      }
    } catch (error) {
      console.error('Error saving system settings:', error)
    } finally {
      setSaving(false)
    }
  }

  const createRole = async (roleData: { name: string; permissions: string[] }) => {
    try {
      const response = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(roleData)
      })

      if (response.ok) {
        await loadSettings()
        setShowRoleDialog(false)
      }
    } catch (error) {
      console.error('Error creating role:', error)
    }
  }

  const createDepartment = async (deptData: { name: string; description?: string }) => {
    try {
      const response = await fetch('/api/admin/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(deptData)
      })

      if (response.ok) {
        await loadSettings()
        setShowDepartmentDialog(false)
      }
    } catch (error) {
      console.error('Error creating department:', error)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">System Settings</h1>
              <p className="text-purple-100">
                Configure organization, users, roles, and system preferences
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <Settings className="h-8 w-8" />
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="organization">Organization</TabsTrigger>
            <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          {/* Organization Settings */}
          <TabsContent value="organization" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Organization Information
                </CardTitle>
                <CardDescription>
                  Manage your organization's basic information and operational settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {organization ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="org-name">Organization Name</Label>
                      <Input
                        id="org-name"
                        value={organization.name}
                        onChange={(e) => setOrganization(prev => prev ? { ...prev, name: e.target.value } : null)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="org-email">Email</Label>
                      <Input
                        id="org-email"
                        type="email"
                        value={organization.email || ''}
                        onChange={(e) => setOrganization(prev => prev ? { ...prev, email: e.target.value } : null)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="org-phone">Phone</Label>
                      <Input
                        id="org-phone"
                        value={organization.phone || ''}
                        onChange={(e) => setOrganization(prev => prev ? { ...prev, phone: e.target.value } : null)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="org-timezone">Timezone</Label>
                      <Select 
                        value={organization.timezone}
                        onValueChange={(value) => setOrganization(prev => prev ? { ...prev, timezone: value } : null)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="America/New_York">Eastern Time</SelectItem>
                          <SelectItem value="America/Chicago">Central Time</SelectItem>
                          <SelectItem value="America/Denver">Mountain Time</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="org-address">Address</Label>
                      <Textarea
                        id="org-address"
                        value={organization.address || ''}
                        onChange={(e) => setOrganization(prev => prev ? { ...prev, address: e.target.value } : null)}
                        rows={3}
                      />
                    </div>
                  </div>
                ) : (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Organization information not found. Please contact support.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Operational Settings */}
                {organization && (
                  <div className="mt-6 border-t pt-6">
                    <h3 className="text-lg font-medium mb-4">Operational Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="auto-logout">Auto-logout (minutes)</Label>
                        <Input
                          id="auto-logout"
                          type="number"
                          value={organization.settings.auto_logout_minutes}
                          onChange={(e) => setOrganization(prev => prev ? {
                            ...prev,
                            settings: { ...prev.settings, auto_logout_minutes: parseInt(e.target.value) || 30 }
                          } : null)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="max-shift-hours">Maximum shift hours</Label>
                        <Input
                          id="max-shift-hours"
                          type="number"
                          value={organization.settings.max_shift_hours}
                          onChange={(e) => setOrganization(prev => prev ? {
                            ...prev,
                            settings: { ...prev.settings, max_shift_hours: parseInt(e.target.value) || 12 }
                          } : null)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="require-gps">Require GPS for check-in</Label>
                        <Switch
                          id="require-gps"
                          checked={organization.settings.require_gps_for_checkin}
                          onCheckedChange={(checked) => setOrganization(prev => prev ? {
                            ...prev,
                            settings: { ...prev.settings, require_gps_for_checkin: checked }
                          } : null)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="allow-offline">Allow offline mode</Label>
                        <Switch
                          id="allow-offline"
                          checked={organization.settings.allow_offline_mode}
                          onCheckedChange={(checked) => setOrganization(prev => prev ? {
                            ...prev,
                            settings: { ...prev.settings, allow_offline_mode: checked }
                          } : null)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <Button onClick={saveOrganizationSettings} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Roles & Permissions */}
          <TabsContent value="roles" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Roles & Permissions</h2>
                <p className="text-gray-600">Define user roles and their access permissions</p>
              </div>
              <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Role
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Role</DialogTitle>
                    <DialogDescription>
                      Define a new role with specific permissions
                    </DialogDescription>
                  </DialogHeader>
                  <RoleForm 
                    role={editingRole}
                    onSubmit={createRole}
                    onCancel={() => setShowRoleDialog(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roles.map((role) => (
                <Card key={role.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Shield className="h-5 w-5 mr-2" />
                        {role.name}
                      </div>
                      <Badge variant="secondary">{role.permissions.length} permissions</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Permissions:</p>
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.slice(0, 3).map((permission, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {permission}
                          </Badge>
                        ))}
                        {role.permissions.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{role.permissions.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 mt-4">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Departments */}
          <TabsContent value="departments" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Departments</h2>
                <p className="text-gray-600">Organize users into departments</p>
              </div>
              <Dialog open={showDepartmentDialog} onOpenChange={setShowDepartmentDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Department
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Department</DialogTitle>
                    <DialogDescription>
                      Add a new department to organize your team
                    </DialogDescription>
                  </DialogHeader>
                  <DepartmentForm 
                    department={editingDepartment}
                    onSubmit={createDepartment}
                    onCancel={() => setShowDepartmentDialog(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {departments.map((department) => (
                <Card key={department.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="h-5 w-5 mr-2" />
                      {department.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {department.description && (
                      <p className="text-sm text-gray-600 mb-4">{department.description}</p>
                    )}
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* System Settings */}
          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  System Configuration
                </CardTitle>
                <CardDescription>
                  Configure system-wide settings and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-medium">General Settings</h3>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                      <Switch
                        id="maintenance-mode"
                        checked={systemSettings.maintenance_mode}
                        onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, maintenance_mode: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="registration-enabled">Allow Registration</Label>
                      <Switch
                        id="registration-enabled"
                        checked={systemSettings.registration_enabled}
                        onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, registration_enabled: checked }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                      <Input
                        id="session-timeout"
                        type="number"
                        value={systemSettings.session_timeout_minutes}
                        onChange={(e) => setSystemSettings(prev => ({ ...prev, session_timeout_minutes: parseInt(e.target.value) || 60 }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium">Notifications</h3>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <Switch
                        id="email-notifications"
                        checked={systemSettings.email_notifications}
                        onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, email_notifications: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sms-notifications">SMS Notifications</Label>
                      <Switch
                        id="sms-notifications"
                        checked={systemSettings.sms_notifications}
                        onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, sms_notifications: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="backup-enabled">Automatic Backups</Label>
                      <Switch
                        id="backup-enabled"
                        checked={systemSettings.backup_enabled}
                        onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, backup_enabled: checked }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={saveSystemSettings} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save System Settings'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Key className="h-5 w-5 mr-2" />
                  Security Configuration
                </CardTitle>
                <CardDescription>
                  Configure security policies and authentication settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="max-failed-logins">Max Failed Login Attempts</Label>
                    <Input
                      id="max-failed-logins"
                      type="number"
                      value={systemSettings.max_failed_logins}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, max_failed_logins: parseInt(e.target.value) || 5 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Password Requirements</Label>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        Minimum 8 characters
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        At least one uppercase letter
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        At least one number
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 mt-6">
                  <h3 className="font-medium mb-4">API Keys & Integrations</h3>
                  <div className="space-y-4">
                    <Alert>
                      <Key className="h-4 w-4" />
                      <AlertDescription>
                        API keys are managed through environment variables for security. 
                        Contact your system administrator to update API configurations.
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}

// Role Form Component
function RoleForm({ 
  role, 
  onSubmit, 
  onCancel 
}: { 
  role: Role | null
  onSubmit: (data: { name: string; permissions: string[] }) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(role?.name || '')
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(role?.permissions || [])

  const availablePermissions = [
    'manage_users', 'view_users', 'manage_roles', 'view_reports',
    'manage_settings', 'view_attendance', 'manage_attendance',
    'view_incidents', 'manage_incidents', 'view_patrols', 'manage_patrols'
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    
    onSubmit({
      name: name.trim(),
      permissions: selectedPermissions
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="role-name">Role Name</Label>
        <Input
          id="role-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Security Supervisor"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label>Permissions</Label>
        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
          {availablePermissions.map((permission) => (
            <div key={permission} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={permission}
                checked={selectedPermissions.includes(permission)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedPermissions(prev => [...prev, permission])
                  } else {
                    setSelectedPermissions(prev => prev.filter(p => p !== permission))
                  }
                }}
                className="rounded border-gray-300"
              />
              <Label htmlFor={permission} className="text-sm">
                {permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {role ? 'Update Role' : 'Create Role'}
        </Button>
      </div>
    </form>
  )
}

// Department Form Component
function DepartmentForm({ 
  department, 
  onSubmit, 
  onCancel 
}: { 
  department: Department | null
  onSubmit: (data: { name: string; description?: string }) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(department?.name || '')
  const [description, setDescription] = useState(department?.description || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    
    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="dept-name">Department Name</Label>
        <Input
          id="dept-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Night Security"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="dept-description">Description (Optional)</Label>
        <Textarea
          id="dept-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of this department's responsibilities"
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {department ? 'Update Department' : 'Create Department'}
        </Button>
      </div>
    </form>
  )
}