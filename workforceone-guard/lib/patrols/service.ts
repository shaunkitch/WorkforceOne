import { supabase } from '../supabase/client'

export interface Patrol {
  id: string
  organization_id: string
  guard_id: string
  route_id?: string
  start_time?: string
  end_time?: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  checkpoints_completed: number
  total_checkpoints: number
  notes?: string
  created_at: string
  guard?: {
    first_name: string
    last_name: string
    email: string
  }
  route?: {
    name: string
    description?: string
    checkpoints: string[]
    estimated_duration?: number
  }
}

export interface PatrolRoute {
  id: string
  organization_id: string
  name: string
  description?: string
  checkpoints: string[] // Array of location IDs
  estimated_duration?: number // in minutes
  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
  locations?: Array<{
    id: string
    name: string
    address?: string
    latitude?: number
    longitude?: number
  }>
}

export interface CheckpointVisit {
  id: string
  patrol_id: string
  location_id: string
  guard_id: string
  visited_at: string
  verification_method: 'qr' | 'nfc' | 'manual'
  verification_data?: string
  latitude?: number
  longitude?: number
  photos?: string[]
  notes?: string
  location?: {
    name: string
    address?: string
  }
}

export class PatrolService {
  // Get all patrols for an organization
  static async getPatrols(
    organizationId: string,
    status?: string,
    guardId?: string,
    limit: number = 50
  ): Promise<Patrol[]> {
    try {
      let query = supabase
        .from('patrols')
        .select(`
          *,
          guard:guard_id (first_name, last_name, email),
          route:route_id (
            name,
            description,
            checkpoints,
            estimated_duration
          )
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (status) {
        query = query.eq('status', status)
      }

      if (guardId) {
        query = query.eq('guard_id', guardId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching patrols:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getPatrols:', error)
      return []
    }
  }

  // Get active patrols (in progress)
  static async getActivePatrols(organizationId: string): Promise<Patrol[]> {
    return this.getPatrols(organizationId, 'in_progress')
  }

  // Get patrol by ID
  static async getPatrol(patrolId: string): Promise<Patrol | null> {
    try {
      const { data, error } = await supabase
        .from('patrols')
        .select(`
          *,
          guard:guard_id (first_name, last_name, email),
          route:route_id (
            name,
            description,
            checkpoints,
            estimated_duration
          )
        `)
        .eq('id', patrolId)
        .single()

      if (error) {
        console.error('Error fetching patrol:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getPatrol:', error)
      return null
    }
  }

  // Create new patrol
  static async createPatrol(patrol: {
    organization_id: string
    guard_id: string
    route_id?: string
    start_time?: string
    total_checkpoints?: number
    notes?: string
  }): Promise<{ success: boolean; patrol?: Patrol; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('patrols')
        .insert({
          ...patrol,
          status: 'scheduled',
          checkpoints_completed: 0
        })
        .select(`
          *,
          guard:guard_id (first_name, last_name, email),
          route:route_id (
            name,
            description,
            checkpoints,
            estimated_duration
          )
        `)
        .single()

      if (error) {
        console.error('Error creating patrol:', error)
        return { success: false, error: error.message }
      }

      // Log activity
      await supabase
        .from('activity_logs')
        .insert({
          organization_id: patrol.organization_id,
          user_id: patrol.guard_id,
          module: 'guard',
          action: 'patrol_created',
          entity_type: 'patrol',
          entity_id: data.id,
          metadata: {
            route_id: patrol.route_id,
            total_checkpoints: patrol.total_checkpoints
          }
        })

      return { success: true, patrol: data }
    } catch (error) {
      console.error('Error in createPatrol:', error)
      return { success: false, error: 'Failed to create patrol' }
    }
  }

  // Start patrol
  static async startPatrol(patrolId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('patrols')
        .update({
          status: 'in_progress',
          start_time: new Date().toISOString()
        })
        .eq('id', patrolId)
        .select()
        .single()

      if (error) {
        console.error('Error starting patrol:', error)
        return { success: false, error: error.message }
      }

      // Log activity
      await supabase
        .from('activity_logs')
        .insert({
          organization_id: data.organization_id,
          user_id: data.guard_id,
          module: 'guard',
          action: 'patrol_started',
          entity_type: 'patrol',
          entity_id: patrolId
        })

      return { success: true }
    } catch (error) {
      console.error('Error in startPatrol:', error)
      return { success: false, error: 'Failed to start patrol' }
    }
  }

  // Complete patrol
  static async completePatrol(patrolId: string, notes?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('patrols')
        .update({
          status: 'completed',
          end_time: new Date().toISOString(),
          notes
        })
        .eq('id', patrolId)
        .select()
        .single()

      if (error) {
        console.error('Error completing patrol:', error)
        return { success: false, error: error.message }
      }

      // Log activity
      await supabase
        .from('activity_logs')
        .insert({
          organization_id: data.organization_id,
          user_id: data.guard_id,
          module: 'guard',
          action: 'patrol_completed',
          entity_type: 'patrol',
          entity_id: patrolId,
          metadata: {
            checkpoints_completed: data.checkpoints_completed,
            total_checkpoints: data.total_checkpoints,
            notes
          }
        })

      return { success: true }
    } catch (error) {
      console.error('Error in completePatrol:', error)
      return { success: false, error: 'Failed to complete patrol' }
    }
  }

  // Get patrol routes via API
  static async getPatrolRoutes(organizationId: string, activeOnly: boolean = true): Promise<PatrolRoute[]> {
    try {
      const params = new URLSearchParams({
        organization_id: organizationId,
        include_checkpoints: 'true'
      })

      const response = await fetch(`/api/patrols/routes?${params}`)
      const result = await response.json()

      if (!response.ok) {
        console.error('Error fetching patrol routes:', result)
        return []
      }

      let routes = result.routes || []

      // Filter by active status if needed
      if (activeOnly) {
        routes = routes.filter((route: PatrolRoute) => route.is_active)
      }

      // Routes now include location details from the API
      return routes
    } catch (error) {
      console.error('Error in getPatrolRoutes:', error)
      return []
    }
  }

  // Create patrol route via API
  static async createPatrolRoute(route: {
    organization_id: string
    name: string
    description?: string
    checkpoints: string[]
    estimated_duration?: number
    created_by?: string
  }): Promise<{ success: boolean; route?: PatrolRoute; error?: string }> {
    try {
      const response = await fetch('/api/patrols/routes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...route,
          is_active: true
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('Error creating patrol route:', result)
        return { success: false, error: result.error || 'Failed to create patrol route' }
      }

      return { success: result.success, route: result.route }
    } catch (error) {
      console.error('Error in createPatrolRoute:', error)
      return { success: false, error: 'Failed to create patrol route' }
    }
  }

  // Update patrol route via API
  static async updatePatrolRoute(
    id: string,
    organizationId: string,
    route: {
      name?: string
      description?: string
      checkpoints?: string[]
      estimated_duration?: number
      is_active?: boolean
      updated_by?: string
    }
  ): Promise<{ success: boolean; route?: PatrolRoute; error?: string }> {
    try {
      const response = await fetch('/api/patrols/routes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          organization_id: organizationId,
          ...route
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('Error updating patrol route:', result)
        return { success: false, error: result.error || 'Failed to update patrol route' }
      }

      return { success: result.success, route: result.route }
    } catch (error) {
      console.error('Error in updatePatrolRoute:', error)
      return { success: false, error: 'Failed to update patrol route' }
    }
  }

  // Delete patrol route via API
  static async deletePatrolRoute(
    id: string,
    organizationId: string,
    deletedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const params = new URLSearchParams({
        id,
        organization_id: organizationId,
        deleted_by: deletedBy
      })

      const response = await fetch(`/api/patrols/routes?${params}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('Error deleting patrol route:', result)
        return { success: false, error: result.error || 'Failed to delete patrol route' }
      }

      return { success: result.success }
    } catch (error) {
      console.error('Error in deletePatrolRoute:', error)
      return { success: false, error: 'Failed to delete patrol route' }
    }
  }

  // Get checkpoint visits for a patrol
  static async getCheckpointVisits(patrolId: string): Promise<CheckpointVisit[]> {
    try {
      const { data, error } = await supabase
        .from('checkpoint_visits')
        .select(`
          *,
          location:location_id (name, address)
        `)
        .eq('patrol_id', patrolId)
        .order('visited_at')

      if (error) {
        console.error('Error fetching checkpoint visits:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getCheckpointVisits:', error)
      return []
    }
  }

  // Record checkpoint visit
  static async recordCheckpointVisit(visit: {
    patrol_id: string
    location_id: string
    guard_id: string
    verification_method: 'qr' | 'nfc' | 'manual'
    verification_data?: string
    latitude?: number
    longitude?: number
    photos?: string[]
    notes?: string
  }): Promise<{ success: boolean; visit?: CheckpointVisit; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('checkpoint_visits')
        .insert({
          ...visit,
          visited_at: new Date().toISOString()
        })
        .select(`
          *,
          location:location_id (name, address)
        `)
        .single()

      if (error) {
        console.error('Error recording checkpoint visit:', error)
        return { success: false, error: error.message }
      }

      // Update patrol checkpoint count
      const { data: patrolData } = await supabase
        .from('patrols')
        .select('checkpoints_completed, organization_id')
        .eq('id', visit.patrol_id)
        .single()

      if (patrolData) {
        await supabase
          .from('patrols')
          .update({
            checkpoints_completed: patrolData.checkpoints_completed + 1
          })
          .eq('id', visit.patrol_id)

        // Log activity
        await supabase
          .from('activity_logs')
          .insert({
            organization_id: patrolData.organization_id,
            user_id: visit.guard_id,
            module: 'guard',
            action: 'checkpoint_visited',
            entity_type: 'checkpoint_visit',
            entity_id: data.id,
            location_id: visit.location_id,
            latitude: visit.latitude,
            longitude: visit.longitude,
            metadata: {
              patrol_id: visit.patrol_id,
              verification_method: visit.verification_method,
              verification_data: visit.verification_data
            }
          })
      }

      return { success: true, visit: data }
    } catch (error) {
      console.error('Error in recordCheckpointVisit:', error)
      return { success: false, error: 'Failed to record checkpoint visit' }
    }
  }

  // Get patrol statistics
  static async getPatrolStatistics(organizationId: string, days: number = 30): Promise<{
    totalPatrols: number
    completedPatrols: number
    activePatrols: number
    averageCheckpoints: number
    completionRate: number
  }> {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

      const { data: patrols, error } = await supabase
        .from('patrols')
        .select('status, checkpoints_completed, total_checkpoints')
        .eq('organization_id', organizationId)
        .gte('created_at', startDate)

      if (error || !patrols) {
        return {
          totalPatrols: 0,
          completedPatrols: 0,
          activePatrols: 0,
          averageCheckpoints: 0,
          completionRate: 0
        }
      }

      const totalPatrols = patrols.length
      const completedPatrols = patrols.filter(p => p.status === 'completed').length
      const activePatrols = patrols.filter(p => p.status === 'in_progress').length
      const totalCheckpoints = patrols.reduce((sum, p) => sum + (p.checkpoints_completed || 0), 0)
      const averageCheckpoints = totalPatrols > 0 ? Math.round(totalCheckpoints / totalPatrols * 10) / 10 : 0
      const completionRate = totalPatrols > 0 ? Math.round((completedPatrols / totalPatrols) * 100) : 0

      return {
        totalPatrols,
        completedPatrols,
        activePatrols,
        averageCheckpoints,
        completionRate
      }
    } catch (error) {
      console.error('Error in getPatrolStatistics:', error)
      return {
        totalPatrols: 0,
        completedPatrols: 0,
        activePatrols: 0,
        averageCheckpoints: 0,
        completionRate: 0
      }
    }
  }
}