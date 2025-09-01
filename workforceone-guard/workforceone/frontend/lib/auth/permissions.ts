export interface Permission {
  module: 'guard' | 'attendance' | 'rep' | 'admin'
  resource: string
  actions: ('create' | 'read' | 'update' | 'delete')[]
}

export interface Role {
  id: string
  name: string
  permissions: Record<string, string[] | string>
  module: string
}

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  organization_id: string
  role_id: string
  role?: Role
}

export class PermissionChecker {
  private permissions: Record<string, string[] | string>

  constructor(role: Role) {
    this.permissions = role.permissions
  }

  can(resource: string, action: string): boolean {
    // Super admin has all permissions
    if (this.permissions['*'] === '*') {
      return true
    }

    const resourcePermissions = this.permissions[resource]
    
    if (!resourcePermissions) {
      return false
    }

    // If resource has wildcard permissions
    if (resourcePermissions === '*') {
      return true
    }

    // Check if action is allowed for resource
    if (Array.isArray(resourcePermissions)) {
      return resourcePermissions.includes(action)
    }

    return false
  }

  canCreate(resource: string): boolean {
    return this.can(resource, 'create')
  }

  canRead(resource: string): boolean {
    return this.can(resource, 'read')
  }

  canUpdate(resource: string): boolean {
    return this.can(resource, 'update')
  }

  canDelete(resource: string): boolean {
    return this.can(resource, 'delete')
  }
}

// Predefined roles for Guard module
export const GUARD_ROLES = {
  superAdmin: {
    name: 'Super Admin',
    permissions: { '*': '*' },
    module: 'guard'
  },
  guardSupervisor: {
    name: 'Guard Supervisor',
    permissions: {
      patrols: ['read', 'create', 'update', 'delete'],
      incidents: ['read', 'create', 'update', 'delete'],
      reports: ['read'],
      users: ['read', 'update'],
      locations: ['read', 'create', 'update'],
      gps_tracking: ['read']
    },
    module: 'guard'
  },
  securityGuard: {
    name: 'Security Guard',
    permissions: {
      patrols: ['read', 'update'],
      incidents: ['read', 'create'],
      checkpoints: ['update'],
      gps_tracking: ['create']
    },
    module: 'guard'
  },
  dispatcher: {
    name: 'Dispatcher',
    permissions: {
      patrols: ['read'],
      incidents: ['read', 'update'],
      gps_tracking: ['read'],
      panic_alerts: ['read', 'update']
    },
    module: 'guard'
  }
} as const