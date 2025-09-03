'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth/hooks'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
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
  User
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Toaster } from '@/components/ui/toaster'

interface AdminLayoutProps {
  children: React.ReactNode
  className?: string
}

const sidebarNavItems = [
  {
    title: 'Overview',
    href: '/dashboard/admin',
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
    href: '/dashboard/admin/incident-reports',
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

export default function AdminLayout({ children, className }: AdminLayoutProps) {
  const pathname = usePathname()
  const { user, signOut, loading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    window.location.href = '/auth/login'
    return null
  }

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/auth/login'
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
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => mobile && setSidebarOpen(false)}
              className={cn(
                'group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-gray-100',
                isActive 
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
                  : 'text-gray-700 hover:text-gray-900'
              )}
            >
              <Icon className={cn(
                'mr-3 h-5 w-5 flex-shrink-0',
                isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
              )} />
              <div className="flex-1">
                <div className="font-medium">{item.title}</div>
                <div className={cn(
                  'text-xs mt-0.5',
                  isActive ? 'text-blue-600' : 'text-gray-500'
                )}>
                  {item.description}
                </div>
              </div>
            </Link>
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
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
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

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-80 p-0">
          <SidebarContent mobile />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 lg:shadow-none lg:border-b-0">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
            <div className="flex items-center">
              {/* Mobile Menu Button */}
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="lg:hidden mr-2"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
              </Sheet>
              
              {/* Page Title */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {sidebarNavItems.find(item => pathname === item.href || pathname.startsWith(item.href + '/'))?.title || 'Admin'}
                </h2>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-4">
              {/* System Status */}
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 hidden sm:flex">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                System Online
              </Badge>

              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </Button>

              {/* Quick Search */}
              <Button variant="ghost" size="sm" className="hidden sm:flex">
                <Search className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className={cn('flex-1 overflow-auto', className)}>
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  )
}