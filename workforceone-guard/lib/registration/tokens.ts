import { supabase } from '../supabase/client'

export interface RegistrationToken {
  id: string
  organization_id: string
  token: string
  token_type: 'qr' | 'invite' | 'access_code'
  role_id?: string
  department_id?: string
  expires_at?: string
  usage_limit?: number
  usage_count: number
  is_active: boolean
  metadata?: any
  created_by: string
  created_at: string
}

export interface CreateTokenData {
  organization_id: string
  token_type: 'qr' | 'invite' | 'access_code'
  role_id?: string
  department_id?: string
  expires_in_hours?: number
  usage_limit?: number
  created_by: string
  metadata?: any
}

export class RegistrationTokenService {
  // Generate a 5-character access code
  static generateAccessCode(): string {
    const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789' // Excluding O and 0 to avoid confusion
    let result = ''
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  // Generate a QR code token (UUID-like)
  static generateQRToken(): string {
    return crypto.randomUUID()
  }

  // Create a new registration token
  static async createToken(data: CreateTokenData): Promise<{ success: boolean; token?: RegistrationToken; error?: string }> {
    try {
      let token: string

      if (data.token_type === 'access_code') {
        // Generate unique 5-letter code
        let attempts = 0
        do {
          token = this.generateAccessCode()
          const { data: existing } = await supabase
            .from('registration_tokens')
            .select('id')
            .eq('token', token)
            .single()
          
          if (!existing) break
          attempts++
        } while (attempts < 10)

        if (attempts >= 10) {
          return { success: false, error: 'Unable to generate unique access code' }
        }
      } else {
        token = this.generateQRToken()
      }

      const expiresAt = data.expires_in_hours 
        ? new Date(Date.now() + data.expires_in_hours * 60 * 60 * 1000).toISOString()
        : null

      const { data: tokenData, error } = await supabase
        .from('registration_tokens')
        .insert({
          organization_id: data.organization_id,
          token,
          token_type: data.token_type,
          role_id: data.role_id,
          department_id: data.department_id,
          expires_at: expiresAt,
          usage_limit: data.usage_limit,
          created_by: data.created_by,
          metadata: data.metadata || {}
        })
        .select()
        .single()

      if (error) {
        console.error('Token creation error:', error)
        return { success: false, error: error.message }
      }

      return { success: true, token: tokenData }
    } catch (error) {
      console.error('Error in createToken:', error)
      return { success: false, error: 'Failed to create registration token' }
    }
  }

  // Get all active tokens for an organization
  static async getOrganizationTokens(organizationId: string): Promise<RegistrationToken[]> {
    try {
      const { data, error } = await supabase
        .from('registration_tokens')
        .select(`
          *,
          role:role_id (name),
          department:department_id (name),
          creator:created_by (first_name, last_name)
        `)
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching tokens:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getOrganizationTokens:', error)
      return []
    }
  }

  // Validate and retrieve token information
  static async validateToken(token: string): Promise<{ success: boolean; tokenData?: RegistrationToken; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('registration_tokens')
        .select(`
          *,
          role:role_id (name, permissions),
          department:department_id (name),
          organization:organization_id (name, slug)
        `)
        .eq('token', token.toUpperCase())
        .eq('is_active', true)
        .single()

      if (error || !data) {
        return { success: false, error: 'Invalid or expired token' }
      }

      // Check if token has expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        return { success: false, error: 'Token has expired' }
      }

      // Check usage limit
      if (data.usage_limit && data.usage_count >= data.usage_limit) {
        return { success: false, error: 'Token usage limit reached' }
      }

      return { success: true, tokenData: data }
    } catch (error) {
      console.error('Error in validateToken:', error)
      return { success: false, error: 'Failed to validate token' }
    }
  }

  // Use a token (increment usage count)
  static async useToken(tokenId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('registration_tokens')
        .update({
          usage_count: supabase.rpc('increment_usage_count', { token_id: tokenId })
        })
        .eq('id', tokenId)

      if (error) {
        console.error('Error using token:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Error in useToken:', error)
      return { success: false, error: 'Failed to use token' }
    }
  }

  // Deactivate a token
  static async deactivateToken(tokenId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('registration_tokens')
        .update({ is_active: false })
        .eq('id', tokenId)

      if (error) {
        console.error('Error deactivating token:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Error in deactivateToken:', error)
      return { success: false, error: 'Failed to deactivate token' }
    }
  }

  // Register user with token
  static async registerWithToken(
    token: string,
    userData: {
      email: string
      password: string
      first_name: string
      last_name: string
      phone?: string
    }
  ): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      // Validate the token
      const tokenResult = await this.validateToken(token)
      if (!tokenResult.success || !tokenResult.tokenData) {
        return { success: false, error: tokenResult.error }
      }

      const tokenData = tokenResult.tokenData

      // Register the user via API
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          userData: {
            first_name: userData.first_name,
            last_name: userData.last_name,
            phone: userData.phone,
            organization_id: tokenData.organization_id,
            role_id: tokenData.role_id,
            department_id: tokenData.department_id
          }
        })
      })

      const result = await response.json()

      if (!response.ok) {
        return { success: false, error: result.error }
      }

      // Increment token usage count
      await this.useToken(tokenData.id)

      return { success: true, user: result.user }
    } catch (error) {
      console.error('Error in registerWithToken:', error)
      return { success: false, error: 'Failed to register with token' }
    }
  }
}