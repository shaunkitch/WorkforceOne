'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../supabase/client'
import { PermissionChecker, Role } from './permissions'

interface AuthUser {
  id: string
  email: string
  first_name: string
  last_name: string
  organization_id: string
  role_id: string
  role?: Role
  avatar_url?: string
  phone?: string
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, userData: Partial<AuthUser>) => Promise<{ error: any }>
  signOut: () => Promise<void>
  permissions: PermissionChecker | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [permissions, setPermissions] = useState<PermissionChecker | null>(null)
  const [fetchingProfile, setFetchingProfile] = useState(false)
  const currentUserRef = useRef<string | null>(null)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        currentUserRef.current = session.user.id
        fetchUserProfile(session.user)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.id)
      if (session?.user) {
        // Only fetch profile if we don't already have this user ID
        if (currentUserRef.current !== session.user.id) {
          currentUserRef.current = session.user.id
          await fetchUserProfile(session.user)
        } else {
          console.log('Same user already loaded, skipping profile fetch')
        }
      } else {
        currentUserRef.current = null
        setUser(null)
        setPermissions(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = useCallback(async (authUser: User) => {
    if (fetchingProfile) {
      console.log('Profile fetch already in progress, skipping...')
      return
    }
    
    setFetchingProfile(true)
    try {
      // First try the direct query
      let { data: profile, error } = await supabase
        .from('users')
        .select(`
          *,
          role:roles(*)
        `)
        .eq('id', authUser.id)
        .single()

      // If the direct query fails due to RLS, try the API endpoint
      if (error && (error.code === 'PGRST116' || error.message?.includes('Cannot coerce'))) {
        console.log('Direct query failed, trying API endpoint...', error)
        
        try {
          const response = await fetch(`/api/auth/profile?userId=${authUser.id}`)
          
          if (response.ok) {
            const result = await response.json()
            profile = result.profile
            error = null
            console.log('API endpoint succeeded, profile:', profile)
          } else {
            const errorResult = await response.json()
            console.error('API profile fetch error:', errorResult)
            setLoading(false)
            return
          }
        } catch (apiError) {
          console.error('API endpoint failed:', apiError)
          setLoading(false)
          return
        }
      } else if (error) {
        console.error('Error fetching user profile:', {
          error,
          code: error?.code,
          message: error?.message,
          details: error?.details,
          hint: error?.hint
        })
        setLoading(false)
        return
      }

      if (!profile) {
        console.error('Profile is null or undefined - redirecting to setup')
        // Redirect to setup profile page if user is authenticated but has no profile
        if (typeof window !== 'undefined' && window.location.pathname !== '/setup-profile') {
          window.location.href = '/setup-profile'
        }
        setLoading(false)
        return
      }

      console.log('Creating authUserData from profile:', profile)

      const authUserData: AuthUser = {
        id: profile.id,
        email: profile.email,
        first_name: profile.first_name,
        last_name: profile.last_name,
        organization_id: profile.organization_id,
        role_id: profile.role_id,
        role: profile.role,
        avatar_url: profile.avatar_url,
        phone: profile.phone
      }

      setUser(authUserData)
      currentUserRef.current = authUserData.id

      // Set up permissions
      if (profile.role) {
        setPermissions(new PermissionChecker(profile.role))
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error)
    } finally {
      setLoading(false)
      setFetchingProfile(false)
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting signInWithPassword...')
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log('SignIn response:', { 
        user: data.user?.id, 
        session: !!data.session,
        error: error?.message 
      })

      if (error) {
        console.error('Sign in error:', error)
        return { error }
      }

      if (!data.session || !data.user) {
        console.error('Sign in failed: no session or user returned')
        return { error: { message: 'Authentication failed - no session created' } }
      }

      console.log('Sign in successful, session created')
      return { error: null }
    } catch (err) {
      console.error('Sign in exception:', err)
      return { error: { message: 'Authentication failed due to network error' } }
    }
  }

  const signUp = async (email: string, password: string, userData: Partial<AuthUser>) => {
    try {
      // Use the smart registration API that works with triggers
      console.log('Using smart registration approach...')
      
      const response = await fetch('/api/auth/smart-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          userData
        }),
      })

      console.log('Registration API response received:', response.status)
      const result = await response.json()
      console.log('Registration API result:', result)

      if (!response.ok) {
        console.error('Registration API failed:', result.error)
        return { error: { message: result.error } }
      }

      // After successful registration, sign in the user
      console.log('Registration successful, attempting sign in...')
      
      try {
        const { data: signInData, error: signInError } = await Promise.race([
          supabase.auth.signInWithPassword({
            email,
            password,
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Sign-in timeout')), 10000)
          )
        ]) as any

        if (signInError) {
          console.error('Sign-in error after registration:', signInError)
          // Registration succeeded but sign-in failed - user can manually sign in
          return { 
            error: null,
            message: 'Registration successful! Please sign in with your new account.',
            needsManualSignIn: true
          }
        }

        console.log('Sign-in successful:', signInData?.user?.id)
        
        // Registration and sign-in successful
        console.log('Smart registration and sign-in completed successfully!')
        return { error: null }
        
      } catch (signInTimeoutError) {
        console.error('Sign-in timeout or error:', signInTimeoutError)
        // Registration succeeded but sign-in had issues - user can manually sign in
        return { 
          error: null,
          message: 'Registration successful! Please sign in with your new account.',
          needsManualSignIn: true
        }
      }

    } catch (error) {
      console.error('Registration error:', error)
      return { error: { message: 'Registration failed due to network or server error' } }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setPermissions(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        permissions
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Custom hooks for permission checking
export function usePermissions() {
  const { permissions } = useAuth()
  return permissions
}

export function useCanAccess(resource: string, action: string) {
  const permissions = usePermissions()
  return permissions?.can(resource, action) ?? false
}