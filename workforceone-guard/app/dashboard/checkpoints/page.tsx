'use client'

import { useAuth } from '@/lib/auth/hooks'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckpointService, Location, CheckpointScan } from '@/lib/checkpoints/service'
import QRScanner from '@/components/checkpoints/QRScanner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Shield, LogOut, Scan, MapPin, Clock, CheckCircle, Camera, QrCode, Smartphone } from 'lucide-react'

export default function CheckpointsPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [checkpoints, setCheckpoints] = useState<Location[]>([])
  const [recentVisits, setRecentVisits] = useState<CheckpointScan[]>([])
  const [statistics, setStatistics] = useState({
    totalVisits: 0,
    uniqueCheckpoints: 0,
    averageVisitsPerDay: 0,
    topCheckpoints: [] as Array<{ name: string; visits: number }>,
    verificationMethods: [] as Array<{ method: string; count: number }>
  })
  const [loadingData, setLoadingData] = useState(true)
  const [showScanner, setShowScanner] = useState(false)
  const [scanResult, setScanResult] = useState<{
    success: boolean
    message: string
    location?: Location
    distance?: number
  } | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)

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
      const [checkpointsData, statsData] = await Promise.all([
        CheckpointService.getCheckpoints(user.organization_id),
        CheckpointService.getCheckpointStatistics(user.organization_id)
      ])

      setCheckpoints(checkpointsData)
      setStatistics(statsData)

      // For now, we'll simulate recent visits - in a real app this would come from the user's patrol
      // setRecentVisits(await CheckpointService.getPatrolCheckpointVisits(currentPatrolId))
    } catch (error) {
      console.error('Error loading checkpoint data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleScanResult = async (qrData: string, location?: { lat: number; lng: number }) => {
    setIsVerifying(true)
    
    try {
      // For demo purposes, we'll simulate patrol ID - in a real app this would come from active patrol
      const mockPatrolId = 'demo-patrol-123'
      
      const result = await CheckpointService.verifyQRCode(
        qrData,
        mockPatrolId,
        user!.id,
        location?.lat,
        location?.lng
      )

      if (result.success && result.location) {
        // Record the checkpoint visit
        const visitResult = await CheckpointService.recordCheckpointVisit(
          mockPatrolId,
          result.location.id,
          user!.id,
          'qr',
          qrData,
          location?.lat,
          location?.lng
        )

        if (visitResult.success) {
          setScanResult({
            success: true,
            message: `Checkpoint "${result.location.name}" verified successfully!`,
            location: result.location,
            distance: result.distance
          })
          // Refresh data to show new visit
          loadCheckpointData()
        } else {
          setScanResult({
            success: false,
            message: visitResult.error || 'Failed to record checkpoint visit'
          })
        }
      } else {
        setScanResult({
          success: false,
          message: result.error || 'Checkpoint verification failed'
        })
      }
    } catch (error) {
      console.error('Error processing scan result:', error)
      setScanResult({
        success: false,
        message: 'An error occurred while processing the scan'
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const handleCloseScanner = () => {
    setShowScanner(false)
    setScanResult(null)
  }

  const getVerificationMethodIcon = (method: string) => {
    switch (method) {
      case 'qr':
        return <QrCode className="h-4 w-4" />
      case 'nfc':
        return <Smartphone className="h-4 w-4" />
      case 'manual':
        return <MapPin className="h-4 w-4" />
      default:
        return <Scan className="h-4 w-4" />
    }
  }

  const getVerificationMethodName = (method: string) => {
    switch (method) {
      case 'qr':
        return 'QR Code'
      case 'nfc':
        return 'NFC Tag'
      case 'manual':
        return 'Manual'
      default:
        return method
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
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
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="p-2 bg-green-100 rounded-full mr-3">
                <Scan className="h-6 w-6 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Checkpoint Scanner</h1>
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
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Checkpoint Verification</h2>
            <p className="text-gray-600">
              Scan QR codes or NFC tags to verify checkpoint visits during patrols.
            </p>
          </div>
          <Button onClick={() => setShowScanner(true)}>
            <Scan className="h-4 w-4 mr-2" />
            Start Scanner
          </Button>
        </div>

        {/* Scanner Dialog */}
        <Dialog open={showScanner} onOpenChange={handleCloseScanner}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Checkpoint Scanner</DialogTitle>
              <DialogDescription>
                Scan a QR code or NFC tag to verify your checkpoint visit
              </DialogDescription>
            </DialogHeader>
            
            {scanResult ? (
              <div className="space-y-4">
                <Alert variant={scanResult.success ? 'default' : 'destructive'}>
                  <AlertDescription className="flex items-center">
                    {scanResult.success ? (
                      <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    ) : (
                      <MapPin className="h-4 w-4 mr-2" />
                    )}
                    {scanResult.message}
                  </AlertDescription>
                </Alert>
                
                {scanResult.success && scanResult.location && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Checkpoint Verified</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="font-medium">{scanResult.location.name}</span>
                        </div>
                        {scanResult.location.address && (
                          <p className="text-sm text-gray-600">{scanResult.location.address}</p>
                        )}
                        {scanResult.distance !== undefined && (
                          <p className="text-sm text-gray-600">
                            Distance: {Math.round(scanResult.distance)}m from checkpoint
                          </p>
                        )}
                        <p className="text-sm text-gray-600">
                          Verified at: {new Date().toLocaleString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                <div className="flex justify-end space-x-2">
                  <Button onClick={() => setScanResult(null)}>
                    Scan Another
                  </Button>
                  <Button variant="outline" onClick={handleCloseScanner}>
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <QRScanner 
                onScanResult={handleScanResult}
                onClose={handleCloseScanner}
                isVerifying={isVerifying}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalVisits}</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Checkpoints</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.uniqueCheckpoints}</div>
              <p className="text-xs text-muted-foreground">Unique locations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.averageVisitsPerDay}</div>
              <p className="text-xs text-muted-foreground">Visits per day</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available</CardTitle>
              <Scan className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{checkpoints.length}</div>
              <p className="text-xs text-muted-foregreen">Total checkpoints</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="checkpoints" className="space-y-6">
          <TabsList>
            <TabsTrigger value="checkpoints">Available Checkpoints ({checkpoints.length})</TabsTrigger>
            <TabsTrigger value="visits">Recent Visits ({recentVisits.length})</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Available Checkpoints */}
          <TabsContent value="checkpoints">
            <Card>
              <CardHeader>
                <CardTitle>Available Checkpoints</CardTitle>
                <CardDescription>
                  QR code and NFC-enabled checkpoint locations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {checkpoints.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Checkpoints</h3>
                    <p className="text-gray-600">No checkpoint locations have been configured yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {checkpoints.map((checkpoint) => (
                      <Card key={checkpoint.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center">
                            <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                            {checkpoint.name}
                          </CardTitle>
                          {checkpoint.address && (
                            <CardDescription>{checkpoint.address}</CardDescription>
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">QR Code:</span>
                              <Badge variant={checkpoint.metadata?.qr_code ? 'default' : 'secondary'}>
                                {checkpoint.metadata?.qr_code ? 'Available' : 'Not Set'}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">NFC Tag:</span>
                              <Badge variant={checkpoint.metadata?.nfc_tag_id ? 'default' : 'secondary'}>
                                {checkpoint.metadata?.nfc_tag_id ? 'Available' : 'Not Set'}
                              </Badge>
                            </div>
                            {checkpoint.geofence_radius && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Range:</span>
                                <span className="text-gray-900">{checkpoint.geofence_radius}m</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recent Visits */}
          <TabsContent value="visits">
            <Card>
              <CardHeader>
                <CardTitle>Recent Checkpoint Visits</CardTitle>
                <CardDescription>
                  Your recent checkpoint scan history
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentVisits.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Recent Visits</h3>
                    <p className="text-gray-600">Start scanning checkpoints to see your visit history.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Checkpoint</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Visited At</TableHead>
                        <TableHead>Photos</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentVisits.map((visit) => (
                        <TableRow key={visit.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                              {visit.location?.name || 'Unknown Location'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {getVerificationMethodIcon(visit.verification_method)}
                              <span className="ml-2">{getVerificationMethodName(visit.verification_method)}</span>
                            </div>
                          </TableCell>
                          <TableCell>{formatDateTime(visit.visited_at)}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {visit.photos?.length || 0} photos
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              Verified
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Checkpoints</CardTitle>
                  <CardDescription>Most frequently visited locations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {statistics.topCheckpoints.map((checkpoint, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{checkpoint.name}</span>
                        <div className="flex items-center">
                          <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${statistics.totalVisits > 0 ? (checkpoint.visits / statistics.totalVisits) * 100 : 0}%`
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{checkpoint.visits}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Verification Methods</CardTitle>
                  <CardDescription>How checkpoints were verified</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {statistics.verificationMethods.map((method, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div className="flex items-center">
                          {getVerificationMethodIcon(method.method)}
                          <span className="text-sm text-gray-600 ml-2">
                            {getVerificationMethodName(method.method)}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{
                                width: `${statistics.totalVisits > 0 ? (method.count / statistics.totalVisits) * 100 : 0}%`
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{method.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}