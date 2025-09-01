'use client'

import { useAuth } from '@/lib/auth/hooks'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import SimpleLiveMap from '@/components/maps/SimpleLiveMap'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Shield, LogOut, MapPin } from 'lucide-react'

export default function LiveTrackingPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth/login')
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
              <div className="p-2 bg-blue-100 rounded-full mr-3">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Live Guard Tracking</h1>
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
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
                <MapPin className="h-8 w-8 mr-3 text-blue-600" />
                Real-Time Guard Tracking
              </h2>
              <p className="text-gray-600">
                Monitor live GPS locations and status of all active security personnel.
              </p>
            </div>
            <div className="flex space-x-2">
              <Link href="/dashboard/map">
                <Button variant="outline" size="sm">
                  Google Maps Version
                </Button>
              </Link>
              <Link href="/test-livemap">
                <Button variant="outline" size="sm">
                  Debug View
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <SimpleLiveMap />

        {/* Additional Information */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">📍 About This Live Tracking System</h3>
          <div className="text-blue-800 space-y-2">
            <p>• <strong>Real-time GPS tracking</strong> - Updates every 30 seconds automatically</p>
            <p>• <strong>Battery monitoring</strong> - Color-coded battery levels for each guard</p>
            <p>• <strong>Coordinate accuracy</strong> - Displays GPS accuracy radius for each position</p>
            <p>• <strong>Movement tracking</strong> - Shows speed, heading, and altitude when available</p>
            <p>• <strong>Visual & table views</strong> - Switch between map visualization and detailed data table</p>
          </div>
          <div className="mt-4 p-3 bg-white rounded border">
            <p className="text-sm text-gray-600">
              <strong>Note:</strong> This version works without Google Maps API. For satellite imagery and street maps, 
              enable billing on your Google Cloud project for the Google Maps JavaScript API.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}