// Real-time WebSocket Service for Live Updates

export interface WebSocketMessage {
  type: 'attendance' | 'patrol' | 'alert' | 'system'
  action: 'create' | 'update' | 'delete' | 'status_change'
  data: any
  timestamp: Date
  userId?: string
  organizationId: string
}

export interface WebSocketOptions {
  organizationId: string
  userId?: string
  subscriptions: Array<'attendance' | 'patrols' | 'alerts' | 'system'>
  onMessage?: (message: WebSocketMessage) => void
  onConnectionChange?: (connected: boolean) => void
  onError?: (error: Error) => void
}

export class WebSocketService {
  private static instance: WebSocketService | null = null
  private ws: WebSocket | null = null
  private options: WebSocketOptions | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private heartbeatInterval: NodeJS.Timeout | null = null
  private isConnected = false

  static getInstance(): WebSocketService {
    if (!this.instance) {
      this.instance = new WebSocketService()
    }
    return this.instance
  }

  /**
   * Connect to WebSocket server
   */
  async connect(options: WebSocketOptions): Promise<boolean> {
    try {
      this.options = options
      
      // Use secure WebSocket in production
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const host = window.location.host
      const wsUrl = `${protocol}//${host}/api/ws?org=${options.organizationId}&user=${options.userId || ''}`

      console.log('[WebSocket] Connecting to:', wsUrl)

      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        console.log('[WebSocket] Connected')
        this.isConnected = true
        this.reconnectAttempts = 0
        this.options?.onConnectionChange?.(true)
        this.startHeartbeat()
        this.subscribe()
      }

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          message.timestamp = new Date(message.timestamp)
          this.handleMessage(message)
        } catch (error) {
          console.error('[WebSocket] Message parse error:', error)
        }
      }

      this.ws.onclose = () => {
        console.log('[WebSocket] Disconnected')
        this.isConnected = false
        this.options?.onConnectionChange?.(false)
        this.stopHeartbeat()
        this.handleReconnect()
      }

      this.ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error)
        this.options?.onError?.(new Error('WebSocket connection error'))
      }

      return true

    } catch (error) {
      console.error('[WebSocket] Connection failed:', error)
      this.options?.onError?.(error instanceof Error ? error : new Error('Connection failed'))
      return false
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.stopHeartbeat()
    this.isConnected = false
    this.options?.onConnectionChange?.(false)
  }

  /**
   * Send subscription message
   */
  private subscribe(): void {
    if (!this.ws || !this.options) return

    const subscribeMessage = {
      type: 'subscribe',
      subscriptions: this.options.subscriptions,
      organizationId: this.options.organizationId,
      userId: this.options.userId
    }

    this.send(subscribeMessage)
  }

  /**
   * Send message to server
   */
  private send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    }
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(message: WebSocketMessage): void {
    console.log('[WebSocket] Received:', message.type, message.action)
    
    // Filter messages by organization
    if (message.organizationId !== this.options?.organizationId) {
      return
    }

    // Call the message handler
    this.options?.onMessage?.(message)
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnect attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1) // Exponential backoff

    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)

    setTimeout(() => {
      if (this.options) {
        this.connect(this.options)
      }
    }, delay)
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' })
      }
    }, 30000) // 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): { connected: boolean; reconnectAttempts: number } {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts
    }
  }

  /**
   * Broadcast live location update
   */
  broadcastLocationUpdate(location: { lat: number; lng: number; accuracy: number }): void {
    this.send({
      type: 'location_update',
      data: {
        userId: this.options?.userId,
        location,
        timestamp: new Date().toISOString()
      }
    })
  }

  /**
   * Send patrol status update
   */
  sendPatrolUpdate(patrolId: string, status: string, checkpointId?: string): void {
    this.send({
      type: 'patrol_update',
      data: {
        patrolId,
        status,
        checkpointId,
        userId: this.options?.userId,
        timestamp: new Date().toISOString()
      }
    })
  }

  /**
   * Send attendance update
   */
  sendAttendanceUpdate(action: 'check_in' | 'check_out', qrCode: string): void {
    this.send({
      type: 'attendance_update',
      data: {
        action,
        qrCode,
        userId: this.options?.userId,
        timestamp: new Date().toISOString()
      }
    })
  }
}

// React hook for WebSocket connection
import { useEffect, useRef, useState } from 'react'

export const useWebSocket = (options: WebSocketOptions) => {
  const [connected, setConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const wsRef = useRef<WebSocketService | null>(null)

  useEffect(() => {
    wsRef.current = WebSocketService.getInstance()
    
    const wsOptions: WebSocketOptions = {
      ...options,
      onMessage: (message) => {
        setLastMessage(message)
        options.onMessage?.(message)
      },
      onConnectionChange: (connected) => {
        setConnected(connected)
        const status = wsRef.current?.getConnectionStatus()
        setReconnectAttempts(status?.reconnectAttempts || 0)
        options.onConnectionChange?.(connected)
      },
      onError: options.onError
    }

    wsRef.current.connect(wsOptions)

    return () => {
      wsRef.current?.disconnect()
    }
  }, [options.organizationId])

  const sendMessage = (type: string, data: any) => {
    wsRef.current?.send({ type, data })
  }

  const broadcastLocation = (location: { lat: number; lng: number; accuracy: number }) => {
    wsRef.current?.broadcastLocationUpdate(location)
  }

  const sendPatrolUpdate = (patrolId: string, status: string, checkpointId?: string) => {
    wsRef.current?.sendPatrolUpdate(patrolId, status, checkpointId)
  }

  const sendAttendanceUpdate = (action: 'check_in' | 'check_out', qrCode: string) => {
    wsRef.current?.sendAttendanceUpdate(action, qrCode)
  }

  return {
    connected,
    lastMessage,
    reconnectAttempts,
    sendMessage,
    broadcastLocation,
    sendPatrolUpdate,
    sendAttendanceUpdate
  }
}