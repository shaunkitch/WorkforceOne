'use client'

import { useAuth } from '@/lib/auth/hooks'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckpointService, Location } from '@/lib/checkpoints/service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Shield, LogOut, Plus, MapPin, QrCode, Smartphone, Copy, Eye, Edit, Trash2, RefreshCw } from 'lucide-react'
import { QRCodeCanvas as QRCode } from 'qrcode.react'
import LocationPicker from '@/components/maps/LocationPicker'

interface NewCheckpoint {
  name: string
  description: string
  address: string
  latitude: number | null
  longitude: number | null
  location_type: 'checkpoint' | 'waypoint' | 'emergency'
  geofence_radius: number
  visit_instructions: string
  qr_code: string
  nfc_tag: string
  verification_methods: ('qr' | 'nfc' | 'manual')[]
  is_active: boolean
}

export default function CheckpointManagePage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [checkpoints, setCheckpoints] = useState<Location[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<Location | null>(null)
  const [newCheckpoint, setNewCheckpoint] = useState<NewCheckpoint>({
    name: '',
    description: '',
    address: '',
    latitude: null,
    longitude: null,
    location_type: 'checkpoint',
    geofence_radius: 50,
    visit_instructions: '',
    qr_code: CheckpointService.generateCheckpointQRCode(`temp-${Date.now()}-${Math.random().toString(36).substring(7)}`), // Auto-generate initial QR code
    nfc_tag: '',
    verification_methods: ['qr'],
    is_active: true
  })
  
  const [editCheckpoint, setEditCheckpoint] = useState<NewCheckpoint>({
    name: '',
    description: '',
    address: '',
    latitude: null,
    longitude: null,
    location_type: 'checkpoint',
    geofence_radius: 50,
    visit_instructions: '',
    qr_code: '',
    nfc_tag: '',
    verification_methods: ['qr'],
    is_active: true
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.organization_id) {
      loadCheckpointData()
    }
  }, [user])

  const loadCheckpointData = async () => {
    if (!user?.organization_id) return

    setLoadingData(true)
    try {
      const checkpointsData = await CheckpointService.getCheckpoints(user.organization_id)
      setCheckpoints(checkpointsData)
    } catch (error) {
      console.error('Error loading checkpoint data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const generateQRCode = () => {
    if (!newCheckpoint.name) {
      alert('Please enter checkpoint name first')
      return
    }
    const qrCode = CheckpointService.generateCheckpointQRCode(`temp-${Date.now()}-${Math.random().toString(36).substring(7)}`)
    setNewCheckpoint(prev => ({ ...prev, qr_code: qrCode }))
  }

  // Removed duplicate generateNFCTag function - now handled in handleVerificationMethodToggle

  const handleCreateCheckpoint = async () => {
    if (!newCheckpoint.name || !newCheckpoint.address) {
      alert('Please provide checkpoint name and address')
      return
    }

    if (newCheckpoint.verification_methods.length === 0) {
      alert('Please select at least one verification method')
      return
    }

    try {
      const result = await CheckpointService.createCheckpoint({
        organization_id: user!.organization_id,
        name: newCheckpoint.name,
        description: newCheckpoint.description,
        address: newCheckpoint.address,
        latitude: newCheckpoint.latitude,
        longitude: newCheckpoint.longitude,
        location_type: newCheckpoint.location_type,
        qr_code: newCheckpoint.qr_code,
        nfc_tag: newCheckpoint.nfc_tag || undefined,
        is_active: newCheckpoint.is_active,
        verification_methods: newCheckpoint.verification_methods,
        geofence_radius: newCheckpoint.geofence_radius,
        visit_instructions: newCheckpoint.visit_instructions,
        created_by: user!.id
      })

      if (result.success) {
        setShowCreateDialog(false)
        resetForm()
        loadCheckpointData()
        alert('Checkpoint created successfully!')
      } else {
        alert('Failed to create checkpoint: ' + result.error)
      }
    } catch (error) {
      console.error('Error creating checkpoint:', error)
      alert('Failed to create checkpoint')
    }
  }

  const resetForm = () => {
    setNewCheckpoint({
      name: '',
      description: '',
      address: '',
      latitude: null,
      longitude: null,
      location_type: 'checkpoint',
      geofence_radius: 50,
      visit_instructions: '',
      qr_code: CheckpointService.generateCheckpointQRCode(`temp-${Date.now()}-${Math.random().toString(36).substring(7)}`), // Auto-generate QR code
      nfc_tag: '',
      verification_methods: ['qr'],
      is_active: true
    })
  }

  const handleVerificationMethodToggle = (method: 'qr' | 'nfc' | 'manual') => {
    setNewCheckpoint(prev => {
      const isRemoving = prev.verification_methods.includes(method)
      const newMethods = isRemoving
        ? prev.verification_methods.filter(m => m !== method)
        : [...prev.verification_methods, method]

      // Generate codes when methods are added
      let updates: any = { verification_methods: newMethods }
      
      if (!isRemoving) {
        if (method === 'qr' && !prev.qr_code) {
          updates.qr_code = CheckpointService.generateCheckpointQRCode(`temp-${Date.now()}-${Math.random().toString(36).substring(7)}`)
        }
        if (method === 'nfc' && !prev.nfc_tag) {
          updates.nfc_tag = generateNFCTag()
        }
      }

      return { ...prev, ...updates }
    })
  }

  const generateNFCTag = () => {
    const chars = '0123456789ABCDEF'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return `NFC-${result}`
  }

  const handleViewCheckpoint = (checkpoint: Location) => {
    setSelectedCheckpoint(checkpoint)
    setShowViewDialog(true)
  }

  const handleEditCheckpoint = (checkpoint: Location) => {
    setEditCheckpoint({
      name: checkpoint.name,
      description: '',
      address: checkpoint.address || '',
      latitude: checkpoint.latitude || null,
      longitude: checkpoint.longitude || null,
      location_type: checkpoint.location_type as 'checkpoint' | 'waypoint' | 'emergency',
      geofence_radius: checkpoint.geofence_radius || 50,
      visit_instructions: checkpoint.metadata?.special_instructions || '',
      qr_code: checkpoint.metadata?.qr_code || '',
      nfc_tag: checkpoint.metadata?.nfc_tag_id || '',
      verification_methods: checkpoint.metadata?.verification_methods || ['qr'],
      is_active: true // Assume active for now
    })
    setSelectedCheckpoint(checkpoint)
    setShowEditDialog(true)
  }

  const handleUpdateCheckpoint = async () => {
    if (!editCheckpoint.name || !editCheckpoint.address || !selectedCheckpoint) {
      alert('Please provide checkpoint name and address')
      return
    }

    try {
      const result = await CheckpointService.updateCheckpoint(
        selectedCheckpoint.id,
        user!.organization_id,
        {
          name: editCheckpoint.name,
          description: editCheckpoint.description,
          address: editCheckpoint.address,
          latitude: editCheckpoint.latitude,
          longitude: editCheckpoint.longitude,
          location_type: editCheckpoint.location_type,
          qr_code: editCheckpoint.qr_code,
          nfc_tag: editCheckpoint.nfc_tag,
          is_active: editCheckpoint.is_active,
          verification_methods: editCheckpoint.verification_methods,
          geofence_radius: editCheckpoint.geofence_radius,
          visit_instructions: editCheckpoint.visit_instructions,
          updated_by: user!.id
        }
      )

      if (result.success) {
        setShowEditDialog(false)
        resetEditForm()
        loadCheckpointData()
      } else {
        alert('Failed to update checkpoint: ' + result.error)
      }
    } catch (error) {
      console.error('Error updating checkpoint:', error)
      alert('Failed to update checkpoint')
    }
  }

  const handleDeleteCheckpoint = (checkpoint: Location) => {
    setSelectedCheckpoint(checkpoint)
    setShowDeleteDialog(true)
  }

  const confirmDeleteCheckpoint = async () => {
    if (!selectedCheckpoint) return

    try {
      const result = await CheckpointService.deleteCheckpoint(
        selectedCheckpoint.id,
        user!.organization_id,
        user!.id
      )

      if (result.success) {
        setShowDeleteDialog(false)
        setSelectedCheckpoint(null)
        loadCheckpointData()
      } else {
        alert('Failed to delete checkpoint: ' + result.error)
      }
    } catch (error) {
      console.error('Error deleting checkpoint:', error)
      alert('Failed to delete checkpoint')
    }
  }

  const resetEditForm = () => {
    setEditCheckpoint({
      name: '',
      description: '',
      address: '',
      latitude: null,
      longitude: null,
      location_type: 'checkpoint',
      geofence_radius: 50,
      visit_instructions: '',
      qr_code: '',
      nfc_tag: '',
      verification_methods: ['qr'],
      is_active: true
    })
  }

  const handleEditVerificationMethodToggle = (method: 'qr' | 'nfc' | 'manual') => {
    setEditCheckpoint(prev => {
      const isRemoving = prev.verification_methods.includes(method)
      const newMethods = isRemoving
        ? prev.verification_methods.filter(m => m !== method)
        : [...prev.verification_methods, method]

      let updatedCheckpoint = { ...prev, verification_methods: newMethods }

      // Auto-generate QR code if QR method is selected and no QR code exists
      if (!isRemoving && method === 'qr' && !prev.qr_code) {
        updatedCheckpoint.qr_code = CheckpointService.generateCheckpointQRCode(
          `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`
        )
      }

      // Auto-generate NFC tag if NFC method is selected and no NFC tag exists
      if (!isRemoving && method === 'nfc' && !prev.nfc_tag) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        let result = ''
        for (let i = 0; i < 8; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        updatedCheckpoint.nfc_tag = `NFC-${result}`
      }

      return updatedCheckpoint
    })
  }

  const generateEditQRCode = () => {
    if (!editCheckpoint.name) {
      alert('Please enter checkpoint name first')
      return
    }
    const qrData = CheckpointService.generateCheckpointQRCode(
      `${editCheckpoint.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
    )
    setEditCheckpoint({ ...editCheckpoint, qr_code: qrData })
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    alert(`${label} copied to clipboard!`)
  }

  const getLocationTypeBadge = (type: string) => {
    const config = {
      checkpoint: { color: 'bg-blue-100 text-blue-800', text: 'Checkpoint' },
      waypoint: { color: 'bg-green-100 text-green-800', text: 'Waypoint' },
      emergency: { color: 'bg-red-100 text-red-800', text: 'Emergency' }
    }

    const badgeConfig = config[type as keyof typeof config] || config.checkpoint

    return (
      <Badge variant="secondary" className={badgeConfig.color}>
        {badgeConfig.text}
      </Badge>
    )
  }

  const getVerificationMethods = (checkpoint: Location) => {
    const methods: string[] = []
    if (checkpoint.metadata?.qr_code) methods.push('QR')
    if (checkpoint.metadata?.nfc_tag_id) methods.push('NFC')
    methods.push('Manual') // Always available
    return methods.join(', ')
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
              <Link href="/dashboard/checkpoints">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Scanner
                </Button>
              </Link>
              <div className="p-2 bg-purple-100 rounded-full mr-3">
                <MapPin className="h-6 w-6 text-purple-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Checkpoint Management</h1>
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
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Checkpoint Administration</h2>
            <p className="text-gray-600">
              Create and manage checkpoint locations with QR codes and NFC tags for patrol verification.
            </p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Checkpoint
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>Create New Checkpoint</DialogTitle>
                <DialogDescription>
                  Set up a new checkpoint location with QR codes and NFC tags for patrol verification.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Basic Information</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Checkpoint Name *</Label>
                      <Input
                        id="name"
                        placeholder="e.g., Main Entrance"
                        value={newCheckpoint.name}
                        onChange={(e) => setNewCheckpoint({ ...newCheckpoint, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Location Type</Label>
                      <Select 
                        value={newCheckpoint.location_type} 
                        onValueChange={(value: 'checkpoint' | 'waypoint' | 'emergency') => 
                          setNewCheckpoint({ ...newCheckpoint, location_type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="checkpoint">Checkpoint</SelectItem>
                          <SelectItem value="waypoint">Waypoint</SelectItem>
                          <SelectItem value="emergency">Emergency Point</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe the checkpoint location and purpose..."
                      value={newCheckpoint.description}
                      onChange={(e) => setNewCheckpoint({ ...newCheckpoint, description: e.target.value })}
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address *</Label>
                    <Input
                      id="address"
                      placeholder="Full address of the checkpoint"
                      value={newCheckpoint.address}
                      onChange={(e) => setNewCheckpoint({ ...newCheckpoint, address: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="radius">Geofence Radius (meters)</Label>
                      <Input
                        id="radius"
                        type="number"
                        min="5"
                        max="500"
                        value={newCheckpoint.geofence_radius}
                        onChange={(e) => setNewCheckpoint({ 
                          ...newCheckpoint, 
                          geofence_radius: parseInt(e.target.value) || 50 
                        })}
                      />
                      <p className="text-xs text-gray-500">
                        Guards must be within this distance to verify the checkpoint
                      </p>
                    </div>
                  </div>
                </div>

                {/* Location Selection */}
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-medium text-gray-900">Location & Coordinates</h4>
                  <LocationPicker
                    latitude={newCheckpoint.latitude}
                    longitude={newCheckpoint.longitude}
                    onLocationChange={(lat, lng) => {
                      setNewCheckpoint(prev => ({
                        ...prev,
                        latitude: lat,
                        longitude: lng
                      }))
                    }}
                    onAddressChange={(address) => {
                      setNewCheckpoint(prev => ({
                        ...prev,
                        address: address
                      }))
                    }}
                  />
                </div>

                {/* Verification Methods */}
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-medium text-gray-900">Verification Methods</h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="qr-method"
                        checked={newCheckpoint.verification_methods.includes('qr')}
                        onCheckedChange={() => handleVerificationMethodToggle('qr')}
                      />
                      <Label htmlFor="qr-method">QR Code Scanning</Label>
                    </div>
                    
                    {newCheckpoint.verification_methods.includes('qr') && (
                      <div className="ml-6 space-y-2">
                        <div className="flex items-center space-x-2">
                          <Input
                            placeholder="QR Code Data (auto-generated)"
                            value={newCheckpoint.qr_code}
                            readOnly
                            className="flex-1"
                          />
                          <Button type="button" onClick={generateQRCode} variant="outline" size="sm">
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </div>
                        {newCheckpoint.qr_code && (
                          <div className="flex items-center space-x-2">
                            <div className="border rounded p-2">
                              <QRCode value={newCheckpoint.qr_code} size={64} />
                            </div>
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm"
                              onClick={() => copyToClipboard(newCheckpoint.qr_code, 'QR Code')}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="nfc-method"
                        checked={newCheckpoint.verification_methods.includes('nfc')}
                        onCheckedChange={() => handleVerificationMethodToggle('nfc')}
                      />
                      <Label htmlFor="nfc-method">NFC Tag Scanning</Label>
                    </div>

                    {newCheckpoint.verification_methods.includes('nfc') && (
                      <div className="ml-6 space-y-2">
                        <div className="flex items-center space-x-2">
                          <Input
                            placeholder="NFC Tag ID (auto-generated)"
                            value={newCheckpoint.nfc_tag}
                            readOnly
                            className="flex-1"
                          />
                          <Button type="button" onClick={() => {
                            const nfcTag = generateNFCTag()
                            setNewCheckpoint(prev => ({ ...prev, nfc_tag: nfcTag }))
                          }} variant="outline" size="sm">
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </div>
                        {newCheckpoint.nfc_tag && (
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => copyToClipboard(newCheckpoint.nfc_tag, 'NFC Tag ID')}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy NFC Tag ID
                          </Button>
                        )}
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="manual-method"
                        checked={newCheckpoint.verification_methods.includes('manual')}
                        onCheckedChange={() => handleVerificationMethodToggle('manual')}
                      />
                      <Label htmlFor="manual-method">Manual Check-in</Label>
                    </div>
                  </div>
                </div>

                {/* Additional Settings */}
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-medium text-gray-900">Additional Settings</h4>
                  
                  <div className="space-y-2">
                    <Label htmlFor="instructions">Visit Instructions</Label>
                    <Textarea
                      id="instructions"
                      placeholder="Special instructions for guards when visiting this checkpoint..."
                      value={newCheckpoint.visit_instructions}
                      onChange={(e) => setNewCheckpoint({ ...newCheckpoint, visit_instructions: e.target.value })}
                      rows={2}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is-active"
                      checked={newCheckpoint.is_active}
                      onCheckedChange={(checked) => setNewCheckpoint({ ...newCheckpoint, is_active: !!checked })}
                    />
                    <Label htmlFor="is-active">Checkpoint is active</Label>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => {
                    setShowCreateDialog(false)
                    resetForm()
                  }}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateCheckpoint}
                    disabled={!newCheckpoint.name || !newCheckpoint.address || newCheckpoint.verification_methods.length === 0}
                  >
                    Create Checkpoint
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Checkpoints</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{checkpoints.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">With QR Codes</CardTitle>
              <QrCode className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {checkpoints.filter(c => c.metadata?.qr_code).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">With NFC Tags</CardTitle>
              <Smartphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {checkpoints.filter(c => c.metadata?.nfc_tag_id).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Emergency Points</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {checkpoints.filter(c => c.location_type === 'emergency').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Checkpoints Table */}
        <Card>
          <CardHeader>
            <CardTitle>Checkpoint Locations</CardTitle>
            <CardDescription>
              Manage your organization's checkpoint locations and verification methods
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checkpoints.map((checkpoint) => (
                  <TableRow key={checkpoint.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{checkpoint.name}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {checkpoint.metadata?.special_instructions || 'No special instructions'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getLocationTypeBadge(checkpoint.location_type)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm max-w-xs truncate">
                        {checkpoint.address || 'No address provided'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {getVerificationMethods(checkpoint)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={checkpoint.location_type === 'checkpoint' ? 'default' : 'secondary'}>
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewCheckpoint(checkpoint)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditCheckpoint(checkpoint)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteCheckpoint(checkpoint)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {checkpoints.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No checkpoints created yet. Create your first checkpoint to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      {/* Checkpoint Details Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedCheckpoint?.name}</DialogTitle>
            <DialogDescription>
              Checkpoint details and verification information
            </DialogDescription>
          </DialogHeader>
          {selectedCheckpoint && (
            <div className="space-y-6">
              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedCheckpoint.metadata?.special_instructions || 'No description provided'}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Location Type</Label>
                  <div className="mt-1">
                    {getLocationTypeBadge(selectedCheckpoint.location_type)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Geofence Radius</Label>
                  <p className="text-lg font-semibold">{selectedCheckpoint.geofence_radius || 50}m</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Address</Label>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedCheckpoint.address || 'No address provided'}
                </p>
              </div>

              {(selectedCheckpoint.latitude && selectedCheckpoint.longitude) && (
                <div>
                  <Label className="text-sm font-medium">Coordinates</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedCheckpoint.latitude}, {selectedCheckpoint.longitude}
                  </p>
                </div>
              )}

              {/* Verification Methods */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Verification Methods</Label>
                
                {selectedCheckpoint.metadata?.qr_code && (
                  <div className="border rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <QrCode className="h-4 w-4 mr-2" />
                        <span className="text-sm font-medium">QR Code</span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => copyToClipboard(selectedCheckpoint.metadata!.qr_code!, 'QR Code')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center space-x-3">
                      <QRCode value={selectedCheckpoint.metadata.qr_code} size={80} />
                      <div className="text-xs text-gray-500 break-all">
                        {selectedCheckpoint.metadata.qr_code}
                      </div>
                    </div>
                  </div>
                )}

                {selectedCheckpoint.metadata?.nfc_tag_id && (
                  <div className="border rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <Smartphone className="h-4 w-4 mr-2" />
                        <span className="text-sm font-medium">NFC Tag</span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => copyToClipboard(selectedCheckpoint.metadata!.nfc_tag_id!, 'NFC Tag ID')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="text-sm text-gray-600">
                      Tag ID: {selectedCheckpoint.metadata.nfc_tag_id}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowViewDialog(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setShowViewDialog(false)
                  handleEditCheckpoint(selectedCheckpoint!)
                }}>
                  Edit Checkpoint
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Checkpoint Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Checkpoint</DialogTitle>
            <DialogDescription>
              Update checkpoint details, location, and verification methods.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Checkpoint Name *</Label>
                <Input
                  id="edit-name"
                  placeholder="e.g., Main Entrance, Security Booth"
                  value={editCheckpoint.name}
                  onChange={(e) => setEditCheckpoint({ ...editCheckpoint, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-address">Address *</Label>
                <Textarea
                  id="edit-address"
                  placeholder="Full address of the checkpoint location"
                  value={editCheckpoint.address}
                  onChange={(e) => setEditCheckpoint({ ...editCheckpoint, address: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-type">Location Type</Label>
                  <Select 
                    value={editCheckpoint.location_type} 
                    onValueChange={(value) => setEditCheckpoint({ ...editCheckpoint, location_type: value as 'checkpoint' | 'waypoint' | 'emergency' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checkpoint">Checkpoint</SelectItem>
                      <SelectItem value="waypoint">Waypoint</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-radius">Geofence Radius (meters)</Label>
                  <Input
                    id="edit-radius"
                    type="number"
                    min="10"
                    max="500"
                    value={editCheckpoint.geofence_radius}
                    onChange={(e) => setEditCheckpoint({ ...editCheckpoint, geofence_radius: parseInt(e.target.value) || 50 })}
                  />
                </div>
              </div>
            </div>

            {/* GPS Coordinates */}
            <div className="space-y-4">
              <Label>GPS Coordinates</Label>
              <LocationPicker
                latitude={editCheckpoint.latitude}
                longitude={editCheckpoint.longitude}
                address={editCheckpoint.address}
                onLocationChange={(lat, lng) => {
                  setEditCheckpoint({
                    ...editCheckpoint,
                    latitude: lat,
                    longitude: lng
                  })
                }}
                height={200}
              />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-lat">Latitude</Label>
                  <Input
                    id="edit-lat"
                    type="number"
                    step="any"
                    placeholder="e.g., 40.7128"
                    value={editCheckpoint.latitude || ''}
                    onChange={(e) => setEditCheckpoint({ ...editCheckpoint, latitude: e.target.value ? parseFloat(e.target.value) : null })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-lng">Longitude</Label>
                  <Input
                    id="edit-lng"
                    type="number"
                    step="any"
                    placeholder="e.g., -74.0060"
                    value={editCheckpoint.longitude || ''}
                    onChange={(e) => setEditCheckpoint({ ...editCheckpoint, longitude: e.target.value ? parseFloat(e.target.value) : null })}
                  />
                </div>
              </div>
            </div>

            {/* Verification Methods */}
            <div className="space-y-4">
              <Label>Verification Methods</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-method-qr"
                    checked={editCheckpoint.verification_methods.includes('qr')}
                    onCheckedChange={() => handleEditVerificationMethodToggle('qr')}
                  />
                  <Label htmlFor="edit-method-qr" className="flex items-center">
                    <QrCode className="h-4 w-4 mr-2" />
                    QR Code Scanning
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-method-nfc"
                    checked={editCheckpoint.verification_methods.includes('nfc')}
                    onCheckedChange={() => handleEditVerificationMethodToggle('nfc')}
                  />
                  <Label htmlFor="edit-method-nfc" className="flex items-center">
                    <Smartphone className="h-4 w-4 mr-2" />
                    NFC Tag Scanning
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-method-manual"
                    checked={editCheckpoint.verification_methods.includes('manual')}
                    onCheckedChange={() => handleEditVerificationMethodToggle('manual')}
                  />
                  <Label htmlFor="edit-method-manual" className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Manual Check-in
                  </Label>
                </div>
              </div>
            </div>

            {/* QR Code Section */}
            {editCheckpoint.verification_methods.includes('qr') && (
              <div className="space-y-4">
                <Label>QR Code Configuration</Label>
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <div className="space-y-2">
                      <Label htmlFor="edit-qr-code">QR Code Data</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="edit-qr-code"
                          placeholder="QR code data"
                          value={editCheckpoint.qr_code}
                          onChange={(e) => setEditCheckpoint({ ...editCheckpoint, qr_code: e.target.value })}
                        />
                        <Button type="button" variant="outline" onClick={generateEditQRCode}>
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  {editCheckpoint.qr_code && (
                    <div className="flex flex-col items-center space-y-2">
                      <QRCode value={editCheckpoint.qr_code} size={80} />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(editCheckpoint.qr_code, 'QR Code')}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* NFC Tag Section */}
            {editCheckpoint.verification_methods.includes('nfc') && (
              <div className="space-y-4">
                <Label htmlFor="edit-nfc-tag">NFC Tag ID</Label>
                <Input
                  id="edit-nfc-tag"
                  placeholder="NFC tag identifier"
                  value={editCheckpoint.nfc_tag}
                  onChange={(e) => setEditCheckpoint({ ...editCheckpoint, nfc_tag: e.target.value })}
                />
              </div>
            )}

            {/* Visit Instructions */}
            <div className="space-y-2">
              <Label htmlFor="edit-instructions">Visit Instructions (Optional)</Label>
              <Textarea
                id="edit-instructions"
                placeholder="Special instructions for guards visiting this checkpoint..."
                value={editCheckpoint.visit_instructions}
                onChange={(e) => setEditCheckpoint({ ...editCheckpoint, visit_instructions: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowEditDialog(false)
                  resetEditForm()
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateCheckpoint}
                disabled={!editCheckpoint.name || !editCheckpoint.address}
              >
                Update Checkpoint
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Checkpoint</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this checkpoint? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedCheckpoint && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="font-medium text-sm">{selectedCheckpoint.name}</div>
                {selectedCheckpoint.address && (
                  <div className="text-sm text-gray-600 mt-1">{selectedCheckpoint.address}</div>
                )}
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  <span>{getLocationTypeBadge(selectedCheckpoint.location_type)}</span>
                  {selectedCheckpoint.metadata?.verification_methods && (
                    <div className="flex space-x-1">
                      {selectedCheckpoint.metadata.verification_methods.includes('qr') && (
                        <Badge variant="secondary" className="text-xs">QR</Badge>
                      )}
                      {selectedCheckpoint.metadata.verification_methods.includes('nfc') && (
                        <Badge variant="secondary" className="text-xs">NFC</Badge>
                      )}
                      {selectedCheckpoint.metadata.verification_methods.includes('manual') && (
                        <Badge variant="secondary" className="text-xs">Manual</Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                <strong>Warning:</strong> Deleting this checkpoint will remove it from all patrol routes and cannot be undone.
              </div>
              
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={confirmDeleteCheckpoint}>
                  Delete Checkpoint
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}