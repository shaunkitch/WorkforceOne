import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { email, password, userData } = await request.json()
    
    console.log('Smart registration request:', { email, userData })

    // Check if user already exists in both auth and users table
    const { data: existingAuthUser } = await supabaseAdmin.auth.admin.listUsers()
    const authUserExists = existingAuthUser?.users?.find(u => u.email === email)
    
    const { data: existingProfile, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single()
    
    // Ignore "not found" errors for the profile check
    if (authUserExists || (existingProfile && !checkError?.message?.includes('No rows'))) {
      return NextResponse.json({ 
        error: 'User already exists with this email address' 
      }, { status: 400 })
    }

    console.log('User does not exist, proceeding with registration...')

    // Use default organization/role
    const organizationId = '00000000-0000-0000-0000-000000000001' // Default org
    const roleId = '00000000-0000-0000-0000-000000000003' // Default role

    // Strategy: Create auth user with exact metadata that trigger expects
    // This should make the trigger create the profile successfully
    console.log('Creating auth user with trigger-compatible metadata...')
    
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for development
      user_metadata: {
        first_name: userData.first_name || 'User',
        last_name: userData.last_name || 'Name',
      }
    })

    if (authError) {
      console.error('Auth creation error:', authError)
      return NextResponse.json({ 
        error: `Authentication error: ${authError.message}` 
      }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ 
        error: 'User creation failed' 
      }, { status: 400 })
    }

    console.log('Auth user created successfully:', authData.user.id)

    // Wait a moment for trigger to complete
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Check if trigger created the profile
    const { data: triggerProfile, error: triggerError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (triggerError || !triggerProfile) {
      console.log('Trigger did not create profile, creating manually...')
      
      // Trigger failed, create profile manually
      const { error: manualProfileError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          first_name: userData.first_name || 'User',
          last_name: userData.last_name || 'Name',
          organization_id: organizationId,
          role_id: roleId,
          phone: userData.phone,
          is_active: true
        })

      if (manualProfileError) {
        console.error('Manual profile creation error:', manualProfileError)
        // Clean up auth user
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        return NextResponse.json({ 
          error: `Profile creation failed: ${manualProfileError.message}` 
        }, { status: 400 })
      }

      console.log('Manual profile creation successful')
    } else {
      console.log('Trigger created profile successfully:', triggerProfile.id)
      
      // Update the profile with additional data if needed
      if (userData.phone || userData.organization_name) {
        const updateData: any = {}
        if (userData.phone) updateData.phone = userData.phone
        
        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update(updateData)
          .eq('id', authData.user.id)

        if (updateError) {
          console.error('Profile update error:', updateError)
          // Not critical, continue with registration success
        }
      }
    }

    console.log('Smart registration completed successfully!')

    return NextResponse.json({ 
      success: true,
      message: 'User registered successfully',
      user: { 
        id: authData.user.id, 
        email,
        needsEmailConfirmation: false
      }
    })

  } catch (error) {
    console.error('Smart registration error:', error)
    return NextResponse.json({ 
      error: 'Registration failed due to server error'
    }, { status: 500 })
  }
}