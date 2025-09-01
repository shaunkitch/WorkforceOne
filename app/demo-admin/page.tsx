'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  LayoutDashboard, 
  Users, 
  MapPin, 
  Shield, 
  AlertTriangle, 
  Settings, 
  BarChart3, 
  Key, 
  QrCode,
  Menu,
  LogOut,
  Bell,
  Search,
  User,
  Clock,
  Activity,
  Zap,
  UserCheck
} from 'lucide-react'

const sidebarNavItems = [
  {
    title: 'Overview',
    href: '/demo-admin',
    icon: LayoutDashboard,
    description: 'Security operations center'
  },
  {
    title: 'Guards',
    href: '/dashboard/admin/guards',
    icon: Users,
    description: 'Manage security personnel'
  },
  {
    title: 'Attendance',
    href: '/dashboard/attendance',
    icon: Shield,
    description: 'Track guard check-ins'
  },
  {
    title: 'Patrols',
    href: '/dashboard/patrols',
    icon: MapPin,
    description: 'Monitor patrol routes'
  },
  {
    title: 'Live Tracking',
    href: '/dashboard/live-tracking',
    icon: BarChart3,
    description: 'Real-time location monitoring'
  },
  {
    title: 'Incidents',
    href: '/dashboard/incidents',
    icon: AlertTriangle,
    description: 'Security incident management'
  },
  {
    title: 'Tokens',
    href: '/dashboard/admin/tokens',
    icon: QrCode,
    description: 'Registration QR codes'
  },
  {
    title: 'Settings',
    href: '/dashboard/admin/settings',
    icon: Settings,
    description: 'System configuration'
  }
]

export default function DemoAdminPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  const demoStats = {
    activeGuards: 12,
    ongoingPatrols: 8,
    openIncidents: 3,
    criticalAlerts: 1,
    averageResponseTime: '4.2 min',
    systemStatus: 'operational'
  }

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">WorkforceOne</h1>
            <p className="text-xs text-gray-500">Admin Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {sidebarNavItems.map((item) => {
          const isActive = item.href === '/demo-admin'
          const Icon = item.icon

          return (
            <div
              key={item.href}
              className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-gray-100 ${
                isActive 
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              <Icon className={`mr-3 h-5 w-5 flex-shrink-0 ${
                isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
              }`} />
              <div className="flex-1">
                <div className="font-medium">{item.title}</div>
                <div className={`text-xs mt-0.5 ${
                  isActive ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {item.description}
                </div>
              </div>
            </div>
          )
        })}
      </nav>

      {/* User Menu */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              Demo User
            </p>
            <p className="text-xs text-gray-500 truncate">demo@workforceone.co.za</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-80 lg:flex-col lg:bg-white lg:shadow-sm">
        <SidebarContent />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 lg:shadow-none lg:border-b-0">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden mr-2"
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Demo Admin
                </h2>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 hidden sm:flex">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                System Online
              </Badge>

              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </Button>

              <Button variant="ghost" size="sm" className="hidden sm:flex">
                <Search className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">
      <div className="p-6 space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome to the Demo!</h1>
              <p className="text-blue-100 text-lg">
                Modern Admin Dashboard - WorkforceOne Security Operations Center
              </p>
            </div>
            <div className="hidden md:block">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center">
                <Shield className="h-10 w-10 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Demo Alert */}
        <Alert className="bg-blue-50 border-blue-200">
          <AlertDescription className="text-blue-800">
            This is a demonstration of the new modern admin interface with sidebar navigation. 
            All features are fully functional in the production environment.
          </AlertDescription>
        </Alert>

        {/* Real-time Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-sm font-medium text-green-800">Active Guards</CardTitle>
                <div className="text-3xl font-bold text-green-600 mt-2">{demoStats.activeGuards}</div>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-green-700">Currently on duty</p>
              <div className="w-full bg-green-200 rounded-full h-2 mt-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '78%' }}></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-sm font-medium text-blue-800">Active Patrols</CardTitle>
                <div className="text-3xl font-bold text-blue-600 mt-2">{demoStats.ongoingPatrols}</div>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-blue-700">Routes in progress</p>
              <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-sm font-medium text-yellow-800">Open Incidents</CardTitle>
                <div className="text-3xl font-bold text-yellow-600 mt-2">{demoStats.openIncidents}</div>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-yellow-700">Requiring attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Response Time</p>
                  <p className="text-2xl font-bold text-gray-900">{demoStats.averageResponseTime}</p>
                  <p className="text-xs text-gray-500">Average response</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">System Status</p>
                  <p className="text-2xl font-bold text-gray-900">99.9%</p>
                  <p className="text-xs text-gray-500">Uptime today</p>
                </div>
                <div className="p-3 bg-emerald-100 rounded-full">
                  <Activity className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Alerts</p>
                  <p className="text-2xl font-bold text-red-600">{demoStats.criticalAlerts}</p>
                  <p className="text-xs text-gray-500">Critical priority</p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <Zap className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-xl">
            <TabsTrigger value="overview" className="rounded-lg font-medium">Overview</TabsTrigger>
            <TabsTrigger value="features" className="rounded-lg font-medium">Features</TabsTrigger>
            <TabsTrigger value="quick-actions" className="rounded-lg font-medium">Quick Actions</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Modern Admin Interface</CardTitle>
                <CardDescription>
                  Experience the new WorkforceOne admin dashboard with enhanced features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">Key Features</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-center">✓ Modern sidebar navigation</li>
                      <li className="flex items-center">✓ Responsive mobile design</li>
                      <li className="flex items-center">✓ Real-time statistics</li>
                      <li className="flex items-center">✓ Enhanced visual hierarchy</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">Improvements</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-center">✓ Gradient card designs</li>
                      <li className="flex items-center">✓ Smooth animations</li>
                      <li className="flex items-center">✓ Better user experience</li>
                      <li className="flex items-center">✓ Professional appearance</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sidebar Navigation</CardTitle>
                  <CardDescription>Easy access to all sections</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    The new sidebar provides quick navigation to all admin sections including guards management,
                    attendance tracking, patrols monitoring, and system settings.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Mobile Responsive</CardTitle>
                  <CardDescription>Works on all devices</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    The interface automatically adapts to different screen sizes with a collapsible
                    sidebar for mobile devices.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Quick Actions */}
          <TabsContent value="quick-actions">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:shadow-lg transition-all duration-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-blue-800">
                    <Users className="h-5 w-5 mr-2" />
                    Guard Management
                  </CardTitle>
                  <CardDescription>Manage security personnel</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    <Users className="h-4 w-4 mr-2" />
                    Manage Guards
                  </Button>
                  <Button variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50">
                    <QrCode className="h-4 w-4 mr-2" />
                    Registration Tokens
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:shadow-lg transition-all duration-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-green-800">
                    <Shield className="h-5 w-5 mr-2" />
                    Security Operations
                  </CardTitle>
                  <CardDescription>Monitor and control security</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    <UserCheck className="h-4 w-4 mr-2" />
                    Attendance Logs
                  </Button>
                  <Button variant="outline" className="w-full border-green-200 text-green-700 hover:bg-green-50">
                    <MapPin className="h-4 w-4 mr-2" />
                    Patrol Routes
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 hover:shadow-lg transition-all duration-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-purple-800">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Incident Response
                  </CardTitle>
                  <CardDescription>Emergency and incident handling</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    View Incidents
                  </Button>
                  <Button variant="outline" className="w-full border-purple-200 text-purple-700 hover:bg-purple-50">
                    <Activity className="h-4 w-4 mr-2" />
                    Live Tracking
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
        </main>
      </div>
    </div>
  )
}