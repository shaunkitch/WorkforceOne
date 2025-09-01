'use client'

import { useAuth } from '@/lib/auth/hooks'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import AdminLayout from '@/components/layout/AdminLayout'
import SimpleLiveMap from '@/components/maps/SimpleLiveMap'
import { Button } from '@/components/ui/button'
import { Shield, MapPin } from 'lucide-react'

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


  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Live Guard Tracking</h1>
              <p className="text-blue-100">
                Monitor live GPS locations and status of all active security personnel
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <MapPin className="h-8 w-8" />
            </div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Real-Time Tracking</h2>
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
      </div>
    </AdminLayout>
  )
}