// QR Authentication Guard Component

'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, LogIn, RefreshCw, Shield, XCircle } from 'lucide-react'
import { useQRAuth, AuthState, AuthenticationContext } from '@/lib/auth/qr-auth'
import { QRScannerError } from '@/lib/errors/qr-scanner'

export interface QRAuthGuardProps {
  children: React.ReactNode | ((user: any) => React.ReactNode)
  context?: AuthenticationContext
  fallback?: React.ReactNode
  requiresAuth?: boolean
  onAuthError?: (error: QRScannerError) => void
  onAuthSuccess?: (user: any) => void
}

export const QRAuthGuard: React.FC<QRAuthGuardProps> = ({
  children,
  context,
  fallback,
  requiresAuth = true,
  onAuthError,
  onAuthSuccess
}) => {
  const router = useRouter()
  const authResult = useQRAuth(context)

  React.useEffect(() => {
    if (authResult.error && onAuthError) {
      onAuthError(authResult.error)
    }

    if (authResult.user && authResult.state === AuthState.AUTHENTICATED && onAuthSuccess) {
      onAuthSuccess(authResult.user)
    }

    if (authResult.needsRedirect && authResult.redirectUrl) {
      router.push(authResult.redirectUrl)
    }
  }, [authResult, onAuthError, onAuthSuccess, router])

  // Show loading state
  if (authResult.isLoading) {
    return (
      <LoadingState 
        message="Checking authentication..."
        subMessage="Please wait while we verify your access"
      />
    )
  }

  // Show error states
  if (authResult.error && requiresAuth) {
    return (
      <ErrorState 
        error={authResult.error}
        onRetry={authResult.refreshAuth}
        context={context}
      />
    )
  }

  // Show unauthenticated state
  if (!authResult.isAuthenticated && requiresAuth) {
    return (
      <UnauthenticatedState 
        context={context}
      />
    )
  }

  // Show fallback if provided and not authenticated
  if (!authResult.isAuthenticated && fallback) {
    return <>{fallback}</>
  }

  // Render children if authenticated or auth not required
  if (typeof children === 'function' && authResult.user) {
    return <>{children(authResult.user)}</>
  }
  
  return <>{children}</>
}

const LoadingState: React.FC<{ message: string; subMessage?: string }> = ({ 
  message, 
  subMessage 
}) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <Card className="w-full max-w-md">
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <div className="p-3 bg-blue-100 rounded-full w-fit mx-auto">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">{message}</h3>
            {subMessage && (
              <p className="text-sm text-gray-600 mt-1">{subMessage}</p>
            )}
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </CardContent>
    </Card>
  </div>
)

const ErrorState: React.FC<{ 
  error: QRScannerError; 
  onRetry: () => Promise<any>;
  context?: AuthenticationContext;
}> = ({ error, onRetry, context }) => {
  const [retrying, setRetrying] = React.useState(false)
  const router = useRouter()

  const handleRetry = async () => {
    setRetrying(true)
    try {
      await onRetry()
    } catch (err) {
      console.error('Retry error:', err)
    } finally {
      setRetrying(false)
    }
  }

  const handleLogin = () => {
    const returnUrl = context?.returnUrl || window.location.href
    router.push(`/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-full">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-red-900">Authentication Error</CardTitle>
              <CardDescription className="text-red-700">
                Unable to verify your access
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error.userMessage}</p>
          </div>

          <div className="flex flex-col space-y-2">
            <Button 
              onClick={handleRetry} 
              disabled={retrying}
              variant="outline"
            >
              {retrying ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Try Again
            </Button>

            <Button onClick={handleLogin}>
              <LogIn className="h-4 w-4 mr-2" />
              Sign In
            </Button>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4">
              <summary className="text-xs cursor-pointer text-gray-500">
                Debug Information
              </summary>
              <pre className="text-xs mt-2 p-2 bg-gray-100 rounded overflow-auto">
                {JSON.stringify(error, null, 2)}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

const UnauthenticatedState: React.FC<{ 
  context?: AuthenticationContext;
}> = ({ context }) => {
  const router = useRouter()

  const handleLogin = () => {
    const returnUrl = context?.returnUrl || window.location.href
    router.push(`/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-full">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <CardTitle className="text-gray-900">Sign In Required</CardTitle>
              <CardDescription>
                You need to sign in to access this feature
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Please sign in with your guard account to continue scanning QR codes 
              and recording attendance.
            </p>

            <Button onClick={handleLogin} className="w-full">
              <LogIn className="h-4 w-4 mr-2" />
              Sign In
            </Button>

            {context?.qrCode && (
              <p className="text-xs text-gray-500 text-center">
                Your QR code will be processed after signing in.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Higher-order component version
export const withQRAuth = <P extends object>(
  Component: React.ComponentType<P>,
  authConfig?: {
    context?: AuthenticationContext
    requiresAuth?: boolean
    fallback?: React.ReactNode
  }
) => {
  return (props: P) => (
    <QRAuthGuard {...authConfig}>
      <Component {...props} />
    </QRAuthGuard>
  )
}

export default QRAuthGuard