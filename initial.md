# WorkforceOne Suite - Project Documentation

## 🚀 Project Overview

WorkforceOne Suite is a comprehensive workforce management platform consisting of three integrated applications that share a unified database schema and authentication system. Built with modern technologies and designed for scalability, the suite allows customers to start with one application and expand by adding modules as needed.

## 📦 Applications

### 1. WorkforceOne Guard - Security Management Platform

#### Core Features
- **Real-time GPS Patrol Tracking**
  - 10-minute automatic location intervals
  - Battery-optimized background tracking
  - Offline capability with sync when connected

- **Advanced Patrol Verification**
  - QR code checkpoint scanning
  - NFC tag support for checkpoints
  - Time-stamped verification logs
  - Photo verification at checkpoints

- **Incident Management**
  - Comprehensive incident report templates
  - Photo/video evidence attachment
  - Voice-to-text incident notes
  - Priority-based incident categorization
  - Real-time incident alerts to supervisors

- **Live Admin Console**
  - Real-time Google Maps integration
  - Live guard position tracking
  - Patrol route visualization
  - Heat maps for incident hotspots
  - Historical patrol playback

- **Intelligent Scheduling**
  - AI-powered route optimization
  - Shift management and rotation
  - Automatic guard assignment
  - Coverage gap detection

- **Security Features**
  - One-touch panic button
  - Geofencing with alerts
  - Man-down detection
  - Duress code support
  - Two-way communication

### 2. WorkforceOne Attendance Management

#### Core Features
- **Clock In/Out System**
  - GPS-verified clock in/out
  - Facial recognition option
  - QR code site verification
  - Offline time capture with sync

- **Shift Management**
  - Dynamic shift scheduling
  - Shift swap requests
  - Overtime tracking
  - Break time monitoring

- **Leave Management**
  - Leave request workflow
  - Leave balance tracking
  - Holiday calendar integration
  - Automatic approval rules

- **Reporting**
  - Timesheet generation
  - Attendance analytics
  - Punctuality reports
  - Payroll integration ready

### 3. WorkforceOne Rep Management

#### Core Features
- **Dynamic Form Builder**
  - Drag-and-drop form designer
  - Conditional logic support
  - Multi-language forms
  - Offline form submission

- **Live Map & Territory Management**
  - Real-time rep location tracking
  - Territory assignment and visualization
  - Route optimization
  - Customer visit tracking

- **Outlet/Customer Management**
  - Customer database with visit history
  - Task assignment per outlet
  - Performance metrics per location
  - Photo capture for merchandising

## 🏗️ Technical Architecture

### Tech Stack
```
Frontend:
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- Shadcn/ui components
- React Query for data fetching
- Zustand for state management
- PWA capabilities

Backend:
- Supabase (PostgreSQL)
- Supabase Auth
- Supabase Realtime
- Supabase Storage
- Edge Functions for complex operations

Hosting:
- Vercel (Frontend)
- Supabase (Backend)

Mobile:
- Progressive Web App (PWA)
- Capacitor for native features
- Push notifications via FCM

Maps & Location:
- Google Maps API
- Geolocation API
- Geocoding services
```

## 📊 Unified Database Schema

### Core Tables

```sql
-- Organizations (Multi-tenant support)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  subscription_tier TEXT DEFAULT 'basic',
  active_modules TEXT[] DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (Shared across all modules)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  avatar_url TEXT,
  role_id UUID REFERENCES roles(id),
  department_id UUID REFERENCES departments(id),
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Roles (RBAC)
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  permissions JSONB NOT NULL,
  module TEXT NOT NULL, -- 'guard', 'attendance', 'rep'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Departments
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES departments(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Locations (Shared for all location-based features)
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  geofence_radius INTEGER, -- meters
  location_type TEXT, -- 'checkpoint', 'outlet', 'site'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity Logs (Unified tracking)
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  location_id UUID REFERENCES locations(id),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Module-Specific Tables

```sql
-- Guard Module
CREATE TABLE patrols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  guard_id UUID REFERENCES users(id),
  route_id UUID REFERENCES patrol_routes(id),
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled',
  checkpoints_completed INTEGER DEFAULT 0,
  total_checkpoints INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  reported_by UUID REFERENCES users(id),
  location_id UUID REFERENCES locations(id),
  incident_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  description TEXT,
  attachments TEXT[],
  status TEXT DEFAULT 'open',
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance Module
CREATE TABLE attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  clock_in TIMESTAMPTZ,
  clock_out TIMESTAMPTZ,
  location_id UUID REFERENCES locations(id),
  verification_method TEXT, -- 'gps', 'qr', 'facial'
  overtime_hours DECIMAL(4, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rep Management Module
CREATE TABLE forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  schema JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES forms(id),
  submitted_by UUID REFERENCES users(id),
  location_id UUID REFERENCES locations(id),
  data JSONB NOT NULL,
  attachments TEXT[],
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🔐 Authentication & Registration

### Registration Methods
1. **QR Code Registration**
   - Admin generates unique QR codes with role/department pre-assigned
   - New users scan QR to auto-fill registration with organization details

2. **Invite Links**
   - Unique invite URLs with embedded tokens
   - Auto-expiry after set duration
   - Bulk invite generation support

3. **Shared Access Codes**
   - Organization-specific codes
   - Time-limited validity
   - Usage tracking and limits

### Implementation
```typescript
// Registration flow
interface RegistrationPayload {
  method: 'qr' | 'invite' | 'code';
  token: string;
  userData: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
}

// Verification endpoint
POST /api/auth/register
- Validate token/code
- Check organization settings
- Create user with assigned role
- Send welcome email
- Initialize user preferences
```

## 🔑 Role-Based Access Control (RBAC)

### Permission Structure
```typescript
interface Permission {
  module: 'guard' | 'attendance' | 'rep' | 'admin';
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

// Example roles
const roles = {
  superAdmin: {
    permissions: ['*:*:*'] // All modules, all resources, all actions
  },
  guardSupervisor: {
    permissions: [
      'guard:patrols:*',
      'guard:incidents:*',
      'guard:reports:read',
    ]
  },
  securityGuard: {
    permissions: [
      'guard:patrols:read,update',
      'guard:incidents:create,read',
      'guard:checkpoints:update'
    ]
  },
  hrManager: {
    permissions: [
      'attendance:*:*',
      'admin:users:*',
      'admin:reports:*'
    ]
  },
  fieldRep: {
    permissions: [
      'rep:forms:read,submit',
      'rep:outlets:read,update',
      'rep:routes:read'
    ]
  }
};
```

## 📱 Mobile-First Features

### Progressive Web App Configuration
```json
{
  "name": "WorkforceOne Suite",
  "short_name": "WorkforceOne",
  "theme_color": "#000000",
  "background_color": "#ffffff",
  "display": "standalone",
  "orientation": "portrait",
  "scope": "/",
  "start_url": "/",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    }
  ],
  "capabilities": {
    "geolocation": true,
    "camera": true,
    "notifications": true,
    "background_sync": true
  }
}
```

### Offline Capabilities
- IndexedDB for local data storage
- Service Worker for offline functionality
- Background sync for data upload
- Conflict resolution for concurrent edits

## 📊 Reporting & Analytics

### Dashboard Components
1. **Executive Dashboard**
   - KPI cards with real-time metrics
   - Trend charts (Chart.js/Recharts)
   - Heat maps for geographic data
   - Predictive analytics

2. **Operational Reports**
   - Automated daily/weekly/monthly reports
   - Custom report builder
   - Export to PDF/Excel
   - Scheduled email delivery

3. **Real-time Analytics**
   - WebSocket connections for live data
   - Activity feeds
   - Alert notifications
   - Performance monitoring

## 🚀 Implementation Roadmap

### Phase 1: Foundation (Weeks 1-4)
- [ ] Set up Supabase project
- [ ] Configure authentication system
- [ ] Create base database schema
- [ ] Set up Next.js project on Vercel
- [ ] Implement RBAC system
- [ ] Create shared UI components

### Phase 2: WorkforceOne Guard (Weeks 5-8)
- [ ] GPS tracking implementation
- [ ] QR code checkpoint system
- [ ] Incident reporting
- [ ] Live map console
- [ ] Panic button feature
- [ ] Basic reporting

### Phase 3: WorkforceOne Attendance (Weeks 9-11)
- [ ] Clock in/out system
- [ ] GPS verification
- [ ] Shift management
- [ ] Leave management
- [ ] Attendance reports

### Phase 4: WorkforceOne Rep (Weeks 12-14)
- [ ] Form builder interface
- [ ] Form submission system
- [ ] Route management
- [ ] Outlet assignment
- [ ] Visit tracking

### Phase 5: Integration & Polish (Weeks 15-16)
- [ ] Cross-module integration
- [ ] Performance optimization
- [ ] Security audit
- [ ] User acceptance testing
- [ ] Documentation
- [ ] Deployment

## 🔧 Development Guidelines

### Code Organization
```
/src
  /app
    /(auth)
      /login
      /register
      /invite
    /(dashboard)
      /guard
      /attendance
      /rep
      /admin
  /components
    /ui
    /features
    /layouts
  /lib
    /supabase
    /utils
    /hooks
  /services
    /api
    /realtime
  /store
  /types
```

### Environment Variables
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=

# Push Notifications
NEXT_PUBLIC_FCM_VAPID_KEY=

# App Configuration
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_APP_NAME=WorkforceOne
```

## 📝 Notes for Claude Code

When implementing with Claude Code:

1. **Start with authentication**: Build the registration system with QR/invite/code support first
2. **Use Supabase RLS**: Implement Row Level Security policies for multi-tenant isolation
3. **Mobile-first approach**: Design all interfaces for mobile screens first
4. **Real-time features**: Leverage Supabase Realtime for live updates
5. **Offline support**: Implement service workers early for offline capability
6. **Component library**: Use shadcn/ui for consistent, accessible UI components
7. **Type safety**: Use TypeScript strictly with proper type definitions
8. **Testing**: Include unit tests for critical business logic
9. **Performance**: Implement lazy loading and code splitting
10. **Security**: Regular dependency updates and security headers

## 🎯 Success Metrics

- User adoption rate > 80% within first month
- < 2 second page load time
- 99.9% uptime
- < 100ms API response time
- Zero critical security vulnerabilities
- Mobile usage > 70%
- Customer satisfaction score > 4.5/5

Supabase DB variables:
POSTGRES_URL="postgres://postgres.kreouyvoffsfecosmjlq:8qraej85HZVdpUpR@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x"
POSTGRES_USER="postgres"
POSTGRES_HOST="db.kreouyvoffsfecosmjlq.supabase.co"
SUPABASE_JWT_SECRET="cDzHoMC/ikCOB882UL9HC8fiyH4KS6owuPpe/ECWVsY9lFDXLEKWnyicZOILqofhG6qTH72r79nYa+DmBUlz9w=="
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyZW91eXZvZmZzZmVjb3NtamxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMTg2NDIsImV4cCI6MjA3MTY5NDY0Mn0.-K3daGn0qaiTaMIz5PMti9-f4_5znfdB4UCf_CtbZLU"
POSTGRES_PRISMA_URL="postgres://postgres.kreouyvoffsfecosmjlq:8qraej85HZVdpUpR@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"
POSTGRES_PASSWORD="8qraej85HZVdpUpR"
POSTGRES_DATABASE="postgres"
SUPABASE_URL="https://kreouyvoffsfecosmjlq.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyZW91eXZvZmZzZmVjb3NtamxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMTg2NDIsImV4cCI6MjA3MTY5NDY0Mn0.-K3daGn0qaiTaMIz5PMti9-f4_5znfdB4UCf_CtbZLU"
NEXT_PUBLIC_SUPABASE_URL="https://kreouyvoffsfecosmjlq.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyZW91eXZvZmZzZmVjb3NtamxxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjExODY0MiwiZXhwIjoyMDcxNjk0NjQyfQ.CHxG2JaIe7XbyXi4NvxD0VB6SCMCE1Xm6iWDV2isD74"
POSTGRES_URL_NON_POOLING="postgres://postgres.kreouyvoffsfecosmjlq:8qraej85HZVdpUpR@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require"
# Google Maps API Key (keep existing)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyApPFvP0eSiQmhhm5xbsXJYl74hskWDcBs

# App Configuration
GOOGLE_CLOUD_PROJECT_ID=opslink-379922
GOOGLE_CLOUD_PROJECT=AIzaSyB1u5XaBNBfENI8imvGJyep_DT-21TKQ5w
GOOGLE_SERVICE_ACCOUNT_PATH=.//home/shaunkitch/OpsLink/opslink-app/payroll-manager-maps-a5cc3e23e694.json
