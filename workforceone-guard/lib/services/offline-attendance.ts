// Offline Attendance Service with Local Storage and Sync

import { LocationCoordinates } from './location'

export interface OfflineAttendanceRecord {
  id: string
  userId: string
  qrCode: string
  action: 'check_in' | 'check_out'
  timestamp: Date
  location: LocationCoordinates
  deviceInfo: {
    userAgent: string
    platform: string
    connectionType?: string
    batteryLevel?: number
  }
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed'
  syncAttempts: number
  lastSyncAttempt?: Date
  errorMessage?: string
}

export interface SyncResult {
  success: boolean
  synced: number
  failed: number
  errors: Array<{ recordId: string; error: string }>
}

export class OfflineAttendanceService {
  private static readonly STORAGE_KEY = 'workforceone_offline_attendance'
  private static readonly MAX_SYNC_ATTEMPTS = 3
  private static readonly SYNC_RETRY_DELAY = 30000 // 30 seconds

  /**
   * Store attendance record locally when offline
   */
  static async storeOfflineRecord(
    userId: string,
    qrCode: string,
    action: 'check_in' | 'check_out',
    location: LocationCoordinates
  ): Promise<OfflineAttendanceRecord> {
    const record: OfflineAttendanceRecord = {
      id: crypto.randomUUID(),
      userId,
      qrCode,
      action,
      timestamp: new Date(),
      location,
      deviceInfo: await this.getDeviceInfo(),
      syncStatus: 'pending',
      syncAttempts: 0
    }

    const existingRecords = this.getOfflineRecords()
    existingRecords.push(record)
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingRecords))

    console.log('[Offline] Stored attendance record:', record.id)
    
    // Try immediate sync if online
    if (navigator.onLine) {
      this.syncPendingRecords()
    }

    return record
  }

  /**
   * Get all offline records from local storage
   */
  static getOfflineRecords(): OfflineAttendanceRecord[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) return []

      const records = JSON.parse(stored)
      return records.map((r: any) => ({
        ...r,
        timestamp: new Date(r.timestamp),
        lastSyncAttempt: r.lastSyncAttempt ? new Date(r.lastSyncAttempt) : undefined
      }))
    } catch (error) {
      console.error('Error reading offline records:', error)
      return []
    }
  }

  /**
   * Get pending records that need sync
   */
  static getPendingRecords(): OfflineAttendanceRecord[] {
    return this.getOfflineRecords().filter(r => 
      r.syncStatus === 'pending' || r.syncStatus === 'failed'
    )
  }

  /**
   * Sync all pending records to server
   */
  static async syncPendingRecords(): Promise<SyncResult> {
    const pendingRecords = this.getPendingRecords()
    
    if (pendingRecords.length === 0) {
      return { success: true, synced: 0, failed: 0, errors: [] }
    }

    console.log(`[Offline] Syncing ${pendingRecords.length} pending records`)

    let synced = 0
    let failed = 0
    const errors: Array<{ recordId: string; error: string }> = []

    for (const record of pendingRecords) {
      if (record.syncAttempts >= this.MAX_SYNC_ATTEMPTS) {
        continue // Skip records that have exceeded retry limit
      }

      try {
        await this.syncSingleRecord(record)
        this.markRecordSynced(record.id)
        synced++
      } catch (error) {
        this.markRecordFailed(record.id, error instanceof Error ? error.message : 'Sync failed')
        failed++
        errors.push({
          recordId: record.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    console.log(`[Offline] Sync complete: ${synced} synced, ${failed} failed`)

    return { success: failed === 0, synced, failed, errors }
  }

  /**
   * Sync a single attendance record to the server
   */
  private static async syncSingleRecord(record: OfflineAttendanceRecord): Promise<void> {
    const response = await fetch('/api/attendance/offline-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recordId: record.id,
        userId: record.userId,
        qrCode: record.qrCode,
        action: record.action,
        timestamp: record.timestamp.toISOString(),
        location: record.location,
        deviceInfo: record.deviceInfo
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Sync failed')
    }

    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error || 'Server rejected sync')
    }
  }

  /**
   * Mark record as successfully synced
   */
  private static markRecordSynced(recordId: string): void {
    const records = this.getOfflineRecords()
    const record = records.find(r => r.id === recordId)
    
    if (record) {
      record.syncStatus = 'synced'
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(records))
    }
  }

  /**
   * Mark record as failed to sync
   */
  private static markRecordFailed(recordId: string, errorMessage: string): void {
    const records = this.getOfflineRecords()
    const record = records.find(r => r.id === recordId)
    
    if (record) {
      record.syncStatus = 'failed'
      record.syncAttempts++
      record.lastSyncAttempt = new Date()
      record.errorMessage = errorMessage
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(records))
    }
  }

  /**
   * Get device information
   */
  private static async getDeviceInfo(): Promise<OfflineAttendanceRecord['deviceInfo']> {
    const deviceInfo: OfflineAttendanceRecord['deviceInfo'] = {
      userAgent: navigator.userAgent,
      platform: navigator.platform
    }

    // Get connection type if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      deviceInfo.connectionType = connection?.effectiveType || connection?.type
    }

    // Get battery level if available
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery()
        deviceInfo.batteryLevel = Math.round(battery.level * 100)
      } catch (error) {
        // Battery API not supported or blocked
      }
    }

    return deviceInfo
  }

  /**
   * Clear all synced records from local storage
   */
  static clearSyncedRecords(): void {
    const records = this.getOfflineRecords()
    const pendingRecords = records.filter(r => r.syncStatus !== 'synced')
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(pendingRecords))
  }

  /**
   * Clear all offline records (use with caution)
   */
  static clearAllRecords(): void {
    localStorage.removeItem(this.STORAGE_KEY)
  }

  /**
   * Get sync statistics
   */
  static getSyncStats(): {
    total: number
    pending: number
    synced: number
    failed: number
    oldestPending?: Date
  } {
    const records = this.getOfflineRecords()
    const pending = records.filter(r => r.syncStatus === 'pending')
    const synced = records.filter(r => r.syncStatus === 'synced')
    const failed = records.filter(r => r.syncStatus === 'failed')

    const oldestPending = pending.length > 0 
      ? new Date(Math.min(...pending.map(r => r.timestamp.getTime())))
      : undefined

    return {
      total: records.length,
      pending: pending.length,
      synced: synced.length,
      failed: failed.length,
      oldestPending
    }
  }

  /**
   * Set up automatic sync on connection restore
   */
  static setupAutoSync(): void {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      console.log('[Offline] Connection restored, starting sync...')
      this.syncPendingRecords()
    })

    window.addEventListener('offline', () => {
      console.log('[Offline] Connection lost, switching to offline mode')
    })

    // Periodic sync every 5 minutes when online
    setInterval(() => {
      if (navigator.onLine) {
        this.syncPendingRecords()
      }
    }, 5 * 60 * 1000)
  }

  /**
   * Check if device is currently online
   */
  static isOnline(): boolean {
    return navigator.onLine
  }

  /**
   * Force retry failed records
   */
  static async retryFailedRecords(): Promise<SyncResult> {
    const failedRecords = this.getOfflineRecords().filter(r => r.syncStatus === 'failed')
    
    // Reset failed records to pending for retry
    const allRecords = this.getOfflineRecords()
    failedRecords.forEach(record => {
      const index = allRecords.findIndex(r => r.id === record.id)
      if (index !== -1) {
        allRecords[index].syncStatus = 'pending'
        allRecords[index].syncAttempts = 0
        allRecords[index].errorMessage = undefined
      }
    })
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allRecords))

    return await this.syncPendingRecords()
  }
}