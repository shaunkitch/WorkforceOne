export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          subscription_tier: string | null
          active_modules: string[] | null
          settings: any | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          subscription_tier?: string | null
          active_modules?: string[] | null
          settings?: any | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          subscription_tier?: string | null
          active_modules?: string[] | null
          settings?: any | null
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          organization_id: string | null
          email: string
          phone: string | null
          first_name: string
          last_name: string
          avatar_url: string | null
          role_id: string | null
          department_id: string | null
          is_active: boolean | null
          metadata: any | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id?: string | null
          email: string
          phone?: string | null
          first_name: string
          last_name: string
          avatar_url?: string | null
          role_id?: string | null
          department_id?: string | null
          is_active?: boolean | null
          metadata?: any | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string | null
          email?: string
          phone?: string | null
          first_name?: string
          last_name?: string
          avatar_url?: string | null
          role_id?: string | null
          department_id?: string | null
          is_active?: boolean | null
          metadata?: any | null
          created_at?: string
          updated_at?: string
        }
      }
      roles: {
        Row: {
          id: string
          organization_id: string | null
          name: string
          permissions: any
          module: string
          created_at: string
        }
        Insert: {
          id?: string
          organization_id?: string | null
          name: string
          permissions: any
          module: string
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string | null
          name?: string
          permissions?: any
          module?: string
          created_at?: string
        }
      }
      departments: {
        Row: {
          id: string
          organization_id: string | null
          name: string
          parent_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id?: string | null
          name: string
          parent_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string | null
          name?: string
          parent_id?: string | null
          created_at?: string
        }
      }
      locations: {
        Row: {
          id: string
          organization_id: string | null
          name: string
          address: string | null
          latitude: number | null
          longitude: number | null
          geofence_radius: number | null
          location_type: string | null
          metadata: any | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id?: string | null
          name: string
          address?: string | null
          latitude?: number | null
          longitude?: number | null
          geofence_radius?: number | null
          location_type?: string | null
          metadata?: any | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string | null
          name?: string
          address?: string | null
          latitude?: number | null
          longitude?: number | null
          geofence_radius?: number | null
          location_type?: string | null
          metadata?: any | null
          created_at?: string
        }
      }
      patrols: {
        Row: {
          id: string
          organization_id: string | null
          guard_id: string | null
          route_id: string | null
          start_time: string | null
          end_time: string | null
          status: string | null
          checkpoints_completed: number | null
          total_checkpoints: number | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id?: string | null
          guard_id?: string | null
          route_id?: string | null
          start_time?: string | null
          end_time?: string | null
          status?: string | null
          checkpoints_completed?: number | null
          total_checkpoints?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string | null
          guard_id?: string | null
          route_id?: string | null
          start_time?: string | null
          end_time?: string | null
          status?: string | null
          checkpoints_completed?: number | null
          total_checkpoints?: number | null
          created_at?: string
        }
      }
      incidents: {
        Row: {
          id: string
          organization_id: string | null
          reported_by: string | null
          location_id: string | null
          incident_type: string
          severity: string
          description: string | null
          attachments: string[] | null
          status: string | null
          resolved_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id?: string | null
          reported_by?: string | null
          location_id?: string | null
          incident_type: string
          severity: string
          description?: string | null
          attachments?: string[] | null
          status?: string | null
          resolved_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string | null
          reported_by?: string | null
          location_id?: string | null
          incident_type?: string
          severity?: string
          description?: string | null
          attachments?: string[] | null
          status?: string | null
          resolved_at?: string | null
          created_at?: string
        }
      }
      activity_logs: {
        Row: {
          id: string
          organization_id: string | null
          user_id: string | null
          module: string
          action: string
          entity_type: string | null
          entity_id: string | null
          location_id: string | null
          latitude: number | null
          longitude: number | null
          metadata: any | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id?: string | null
          user_id?: string | null
          module: string
          action: string
          entity_type?: string | null
          entity_id?: string | null
          location_id?: string | null
          latitude?: number | null
          longitude?: number | null
          metadata?: any | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string | null
          user_id?: string | null
          module?: string
          action?: string
          entity_type?: string | null
          entity_id?: string | null
          location_id?: string | null
          latitude?: number | null
          longitude?: number | null
          metadata?: any | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}