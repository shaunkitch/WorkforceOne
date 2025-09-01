'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SetupProfilePage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const createProfile = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/auth/create-profile', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: 'Admin',
          last_name: 'User',
          organization_name: 'Security Company'
        })
      })

      const data = await response.json()
      setResult(data)
      
      if (data.success) {
        // Reload the page after successful profile creation
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 2000)
      }
    } catch (error) {
      console.error('Error creating profile:', error)
      setResult({ success: false, error: 'Network error' })
    } finally {
      setLoading(false)
    }
  }, [])

  // Auto-create profile on page load (disabled since auth is working)
  // useEffect(() => {
  //   createProfile()
  // }, [createProfile])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Setup Your Profile</CardTitle>
          <CardDescription>
            You're logged in but missing a user profile. Click below to create it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={createProfile} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Creating Profile...' : 'Create Profile'}
          </Button>
          
          {result && (
            <div className={`p-3 rounded ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {result.success ? (
                <div>
                  <p className="font-medium">✅ Profile Created!</p>
                  <p className="text-sm">Redirecting to dashboard...</p>
                </div>
              ) : (
                <div>
                  <p className="font-medium">❌ Error</p>
                  <p className="text-sm">{result.error}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}