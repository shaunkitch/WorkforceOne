'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Shield } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [redirecting, setRedirecting] = useState(false)
  const { signIn, user, loading: authLoading } = useAuth()
  const router = useRouter()

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user && !redirecting) {
      console.log('User already authenticated, redirecting to dashboard')
      setRedirecting(true)
      window.location.href = '/dashboard'
    }
  }, [user, authLoading, redirecting])

  // Show loading state while checking auth or redirecting
  if (authLoading || redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('Attempting login for:', email)
      
      const result = await Promise.race([
        signIn(email, password),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Login timeout')), 10000)
        )
      ]) as any

      console.log('Login result:', result)
      
      if (result.error) {
        console.error('Login error:', result.error)
        setError(result.error.message)
        setLoading(false)
      } else {
        console.log('Login successful, redirecting to dashboard...')
        // Small delay to ensure auth state is updated
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 500)
      }
    } catch (timeoutError) {
      console.error('Login timeout, trying server-side login:', timeoutError)
      
      try {
        console.log('Attempting server-side login...')
        const serverResponse = await fetch('/api/auth/server-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ email, password }),
        })

        const serverResult = await serverResponse.json()
        console.log('Server login result:', serverResult)

        if (serverResult.success) {
          console.log('Server login successful, redirecting...')
          // Small delay to ensure session cookies are set
          setTimeout(() => {
            window.location.href = '/dashboard'
          }, 500)
        } else {
          setError(serverResult.error || 'Login failed. Please check your credentials.')
          setLoading(false)
        }
      } catch (serverError) {
        console.error('Server login also failed:', serverError)
        setError('Login failed. Please check your credentials and try again.')
        setLoading(false)
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">WorkforceOne Guard</CardTitle>
          <CardDescription>Sign in to your security management account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link href="/auth/register" className="text-blue-600 hover:underline">
                Register here
              </Link>
            </p>
            <p className="text-sm text-gray-600">
              Have an invite or QR code?{' '}
              <Link href="/auth/register/token" className="text-blue-600 hover:underline">
                Register with token
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}