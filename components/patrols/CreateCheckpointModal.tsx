'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { MapPin, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/checkpoints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          organization_id: organizationId,
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null,
          is_active: true
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create checkpoint')
      }

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

      onCheckpointCreated()
      onClose()
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Create New Checkpoint
          </DialogTitle>
          <DialogDescription>
            Add a new checkpoint location for patrol routes. Fill in the details below.
          </DialogDescription>
        </DialogHeader>

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
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Checkpoint
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}