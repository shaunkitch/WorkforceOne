'use client'

import { useAuth, usePermissions } from '@/lib/auth/hooks'
import AdminLayout from '@/components/layout/AdminLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, MapPin, AlertTriangle, Users, Activity, Scan, Settings, UserCheck } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { user } = useAuth()
  const permissions = usePermissions()

  return (
    <AdminLayout>
      <div className="p-6 space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Security Dashboard</h1>
              <p className="text-blue-100">
                Monitor patrols, manage incidents, and track security operations in real-time.
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <Shield className="h-8 w-8" />
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Patrols</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">+2 from yesterday</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Incidents</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">-1 from yesterday</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Guards On Duty</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">28</div>
              <p className="text-xs text-muted-foreground">Across 8 locations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Checkpoints</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156</div>
              <p className="text-xs text-muted-foreground">Completed today</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`}>
          <Link href="/dashboard/attendance">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserCheck className="h-5 w-5 mr-2 text-indigo-600" />
                  Attendance Monitor
                </CardTitle>
                <CardDescription>
                  Track guard check-ins, shifts, and QR code attendance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  Open Attendance
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/live-tracking">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-blue-600" />
                  Live Tracking
                </CardTitle>
                <CardDescription>
                  Real-time GPS tracking of all active guards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  View Live Map
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/map">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-green-600" />
                  Google Maps
                </CardTitle>
                <CardDescription>
                  View guard locations with Google Maps integration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  Open Map View
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/incidents">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
                  Incidents
                </CardTitle>
                <CardDescription>
                  Report and manage security incidents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  Manage Incidents
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/patrols">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-green-600" />
                  Patrols
                </CardTitle>
                <CardDescription>
                  Schedule and monitor patrol activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  View Patrols
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/checkpoints">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Scan className="h-5 w-5 mr-2 text-purple-600" />
                  Checkpoint Scanner
                </CardTitle>
                <CardDescription>
                  Scan QR codes and NFC tags during patrols
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  Open Scanner
                </Button>
              </CardContent>
            </Card>
          </Link>

          {/* Admin Console - Only show for users with admin permissions */}
          {permissions?.canRead('admin') && (
            <>
              <Link href="/dashboard/admin">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Settings className="h-5 w-5 mr-2 text-red-600" />
                      Admin Console
                    </CardTitle>
                    <CardDescription>
                      Real-time monitoring and system management
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" variant="outline">
                      Open Console
                    </Button>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/dashboard/admin/settings">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Settings className="h-5 w-5 mr-2 text-purple-600" />
                      System Settings
                    </CardTitle>
                    <CardDescription>
                      Configure organization, roles, and system preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" variant="outline">
                      Configure System
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            </>
          )}
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest security events and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Patrol #P-2024-001 completed checkpoint at Main Entrance</span>
                <span className="text-xs text-gray-400">2 minutes ago</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Incident I-2024-005 reported at Parking Lot B</span>
                <span className="text-xs text-gray-400">15 minutes ago</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Guard John Smith started shift at Location A</span>
                <span className="text-xs text-gray-400">1 hour ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}