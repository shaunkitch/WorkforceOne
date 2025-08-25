'use client'

import { useAuth } from '@/lib/auth/hooks'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PatrolService, Patrol, CheckpointVisit } from '@/lib/patrols/service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Shield, LogOut, Play, MapPin, Clock, User, Activity, Navigation, Zap } from 'lucide-react'

interface LivePatrolData extends Patrol {
  visits?: CheckpointVisit[]
  lastPosition?: {
    latitude: number
    longitude: number
    timestamp: string
  }
}

export default function LivePatrolsPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [activePatrols, setActivePatrols] = useState<LivePatrolData[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.organization_id) {
      loadLiveData()
      
      // Set up real-time updates every 30 seconds
      const interval = setInterval(loadLiveData, 30000)
      setRefreshInterval(interval)
      
      return () => {
        if (interval) clearInterval(interval)
      }
    }
  }, [user])

  const loadLiveData = async () => {
    if (!user?.organization_id) return

    setLoadingData(true)
    try {
      const patrols = await PatrolService.getActivePatrols(user.organization_id)
      
      // Fetch checkpoint visits for each active patrol
      const patrolsWithVisits = await Promise.all(
        patrols.map(async (patrol) => {
          const visits = await PatrolService.getCheckpointVisits(patrol.id)
          return {
            ...patrol,
            visits,
            lastPosition: visits.length > 0 ? {
              latitude: visits[visits.length - 1].latitude || 0,
              longitude: visits[visits.length - 1].longitude || 0,
              timestamp: visits[visits.length - 1].visited_at
            } : undefined
          }
        })
      )
      
      setActivePatrols(patrolsWithVisits)
    } catch (error) {
      console.error('Error loading live patrol data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const getTimeElapsed = (startTime?: string) => {
    if (!startTime) return 'Not started'
    const start = new Date(startTime).getTime()
    const now = new Date().getTime()
    const elapsed = Math.floor((now - start) / (1000 * 60)) // minutes
    
    if (elapsed < 60) return `${elapsed}m`
    const hours = Math.floor(elapsed / 60)
    const minutes = elapsed % 60
    return `${hours}h ${minutes}m`
  }

  const getLastActivity = (visits?: CheckpointVisit[]) => {
    if (!visits || visits.length === 0) return 'No activity'
    const lastVisit = visits[visits.length - 1]
    const elapsed = Math.floor((new Date().getTime() - new Date(lastVisit.visited_at).getTime()) / (1000 * 60))
    return `${elapsed}m ago at ${lastVisit.location?.name}`
  }

  const getProgressColor = (completed: number, total: number) => {
    const percentage = (completed / total) * 100
    if (percentage < 25) return 'bg-red-500'
    if (percentage < 50) return 'bg-orange-500'
    if (percentage < 75) return 'bg-yellow-500'
    return 'bg-green-500'
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
              <Link href="/dashboard/patrols">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Patrols
                </Button>
              </Link>
              <div className="p-2 bg-green-100 rounded-full mr-3">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Live Patrol Tracking</h1>
              <div className="ml-3 flex items-center">
                <div className="animate-pulse h-2 w-2 bg-green-500 rounded-full mr-1"></div>
                <span className="text-xs text-gray-500">Live</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={loadLiveData}>
                <Zap className="h-4 w-4 mr-2" />
                Refresh
              </Button>
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
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Active Patrols</h2>
          <p className="text-gray-600">
            Real-time monitoring of guards currently on patrol. Updates every 30 seconds.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Patrols</CardTitle>
              <Play className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activePatrols.length}</div>
              <p className="text-xs text-muted-foreground">Currently in progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Guards on Duty</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activePatrols.length}</div>
              <p className="text-xs text-muted-foreground">Active guards</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Checkpoints</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activePatrols.reduce((sum, p) => sum + p.checkpoints_completed, 0)} / {activePatrols.reduce((sum, p) => sum + p.total_checkpoints, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Completed today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
              <Navigation className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activePatrols.length > 0 
                  ? Math.round(activePatrols.reduce((sum, p) => sum + (p.checkpoints_completed / p.total_checkpoints * 100), 0) / activePatrols.length)
                  : 0
                }%
              </div>
              <p className="text-xs text-muted-foreground">Completion rate</p>
            </CardContent>
          </Card>
        </div>

        {activePatrols.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="p-4 bg-gray-100 rounded-full mb-4">
                <Shield className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Patrols</h3>
              <p className="text-gray-600 text-center max-w-md">
                There are currently no guards on patrol. Start a patrol from the patrol management page.
              </p>
              <Link href="/dashboard/patrols/assign" className="mt-4">
                <Button>
                  <Play className="h-4 w-4 mr-2" />
                  Start Patrol
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activePatrols.map((patrol) => (
              <Card key={patrol.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-full mr-3">
                        <User className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {patrol.guard?.first_name} {patrol.guard?.last_name}
                        </CardTitle>
                        <CardDescription>
                          {patrol.route?.name || 'Custom Route'}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <Activity className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Progress */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Checkpoint Progress</span>
                        <span>{patrol.checkpoints_completed} / {patrol.total_checkpoints}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getProgressColor(patrol.checkpoints_completed, patrol.total_checkpoints)}`}
                          style={{
                            width: `${(patrol.checkpoints_completed / patrol.total_checkpoints) * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Time Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="flex items-center text-gray-600 mb-1">
                          <Clock className="h-4 w-4 mr-1" />
                          Duration
                        </div>
                        <div className="font-medium">{getTimeElapsed(patrol.start_time)}</div>
                      </div>
                      <div>
                        <div className="flex items-center text-gray-600 mb-1">
                          <MapPin className="h-4 w-4 mr-1" />
                          Last Activity
                        </div>
                        <div className="font-medium text-xs">{getLastActivity(patrol.visits)}</div>
                      </div>
                    </div>

                    {/* Recent Checkpoints */}
                    {patrol.visits && patrol.visits.length > 0 && (
                      <div>
                        <div className="text-sm text-gray-600 mb-2">Recent Checkpoints</div>
                        <div className="space-y-1">
                          {patrol.visits.slice(-3).map((visit) => (
                            <div key={visit.id} className="flex items-center text-xs bg-gray-50 rounded p-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                              <div className="flex-1">
                                <div className="font-medium">{visit.location?.name}</div>
                                <div className="text-gray-500">
                                  {new Date(visit.visited_at).toLocaleTimeString()} • {visit.verification_method}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {patrol.notes && (
                      <div className="text-xs text-gray-600 bg-gray-50 rounded p-2">
                        <strong>Notes:</strong> {patrol.notes}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Auto-refresh indicator */}
        <div className="fixed bottom-4 right-4">
          <div className="bg-white rounded-full shadow-lg px-3 py-2 text-xs text-gray-600 flex items-center">
            <div className="animate-pulse h-2 w-2 bg-green-500 rounded-full mr-2"></div>
            Auto-updating every 30s
          </div>
        </div>
      </main>
    </div>
  )
}