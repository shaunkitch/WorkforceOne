'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft,
  User, 
  Settings, 
  Bell, 
  Shield, 
  Clock,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Camera,
  LogOut,
  Save,
  Edit3,
  Award,
  TrendingUp,
  CheckCircle2
} from 'lucide-react'
import Link from 'next/link'

interface UserProfile {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  employee_id?: string
  department?: string
  role?: string
  avatar_url?: string
  created_at: string
  last_active?: string
}

interface UserStats {
  totalShifts: number
  totalHours: number
  checkpointsCompleted: number
  incidentsReported: number
  patrolsCompleted: number
  averageRating: number
}

interface NotificationSettings {
  push_notifications: boolean
  shift_reminders: boolean
  incident_alerts: boolean
  patrol_assignments: boolean
  system_updates: boolean
}

export default function ProfilePage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<UserStats>({
    totalShifts: 0,
    totalHours: 0,
    checkpointsCompleted: 0,
    incidentsReported: 0,
    patrolsCompleted: 0,
    averageRating: 0
  })
  
  const [notifications, setNotifications] = useState<NotificationSettings>({
    push_notifications: true,
    shift_reminders: true,
    incident_alerts: true,
    patrol_assignments: true,
    system_updates: false
  })
  
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    first_name: '',
    last_name: '',
    phone: ''
  })
  
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    if (user) {
      setProfile(user as UserProfile)
      setEditData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || ''
      })
      loadUserStats()
      loadNotificationSettings()
    }
  }, [user])

  const loadUserStats = async () => {
    try {
      const response = await fetch('/api/user/stats', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats || stats)
      }
    } catch (error) {
      console.error('Failed to load user stats:', error)
    }
  }

  const loadNotificationSettings = async () => {
    try {
      const response = await fetch('/api/user/notification-settings', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.settings || notifications)
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error)
    }
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editData)
      })
      
      if (response.ok) {
        const updatedUser = await response.json()
        setProfile(updatedUser.user)
        setIsEditing(false)
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch (error) {
      console.error('Failed to save profile:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleNotificationChange = async (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...notifications, [key]: value }
    setNotifications(newSettings)
    
    try {
      await fetch('/api/user/notification-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newSettings)
      })
    } catch (error) {
      console.error('Failed to save notification settings:', error)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth/login')
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <Link href="/mobile">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="font-semibold text-gray-900">Profile</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Edit3 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Profile Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-bold">
                  {profile.first_name?.[0]}{profile.last_name?.[0]}
                </span>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900">
                  {profile.first_name} {profile.last_name}
                </h2>
                <p className="text-gray-600">{profile.role || 'Security Guard'}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="secondary">{profile.department || 'Security'}</Badge>
                  <Badge variant="outline">ID: {profile.employee_id || 'N/A'}</Badge>
                </div>
              </div>
            </div>
            
            {saveSuccess && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2 text-green-800">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm">Profile updated successfully!</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Personal Information</CardTitle>
            {isEditing && (
              <CardDescription>Update your personal details</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      value={editData.first_name}
                      onChange={(e) => setEditData(prev => ({ ...prev, first_name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={editData.last_name}
                      onChange={(e) => setEditData(prev => ({ ...prev, last_name: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={editData.phone}
                    onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button onClick={handleSaveProfile} disabled={isSaving} className="flex-1">
                    {isSaving ? 'Saving...' : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-900">{profile.email}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-900">{profile.phone || 'Not provided'}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-900">
                    Joined {new Date(profile.created_at).toLocaleDateString()}
                  </span>
                </div>
                {profile.last_active && (
                  <div className="flex items-center space-x-3">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-900">
                      Last active {new Date(profile.last_active).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Performance Overview
            </CardTitle>
            <CardDescription>Your work statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{stats.totalShifts}</p>
                <p className="text-xs text-gray-600">Total Shifts</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{stats.totalHours.toFixed(1)}h</p>
                <p className="text-xs text-gray-600">Hours Worked</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{stats.checkpointsCompleted}</p>
                <p className="text-xs text-gray-600">Checkpoints</p>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">{stats.incidentsReported}</p>
                <p className="text-xs text-gray-600">Incidents</p>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Award className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-900">Performance Rating</span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-yellow-600">
                    {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : 'N/A'}
                  </p>
                  <p className="text-xs text-yellow-700">out of 5.0</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <Bell className="h-4 w-4 mr-2" />
              Notification Settings
            </CardTitle>
            <CardDescription>Manage your notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-gray-600">Receive push notifications</p>
              </div>
              <Switch
                checked={notifications.push_notifications}
                onCheckedChange={(checked) => handleNotificationChange('push_notifications', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Shift Reminders</p>
                <p className="text-sm text-gray-600">Reminders for upcoming shifts</p>
              </div>
              <Switch
                checked={notifications.shift_reminders}
                onCheckedChange={(checked) => handleNotificationChange('shift_reminders', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Incident Alerts</p>
                <p className="text-sm text-gray-600">Alerts for new incidents</p>
              </div>
              <Switch
                checked={notifications.incident_alerts}
                onCheckedChange={(checked) => handleNotificationChange('incident_alerts', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Patrol Assignments</p>
                <p className="text-sm text-gray-600">Notifications for patrol tasks</p>
              </div>
              <Switch
                checked={notifications.patrol_assignments}
                onCheckedChange={(checked) => handleNotificationChange('patrol_assignments', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">System Updates</p>
                <p className="text-sm text-gray-600">App updates and announcements</p>
              </div>
              <Switch
                checked={notifications.system_updates}
                onCheckedChange={(checked) => handleNotificationChange('system_updates', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* App Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <Settings className="h-4 w-4 mr-2" />
              App Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/mobile/attendance-history">
              <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                <div className="flex items-center space-x-3">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>Attendance History</span>
                </div>
                <span className="text-gray-400">›</span>
              </div>
            </Link>
            
            <Link href="/mobile/patrol-history">
              <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>Patrol History</span>
                </div>
                <span className="text-gray-400">›</span>
              </div>
            </Link>
            
            <Link href="/mobile/incident-history">
              <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                <div className="flex items-center space-x-3">
                  <Shield className="h-4 w-4 text-gray-500" />
                  <span>Incident Reports</span>
                </div>
                <span className="text-gray-400">›</span>
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation Space */}
      <div className="h-16"></div>
    </div>
  )
}