'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft,
  Camera, 
  MapPin, 
  Clock, 
  AlertTriangle,
  Send,
  Mic,
  MicOff,
  Image,
  X,
  CheckCircle2
} from 'lucide-react'
import Link from 'next/link'

interface IncidentLocation {
  latitude: number
  longitude: number
  accuracy: number
  address?: string
}

interface IncidentPhoto {
  id: string
  dataUrl: string
  timestamp: Date
}

const incidentTypes = [
  { value: 'security_breach', label: 'Security Breach', color: 'bg-red-100 text-red-800' },
  { value: 'suspicious_activity', label: 'Suspicious Activity', color: 'bg-orange-100 text-orange-800' },
  { value: 'theft', label: 'Theft', color: 'bg-red-100 text-red-800' },
  { value: 'vandalism', label: 'Vandalism', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'trespassing', label: 'Trespassing', color: 'bg-purple-100 text-purple-800' },
  { value: 'fire_hazard', label: 'Fire Hazard', color: 'bg-red-100 text-red-800' },
  { value: 'medical_emergency', label: 'Medical Emergency', color: 'bg-red-100 text-red-800' },
  { value: 'equipment_malfunction', label: 'Equipment Malfunction', color: 'bg-blue-100 text-blue-800' },
  { value: 'safety_hazard', label: 'Safety Hazard', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-800' }
]

const priorityLevels = [
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' }
]

export default function IncidentReport() {
  const { user } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    type: '',
    priority: 'medium',
    title: '',
    description: '',
    location: '',
    peopleInvolved: '',
    witnessCount: '',
    actionTaken: ''
  })
  
  // Media and location state
  const [photos, setPhotos] = useState<IncidentPhoto[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [location, setLocation] = useState<IncidentLocation | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  
  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    // Get current location automatically
    getCurrentLocation()
  }, [])

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) return
    
    setLocationLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location: IncidentLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        }
        
        // Try to get address from coordinates
        try {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.latitude},${location.longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
          )
          const data = await response.json()
          if (data.results?.[0]) {
            location.address = data.results[0].formatted_address
          }
        } catch (error) {
          console.warn('Could not get address:', error)
        }
        
        setLocation(location)
        setLocationLoading(false)
      },
      (error) => {
        console.error('Location error:', error)
        setLocationLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }

  const handlePhotoCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const photo: IncidentPhoto = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            dataUrl: e.target?.result as string,
            timestamp: new Date()
          }
          setPhotos(prev => [...prev, photo])
        }
        reader.readAsDataURL(file)
      }
    })
  }

  const removePhoto = (photoId: string) => {
    setPhotos(prev => prev.filter(p => p.id !== photoId))
  }

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      const chunks: Blob[] = []
      
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data)
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        setAudioBlob(blob)
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorder.start()
      setIsRecording(true)
      
      // Auto-stop after 5 minutes
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop()
          setIsRecording(false)
        }
      }, 300000)
      
      // Store recorder for manual stop
      (window as any).mediaRecorder = mediaRecorder
    } catch (error) {
      console.error('Recording error:', error)
      alert('Could not start recording. Please check microphone permissions.')
    }
  }

  const stopAudioRecording = () => {
    const recorder = (window as any).mediaRecorder
    if (recorder && recorder.state === 'recording') {
      recorder.stop()
      setIsRecording(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.type || !formData.title || !formData.description) {
      setSubmitError('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    setSubmitError('')

    try {
      // Create incident report
      const incidentData = {
        ...formData,
        reporter_id: user?.id,
        location_data: location,
        photos: photos.map(p => ({ id: p.id, timestamp: p.timestamp })),
        has_audio: !!audioBlob,
        reported_at: new Date().toISOString(),
        status: 'open'
      }

      const response = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incidentData)
      })

      if (response.ok) {
        const result = await response.json()
        
        // Upload photos if any
        if (photos.length > 0) {
          await uploadPhotos(result.incident.id)
        }
        
        // Upload audio if exists
        if (audioBlob) {
          await uploadAudio(result.incident.id)
        }
        
        setSubmitSuccess(true)
        setTimeout(() => {
          router.push('/mobile')
        }, 2000)
      } else {
        throw new Error('Failed to submit incident')
      }
    } catch (error) {
      console.error('Submit error:', error)
      setSubmitError('Failed to submit incident. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const uploadPhotos = async (incidentId: string) => {
    // In a real app, upload photos to storage service
    console.log('Would upload photos for incident:', incidentId)
  }

  const uploadAudio = async (incidentId: string) => {
    // In a real app, upload audio to storage service
    console.log('Would upload audio for incident:', incidentId)
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-6">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Report Submitted</h2>
            <p className="text-gray-600 mb-4">Your incident report has been successfully submitted and will be reviewed by security personnel.</p>
            <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <Link href="/mobile">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="font-semibold text-gray-900">Incident Report</h1>
          <div className="w-20"></div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-6 pb-20">
        {/* Incident Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Incident Type *</CardTitle>
            <CardDescription>What type of incident occurred?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {incidentTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                  className={`p-2 text-sm rounded-lg border transition-all ${
                    formData.type === type.value 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Badge className={type.color}>{type.label}</Badge>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Priority Level */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Priority Level</CardTitle>
            <CardDescription>How urgent is this incident?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2">
              {priorityLevels.map((priority) => (
                <button
                  key={priority.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, priority: priority.value }))}
                  className={`p-2 text-sm rounded-lg border transition-all ${
                    formData.priority === priority.value 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Badge className={priority.color}>{priority.label}</Badge>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Basic Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Incident Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Brief description of the incident"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Detailed description of what happened, when it occurred, and any relevant circumstances..."
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="location">Specific Location</Label>
              <Input
                id="location"
                placeholder="Building, room, area (optional)"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* GPS Location */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              GPS Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            {locationLoading ? (
              <p className="text-gray-600">Getting location...</p>
            ) : location ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  {location.address || `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`}
                </p>
                <p className="text-xs text-gray-500">
                  Accuracy: {Math.round(location.accuracy)}m
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-gray-600">Location not available</p>
                <Button type="button" variant="outline" size="sm" onClick={getCurrentLocation}>
                  Get Location
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Photos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <Camera className="h-4 w-4 mr-2" />
              Photos ({photos.length})
            </CardTitle>
            <CardDescription>Add photos to support your report</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handlePhotoCapture}
                className="w-full"
              >
                <Camera className="h-4 w-4 mr-2" />
                Take Photo
              </Button>
              
              {photos.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {photos.map((photo) => (
                    <div key={photo.id} className="relative">
                      <img 
                        src={photo.dataUrl} 
                        alt="Incident photo" 
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(photo.id)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </CardContent>
        </Card>

        {/* Audio Recording */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <Mic className="h-4 w-4 mr-2" />
              Audio Note
            </CardTitle>
            <CardDescription>Record additional details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              {!isRecording ? (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={startAudioRecording}
                >
                  <Mic className="h-4 w-4 mr-2" />
                  Start Recording
                </Button>
              ) : (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={stopAudioRecording}
                  className="text-red-600 border-red-600"
                >
                  <MicOff className="h-4 w-4 mr-2" />
                  Stop Recording
                </Button>
              )}
              
              {audioBlob && !isRecording && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Audio Recorded
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Additional Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="peopleInvolved">People Involved</Label>
              <Input
                id="peopleInvolved"
                placeholder="Names, descriptions, or 'Unknown'"
                value={formData.peopleInvolved}
                onChange={(e) => setFormData(prev => ({ ...prev, peopleInvolved: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="witnessCount">Number of Witnesses</Label>
              <Input
                id="witnessCount"
                type="number"
                placeholder="0"
                value={formData.witnessCount}
                onChange={(e) => setFormData(prev => ({ ...prev, witnessCount: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="actionTaken">Action Taken</Label>
              <Textarea
                id="actionTaken"
                placeholder="What immediate actions were taken?"
                rows={3}
                value={formData.actionTaken}
                onChange={(e) => setFormData(prev => ({ ...prev, actionTaken: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {submitError && (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 text-red-800">
                <AlertTriangle className="h-4 w-4" />
                <p className="text-sm">{submitError}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting || !formData.type || !formData.title || !formData.description}
          >
            {isSubmitting ? (
              'Submitting...'
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Report
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}