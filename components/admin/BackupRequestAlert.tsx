'use client'

import { useEffect, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, MapPin, Clock, User, Shield, X, CheckCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth/hooks'

// Extend Window interface for webkit audio context
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext
  }
}

interface BackupRequest {
  id: string
  guard_id: string
  organization_id: string
  patrol_id?: string
  emergency_type: string
  status: 'active' | 'acknowledged' | 'resolved'
  current_latitude?: number
  current_longitude?: number
  closest_checkpoint_id?: string
  distance_to_checkpoint?: number
  notes?: string
  created_at: string
  updated_at: string
  guard: {
    first_name: string
    last_name: string
    email: string
  }
  location?: {
    name: string
    address?: string
    latitude?: number
    longitude?: number
  }
}

export default function BackupRequestAlert() {
  const { user } = useAuth()
  const [backupRequests, setBackupRequests] = useState<BackupRequest[]>([])
  const [loading, setLoading] = useState(false)

  const fetchBackupRequests = async () => {
    if (!user?.organization_id) {
      return
    }
    
    try {
      const url = `/api/backup-requests?organization_id=${user.organization_id}`
      
      const response = await fetch(url)
      
      if (response.ok) {
        const data = await response.json()
        const requests = data.backupRequests || []
        
        
        // Fetch guard details for each request
        const requestsWithGuards = await Promise.all(requests.map(async (request: any) => {
          try {
            const guardResponse = await fetch(`/api/users/${request.guard_id}`)
            const guardData = guardResponse.ok ? await guardResponse.json() : null
            
            let locationData = null
            if (request.closest_checkpoint_id) {
              const locationResponse = await fetch(`/api/locations/${request.closest_checkpoint_id}`)
              locationData = locationResponse.ok ? await locationResponse.json() : null
            }
            
            return {
              ...request,
              guard: guardData || { first_name: 'Unknown', last_name: 'Guard', email: '' },
              location: locationData
            }
          } catch (err) {
            return {
              ...request,
              guard: { first_name: 'Unknown', last_name: 'Guard', email: '' },
              location: null
            }
          }
        }))
        
        setBackupRequests(requestsWithGuards)
      } else {
      }
    } catch (error) {
    }
  }

  const updateRequestStatus = async (requestId: string, status: 'acknowledged' | 'resolved', notes?: string) => {
    
    if (!user) {
      return
    }
    
    setLoading(true)
    try {
      const requestData = {
        id: requestId,
        status,
        responded_by: user.id,
        response_time: new Date().toISOString(),
        resolution_notes: notes
      }
      
      
      const response = await fetch('/api/backup-requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })
      
      
      const responseData = await response.json()

      if (response.ok) {
        // Refresh the backup requests
        fetchBackupRequests()
        
        if (status === 'acknowledged') {
        } else if (status === 'resolved') {
        }
      } else {
      }
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  // Poll for new backup requests every 5 seconds
  useEffect(() => {
    fetchBackupRequests()
    
    const interval = setInterval(() => {
      fetchBackupRequests()
    }, 5000)

    return () => clearInterval(interval)
  }, [user?.organization_id])

  // Play alert sound when new backup requests come in
  useEffect(() => {
    const activeRequests = backupRequests.filter(req => req.status === 'active')
    if (activeRequests.length > 0) {
      // Try to play audio alert with fallback to system beep
      try {
        const audio = new Audio('/sounds/alert.mp3')
        audio.play().catch((audioError) => {
          // Fallback: Use Web Audio API for a simple beep
          try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)()
            const oscillator = audioContext.createOscillator()
            const gainNode = audioContext.createGain()
            
            oscillator.connect(gainNode)
            gainNode.connect(audioContext.destination)
            
            oscillator.frequency.value = 800 // 800 Hz beep
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
            
            oscillator.start()
            oscillator.stop(audioContext.currentTime + 0.5)
          } catch (beepError) {
          }
        })
      } catch (error) {
      }
    }
  }, [backupRequests])

  const urgentRequests = backupRequests.filter(req => req.status === 'active' || req.status === 'acknowledged')
  
  if (urgentRequests.length === 0) {
    return null // Don't show anything if no urgent requests
  }
  

  return (
    <div className="fixed top-4 right-4 z-50 space-y-4 max-w-md">
      {urgentRequests.map((request) => (
        <Card key={request.id} className={`border-2 shadow-2xl ${
          request.status === 'active' 
            ? 'border-red-500 bg-red-50 animate-pulse' 
            : 'border-yellow-500 bg-yellow-50'
        }`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className={`h-6 w-6 ${request.status === 'active' ? 'text-red-600' : 'text-yellow-600'}`} />
                <CardTitle className={`text-lg ${request.status === 'active' ? 'text-red-800' : 'text-yellow-800'}`}>
                  {request.status === 'active' ? '🚨 BACKUP REQUESTED' : '⏳ ACKNOWLEDGED'}
                </CardTitle>
              </div>
              <Badge variant={request.status === 'active' ? 'destructive' : 'default'} className={request.status === 'active' ? 'bg-red-600' : 'bg-yellow-600'}>
                {request.status === 'active' ? 'URGENT' : 'IN PROGRESS'}
              </Badge>
            </div>
            <CardDescription className={request.status === 'active' ? 'text-red-700' : 'text-yellow-700'}>
              {request.status === 'active' 
                ? 'Emergency assistance needed immediately' 
                : 'Backup request has been acknowledged'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Guard Information */}
            <div className="flex items-center gap-2 p-3 bg-white rounded-lg">
              <User className="h-4 w-4 text-gray-600" />
              <div>
                <div className="font-semibold text-gray-900">
                  {request.guard.first_name} {request.guard.last_name}
                </div>
                <div className="text-sm text-gray-600">{request.guard.email}</div>
              </div>
            </div>

            {/* Location Information */}
            {request.location && (
              <div className="flex items-start gap-2 p-3 bg-white rounded-lg">
                <MapPin className="h-4 w-4 text-gray-600 mt-1" />
                <div>
                  <div className="font-semibold text-gray-900">
                    Near: {request.location.name}
                  </div>
                  {request.location.address && (
                    <div className="text-sm text-gray-600">{request.location.address}</div>
                  )}
                  {request.distance_to_checkpoint && (
                    <div className="text-xs text-gray-500 mt-1">
                      ~{Math.round(request.distance_to_checkpoint)}m from checkpoint
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Time Information */}
            <div className="flex items-center gap-2 p-3 bg-white rounded-lg">
              <Clock className="h-4 w-4 text-gray-600" />
              <div>
                <div className="font-semibold text-gray-900">
                  Requested: {new Date(request.created_at).toLocaleTimeString()}
                </div>
                <div className="text-sm text-gray-600">
                  {Math.floor((Date.now() - new Date(request.created_at).getTime()) / 60000)} minutes ago
                </div>
              </div>
            </div>

            {/* Notes */}
            {request.notes && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="text-sm font-medium text-yellow-800">Notes:</div>
                <div className="text-sm text-yellow-700">{request.notes}</div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              {request.status === 'active' && (
                <Button
                  onClick={() => updateRequestStatus(request.id, 'acknowledged')}
                  disabled={loading}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Acknowledge
                </Button>
              )}
              <Button
                onClick={() => updateRequestStatus(request.id, 'resolved', 'Backup dispatched successfully')}
                disabled={loading}
                className={`${request.status === 'active' ? 'flex-1' : 'w-full'} bg-green-600 hover:bg-green-700`}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {request.status === 'active' ? 'Resolve' : 'Mark Complete'}
              </Button>
            </div>

            {/* Coordinates for Emergency Services */}
            {request.current_latitude && request.current_longitude && (
              <div className="text-xs text-gray-500 p-2 bg-gray-100 rounded font-mono">
                Coords: {request.current_latitude.toFixed(6)}, {request.current_longitude.toFixed(6)}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}