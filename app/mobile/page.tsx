'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  MapPin, 
  AlertTriangle, 
  Clock, 
  Activity, 
  Scan, 
  UserCheck, 
  Settings,
  Bell,
  User,
  Map,
  FileText,
  PhoneCall,
  Camera,
  Navigation,
  Battery,
  Signal
} from 'lucide-react'
import Link from 'next/link'

interface UserStats {
  activeShift: boolean
  currentPatrol: string | null
  completedCheckpoints: number
  totalCheckpoints: number
  incidentsReported: number
  lastCheckIn: string | null
}

export default function MobileDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<UserStats>({
    activeShift: false,
    currentPatrol: null,
    completedCheckpoints: 0,
    totalCheckpoints: 0,
    incidentsReported: 0,
    lastCheckIn: null
  })
  const [currentTime, setCurrentTime] = useState(new Date())
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null)
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Update time every minute
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 60000)
    
    // Check battery status
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100))
      })
    }

    // Check online status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      clearInterval(timeInterval)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const quickActions = [
    {
      title: 'Check In/Out',
      description: 'Clock in or out of your shift',
      icon: UserCheck,
      href: '/attendance/scan',
      color: 'bg-green-500',
      isWorking: true
    },
    {
      title: 'Start Patrol',
      description: 'Begin your patrol route',
      icon: Navigation,
      href: '/patrols/start',
      color: 'bg-blue-500',
      isWorking: true
    },
    {
      title: 'Scan Checkpoint',
      description: 'Verify checkpoint with QR/NFC',
      icon: Scan,
      href: '/dashboard/checkpoints',
      color: 'bg-purple-500',
      isWorking: false
    },
    {
      title: 'Report Incident',
      description: 'Create incident report',
      icon: AlertTriangle,
      href: '/mobile/incident-report',
      color: 'bg-red-500',
      isWorking: false
    },
    {
      title: 'View Map',
      description: 'See your location and routes',
      icon: Map,
      href: '/mobile/map',
      color: 'bg-indigo-500',
      isWorking: false
    },
    {
      title: 'My Profile',
      description: 'View profile and settings',
      icon: User,
      href: '/mobile/profile',
      color: 'bg-gray-500',
      isWorking: false
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Status Bar */}
      <div className="bg-white border-b px-4 py-2 flex justify-between items-center text-xs">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Signal className={`h-3 w-3 ${isOnline ? 'text-green-500' : 'text-red-500'}`} />
            <span className={isOnline ? 'text-green-600' : 'text-red-600'}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          {batteryLevel !== null && (
            <div className="flex items-center space-x-1">
              <Battery className={`h-3 w-3 ${batteryLevel > 20 ? 'text-green-500' : 'text-red-500'}`} />
              <span>{batteryLevel}%</span>
            </div>
          )}
        </div>
        <span className="text-gray-600">{currentTime.toLocaleTimeString()}</span>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-4 py-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold mb-1">WorkforceOne Guard</h1>
            <p className="text-blue-100">Welcome back, {user?.first_name}</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        {/* Current Status */}
        <div className="mt-4 p-3 bg-white/10 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-blue-100">Current Status</p>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant={stats.activeShift ? 'default' : 'secondary'} className="bg-white/20 text-white">
                  {stats.activeShift ? 'On Duty' : 'Off Duty'}
                </Badge>
                {stats.currentPatrol && (
                  <Badge variant="outline" className="border-white/40 text-white">
                    {stats.currentPatrol}
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-100">Progress</p>
              <p className="text-lg font-semibold">
                {stats.completedCheckpoints}/{stats.totalCheckpoints}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-4 -mt-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-white shadow-md">
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 mx-auto text-blue-600 mb-2" />
              <p className="text-2xl font-bold text-gray-900">8.5</p>
              <p className="text-xs text-gray-600">Hours Today</p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-md">
            <CardContent className="p-4 text-center">
              <MapPin className="h-6 w-6 mx-auto text-green-600 mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.completedCheckpoints}</p>
              <p className="text-xs text-gray-600">Checkpoints</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-4">
          {quickActions.map((action) => {
            const IconComponent = action.icon
            return (
              <Link key={action.title} href={action.href}>
                <Card className={`hover:shadow-lg transition-all duration-200 ${!action.isWorking ? 'opacity-75' : ''}`}>
                  <CardContent className="p-4 text-center">
                    <div className={`w-12 h-12 ${action.color} rounded-full flex items-center justify-center mx-auto mb-3`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-medium text-gray-900 mb-1">{action.title}</h3>
                    <p className="text-xs text-gray-600 leading-tight">{action.description}</p>
                    {!action.isWorking && (
                      <Badge variant="secondary" className="mt-2 text-xs">Coming Soon</Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="px-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">Checkpoint scanned at Main Gate</p>
                  <p className="text-xs text-gray-500">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">Patrol started: Building A Route</p>
                  <p className="text-xs text-gray-500">15 minutes ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-gray-400 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">Shift started</p>
                  <p className="text-xs text-gray-500">1 hour ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Emergency Contact */}
      <div className="px-4 mb-6">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-red-900">Emergency</h3>
                <p className="text-sm text-red-700">24/7 Security Control</p>
              </div>
              <Button className="bg-red-600 hover:bg-red-700">
                <PhoneCall className="h-4 w-4 mr-2" />
                Call Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="grid grid-cols-4 gap-1">
          <Link href="/mobile" className="flex flex-col items-center py-2 px-1 text-blue-600">
            <Shield className="h-5 w-5" />
            <span className="text-xs mt-1">Home</span>
          </Link>
          <Link href="/mobile/patrols" className="flex flex-col items-center py-2 px-1 text-gray-600 hover:text-blue-600">
            <Activity className="h-5 w-5" />
            <span className="text-xs mt-1">Patrols</span>
          </Link>
          <Link href="/mobile/incidents" className="flex flex-col items-center py-2 px-1 text-gray-600 hover:text-blue-600">
            <FileText className="h-5 w-5" />
            <span className="text-xs mt-1">Reports</span>
          </Link>
          <Link href="/mobile/profile" className="flex flex-col items-center py-2 px-1 text-gray-600 hover:text-blue-600">
            <User className="h-5 w-5" />
            <span className="text-xs mt-1">Profile</span>
          </Link>
        </div>
      </div>
    </div>
  )
}