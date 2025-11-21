# Guía de Implementación - Admin Panel

**Audiencia:** Desarrolladores del equipo de implementación
**Versión:** 1.0
**Fecha:** 2025-11-11

---

## Introducción

Esta guía proporciona instrucciones paso a paso para implementar el panel de administración diseñado en este proyecto. Está dirigida a los especialistas del equipo:

- **data-engineer**: Implementación de database schema y migraciones
- **app-security-guardian**: Implementación de capas de seguridad y RLS
- **fullstack-implementer**: Implementación de componentes UI y lógica de negocio
- **backend-developer**: Implementación de API routes y Server Actions

---

## Fase 1: Configuración de Base de Datos

**Responsable:** data-engineer

### 1.1 Pre-requisitos

- Acceso a Supabase dashboard
- Permisos para ejecutar SQL migrations
- Backup de base de datos existente

### 1.2 Ejecutar Migraciones

#### Migración 001: Tablas Core

```bash
# 1. Abrir Supabase Dashboard > SQL Editor
# 2. Copiar contenido de docs/architecture/database-schema.md (Migración 001)
# 3. Ejecutar la migración

# Verificar que se ejecutó correctamente:
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

**Verificaciones:**

```sql
-- 1. Verificar ENUMs creados
SELECT typname FROM pg_type WHERE typname IN (
  'user_role', 'user_status', 'audit_action_category', 'setting_type'
);
-- Esperado: 4 filas

-- 2. Verificar tablas creadas
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('user_roles', 'user_profiles', 'audit_logs', 'system_settings');
-- Esperado: 4 filas

-- 3. Verificar RLS habilitado
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('user_roles', 'user_profiles', 'audit_logs', 'system_settings');
-- Esperado: rowsecurity = true para todas

-- 4. Verificar triggers
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table IN ('user_roles', 'user_profiles', 'system_settings');
-- Esperado: triggers de updated_at y on_auth_user_created
```

#### Migración 002: Vistas de Analytics

```bash
# Ejecutar Migración 002 desde database-schema.md
```

**Verificaciones:**

```sql
-- Verificar vista materializada
SELECT * FROM public.admin_dashboard_stats;
-- Debe retornar 1 fila con stats

-- Verificar vistas regulares
SELECT * FROM public.user_activity_summary LIMIT 5;
SELECT * FROM public.recent_activity LIMIT 5;
```

#### Migración 003: Datos Iniciales

```sql
-- IMPORTANTE: Actualizar email del primer admin
-- Buscar en el script: WHERE email = 'admin@example.com'
-- Reemplazar con email real

-- Luego ejecutar Migración 003
```

**Verificaciones:**

```sql
-- Verificar settings iniciales
SELECT * FROM public.system_settings;
-- Esperado: 8 settings

-- Verificar primer admin
SELECT u.email, ur.role, up.status
FROM auth.users u
JOIN public.user_roles ur ON ur.user_id = u.id
JOIN public.user_profiles up ON up.user_id = u.id
WHERE ur.role = 'admin';
-- Esperado: Al menos 1 admin
```

### 1.3 Testing de Integridad

```sql
-- Test 1: Crear usuario de prueba y verificar auto-creación de perfil/rol
INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-0000-0000-000000000001', 'test@example.com');

-- Verificar profile y rol creados automáticamente
SELECT * FROM public.user_profiles WHERE user_id = '00000000-0000-0000-0000-000000000001';
SELECT * FROM public.user_roles WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- Cleanup
DELETE FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000001';
```

---

## Fase 2: Implementación de Seguridad

**Responsable:** app-security-guardian

### 2.1 Actualizar Middleware

```typescript
// middleware.ts
import { updateSession } from '@/lib/supabase/middleware';
import { type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

```typescript
// lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { hasEnvVars } from '../utils';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  if (!hasEnvVars) return supabaseResponse;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  // Proteger rutas /admin/*
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth');

  if (isAdminRoute && !user && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    url.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
```

### 2.2 Crear Helpers de Autorización

```bash
# Crear directorios
mkdir -p lib/admin/auth
mkdir -p lib/admin/rbac
```

```typescript
// lib/admin/rbac/roles.ts
export const ROLES = {
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  USER: 'user',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_HIERARCHY = {
  admin: 3,
  moderator: 2,
  user: 1,
} as const;

export function hasHigherOrEqualRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}
```

```typescript
// lib/admin/auth/require-admin.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { ROLES, type Role } from '@/lib/admin/rbac/roles';

export const requireAdmin = cache(async () => {
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) {
    redirect('/auth/login?redirect=/admin');
  }

  const { data: userRole, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', data.claims.sub)
    .single();

  if (error || userRole?.role !== ROLES.ADMIN) {
    redirect('/unauthorized');
  }

  return {
    id: data.claims.sub,
    email: data.claims.email!,
    role: userRole.role as Role,
  };
});

export const requireModerator = cache(async () => {
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) {
    redirect('/auth/login?redirect=/admin');
  }

  const { data: userRole, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', data.claims.sub)
    .single();

  if (
    error ||
    (userRole?.role !== ROLES.ADMIN && userRole?.role !== ROLES.MODERATOR)
  ) {
    redirect('/unauthorized');
  }

  return {
    id: data.claims.sub,
    email: data.claims.email!,
    role: userRole.role as Role,
  };
});

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims?.sub) return null;

  const { data: userRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', data.claims.sub)
    .single();

  return {
    id: data.claims.sub,
    email: data.claims.email!,
    role: (userRole?.role as Role) || ROLES.USER,
  };
});
```

### 2.3 Crear Helpers para API Routes

```bash
mkdir -p lib/api
```

```typescript
// lib/api/response.ts
import { NextResponse } from 'next/server';

export type ApiResponse<T = any> = {
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  message?: string;
};

export type ApiError = {
  error: {
    code: string;
    message: string;
    details?: any;
    requestId?: string;
  };
};

export function apiSuccess<T>(
  data: T,
  meta?: ApiResponse['meta'],
  message?: string,
) {
  return NextResponse.json({ data, meta, message } as ApiResponse<T>);
}

export function apiCreated<T>(data: T, message = 'Resource created successfully') {
  return NextResponse.json({ data, message } as ApiResponse<T>, { status: 201 });
}

export function apiError(
  code: string,
  message: string,
  status = 500,
  details?: any,
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details,
        requestId: crypto.randomUUID(),
      },
    } as ApiError,
    { status },
  );
}

export function apiValidationError(details: any) {
  return apiError('VALIDATION_ERROR', 'Invalid input data', 400, details);
}

export function apiUnauthorized(message = 'Authentication required') {
  return apiError('UNAUTHORIZED', message, 401);
}

export function apiForbidden(message = 'Insufficient permissions') {
  return apiError('FORBIDDEN', message, 403);
}

export function apiNotFound(message = 'Resource not found') {
  return apiError('NOT_FOUND', message, 404);
}
```

```typescript
// lib/api/auth.ts
import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
import { apiUnauthorized, apiForbidden } from './response';
import { ROLE_HIERARCHY, type Role } from '@/lib/admin/rbac/roles';

export async function requireApiAuth(request: NextRequest) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims?.sub) {
    throw apiUnauthorized();
  }

  return {
    id: data.claims.sub,
    email: data.claims.email!,
  };
}

export async function requireApiRole(request: NextRequest, requiredRole: Role) {
  const user = await requireApiAuth(request);
  const supabase = await createClient();

  const { data: userRole, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (error || !userRole) {
    throw apiForbidden();
  }

  const userLevel = ROLE_HIERARCHY[userRole.role as Role] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;

  if (userLevel < requiredLevel) {
    throw apiForbidden();
  }

  return {
    ...user,
    role: userRole.role as Role,
  };
}
```

```typescript
// lib/api/handler.ts
import { NextRequest, NextResponse } from 'next/server';
import { apiError } from './response';

export function apiHandler(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
) {
  return async (request: NextRequest, context?: any) => {
    try {
      return await handler(request, context);
    } catch (error: any) {
      if (error instanceof NextResponse) {
        return error;
      }

      console.error('[API Error]', {
        url: request.url,
        method: request.method,
        error: error.message,
      });

      return apiError(
        'INTERNAL_ERROR',
        process.env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : error.message,
        500,
      );
    }
  };
}
```

```typescript
// lib/api/validation.ts
import { z } from 'zod';
import { apiValidationError } from './response';

export function validateBody<T extends z.ZodType>(schema: T, body: unknown) {
  const result = schema.safeParse(body);

  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    throw apiValidationError(details);
  }

  return result.data as z.infer<T>;
}

export function validateQuery<T extends z.ZodType>(
  schema: T,
  searchParams: URLSearchParams,
) {
  const params = Object.fromEntries(searchParams.entries());
  const result = schema.safeParse(params);

  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    throw apiValidationError(details);
  }

  return result.data as z.infer<T>;
}
```

### 2.4 Testing de Seguridad

```bash
# Instalar dependencias de testing
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

```typescript
// __tests__/security/authorization.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { requireAdmin, requireModerator } from '@/lib/admin/auth/require-admin';

describe('Authorization Helpers', () => {
  it('should allow admin to access requireAdmin', async () => {
    // Mock admin user
    // ... implementar mock
    const user = await requireAdmin();
    expect(user.role).toBe('admin');
  });

  it('should deny regular user from requireAdmin', async () => {
    // Mock regular user
    // ... implementar mock
    await expect(requireAdmin()).rejects.toThrow();
  });
});
```

---

## Fase 3: Implementación de Backend

**Responsable:** backend-developer

### 3.1 Crear Queries de Base de Datos

```bash
mkdir -p lib/admin/queries
```

```typescript
// lib/admin/queries/users.ts
import { createClient } from '@/lib/supabase/server';

export async function getUsers({
  page = 1,
  limit = 20,
  filters = {},
  sort = 'created_at',
  order = 'desc',
}: {
  page?: number;
  limit?: number;
  filters?: {
    role?: string;
    status?: string;
    search?: string;
  };
  sort?: string;
  order?: 'asc' | 'desc';
}) {
  const supabase = await createClient();

  let query = supabase
    .from('user_profiles')
    .select(
      `
      *,
      user_id,
      user_roles!inner(role)
    `,
      { count: 'exact' },
    );

  // Aplicar filtros
  if (filters.role) {
    query = query.eq('user_roles.role', filters.role);
  }

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.search) {
    query = query.or(
      `full_name.ilike.%${filters.search}%,user_id.in.(select id from auth.users where email ilike '%${filters.search}%')`,
    );
  }

  // Paginación
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await query
    .order(sort, { ascending: order === 'asc' })
    .range(from, to);

  if (error) throw error;

  return {
    users: data || [],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

export async function getUserById(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_profiles')
    .select(
      `
      *,
      user_id,
      user_roles!inner(role, assigned_by, assigned_at, updated_at)
    `,
    )
    .eq('user_id', userId)
    .single();

  if (error) throw error;

  return data;
}
```

```typescript
// lib/admin/queries/audit-logs.ts
import { createClient } from '@/lib/supabase/server';

export async function getAuditLogs({
  page = 1,
  limit = 20,
  filters = {},
}: {
  page?: number;
  limit?: number;
  filters?: {
    userId?: string;
    action?: string;
    category?: string;
    resourceType?: string;
  };
}) {
  const supabase = await createClient();

  let query = supabase
    .from('audit_logs')
    .select('*', { count: 'exact' });

  if (filters.userId) {
    query = query.eq('user_id', filters.userId);
  }

  if (filters.action) {
    query = query.eq('action', filters.action);
  }

  if (filters.category) {
    query = query.eq('action_category', filters.category);
  }

  if (filters.resourceType) {
    query = query.eq('resource_type', filters.resourceType);
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  return {
    logs: data || [],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  };
}
```

### 3.2 Crear Mutations

```bash
mkdir -p lib/admin/mutations
```

```typescript
// lib/admin/mutations/users.ts
import { createClient } from '@/lib/supabase/server';

export async function updateUser(
  userId: string,
  data: {
    full_name?: string;
    status?: 'active' | 'inactive' | 'suspended' | 'pending';
    avatar_url?: string;
    bio?: string;
  },
) {
  const supabase = await createClient();

  const { data: updated, error } = await supabase
    .from('user_profiles')
    .update(data)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;

  return updated;
}

export async function updateUserRole(
  userId: string,
  role: 'admin' | 'moderator' | 'user',
  assignedBy: string,
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('user_roles')
    .update({ role, assigned_by: assignedBy })
    .eq('user_id', userId);

  if (error) throw error;
}

export async function deleteUser(userId: string) {
  const supabase = await createClient();

  // Supabase eliminará en cascada profile y role por FK
  const { error } = await supabase.auth.admin.deleteUser(userId);

  if (error) throw error;
}
```

### 3.3 Crear Sistema de Auditoría

```bash
mkdir -p lib/admin/audit
```

```typescript
// lib/admin/audit/index.ts
import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

export async function createAuditLog({
  userId,
  action,
  actionCategory,
  resourceType,
  resourceId,
  changes = {},
  metadata = {},
}: {
  userId: string;
  action: string;
  actionCategory: 'auth' | 'user' | 'role' | 'setting' | 'system';
  resourceType?: string;
  resourceId?: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
}) {
  const supabase = await createClient();
  const headersList = await headers();

  const { error } = await supabase.from('audit_logs').insert({
    user_id: userId,
    action,
    action_category: actionCategory,
    resource_type: resourceType,
    resource_id: resourceId,
    changes,
    metadata,
    ip_address: headersList.get('x-forwarded-for') || headersList.get('x-real-ip'),
    user_agent: headersList.get('user-agent'),
  });

  if (error) {
    console.error('Failed to create audit log:', error);
  }
}

// Acciones comunes
export const AUDIT_ACTIONS = {
  USER_CREATE: 'user.create',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
  USER_ROLE_CHANGE: 'user.role.update',
  USER_STATUS_CHANGE: 'user.status.update',
  ROLE_CREATE: 'role.create',
  ROLE_UPDATE: 'role.update',
  ROLE_DELETE: 'role.delete',
  SETTING_UPDATE: 'setting.update',
  ADMIN_LOGIN: 'admin.login',
} as const;
```

### 3.4 Crear API Routes

```bash
mkdir -p app/api/admin/users
```

```typescript
// app/api/admin/users/route.ts
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api/handler';
import { requireApiRole } from '@/lib/api/auth';
import { apiSuccess } from '@/lib/api/response';
import { validateQuery } from '@/lib/api/validation';
import { getUsers } from '@/lib/admin/queries/users';

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  role: z.enum(['admin', 'moderator', 'user']).optional(),
  status: z.enum(['active', 'inactive', 'suspended', 'pending']).optional(),
  search: z.string().optional(),
  sort: z.string().default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const GET = apiHandler(async (request: NextRequest) => {
  await requireApiRole(request, 'moderator');

  const params = validateQuery(querySchema, request.nextUrl.searchParams);

  const { users, total, page, limit, totalPages } = await getUsers({
    page: params.page,
    limit: params.limit,
    filters: {
      role: params.role,
      status: params.status,
      search: params.search,
    },
    sort: params.sort,
    order: params.order,
  });

  return apiSuccess(users, {
    page,
    limit,
    total,
    totalPages,
  });
});
```

---

## Fase 4: Implementación de Frontend

**Responsable:** fullstack-implementer

### 4.1 Crear Página de Unauthorized

```typescript
// app/unauthorized/page.tsx
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">403</h1>
        <h2 className="text-2xl">Acceso No Autorizado</h2>
        <p className="text-muted-foreground">
          No tienes permisos para acceder a esta página.
        </p>
        <Button asChild>
          <Link href="/">Volver al inicio</Link>
        </Button>
      </div>
    </div>
  );
}
```

### 4.2 Crear Layout del Admin Panel

```bash
mkdir -p app/admin/(dashboard)
mkdir -p components/admin
```

```typescript
// app/admin/layout.tsx
import { requireModerator } from '@/lib/admin/auth/require-admin';
import { AdminSidebar } from '@/components/admin/sidebar';
import { AdminHeader } from '@/components/admin/header';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireModerator();

  return (
    <div className="flex h-screen">
      <AdminSidebar userRole={user.role} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader user={user} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
```

### 4.3 Crear Dashboard

```typescript
// app/admin/(dashboard)/page.tsx
import { requireAdmin } from '@/lib/admin/auth/require-admin';
import { StatsGrid } from '@/components/admin/dashboard/stats-grid';
import { RecentActivity } from '@/components/admin/dashboard/recent-activity';

export default async function AdminDashboard() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Resumen general del sistema
        </p>
      </div>

      <StatsGrid />
      <RecentActivity />
    </div>
  );
}
```

### 4.4 Crear Página de Usuarios

```typescript
// app/admin/users/page.tsx
import { requireModerator } from '@/lib/admin/auth/require-admin';
import { getUsers } from '@/lib/admin/queries/users';
import { UsersTable } from '@/components/admin/users/users-table';

export default async function UsersPage({
  searchParams,
}: {
  searchParams: {
    page?: string;
    role?: string;
    status?: string;
    search?: string;
  };
}) {
  await requireModerator();

  const page = Number(searchParams.page) || 1;

  const { users, total, totalPages } = await getUsers({
    page,
    limit: 20,
    filters: {
      role: searchParams.role,
      status: searchParams.status,
      search: searchParams.search,
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Usuarios</h1>
        <p className="text-muted-foreground">
          Gestión de usuarios del sistema
        </p>
      </div>

      <UsersTable
        users={users}
        total={total}
        currentPage={page}
        totalPages={totalPages}
      />
    </div>
  );
}
```

---

## Checklist de Implementación

### Database
- [ ] Migración 001 ejecutada y verificada
- [ ] Migración 002 ejecutada y verificada
- [ ] Migración 003 ejecutada con email correcto
- [ ] Tests de integridad pasados
- [ ] Primer admin creado

### Security
- [ ] Middleware actualizado para rutas /admin
- [ ] Helpers de autorización implementados
- [ ] Helpers de API creados
- [ ] RLS verificado funcionando
- [ ] Tests de seguridad pasados

### Backend
- [ ] Queries implementadas
- [ ] Mutations implementadas
- [ ] Sistema de auditoría implementado
- [ ] API routes creadas
- [ ] Validación con Zod implementada

### Frontend
- [ ] Layout de admin implementado
- [ ] Dashboard implementado
- [ ] Página de usuarios implementada
- [ ] Componentes UI creados
- [ ] Página unauthorized implementada

---

## Testing End-to-End

```bash
# 1. Login como admin
# 2. Navegar a /admin
# 3. Verificar dashboard se carga
# 4. Navegar a /admin/users
# 5. Verificar lista de usuarios
# 6. Cambiar rol de un usuario
# 7. Verificar audit log creado
# 8. Logout y login como usuario regular
# 9. Intentar acceder a /admin
# 10. Verificar redirect a /unauthorized
```

---

## Documentos Relacionados

- [Arquitectura del Admin Panel](./admin-panel-architecture.md)
- [ADR-001: RBAC Implementation](../decisions/adr-001-rbac-implementation.md)
- [ADR-002: Database Schema](../decisions/adr-002-database-schema.md)
- [ADR-003: API Route Structure](../decisions/adr-003-api-route-structure.md)
- [ADR-004: Security Layers](../decisions/adr-004-security-layers.md)
