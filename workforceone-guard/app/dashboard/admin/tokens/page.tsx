'use client'

import { useAuth } from '@/lib/auth/hooks'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { RegistrationTokenService, RegistrationToken, CreateTokenData } from '@/lib/registration/tokens'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Shield, LogOut, Plus, QrCode, Key, Copy, Trash2, Clock, Users, Settings } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

interface Role {
  id: string
  name: string
}

interface Department {
  id: string
  name: string
}

export default function RegistrationTokensPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [tokens, setTokens] = useState<RegistrationToken[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showQRDialog, setShowQRDialog] = useState(false)
  const [selectedToken, setSelectedToken] = useState<RegistrationToken | null>(null)
  const [newToken, setNewToken] = useState<Partial<CreateTokenData>>({
    token_type: 'access_code',
    expires_in_hours: 24,
    usage_limit: 10
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    setLoadingData(true)
    try {
      // Load tokens
      const tokensData = await RegistrationTokenService.getOrganizationTokens(user!.organization_id)
      setTokens(tokensData)

      // Load roles and departments (simplified for demo)
      // In production, you'd fetch these from your API
      setRoles([
        { id: '00000000-0000-0000-0000-000000000003', name: 'Security Guard' },
        { id: '00000000-0000-0000-0000-000000000002', name: 'Guard Supervisor' },
        { id: '00000000-0000-0000-0000-000000000004', name: 'Dispatcher' }
      ])
      setDepartments([
        { id: '00000000-0000-0000-0000-000000000001', name: 'Security Operations' }
      ])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleCreateToken = async () => {
    if (!newToken.token_type) return

    try {
      const result = await RegistrationTokenService.createToken({
        organization_id: user!.organization_id,
        token_type: newToken.token_type,
        role_id: newToken.role_id,
        department_id: newToken.department_id,
        expires_in_hours: newToken.expires_in_hours,
        usage_limit: newToken.usage_limit,
        created_by: user!.id
      } as CreateTokenData)

      if (result.success) {
        setShowCreateDialog(false)
        setNewToken({
          token_type: 'access_code',
          expires_in_hours: 24,
          usage_limit: 10
        })
        loadData()
      } else {
        alert('Failed to create token: ' + result.error)
      }
    } catch (error) {
      console.error('Error creating token:', error)
      alert('Failed to create token')
    }
  }

  const handleDeactivateToken = async (tokenId: string) => {
    if (confirm('Are you sure you want to deactivate this token?')) {
      const result = await RegistrationTokenService.deactivateToken(tokenId)
      if (result.success) {
        loadData()
      } else {
        alert('Failed to deactivate token: ' + result.error)
      }
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  const getRegistrationURL = (token: string) => {
    return `${window.location.origin}/auth/register/token?token=${token}`
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getTokenTypeBadge = (type: string) => {
    const config = {
      access_code: { color: 'bg-blue-100 text-blue-800', text: '5-Letter Code', icon: Key },
      qr: { color: 'bg-green-100 text-green-800', text: 'QR Code', icon: QrCode },
      invite: { color: 'bg-purple-100 text-purple-800', text: 'Invite Link', icon: Users }
    }

    const tokenConfig = config[type as keyof typeof config] || config.access_code
    const IconComponent = tokenConfig.icon

    return (
      <Badge variant="secondary" className={tokenConfig.color}>
        <IconComponent className="h-3 w-3 mr-1" />
        {tokenConfig.text}
      </Badge>
    )
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
              <Link href="/dashboard/admin">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Admin
                </Button>
              </Link>
              <div className="p-2 bg-blue-100 rounded-full mr-3">
                <Key className="h-6 w-6 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Registration Tokens</h1>
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
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Guard Registration</h2>
            <p className="text-gray-600">
              Create QR codes and 5-letter access codes for guards to join your organization.
            </p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Token
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create Registration Token</DialogTitle>
                <DialogDescription>
                  Generate a new token for guards to register and join your organization.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="token_type">Token Type</Label>
                  <Select
                    value={newToken.token_type}
                    onValueChange={(value: 'qr' | 'access_code') => setNewToken({ ...newToken, token_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="access_code">5-Letter Access Code</SelectItem>
                      <SelectItem value="qr">QR Code</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role_id">Default Role</Label>
                  <Select
                    value={newToken.role_id}
                    onValueChange={(value) => setNewToken({ ...newToken, role_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select default role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expires_in_hours">Expires In (Hours)</Label>
                  <Input
                    type="number"
                    value={newToken.expires_in_hours || ''}
                    onChange={(e) => setNewToken({ ...newToken, expires_in_hours: parseInt(e.target.value) || undefined })}
                    placeholder="24"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="usage_limit">Usage Limit</Label>
                  <Input
                    type="number"
                    value={newToken.usage_limit || ''}
                    onChange={(e) => setNewToken({ ...newToken, usage_limit: parseInt(e.target.value) || undefined })}
                    placeholder="10"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateToken} disabled={!newToken.token_type}>
                    Create Token
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
              <CardTitle className="text-sm font-medium">Active Tokens</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tokens.filter(t => t.is_active).length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">QR Codes</CardTitle>
              <QrCode className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tokens.filter(t => t.token_type === 'qr').length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Access Codes</CardTitle>
              <Key className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tokens.filter(t => t.token_type === 'access_code').length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tokens.reduce((sum, t) => sum + t.usage_count, 0)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tokens Table */}
        <Card>
          <CardHeader>
            <CardTitle>Registration Tokens</CardTitle>
            <CardDescription>
              Manage QR codes and access codes for guard registration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Token</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tokens.map((token) => (
                  <TableRow key={token.id}>
                    <TableCell>
                      {getTokenTypeBadge(token.token_type)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                          {token.token}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(token.token)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        {token.token_type === 'qr' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedToken(token)
                              setShowQRDialog(true)
                            }}
                          >
                            <QrCode className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {(token as any).role?.name || 'Not set'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {token.usage_count}/{token.usage_limit || '∞'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {token.expires_at ? (
                        <div className="flex items-center text-sm">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDateTime(token.expires_at)}
                        </div>
                      ) : (
                        'Never'
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(getRegistrationURL(token.token))}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeactivateToken(token.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {tokens.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No registration tokens created yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>QR Code Registration</DialogTitle>
            <DialogDescription>
              Guards can scan this QR code to register
            </DialogDescription>
          </DialogHeader>
          {selectedToken && (
            <div className="flex flex-col items-center space-y-4">
              <QRCodeSVG
                value={getRegistrationURL(selectedToken.token)}
                size={200}
                level="M"
                includeMargin={true}
              />
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  Token: <code className="bg-gray-100 px-2 py-1 rounded">{selectedToken.token}</code>
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(getRegistrationURL(selectedToken.token))}
                >
                  <Copy className="h-3 w-3 mr-2" />
                  Copy Link
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}