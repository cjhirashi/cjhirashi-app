# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15+ application using the App Router with Supabase authentication and shadcn/ui components. The project follows modern React patterns with TypeScript and uses cookie-based authentication via Supabase SSR.

## Development Commands

```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run ESLint
npm run lint
```

The development server runs on http://localhost:3000 by default.

## Environment Setup

Required environment variables in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - Supabase publishable/anon key

These can be found in your Supabase project's API settings. The app checks for these variables using `hasEnvVars` from `lib/utils.ts:9`.

## Architecture

### Supabase Client Patterns

The application uses three different Supabase client initialization patterns depending on the context:

1. **Server Components & Route Handlers**: `lib/supabase/server.ts`
   - Creates a new client on each request (required for Fluid compute)
   - Uses Next.js cookies API for session management
   - Never store in global variables

2. **Client Components**: `lib/supabase/client.ts`
   - Browser-only client using `createBrowserClient`
   - Used in forms and interactive components

3. **Middleware**: `lib/supabase/middleware.ts`
   - Handles session refresh across all routes
   - Protects routes by redirecting unauthenticated users to `/auth/login`
   - CRITICAL: Always return the `supabaseResponse` object to maintain session cookies

### Authentication Flow

- Login/signup forms are client components that use the browser client
- After authentication, users are redirected to `/protected`
- Email confirmation handled via `/auth/confirm/route.ts` which processes OTP tokens
- Middleware at `middleware.ts:1` runs on all routes except static assets and matches the pattern at `middleware.ts:9`
- Protected routes check authentication via `supabase.auth.getClaims()` - this must be called to prevent random logouts

### Route Structure

#### Public Routes
- `/` - Public home page with tutorial steps
- `/auth/login` - Login page
- `/auth/sign-up` - Registration page
- `/auth/forgot-password` - Password reset flow
- `/auth/confirm` - Email confirmation callback (route handler)
- `/protected` - Example authenticated page that checks user session at `app/protected/page.tsx:8`

#### Admin Panel Routes
- `/admin` - Admin dashboard (requires admin or moderator role)
- `/admin/users` - User management (CRUD operations)
- `/admin/roles` - Role management
- `/admin/audit-logs` - System audit logs (immutable)
- `/admin/analytics` - Analytics and reporting
- `/admin/settings` - System settings

**See:** `docs/architecture/admin-panel-architecture.md` for complete admin panel architecture

### Component Organization

- `components/` - Top-level application components (forms, buttons, navigation)
- `components/ui/` - shadcn/ui primitives (button, input, card, etc.)
- `components/tutorial/` - Tutorial-specific components for the starter template

Components follow shadcn/ui conventions:
- Configured in `components.json` with "new-york" style
- Path aliases: `@/components`, `@/lib`, `@/hooks`, `@/components/ui`
- Uses Lucide React for icons
- Styled with Tailwind CSS using the `cn()` utility from `lib/utils.ts:4`

### Styling

- Tailwind CSS with "new-york" shadcn/ui theme
- Dark mode support via `next-themes` with system preference detection
- Global styles in `app/globals.css`
- Neutral base color with CSS variables enabled
- Geist Sans font family from Google Fonts

## Key Implementation Details

### Middleware Session Management

The middleware at `lib/supabase/middleware.ts:5` performs critical session management:
- Always call `supabase.auth.getClaims()` immediately after creating the client
- Do NOT run code between `createServerClient` and `getClaims()`
- Must return the unmodified `supabaseResponse` with cookies intact
- If creating a new response, copy cookies using `myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())`

### Client-Side Forms

Authentication forms (login, signup, password reset) follow this pattern:
- Use `"use client"` directive
- Import browser client from `@/lib/supabase/client`
- Manage loading and error states locally
- Handle navigation with `useRouter` from `next/navigation`
- Display errors inline with the form

### Server Components

Protected server components:
- Import server client from `@/lib/supabase/server`
- Call `await createClient()` to get a new client instance
- Check authentication with `await supabase.auth.getClaims()`
- Redirect to login if no valid session using `redirect()` from `next/navigation`

## Admin Panel Architecture

This project includes a comprehensive admin panel with Role-Based Access Control (RBAC). Key features:

### RBAC System
- **Roles**: admin, moderator, user
- **Role Hierarchy**: admin > moderator > user
- **Storage**: PostgreSQL table `user_roles` with RLS policies
- **Verification**: Multi-layer (middleware → layout → API → RLS)

**See:** `docs/decisions/adr-001-rbac-implementation.md` for detailed RBAC architecture

### Security Layers (Defense in Depth)

1. **Middleware**: Session validation, redirect unauthenticated users
2. **Layout/Page**: Role verification with `requireAdmin()` or `requireModerator()`
3. **API Routes/Server Actions**: Re-verify authorization + input validation
4. **Database Queries**: Parameterized queries (SQL injection protection)
5. **RLS Policies**: PostgreSQL row-level security (last defense)

**See:** `docs/decisions/adr-004-security-layers.md` for security implementation

### Database Schema

Core tables:
- `user_roles` - Stores user roles for RBAC
- `user_profiles` - Extended user metadata (status, avatar, bio, etc.)
- `audit_logs` - Immutable audit trail of all admin actions
- `system_settings` - Key-value store for system configuration

**See:** `docs/architecture/database-schema.md` for complete schema with migrations

### API Structure

- **API Routes**: RESTful endpoints at `/api/admin/*` (GET/POST/PUT/DELETE)
- **Server Actions**: Form mutations with built-in CSRF protection
- **Response Format**: Standardized JSON with `apiSuccess()`, `apiError()` helpers
- **Validation**: Zod schemas for all inputs

**See:** `docs/decisions/adr-003-api-route-structure.md` for API conventions

### Key Files and Patterns

**Authorization Helpers** (`lib/admin/auth/`):
```typescript
import { requireAdmin } from '@/lib/admin/auth/require-admin';

export default async function AdminPage() {
  const admin = await requireAdmin(); // Throws/redirects if not admin
  // ... rest of page
}
```

**Audit Logging** (`lib/admin/audit/`):
```typescript
import { createAuditLog } from '@/lib/admin/audit';

await createAuditLog({
  userId: admin.id,
  action: 'user.role.update',
  actionCategory: 'role',
  resourceType: 'user',
  resourceId: targetUserId,
  changes: { role: { from: 'user', to: 'admin' } },
});
```

**API Routes** (`app/api/admin/*/route.ts`):
```typescript
import { apiHandler } from '@/lib/api/handler';
import { requireApiRole } from '@/lib/api/auth';

export const GET = apiHandler(async (request) => {
  await requireApiRole(request, 'moderator');
  // ... implementation
});
```

### Implementation Guide

For step-by-step implementation instructions, see:
- `docs/architecture/implementation-guide.md` - Complete implementation guide
- `docs/architecture/README.md` - Architecture documentation index

### Architecture Decision Records (ADRs)

All major architectural decisions are documented:
- `docs/decisions/adr-001-rbac-implementation.md` - RBAC strategy
- `docs/decisions/adr-002-database-schema.md` - Database design
- `docs/decisions/adr-003-api-route-structure.md` - API conventions
- `docs/decisions/adr-004-security-layers.md` - Security architecture

## TypeScript Configuration

- Strict mode enabled
- Path alias `@/*` maps to project root
- Using `react-jsx` transform
- Target ES2017
- Module resolution: bundler
