import { supabase } from '../supabase/client'

export interface Incident {
  id: string
  organization_id: string
  reported_by: string
  location_id?: string
  patrol_id?: string
  incident_type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description?: string
  attachments?: string[]
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  assigned_to?: string
  resolved_at?: string
  latitude?: number
  longitude?: number
  created_at: string
  updated_at: string
  reporter?: {
    first_name: string
    last_name: string
    email: string
  }
  assignee?: {
    first_name: string
    last_name: string
    email: string
  }
  location?: {
    name: string
    address?: string
  }
}

export interface IncidentComment {
  id: string
  incident_id: string
  user_id: string
  comment: string
  created_at: string
  user: {
    first_name: string
    last_name: string
  }
}

export interface IncidentType {
  id: string
  name: string
  description?: string
  severity_default: string
  requires_immediate_response: boolean
}

export const INCIDENT_TYPES: IncidentType[] = [
  { id: 'security_breach', name: 'Security Breach', description: 'Unauthorized access or intrusion', severity_default: 'high', requires_immediate_response: true },
  { id: 'theft', name: 'Theft/Vandalism', description: 'Property theft or vandalism', severity_default: 'medium', requires_immediate_response: false },
  { id: 'safety_hazard', name: 'Safety Hazard', description: 'Unsafe conditions or hazards', severity_default: 'medium', requires_immediate_response: false },
  { id: 'medical_emergency', name: 'Medical Emergency', description: 'Medical assistance required', severity_default: 'critical', requires_immediate_response: true },
  { id: 'fire', name: 'Fire/Smoke', description: 'Fire or smoke detected', severity_default: 'critical', requires_immediate_response: true },
  { id: 'suspicious_activity', name: 'Suspicious Activity', description: 'Unusual or suspicious behavior', severity_default: 'medium', requires_immediate_response: false },
  { id: 'equipment_failure', name: 'Equipment Failure', description: 'Security equipment malfunction', severity_default: 'low', requires_immediate_response: false },
  { id: 'noise_complaint', name: 'Noise Complaint', description: 'Excessive noise disturbance', severity_default: 'low', requires_immediate_response: false },
  { id: 'access_control', name: 'Access Control Issue', description: 'Problems with access control systems', severity_default: 'medium', requires_immediate_response: false },
  { id: 'other', name: 'Other', description: 'Other security-related incident', severity_default: 'medium', requires_immediate_response: false }
]

export class IncidentService {
  // Get all incidents for an organization
  static async getIncidents(
    organizationId: string,
    status?: string,
    severity?: string,
    limit: number = 50
  ): Promise<Incident[]> {
    try {
      let query = supabase
        .from('incidents')
        .select(`
          *,
          reporter:reported_by (first_name, last_name, email),
          assignee:assigned_to (first_name, last_name, email),
          location:location_id (name, address)
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (status) {
        query = query.eq('status', status)
      }

      if (severity) {
        query = query.eq('severity', severity)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching incidents:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getIncidents:', error)
      return []
    }
  }

  // Get open incidents
  static async getOpenIncidents(organizationId: string): Promise<Incident[]> {
    return this.getIncidents(organizationId, 'open')
  }

  // Get critical incidents
  static async getCriticalIncidents(organizationId: string): Promise<Incident[]> {
    return this.getIncidents(organizationId, undefined, 'critical')
  }

  // Get incident by ID
  static async getIncident(incidentId: string): Promise<Incident | null> {
    try {
      const { data, error } = await supabase
        .from('incidents')
        .select(`
          *,
          reporter:reported_by (first_name, last_name, email),
          assignee:assigned_to (first_name, last_name, email),
          location:location_id (name, address)
        `)
        .eq('id', incidentId)
        .single()

      if (error) {
        console.error('Error fetching incident:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getIncident:', error)
      return null
    }
  }

  // Create new incident
  static async createIncident(incident: {
    organization_id: string
    reported_by: string
    location_id?: string
    patrol_id?: string
    incident_type: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    title: string
    description?: string
    attachments?: string[]
    latitude?: number
    longitude?: number
  }): Promise<{ success: boolean; incident?: Incident; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('incidents')
        .insert({
          ...incident,
          status: 'open'
        })
        .select(`
          *,
          reporter:reported_by (first_name, last_name, email),
          assignee:assigned_to (first_name, last_name, email),
          location:location_id (name, address)
        `)
        .single()

      if (error) {
        console.error('Error creating incident:', error)
        return { success: false, error: error.message }
      }

      // Log activity
      await supabase
        .from('activity_logs')
        .insert({
          organization_id: incident.organization_id,
          user_id: incident.reported_by,
          module: 'guard',
          action: 'incident_created',
          entity_type: 'incident',
          entity_id: data.id,
          location_id: incident.location_id,
          latitude: incident.latitude,
          longitude: incident.longitude,
          metadata: {
            incident_type: incident.incident_type,
            severity: incident.severity,
            title: incident.title,
            patrol_id: incident.patrol_id
          }
        })

      // Send notifications for high/critical incidents
      if (incident.severity === 'high' || incident.severity === 'critical') {
        await this.sendIncidentNotification(data)
      }

      return { success: true, incident: data }
    } catch (error) {
      console.error('Error in createIncident:', error)
      return { success: false, error: 'Failed to create incident' }
    }
  }

  // Update incident
  static async updateIncident(
    incidentId: string,
    updates: {
      status?: 'open' | 'in_progress' | 'resolved' | 'closed'
      assigned_to?: string
      severity?: 'low' | 'medium' | 'high' | 'critical'
      description?: string
      resolved_at?: string
    }
  ): Promise<{ success: boolean; incident?: Incident; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('incidents')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', incidentId)
        .select(`
          *,
          reporter:reported_by (first_name, last_name, email),
          assignee:assigned_to (first_name, last_name, email),
          location:location_id (name, address)
        `)
        .single()

      if (error) {
        console.error('Error updating incident:', error)
        return { success: false, error: error.message }
      }

      // Log activity
      await supabase
        .from('activity_logs')
        .insert({
          organization_id: data.organization_id,
          user_id: data.reported_by,
          module: 'guard',
          action: 'incident_updated',
          entity_type: 'incident',
          entity_id: incidentId,
          metadata: updates
        })

      return { success: true, incident: data }
    } catch (error) {
      console.error('Error in updateIncident:', error)
      return { success: false, error: 'Failed to update incident' }
    }
  }

  // Assign incident to user
  static async assignIncident(
    incidentId: string,
    assigneeId: string,
    assignedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.updateIncident(incidentId, {
        assigned_to: assigneeId,
        status: 'in_progress'
      })

      if (result.success && result.incident) {
        // Log assignment activity
        await supabase
          .from('activity_logs')
          .insert({
            organization_id: result.incident.organization_id,
            user_id: assignedBy,
            module: 'guard',
            action: 'incident_assigned',
            entity_type: 'incident',
            entity_id: incidentId,
            metadata: {
              assigned_to: assigneeId,
              assigned_by: assignedBy
            }
          })
      }

      return result
    } catch (error) {
      console.error('Error in assignIncident:', error)
      return { success: false, error: 'Failed to assign incident' }
    }
  }

  // Add comment to incident
  static async addComment(
    incidentId: string,
    userId: string,
    comment: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('incident_comments')
        .insert({
          incident_id: incidentId,
          user_id: userId,
          comment
        })

      if (error) {
        console.error('Error adding comment:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Error in addComment:', error)
      return { success: false, error: 'Failed to add comment' }
    }
  }

  // Get comments for incident
  static async getComments(incidentId: string): Promise<IncidentComment[]> {
    try {
      const { data, error } = await supabase
        .from('incident_comments')
        .select(`
          *,
          user:user_id (first_name, last_name)
        `)
        .eq('incident_id', incidentId)
        .order('created_at')

      if (error) {
        console.error('Error fetching comments:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getComments:', error)
      return []
    }
  }

  // Get incident statistics
  static async getIncidentStatistics(organizationId: string, days: number = 30): Promise<{
    totalIncidents: number
    openIncidents: number
    resolvedIncidents: number
    criticalIncidents: number
    averageResolutionTime: number
    incidentsByType: Array<{ type: string; count: number }>
    incidentsBySeverity: Array<{ severity: string; count: number }>
  }> {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

      const { data: incidents, error } = await supabase
        .from('incidents')
        .select('incident_type, severity, status, created_at, resolved_at')
        .eq('organization_id', organizationId)
        .gte('created_at', startDate)

      if (error || !incidents) {
        return {
          totalIncidents: 0,
          openIncidents: 0,
          resolvedIncidents: 0,
          criticalIncidents: 0,
          averageResolutionTime: 0,
          incidentsByType: [],
          incidentsBySeverity: []
        }
      }

      const totalIncidents = incidents.length
      const openIncidents = incidents.filter(i => i.status === 'open').length
      const resolvedIncidents = incidents.filter(i => i.status === 'resolved').length
      const criticalIncidents = incidents.filter(i => i.severity === 'critical').length

      // Calculate average resolution time
      const resolvedWithTime = incidents.filter(i => i.resolved_at && i.created_at)
      const totalResolutionTime = resolvedWithTime.reduce((sum, incident) => {
        const created = new Date(incident.created_at).getTime()
        const resolved = new Date(incident.resolved_at!).getTime()
        return sum + (resolved - created)
      }, 0)
      const averageResolutionTime = resolvedWithTime.length > 0 
        ? Math.round(totalResolutionTime / resolvedWithTime.length / (1000 * 60 * 60)) // hours
        : 0

      // Group by type
      const typeMap = new Map<string, number>()
      incidents.forEach(incident => {
        typeMap.set(incident.incident_type, (typeMap.get(incident.incident_type) || 0) + 1)
      })
      const incidentsByType = Array.from(typeMap.entries()).map(([type, count]) => ({ type, count }))

      // Group by severity
      const severityMap = new Map<string, number>()
      incidents.forEach(incident => {
        severityMap.set(incident.severity, (severityMap.get(incident.severity) || 0) + 1)
      })
      const incidentsBySeverity = Array.from(severityMap.entries()).map(([severity, count]) => ({ severity, count }))

      return {
        totalIncidents,
        openIncidents,
        resolvedIncidents,
        criticalIncidents,
        averageResolutionTime,
        incidentsByType,
        incidentsBySeverity
      }
    } catch (error) {
      console.error('Error in getIncidentStatistics:', error)
      return {
        totalIncidents: 0,
        openIncidents: 0,
        resolvedIncidents: 0,
        criticalIncidents: 0,
        averageResolutionTime: 0,
        incidentsByType: [],
        incidentsBySeverity: []
      }
    }
  }

  // Send notification for critical incidents
  private static async sendIncidentNotification(incident: Incident): Promise<void> {
    // This would integrate with your notification system
    // For now, we'll just log it
    console.log(`CRITICAL INCIDENT ALERT: ${incident.title} - ${incident.severity}`)
    
    // In a real application, you would:
    // 1. Send push notifications to supervisors
    // 2. Send SMS alerts
    // 3. Send email notifications
    // 4. Trigger automated response protocols
  }

  // Get nearby incidents (for situational awareness)
  static async getNearbyIncidents(
    organizationId: string,
    latitude: number,
    longitude: number,
    radiusKm: number = 1
  ): Promise<Incident[]> {
    try {
      // This is a simplified version - in production you'd use PostGIS
      const { data, error } = await supabase
        .from('incidents')
        .select(`
          *,
          reporter:reported_by (first_name, last_name, email),
          location:location_id (name, address)
        `)
        .eq('organization_id', organizationId)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours

      if (error || !data) {
        return []
      }

      // Filter by distance (simple calculation)
      return data.filter(incident => {
        if (!incident.latitude || !incident.longitude) return false
        
        const distance = this.calculateDistance(
          latitude,
          longitude,
          incident.latitude,
          incident.longitude
        )
        
        return distance <= radiusKm
      })
    } catch (error) {
      console.error('Error in getNearbyIncidents:', error)
      return []
    }
  }

  // Calculate distance between two points (Haversine formula)
  private static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180)
    const dLon = (lon2 - lon1) * (Math.PI / 180)
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }
}