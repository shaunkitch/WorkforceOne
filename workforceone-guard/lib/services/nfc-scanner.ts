// NFC Scanning Service for Patrol Checkpoints

export interface NFCCheckpointData {
  checkpointId: string
  routeId?: string
  siteId: string
  name: string
  instructions?: string
  requiredActions?: string[]
  metadata?: any
}

export interface NFCScanResult {
  success: boolean
  data?: NFCCheckpointData
  error?: string
  timestamp: Date
}

export class NFCScannerService {
  private static reader: NDEFReader | null = null
  private static isScanning = false

  /**
   * Check if NFC is supported on this device
   */
  static isNFCSupported(): boolean {
    return 'NDEFReader' in window && 'NDEFWriter' in window
  }

  /**
   * Request NFC permission and initialize reader
   */
  static async requestNFCPermission(): Promise<boolean> {
    try {
      if (!this.isNFCSupported()) {
        throw new Error('NFC not supported on this device')
      }

      // Check if permission is already granted
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'nfc' as any })
        if (permission.state === 'denied') {
          throw new Error('NFC permission denied')
        }
      }

      // Initialize reader
      this.reader = new NDEFReader()
      return true

    } catch (error) {
      console.error('NFC permission error:', error)
      return false
    }
  }

  /**
   * Start scanning for NFC tags
   */
  static async startScanning(
    onScan: (result: NFCScanResult) => void,
    timeout: number = 30000
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.reader) {
        const hasPermission = await this.requestNFCPermission()
        if (!hasPermission) {
          return { success: false, error: 'NFC permission required' }
        }
      }

      if (this.isScanning) {
        return { success: false, error: 'Already scanning' }
      }

      this.isScanning = true

      // Start scanning
      await this.reader!.scan({ signal: AbortSignal.timeout(timeout) })

      // Set up scan handler
      this.reader!.onreading = (event: NDEFReadingEvent) => {
        try {
          const result = this.processNFCData(event)
          onScan(result)
        } catch (error) {
          onScan({
            success: false,
            error: error instanceof Error ? error.message : 'NFC processing failed',
            timestamp: new Date()
          })
        }
      }

      this.reader!.onreadingerror = (error: Event) => {
        console.error('NFC reading error:', error)
        onScan({
          success: false,
          error: 'Failed to read NFC tag',
          timestamp: new Date()
        })
        this.isScanning = false
      }

      return { success: true }

    } catch (error) {
      this.isScanning = false
      console.error('NFC scanning error:', error)
      
      if (error instanceof DOMException && error.name === 'AbortError') {
        return { success: false, error: 'NFC scan timeout' }
      }
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to start NFC scanning'
      }
    }
  }

  /**
   * Stop NFC scanning
   */
  static async stopScanning(): Promise<void> {
    try {
      if (this.reader && this.isScanning) {
        // Note: NDEFReader doesn't have a stop method, scanning stops automatically
        this.isScanning = false
      }
    } catch (error) {
      console.error('Error stopping NFC scan:', error)
    }
  }

  /**
   * Process NFC tag data
   */
  private static processNFCData(event: NDEFReadingEvent): NFCScanResult {
    try {
      const { message } = event

      // Look for WorkforceOne checkpoint data
      for (const record of message.records) {
        if (record.recordType === 'text') {
          const textDecoder = new TextDecoder()
          const data = textDecoder.decode(record.data)
          
          // Try to parse as JSON (our checkpoint format)
          try {
            const checkpointData = JSON.parse(data) as NFCCheckpointData
            
            // Validate required fields
            if (checkpointData.checkpointId && checkpointData.siteId) {
              return {
                success: true,
                data: checkpointData,
                timestamp: new Date()
              }
            }
          } catch {
            // Not JSON, might be a simple text tag
            if (data.startsWith('CHECKPOINT:') || data.startsWith('WF:')) {
              return this.parseSimpleCheckpointTag(data)
            }
          }
        }
        
        if (record.recordType === 'url') {
          const textDecoder = new TextDecoder()
          const url = textDecoder.decode(record.data)
          
          // Check if it's a WorkforceOne checkpoint URL
          if (url.includes('/checkpoint/') || url.includes('/patrol/')) {
            return this.parseCheckpointURL(url)
          }
        }
      }

      return {
        success: false,
        error: 'No valid checkpoint data found on NFC tag',
        timestamp: new Date()
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process NFC data',
        timestamp: new Date()
      }
    }
  }

  /**
   * Parse simple text-based checkpoint tags
   */
  private static parseSimpleCheckpointTag(data: string): NFCScanResult {
    try {
      // Format: "CHECKPOINT:site123:checkpoint456" or "WF:CHECKPOINT:123:Main Gate"
      const parts = data.split(':')
      
      if (parts.length >= 3) {
        const checkpointData: NFCCheckpointData = {
          checkpointId: parts[2],
          siteId: parts[1],
          name: parts[3] || `Checkpoint ${parts[2]}`,
          metadata: { source: 'simple_nfc_tag', originalData: data }
        }

        return {
          success: true,
          data: checkpointData,
          timestamp: new Date()
        }
      }

      return {
        success: false,
        error: 'Invalid checkpoint tag format',
        timestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to parse checkpoint tag',
        timestamp: new Date()
      }
    }
  }

  /**
   * Parse checkpoint URLs from NFC tags
   */
  private static parseCheckpointURL(url: string): NFCScanResult {
    try {
      const urlObj = new URL(url)
      const pathParts = urlObj.pathname.split('/')
      
      // Extract checkpoint ID from URL
      const checkpointIndex = pathParts.indexOf('checkpoint')
      if (checkpointIndex !== -1 && pathParts[checkpointIndex + 1]) {
        const checkpointId = pathParts[checkpointIndex + 1]
        const siteId = urlObj.searchParams.get('site') || 'unknown'
        
        const checkpointData: NFCCheckpointData = {
          checkpointId,
          siteId,
          name: urlObj.searchParams.get('name') || `Checkpoint ${checkpointId}`,
          routeId: urlObj.searchParams.get('route') || undefined,
          metadata: { source: 'url_nfc_tag', originalUrl: url }
        }

        return {
          success: true,
          data: checkpointData,
          timestamp: new Date()
        }
      }

      return {
        success: false,
        error: 'Invalid checkpoint URL format',
        timestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to parse checkpoint URL',
        timestamp: new Date()
      }
    }
  }

  /**
   * Write checkpoint data to NFC tag
   */
  static async writeCheckpointTag(
    checkpointData: NFCCheckpointData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.isNFCSupported()) {
        return { success: false, error: 'NFC not supported' }
      }

      const writer = new NDEFWriter()
      
      // Create NDEF message with checkpoint data
      const message = {
        records: [
          {
            recordType: 'text',
            data: JSON.stringify(checkpointData)
          },
          {
            recordType: 'url',
            data: `https://www.workforceone.co.za/checkpoint/${checkpointData.checkpointId}?site=${checkpointData.siteId}&name=${encodeURIComponent(checkpointData.name)}`
          }
        ]
      }

      await writer.write(message)

      return { success: true }

    } catch (error) {
      console.error('NFC write error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to write NFC tag'
      }
    }
  }

  /**
   * Get scan status
   */
  static getScanStatus(): { isScanning: boolean; isSupported: boolean } {
    return {
      isScanning: this.isScanning,
      isSupported: this.isNFCSupported()
    }
  }

  /**
   * Validate checkpoint data from scan
   */
  static async validateCheckpoint(
    checkpointData: NFCCheckpointData,
    userId: string
  ): Promise<{ success: boolean; checkpoint?: any; error?: string }> {
    try {
      // Validate checkpoint exists in database
      const response = await fetch(`/api/patrols/checkpoints/${checkpointData.checkpointId}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          siteId: checkpointData.siteId,
          scanMethod: 'nfc',
          metadata: checkpointData.metadata
        })
      })

      const result = await response.json()

      if (!response.ok) {
        return { success: false, error: result.error }
      }

      return { success: true, checkpoint: result.checkpoint }

    } catch (error) {
      console.error('Checkpoint validation error:', error)
      return { success: false, error: 'Failed to validate checkpoint' }
    }
  }
}