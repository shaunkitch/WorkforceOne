// Push Notification Service for Mobile App

export interface PushNotificationOptions {
  title: string
  body: string
  icon?: string
  badge?: string
  data?: any
  tag?: string
  requireInteraction?: boolean
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}

export interface PushSubscriptionData {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export class PushNotificationService {
  private static registration: ServiceWorkerRegistration | null = null
  private static subscription: PushSubscription | null = null

  /**
   * Initialize push notifications
   */
  static async initialize(): Promise<boolean> {
    try {
      // Check if service worker and push messaging are supported
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push notifications not supported')
        return false
      }

      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js')
      console.log('[Push] Service worker registered')

      // Check if user already granted permission
      const permission = await Notification.requestPermission()
      
      if (permission === 'granted') {
        await this.subscribeToPush()
        return true
      }

      return false

    } catch (error) {
      console.error('[Push] Initialization error:', error)
      return false
    }
  }

  /**
   * Request notification permission
   */
  static async requestPermission(): Promise<boolean> {
    try {
      const permission = await Notification.requestPermission()
      
      if (permission === 'granted') {
        await this.subscribeToPush()
        return true
      }

      return false
    } catch (error) {
      console.error('[Push] Permission request error:', error)
      return false
    }
  }

  /**
   * Subscribe to push notifications
   */
  private static async subscribeToPush(): Promise<void> {
    try {
      if (!this.registration) {
        throw new Error('Service worker not registered')
      }

      // Check if already subscribed
      this.subscription = await this.registration.pushManager.getSubscription()
      
      if (this.subscription) {
        console.log('[Push] Already subscribed')
        await this.updateSubscriptionOnServer()
        return
      }

      // Create new subscription
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 
        'BEL64xQvQnWIvQNdXjN1JCfzEQ0Q_QTK9Gzic_1K3HmkZV8L-QSRJyC1YzG8v5Q6-oJ7ZkJm4Qc1rV7_9F6CwCQ'

      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
      })

      console.log('[Push] New subscription created')
      await this.updateSubscriptionOnServer()

    } catch (error) {
      console.error('[Push] Subscribe error:', error)
      throw error
    }
  }

  /**
   * Update subscription on server
   */
  private static async updateSubscriptionOnServer(): Promise<void> {
    if (!this.subscription) return

    try {
      const subscriptionData: PushSubscriptionData = {
        endpoint: this.subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(this.subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(this.subscription.getKey('auth')!)
        }
      }

      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscriptionData)
      })

      if (!response.ok) {
        throw new Error('Failed to update subscription on server')
      }

      console.log('[Push] Subscription updated on server')
    } catch (error) {
      console.error('[Push] Server update error:', error)
    }
  }

  /**
   * Send local notification
   */
  static async sendLocalNotification(options: PushNotificationOptions): Promise<void> {
    try {
      if (!this.registration) {
        throw new Error('Service worker not registered')
      }

      if (Notification.permission !== 'granted') {
        throw new Error('Notification permission not granted')
      }

      await this.registration.showNotification(options.title, {
        body: options.body,
        icon: options.icon || '/icons/icon-192x192.png',
        badge: options.badge || '/icons/badge-72x72.png',
        data: options.data,
        tag: options.tag,
        requireInteraction: options.requireInteraction,
        actions: options.actions
      })

    } catch (error) {
      console.error('[Push] Local notification error:', error)
      throw error
    }
  }

  /**
   * Send notification via server (to other devices)
   */
  static async sendServerNotification(
    targetUserId: string,
    options: PushNotificationOptions
  ): Promise<boolean> {
    try {
      const response = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId,
          ...options
        })
      })

      return response.ok
    } catch (error) {
      console.error('[Push] Server notification error:', error)
      return false
    }
  }

  /**
   * Handle attendance notifications
   */
  static async notifyAttendanceUpdate(
    action: 'check_in' | 'check_out',
    guardName: string,
    siteName?: string
  ): Promise<void> {
    const options: PushNotificationOptions = {
      title: `${guardName} - ${action === 'check_in' ? 'Check In' : 'Check Out'}`,
      body: siteName ? `At ${siteName}` : 'Attendance recorded',
      icon: '/icons/attendance-icon.png',
      tag: 'attendance',
      data: { type: 'attendance', action, timestamp: new Date().toISOString() }
    }

    await this.sendLocalNotification(options)
  }

  /**
   * Handle patrol notifications
   */
  static async notifyPatrolUpdate(
    guardName: string,
    checkpointName: string,
    routeName?: string
  ): Promise<void> {
    const options: PushNotificationOptions = {
      title: `${guardName} - Checkpoint Scan`,
      body: `Visited ${checkpointName}${routeName ? ` on ${routeName}` : ''}`,
      icon: '/icons/patrol-icon.png',
      tag: 'patrol',
      data: { type: 'patrol', timestamp: new Date().toISOString() }
    }

    await this.sendLocalNotification(options)
  }

  /**
   * Handle alert notifications
   */
  static async notifyAlert(
    alertType: 'emergency' | 'incident' | 'system',
    title: string,
    message: string,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): Promise<void> {
    const options: PushNotificationOptions = {
      title: `🚨 ${title}`,
      body: message,
      icon: '/icons/alert-icon.png',
      badge: '/icons/alert-badge.png',
      tag: `alert-${alertType}`,
      requireInteraction: priority === 'high',
      data: { 
        type: 'alert', 
        alertType, 
        priority,
        timestamp: new Date().toISOString() 
      },
      actions: priority === 'high' ? [
        { action: 'acknowledge', title: 'Acknowledge', icon: '/icons/check.png' },
        { action: 'respond', title: 'Respond', icon: '/icons/response.png' }
      ] : undefined
    }

    await this.sendLocalNotification(options)
  }

  /**
   * Utility functions
   */
  private static urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    bytes.forEach(b => binary += String.fromCharCode(b))
    return window.btoa(binary)
  }

  /**
   * Get current permission status
   */
  static getPermissionStatus(): NotificationPermission {
    return Notification.permission
  }

  /**
   * Check if notifications are supported
   */
  static isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
  }

  /**
   * Unsubscribe from push notifications
   */
  static async unsubscribe(): Promise<boolean> {
    try {
      if (this.subscription) {
        await this.subscription.unsubscribe()
        this.subscription = null
        
        // Notify server of unsubscription
        await fetch('/api/push/unsubscribe', { method: 'POST' })
        
        return true
      }
      return false
    } catch (error) {
      console.error('[Push] Unsubscribe error:', error)
      return false
    }
  }
}