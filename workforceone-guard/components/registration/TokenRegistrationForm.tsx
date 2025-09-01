'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { RegistrationTokenService } from '@/lib/registration/tokens'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Shield, QrCode, Mail, Key, CheckCircle, User, Phone, Lock } from 'lucide-react'

interface TokenRegistrationFormProps {
  initialToken?: string | null
}

export const TokenRegistrationForm: React.FC<TokenRegistrationFormProps> = ({ initialToken }) => {
  const [step, setStep] = useState<'token' | 'form' | 'success'>('token')
  const [token, setToken] = useState(initialToken || '')
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

  useEffect(() => {
    if (initialToken) {
      validateToken(initialToken)
    }
  }, [initialToken])

  const validateToken = async (tokenValue: string) => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/registration/validate-token?token=${encodeURIComponent(tokenValue)}`)
      const result = await response.json()
      
      if (result.valid && result.tokenData) {
        setTokenData(result.tokenData)
        setStep('form')
      } else {
        setError(result.error || 'Invalid token')
      }
    } catch (err) {
      setError('Failed to validate token')
    }
    
    setLoading(false)
  }

  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (token.trim()) {
      validateToken(token.trim())
    }
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

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      setLoading(false)
      return
    }

    try {
      const { success, error } = await RegistrationTokenService.registerWithToken(token, {
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone
      })
      
      if (success) {
        setStep('success')
        setTimeout(() => {
          router.push('/auth/login?message=Registration successful! Please sign in.')
        }, 3000)
      } else {
        setError(error || 'Registration failed')
      }
    } catch (err) {
      setError('Registration failed. Please try again.')
    }
    
    setLoading(false)
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
            <CardTitle className="text-2xl font-bold">Join WorkforceOne</CardTitle>
            <CardDescription>Enter your registration token to create your guard account</CardDescription>
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
                  placeholder="Enter 5-letter code or QR token"
                  value={token}
                  onChange={(e) => setToken(e.target.value.toUpperCase())}
                  maxLength={36}
                  required
                />
                <p className="text-xs text-gray-600">
                  Get this from your supervisor or scan a registration QR code
                </p>
              </div>
              
              <Button type="submit" className="w-full" disabled={loading || !token.trim()}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validating Token...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Validate Token
                  </>
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

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-green-800">Registration Complete!</CardTitle>
            <CardDescription>Your guard account has been created successfully</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                Welcome to WorkforceOne, {formData.firstName}! Your account is now active.
              </p>
            </div>
            <p className="text-sm text-gray-600">
              You will be redirected to the login page in a few seconds...
            </p>
            <Button onClick={() => router.push('/auth/login')} className="w-full">
              Continue to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
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
        return 'QR Code Registration'
      case 'invite':
        return 'Invite Link Registration'
      case 'access_code':
        return 'Access Code Registration'
      default:
        return 'Token Registration'
    }
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-green-800">Registration Complete!</CardTitle>
            <CardDescription>Your guard account has been created successfully</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                Welcome to WorkforceOne, {formData.firstName}! Your account is now active.
              </p>
            </div>
            <p className="text-sm text-gray-600">
              You will be redirected to the login page in a few seconds...
            </p>
            <Button onClick={() => router.push('/auth/login')} className="w-full">
              Continue to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
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
            <CardTitle className="text-2xl font-bold">Join WorkforceOne</CardTitle>
            <CardDescription>Enter your registration token to create your guard account</CardDescription>
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
                  placeholder="Enter 5-letter code or QR token"
                  value={token}
                  onChange={(e) => setToken(e.target.value.toUpperCase())}
                  maxLength={36}
                  required
                />
                <p className="text-xs text-gray-600">
                  Get this from your supervisor or scan a registration QR code
                </p>
              </div>
              
              <Button type="submit" className="w-full" disabled={loading || !token.trim()}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validating Token...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Validate Token
                  </>
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
          <CardTitle className="text-2xl font-bold">Complete Your Registration</CardTitle>
          <CardDescription>
            {getTokenTypeLabel(tokenData?.token_type)} • Role: {tokenData?.role?.name}
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
                <Label htmlFor="firstName">
                  <User className="h-4 w-4 inline mr-1" />
                  First Name
                </Label>
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
              <Label htmlFor="email">
                <Mail className="h-4 w-4 inline mr-1" />
                Email Address
              </Label>
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
              <Label htmlFor="phone">
                <Phone className="h-4 w-4 inline mr-1" />
                Phone Number (Optional)
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+27 12 345 6789"
                value={formData.phone}
                onChange={handleFormChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">
                <Lock className="h-4 w-4 inline mr-1" />
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Create a secure password (min 8 chars)"
                value={formData.password}
                onChange={handleFormChange}
                minLength={8}
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
                  Creating Account...
                </>
              ) : (
                <>
                  <User className="mr-2 h-4 w-4" />
                  Create Guard Account
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center space-y-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setStep('token')}
              className="text-gray-600"
            >
              Use Different Token
            </Button>
            <p className="text-xs text-gray-500">
              By registering, you agree to WorkforceOne's terms of service
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
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
      return 'QR Code Registration'
    case 'invite':
      return 'Invite Link Registration'
    case 'access_code':
      return 'Access Code Registration'
    default:
      return 'Token Registration'
  }
}