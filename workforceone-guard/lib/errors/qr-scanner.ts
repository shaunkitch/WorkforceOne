// QR Scanner Error Handling System

export enum QRScanErrorCode {
  // QR Code Validation Errors
  INVALID_CODE = 'INVALID_CODE',
  EXPIRED_CODE = 'EXPIRED_CODE',
  CODE_NOT_FOUND = 'CODE_NOT_FOUND',
  CODE_ALREADY_USED = 'CODE_ALREADY_USED',
  
  // Authentication Errors
  USER_NOT_AUTHENTICATED = 'USER_NOT_AUTHENTICATED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  
  // Location Errors
  LOCATION_PERMISSION_DENIED = 'LOCATION_PERMISSION_DENIED',
  LOCATION_UNAVAILABLE = 'LOCATION_UNAVAILABLE',
  LOCATION_TIMEOUT = 'LOCATION_TIMEOUT',
  INVALID_LOCATION = 'INVALID_LOCATION',
  
  // Database Errors
  DATABASE_CONNECTION_FAILED = 'DATABASE_CONNECTION_FAILED',
  RECORD_CREATION_FAILED = 'RECORD_CREATION_FAILED',
  DATA_VALIDATION_FAILED = 'DATA_VALIDATION_FAILED',
  
  // Network Errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  REQUEST_TIMEOUT = 'REQUEST_TIMEOUT',
  SERVER_ERROR = 'SERVER_ERROR',
  
  // General Errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface QRScanError {
  code: QRScanErrorCode
  message: string
  userMessage: string
  details?: any
  timestamp: Date
  context?: {
    qrCode?: string
    userId?: string
    action?: string
    location?: { lat: number; lng: number }
  }
}

export class QRScannerError extends Error {
  public readonly errorCode: QRScanErrorCode
  public readonly userMessage: string
  public readonly details?: any
  public readonly timestamp: Date
  public readonly context?: any

  constructor(
    code: QRScanErrorCode,
    message: string,
    userMessage: string,
    details?: any,
    context?: any
  ) {
    super(message)
    this.name = 'QRScannerError'
    this.errorCode = code
    this.userMessage = userMessage
    this.details = details
    this.timestamp = new Date()
    this.context = context
  }

  toJSON(): QRScanError {
    return {
      code: this.errorCode,
      message: this.message,
      userMessage: this.userMessage,
      details: this.details,
      timestamp: this.timestamp,
      context: this.context
    }
  }
}

// Error Factory Functions
export const QRScanErrors = {
  invalidCode: (code?: string): QRScannerError =>
    new QRScannerError(
      QRScanErrorCode.INVALID_CODE,
      `Invalid QR code: ${code}`,
      'This QR code is not valid. Please check with your administrator.',
      { code },
      { qrCode: code }
    ),

  expiredCode: (code: string, expiredAt: Date): QRScannerError =>
    new QRScannerError(
      QRScanErrorCode.EXPIRED_CODE,
      `QR code expired at ${expiredAt.toISOString()}`,
      'This QR code has expired. Please request a new code.',
      { code, expiredAt },
      { qrCode: code }
    ),

  codeNotFound: (code: string): QRScannerError =>
    new QRScannerError(
      QRScanErrorCode.CODE_NOT_FOUND,
      `QR code not found: ${code}`,
      'QR code not found in system. Please verify the code is correct.',
      { code },
      { qrCode: code }
    ),

  userNotAuthenticated: (): QRScannerError =>
    new QRScannerError(
      QRScanErrorCode.USER_NOT_AUTHENTICATED,
      'User not authenticated',
      'Please log in to continue.',
      {},
      {}
    ),

  locationPermissionDenied: (): QRScannerError =>
    new QRScannerError(
      QRScanErrorCode.LOCATION_PERMISSION_DENIED,
      'Location permission denied by user',
      'Location access is required for attendance verification. Please enable location services in your browser settings.',
      {},
      {}
    ),

  locationTimeout: (): QRScannerError =>
    new QRScannerError(
      QRScanErrorCode.LOCATION_TIMEOUT,
      'Location request timed out',
      'Unable to get your location. Please check your GPS signal and try again.',
      {},
      {}
    ),

  databaseError: (originalError: Error): QRScannerError =>
    new QRScannerError(
      QRScanErrorCode.DATABASE_CONNECTION_FAILED,
      `Database error: ${originalError.message}`,
      'Unable to connect to the system. Please try again in a moment.',
      { originalError: originalError.message },
      {}
    ),

  networkError: (originalError: Error): QRScannerError =>
    new QRScannerError(
      QRScanErrorCode.NETWORK_ERROR,
      `Network error: ${originalError.message}`,
      'Network connection issue. Please check your internet connection and try again.',
      { originalError: originalError.message },
      {}
    ),

  serverError: (statusCode: number, message?: string): QRScannerError =>
    new QRScannerError(
      QRScanErrorCode.SERVER_ERROR,
      `Server error: ${statusCode} - ${message}`,
      'Server is experiencing issues. Please try again later.',
      { statusCode, message },
      {}
    ),

  recordCreationFailed: (details: any): QRScannerError =>
    new QRScannerError(
      QRScanErrorCode.RECORD_CREATION_FAILED,
      'Failed to create attendance record',
      'Unable to record your attendance. Please try again.',
      details,
      {}
    )
}

// Error Logger
export interface ErrorLogEntry {
  id: string
  error: QRScanError
  userId?: string
  userAgent?: string
  url?: string
  sessionId?: string
}

export class QRErrorLogger {
  private static logs: ErrorLogEntry[] = []

  static log(error: QRScannerError, userId?: string, additionalContext?: any): void {
    const logEntry: ErrorLogEntry = {
      id: crypto.randomUUID(),
      error,
      userId,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      sessionId: typeof window !== 'undefined' ? sessionStorage.getItem('sessionId') || undefined : undefined,
      ...additionalContext
    }

    this.logs.push(logEntry)

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('QR Scanner Error:', logEntry)
    }

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService(logEntry).catch(console.error)
    }
  }

  private static async sendToMonitoringService(logEntry: ErrorLogEntry): Promise<void> {
    try {
      // This could be integrated with services like Sentry, LogRocket, etc.
      await fetch('/api/errors/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry)
      })
    } catch (error) {
      console.error('Failed to send error log:', error)
    }
  }

  static getLogs(): ErrorLogEntry[] {
    return [...this.logs]
  }

  static clearLogs(): void {
    this.logs = []
  }
}

// Error Handler Hook for React Components
export const useQRErrorHandler = () => {
  const handleError = (error: unknown, context?: any): QRScannerError => {
    let qrError: QRScannerError

    if (error instanceof QRScannerError) {
      qrError = error
    } else if (error instanceof Error) {
      // Map common errors to QR-specific errors
      if (error.message.includes('network') || error.message.includes('fetch')) {
        qrError = QRScanErrors.networkError(error)
      } else if (error.message.includes('database') || error.message.includes('supabase')) {
        qrError = QRScanErrors.databaseError(error)
      } else {
        qrError = new QRScannerError(
          QRScanErrorCode.UNKNOWN_ERROR,
          error.message,
          'An unexpected error occurred. Please try again.',
          { originalError: error.message },
          context
        )
      }
    } else {
      qrError = new QRScannerError(
        QRScanErrorCode.UNKNOWN_ERROR,
        'Unknown error occurred',
        'An unexpected error occurred. Please try again.',
        { error },
        context
      )
    }

    // Log the error
    QRErrorLogger.log(qrError, context?.userId, context)

    return qrError
  }

  return { handleError }
}