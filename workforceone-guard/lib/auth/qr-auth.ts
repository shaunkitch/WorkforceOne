// Unified Authentication Flow for QR Code Scanning

import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { QRScanErrors, QRScannerError } from '@/lib/errors/qr-scanner'

export interface QRAuthUser extends User {
  first_name?: string
  last_name?: string
  role?: {
    id: string
    name: string
    permissions: Record<string, any>
  }
  organization_id?: string
  is_active?: boolean
}

export interface AuthenticationContext {
  returnUrl?: string
  qrCode?: string
  action?: 'attendance' | 'registration' | 'patrol'
  siteId?: string
}

export enum AuthState {
  LOADING = 'loading',
  AUTHENTICATED = 'authenticated',
  UNAUTHENTICATED = 'unauthenticated',
  SESSION_EXPIRED = 'session_expired',
  INSUFFICIENT_PERMISSIONS = 'insufficient_permissions',
  ACCOUNT_INACTIVE = 'account_inactive'
}

export interface AuthenticationResult {
  state: AuthState
  user: QRAuthUser | null
  error: QRScannerError | null
  requiresRedirect: boolean
  redirectUrl?: string
}

export class QRAuthService {
  private static currentUser: QRAuthUser | null = null
  private static authState: AuthState = AuthState.LOADING

  static async checkAuthentication(context?: AuthenticationContext): Promise<AuthenticationResult> {
    try {
      // Check if we have a valid session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Session error:', sessionError)
        return this.createAuthResult(AuthState.UNAUTHENTICATED, null, QRScanErrors.userNotAuthenticated())
      }

      if (!session) {
        const redirectUrl = context?.returnUrl 
          ? `/auth/login?returnUrl=${encodeURIComponent(context.returnUrl)}`
          : '/auth/login'
        
        return this.createAuthResult(
          AuthState.UNAUTHENTICATED, 
          null, 
          QRScanErrors.userNotAuthenticated(),
          true,
          redirectUrl
        )
      }

      // Get user profile with role information
      const { data: profile, error: profileError } = await supabase
        .rpc('get_user_profile', { user_id: session.user.id })

      if (profileError || !profile) {
        console.error('Profile error:', profileError)
        return this.createAuthResult(
          AuthState.UNAUTHENTICATED,
          null,
          new QRScannerError(
            'USER_PROFILE_ERROR' as any,
            'Failed to load user profile',
            'Unable to load your profile. Please try logging in again.',
            { profileError },
            { userId: session.user.id }
          )
        )
      }

      // Check if account is active
      if (!profile.is_active) {
        return this.createAuthResult(
          AuthState.ACCOUNT_INACTIVE,
          null,
          new QRScannerError(
            'ACCOUNT_INACTIVE' as any,
            'User account is inactive',
            'Your account has been deactivated. Please contact your administrator.',
            { userId: session.user.id },
            { userId: session.user.id }
          )
        )
      }

      // Create authenticated user object
      const authUser: QRAuthUser = {
        ...session.user,
        first_name: profile.first_name,
        last_name: profile.last_name,
        role: profile.role,
        organization_id: profile.organization_id,
        is_active: profile.is_active
      }

      // Check permissions for specific actions
      if (context?.action) {
        const hasPermission = await this.checkActionPermission(authUser, context.action, context)
        if (!hasPermission) {
          return this.createAuthResult(
            AuthState.INSUFFICIENT_PERMISSIONS,
            authUser,
            new QRScannerError(
              'INSUFFICIENT_PERMISSIONS' as any,
              `Insufficient permissions for action: ${context.action}`,
              'You do not have permission to perform this action. Please contact your administrator.',
              { action: context.action, userRole: authUser.role?.name },
              { userId: authUser.id, action: context.action }
            )
          )
        }
      }

      this.currentUser = authUser
      this.authState = AuthState.AUTHENTICATED

      return this.createAuthResult(AuthState.AUTHENTICATED, authUser, null)

    } catch (error) {
      console.error('Authentication check error:', error)
      return this.createAuthResult(
        AuthState.UNAUTHENTICATED,
        null,
        new QRScannerError(
          'AUTHENTICATION_ERROR' as any,
          'Authentication check failed',
          'Unable to verify your authentication. Please try again.',
          { error },
          {}
        )
      )
    }
  }

  private static async checkActionPermission(
    user: QRAuthUser, 
    action: string, 
    context?: AuthenticationContext
  ): Promise<boolean> {
    // Check role-based permissions
    const rolePermissions = user.role?.permissions || {}

    switch (action) {
      case 'attendance':
        // Guards can always check in/out, admins can manage attendance
        return this.hasPermission(rolePermissions, 'attendance.scan') ||
               this.hasPermission(rolePermissions, 'attendance.manage') ||
               user.role?.name === 'Guard' ||
               user.role?.name === 'Super Admin'

      case 'registration':
        // Only admins can generate registration QR codes, but anyone can use them
        return true // Registration QR validation happens at the QR level

      case 'patrol':
        // Guards can scan patrol checkpoints, admins can manage patrols
        return this.hasPermission(rolePermissions, 'patrol.scan') ||
               this.hasPermission(rolePermissions, 'patrol.manage') ||
               user.role?.name === 'Guard' ||
               user.role?.name === 'Super Admin'

      default:
        return false
    }
  }

  private static hasPermission(permissions: Record<string, any>, permission: string): boolean {
    // Check for wildcard permission
    if (permissions['*'] === '*') return true

    // Check for specific permission
    const parts = permission.split('.')
    let current = permissions
    
    for (const part of parts) {
      if (current[part] === '*') return true
      if (typeof current[part] === 'object') {
        current = current[part]
      } else {
        return current[part] === true
      }
    }

    return false
  }

  private static createAuthResult(
    state: AuthState,
    user: QRAuthUser | null,
    error: QRScannerError | null,
    requiresRedirect: boolean = false,
    redirectUrl?: string
  ): AuthenticationResult {
    return {
      state,
      user,
      error,
      requiresRedirect,
      redirectUrl
    }
  }

  static getCurrentUser(): QRAuthUser | null {
    return this.currentUser
  }

  static getAuthState(): AuthState {
    return this.authState
  }

  static async signOut(): Promise<void> {
    try {
      await supabase.auth.signOut()
      this.currentUser = null
      this.authState = AuthState.UNAUTHENTICATED
    } catch (error) {
      console.error('Sign out error:', error)
      throw new QRScannerError(
        'SIGNOUT_ERROR' as any,
        'Failed to sign out',
        'Unable to sign out. Please try again.',
        { error },
        { userId: this.currentUser?.id }
      )
    }
  }

  static async refreshSession(): Promise<AuthenticationResult> {
    try {
      const { data, error } = await supabase.auth.refreshSession()
      
      if (error || !data.session) {
        this.currentUser = null
        this.authState = AuthState.SESSION_EXPIRED
        
        return this.createAuthResult(
          AuthState.SESSION_EXPIRED,
          null,
          new QRScannerError(
            'SESSION_EXPIRED' as any,
            'Session has expired',
            'Your session has expired. Please log in again.',
            { error },
            { userId: this.currentUser?.id }
          ),
          true,
          '/auth/login'
        )
      }

      // Re-check authentication with refreshed session
      return await this.checkAuthentication()

    } catch (error) {
      console.error('Session refresh error:', error)
      return this.createAuthResult(
        AuthState.UNAUTHENTICATED,
        null,
        new QRScannerError(
          'SESSION_REFRESH_ERROR' as any,
          'Failed to refresh session',
          'Unable to refresh your session. Please log in again.',
          { error },
          { userId: this.currentUser?.id }
        )
      )
    }
  }

  // Listen for auth state changes
  static onAuthStateChange(callback: (result: AuthenticationResult) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[QR Auth] Auth state changed:', event)

      switch (event) {
        case 'SIGNED_IN':
          if (session) {
            const result = await this.checkAuthentication()
            callback(result)
          }
          break

        case 'SIGNED_OUT':
          this.currentUser = null
          this.authState = AuthState.UNAUTHENTICATED
          callback(this.createAuthResult(AuthState.UNAUTHENTICATED, null, null))
          break

        case 'TOKEN_REFRESHED':
          if (session) {
            const result = await this.checkAuthentication()
            callback(result)
          }
          break

        default:
          break
      }
    })
  }
}

// React Hook for QR Authentication
export const useQRAuth = (context?: AuthenticationContext) => {
  const [authResult, setAuthResult] = React.useState<AuthenticationResult>({
    state: AuthState.LOADING,
    user: null,
    error: null,
    requiresRedirect: false
  })

  React.useEffect(() => {
    let mounted = true

    const checkAuth = async () => {
      const result = await QRAuthService.checkAuthentication(context)
      if (mounted) {
        setAuthResult(result)
      }
    }

    checkAuth()

    // Set up auth state listener
    const { data: { subscription } } = QRAuthService.onAuthStateChange((result) => {
      if (mounted) {
        setAuthResult(result)
      }
    })

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [context])

  const signOut = React.useCallback(async () => {
    try {
      await QRAuthService.signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }, [])

  const refreshAuth = React.useCallback(async () => {
    const result = await QRAuthService.refreshSession()
    setAuthResult(result)
    return result
  }, [])

  return {
    ...authResult,
    signOut,
    refreshAuth,
    isLoading: authResult.state === AuthState.LOADING,
    isAuthenticated: authResult.state === AuthState.AUTHENTICATED,
    needsRedirect: authResult.requiresRedirect
  }
}

// Add React import for hook
import React from 'react'