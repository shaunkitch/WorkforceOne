'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { MapPin, Loader2, QrCode } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'

interface CreateCheckpointModalProps {
  isOpen: boolean
  onClose: () => void
  onCheckpointCreated: () => void
  organizationId: string
}

export default function CreateCheckpointModal({
  isOpen,
  onClose,
  onCheckpointCreated,
  organizationId
}: CreateCheckpointModalProps) {
  const [loading, setLoading] = useState(false)
  const [createdCheckpoint, setCreatedCheckpoint] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    latitude: '',
    longitude: '',
    qr_code_data: '',
    instructions: ''
  })
  const { toast } = useToast()

  const handleClose = () => {
    setCreatedCheckpoint(null)
    setFormData({
      name: '',
      description: '',
      address: '',
      latitude: '',
      longitude: '',
      qr_code_data: '',
      instructions: ''
    })
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      const response = await fetch('/api/checkpoints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          address: formData.address,
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null,
          visit_instructions: formData.instructions,
          organization_id: organizationId,
          created_by: user.id,
          is_active: true
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create checkpoint')
      }

      const result = await response.json()
      console.log('Checkpoint creation result:', result)
      
      if (result.success && result.checkpoint) {
        setCreatedCheckpoint(result.checkpoint)

        toast({
          title: "Success",
          description: "Checkpoint created successfully",
        })

        // Reset form
        setFormData({
          name: '',
          description: '',
          address: '',
          latitude: '',
          longitude: '',
          qr_code_data: '',
          instructions: ''
        })

        // Call the callback to refresh the checkpoint list
        onCheckpointCreated()
      } else {
        throw new Error(result.error || 'Invalid response from server')
      }
    } catch (error) {
      console.error('Error creating checkpoint:', error)
      toast({
        title: "Error",
        description: "Failed to create checkpoint. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const generateQRCode = () => {
    const qrData = `checkpoint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    setFormData({ ...formData, qr_code_data: qrData })
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Geolocation is not supported by this browser.",
        variant: "destructive"
      })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData({
          ...formData,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString()
        })
        toast({
          title: "Success",
          description: "Location captured successfully",
        })
      },
      (error) => {
        toast({
          title: "Error",
          description: "Failed to get current location",
          variant: "destructive"
        })
      }
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {createdCheckpoint ? (
              <>
                <QrCode className="h-5 w-5" />
                Checkpoint Created Successfully
              </>
            ) : (
              <>
                <MapPin className="h-5 w-5" />
                Create New Checkpoint
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {createdCheckpoint 
              ? "Your checkpoint has been created with the QR code shown below."
              : "Add a new checkpoint location for patrol routes. Fill in the details below."
            }
          </DialogDescription>
        </DialogHeader>

        {createdCheckpoint ? (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">{createdCheckpoint.name}</h3>
              <p className="text-gray-600 mb-4">{createdCheckpoint.metadata?.description || 'No description'}</p>
              
              <div className="bg-white p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                <QrCode className="h-16 w-16 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-500 mb-2">QR Code:</p>
                <p className="font-mono text-lg font-semibold break-all">
                  {createdCheckpoint.metadata?.qr_code || 'QR Code not available'}
                </p>
              </div>
              
              {createdCheckpoint.address && (
                <p className="text-sm text-gray-600 mt-2">
                  <strong>Address:</strong> {createdCheckpoint.address}
                </p>
              )}
              
              {(createdCheckpoint.latitude && createdCheckpoint.longitude) && (
                <p className="text-sm text-gray-600">
                  <strong>Location:</strong> {createdCheckpoint.latitude}, {createdCheckpoint.longitude}
                </p>
              )}
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setCreatedCheckpoint(null)}>
                Create Another
              </Button>
              <Button onClick={handleClose}>
                Close
              </Button>
            </div>
          </div>
        ) : (

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Checkpoint Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Main Gate"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Physical address"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the checkpoint"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <div className="flex gap-2">
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  placeholder="-26.1234"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={getCurrentLocation}
                  className="whitespace-nowrap"
                >
                  Get Location
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                placeholder="28.1234"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="qr_code_data">QR Code Data</Label>
            <div className="flex gap-2">
              <Input
                id="qr_code_data"
                value={formData.qr_code_data}
                onChange={(e) => setFormData({ ...formData, qr_code_data: e.target.value })}
                placeholder="QR code identifier"
              />
              <Button
                type="button"
                variant="outline"
                onClick={generateQRCode}
                className="whitespace-nowrap"
              >
                Generate
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              placeholder="Special instructions for guards at this checkpoint"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Checkpoint
            </Button>
          </div>
        </form>
        )}
      </DialogContent>
    </Dialog>
  )
}