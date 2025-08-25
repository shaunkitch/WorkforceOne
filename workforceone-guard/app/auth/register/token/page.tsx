'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { RegistrationTokenService } from '@/lib/registration/tokens'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Shield, QrCode, Mail, Key } from 'lucide-react'

export default function TokenRegistrationPage() {
  const [step, setStep] = useState<'token' | 'form'>('token')
  const [token, setToken] = useState('')
  const [tokenData, setTokenData] = useState<any>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check if token is provided in URL
    const urlToken = searchParams.get('token')
    if (urlToken) {
      setToken(urlToken)
      validateToken(urlToken)
    }
  }, [searchParams])

  const validateToken = async (tokenValue: string) => {
    setLoading(true)
    setError('')

    const { success, tokenData: data, error } = await RegistrationTokenService.validateToken(tokenValue)
    
    if (success && data) {
      setTokenData(data)
      setStep('form')
    } else {
      setError(error || 'Invalid token')
    }
    setLoading(false)
  }

  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    validateToken(token)
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    const { success, error } = await RegistrationTokenService.registerWithToken(token, {
      email: formData.email,
      password: formData.password,
      first_name: formData.firstName,
      last_name: formData.lastName,
      phone: formData.phone
    })
    
    if (success) {
      router.push('/auth/login?message=Registration successful')
    } else {
      setError(error || 'Registration failed')
    }
    setLoading(false)
  }

  const getTokenIcon = (tokenType: string) => {
    switch (tokenType) {
      case 'qr':
        return <QrCode className="h-8 w-8 text-blue-600" />
      case 'invite':
        return <Mail className="h-8 w-8 text-blue-600" />
      case 'access_code':
        return <Key className="h-8 w-8 text-blue-600" />
      default:
        return <Shield className="h-8 w-8 text-blue-600" />
    }
  }

  const getTokenTypeLabel = (tokenType: string) => {
    switch (tokenType) {
      case 'qr':
        return 'QR Code'
      case 'invite':
        return 'Invite Link'
      case 'access_code':
        return 'Access Code'
      default:
        return 'Token'
    }
  }

  if (step === 'token') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Join Organization</CardTitle>
            <CardDescription>Enter your registration token to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTokenSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="token">Registration Token</Label>
                <Input
                  id="token"
                  placeholder="Enter your token, invite code, or access code"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                />
                <p className="text-xs text-gray-600">
                  This was provided by your administrator via QR code, invite link, or access code
                </p>
              </div>
              
              <Button type="submit" className="w-full" disabled={loading || !token}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validating...
                  </>
                ) : (
                  'Validate Token'
                )}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-blue-600 hover:underline">
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              {getTokenIcon(tokenData?.token_type)}
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Complete Registration</CardTitle>
          <CardDescription>
            {getTokenTypeLabel(tokenData?.token_type)} validated successfully
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegistration} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleFormChange}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="john.doe@example.com"
                value={formData.email}
                onChange={handleFormChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={handleFormChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Create a secure password"
                value={formData.password}
                onChange={handleFormChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleFormChange}
                required
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setStep('token')}
              className="text-gray-600"
            >
              Use different token
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}