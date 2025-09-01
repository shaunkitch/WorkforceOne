import { supabase } from '../supabase/client'

export interface RegistrationToken {
  id: string
  token: string
  token_type: 'qr' | 'invite' | 'access_code'
  role_id: string
  department_id?: string
  organization_id: string
  expires_at?: string
  usage_limit?: number
  usage_count: number
  is_active: boolean
  metadata?: any
}

export interface RegistrationPayload {
  method: 'qr' | 'invite' | 'code'
  token: string
  userData: {
    email: string
    firstName: string
    lastName: string
    phone?: string
    password: string
  }
}

export class RegistrationService {
  // Validate registration token
  static async validateToken(token: string): Promise<{ valid: boolean; tokenData?: RegistrationToken; error?: string }> {
    try {
      const { data: tokenData, error } = await supabase
        .from('registration_tokens')
        .select('*')
        .eq('token', token)
        .eq('is_active', true)
        .single()

      if (error || !tokenData) {
        return { valid: false, error: 'Invalid or expired token' }
      }

      // Check expiration
      if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
        return { valid: false, error: 'Token has expired' }
      }

      // Check usage limit
      if (tokenData.usage_limit && tokenData.usage_count >= tokenData.usage_limit) {
        return { valid: false, error: 'Token usage limit exceeded' }
      }

      return { valid: true, tokenData }
    } catch (error) {
      return { valid: false, error: 'Error validating token' }
    }
  }

  // Register user with token
  static async registerWithToken(payload: RegistrationPayload): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate token first
      const { valid, tokenData, error: tokenError } = await this.validateToken(payload.token)
      
      if (!valid || !tokenData) {
        return { success: false, error: tokenError }
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: payload.userData.email,
        password: payload.userData.password,
      })

      if (authError) {
        return { success: false, error: authError.message }
      }

      if (!authData.user) {
        return { success: false, error: 'Failed to create user account' }
      }

      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: payload.userData.email,
          first_name: payload.userData.firstName,
          last_name: payload.userData.lastName,
          phone: payload.userData.phone,
          organization_id: tokenData.organization_id,
          role_id: tokenData.role_id,
          department_id: tokenData.department_id,
        })

      if (profileError) {
        return { success: false, error: 'Failed to create user profile' }
      }

      // Update token usage count
      await supabase
        .from('registration_tokens')
        .update({ 
          usage_count: tokenData.usage_count + 1 
        })
        .eq('id', tokenData.id)

      // Log activity
      await supabase
        .from('activity_logs')
        .insert({
          organization_id: tokenData.organization_id,
          user_id: authData.user.id,
          module: 'auth',
          action: 'user_registered',
          entity_type: 'user',
          entity_id: authData.user.id,
          metadata: {
            registration_method: payload.method,
            token_type: tokenData.token_type
          }
        })

      return { success: true }
    } catch (error) {
      console.error('Registration error:', error)
      return { success: false, error: 'Registration failed' }
    }
  }

  // Generate QR code token
  static async generateQRToken(
    organizationId: string,
    roleId: string,
    departmentId?: string,
    expiresInHours: number = 24
  ): Promise<{ token?: string; error?: string }> {
    try {
      const token = crypto.randomUUID()
      const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000)

      const { error } = await supabase
        .from('registration_tokens')
        .insert({
          token,
          token_type: 'qr',
          organization_id: organizationId,
          role_id: roleId,
          department_id: departmentId,
          expires_at: expiresAt.toISOString(),
          usage_limit: 1
        })

      if (error) {
        return { error: 'Failed to generate QR token' }
      }

      return { token }
    } catch (error) {
      return { error: 'Error generating QR token' }
    }
  }

  // Generate invite link token
  static async generateInviteToken(
    organizationId: string,
    roleId: string,
    departmentId?: string,
    expiresInDays: number = 7
  ): Promise<{ token?: string; error?: string }> {
    try {
      const token = crypto.randomUUID()
      const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)

      const { error } = await supabase
        .from('registration_tokens')
        .insert({
          token,
          token_type: 'invite',
          organization_id: organizationId,
          role_id: roleId,
          department_id: departmentId,
          expires_at: expiresAt.toISOString(),
          usage_limit: 1
        })

      if (error) {
        return { error: 'Failed to generate invite token' }
      }

      return { token }
    } catch (error) {
      return { error: 'Error generating invite token' }
    }
  }

  // Generate access code
  static async generateAccessCode(
    organizationId: string,
    roleId: string,
    departmentId?: string,
    usageLimit: number = 10,
    expiresInDays: number = 30
  ): Promise<{ token?: string; error?: string }> {
    try {
      // Generate 6-digit access code
      const token = Math.random().toString().substr(2, 6)
      const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)

      const { error } = await supabase
        .from('registration_tokens')
        .insert({
          token,
          token_type: 'access_code',
          organization_id: organizationId,
          role_id: roleId,
          department_id: departmentId,
          expires_at: expiresAt.toISOString(),
          usage_limit: usageLimit
        })

      if (error) {
        return { error: 'Failed to generate access code' }
      }

      return { token }
    } catch (error) {
      return { error: 'Error generating access code' }
    }
  }
}