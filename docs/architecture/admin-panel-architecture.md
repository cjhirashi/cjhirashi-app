# Arquitectura del Panel de Administración

## Resumen Ejecutivo

Este documento define la arquitectura completa para el panel de administración con control de acceso basado en roles (RBAC) que se integrará en la aplicación Next.js 15+ existente con autenticación Supabase.

**Versión:** 1.0
**Fecha:** 2025-11-11
**Estado:** Diseño Aprobado

---

## 1. Visión General de la Arquitectura

### 1.1 Objetivos del Sistema

1. **Seguridad**: Implementar RBAC robusto con múltiples capas de protección
2. **Escalabilidad**: Diseñar para soportar crecimiento en usuarios y funcionalidades
3. **Mantenibilidad**: Código modular y bien documentado
4. **Rendimiento**: Optimización de consultas y caching estratégico
5. **Auditabilidad**: Trazabilidad completa de acciones administrativas

### 1.2 Principios de Diseño

- **Defensa en profundidad**: Seguridad en middleware, API routes, RLS y componentes
- **Principio de menor privilegio**: Permisos mínimos necesarios por rol
- **Separación de responsabilidades**: Clara división entre presentación, lógica y datos
- **Inmutabilidad de logs**: Auditoría que no puede ser modificada
- **Progressive Enhancement**: Funcionalidad base sin JavaScript mejorada con interactividad

---

## 2. Arquitectura del Sistema

### 2.1 Diagrama de Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────┐
│                        Cliente (Navegador)                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Next.js 15 App Router (React 19)                 │  │
│  │  ┌────────────────┐  ┌────────────────┐                 │  │
│  │  │  Public Routes │  │  Admin Routes  │                 │  │
│  │  │   /, /auth/*   │  │   /admin/*     │                 │  │
│  │  └────────────────┘  └────────────────┘                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTP/SSE
┌─────────────────────────────────────────────────────────────────┐
│                    Middleware Layer (Edge)                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  1. Session Validation (Supabase Auth)                   │  │
│  │  2. Role Extraction (JWT Claims)                         │  │
│  │  3. Route Protection (/admin/* requires admin/moderator) │  │
│  │  4. Redirect Logic                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Application Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Server       │  │ API Routes   │  │ Server Actions       │  │
│  │ Components   │  │ /api/admin/* │  │ (Mutations)          │  │
│  │              │  │              │  │                      │  │
│  │ - Dashboard  │  │ - Users CRUD │  │ - Update User Role   │  │
│  │ - User List  │  │ - Stats      │  │ - Toggle User Status │  │
│  │ - Analytics  │  │ - Logs       │  │ - System Settings    │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                              ↓                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           Authorization Layer (Helpers)                   │  │
│  │  - requireAdmin(): Verifica rol admin                    │  │
│  │  - requireModerator(): Verifica admin o moderator        │  │
│  │  - hasPermission(): Verifica permisos específicos        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Data Access Layer                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Supabase Client (PostgreSQL via REST API)        │  │
│  │  - Type-safe queries                                     │  │
│  │  - RLS enforcement                                       │  │
│  │  - Connection pooling                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Database Layer (PostgreSQL)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │  users   │  │  roles   │  │ user_    │  │ audit_logs   │   │
│  │          │  │          │  │ roles    │  │              │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │         Row Level Security (RLS) Policies               │   │
│  │  - Users: Admins ven todos, users solo su perfil       │   │
│  │  - Roles: Solo admins pueden modificar                 │   │
│  │  - Audit Logs: Solo lectura para admins, inmutable     │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Flujo de Datos

#### 2.2.1 Flujo de Autenticación y Autorización

```
1. Usuario accede a /admin/users
   ↓
2. Middleware intercepta la solicitud
   ↓
3. Middleware verifica sesión válida con Supabase
   ↓
4. Middleware extrae rol del usuario desde JWT claims
   ↓
5. Middleware verifica si rol es 'admin' o 'moderator'
   ├─ No autorizado → Redirect a /unauthorized
   └─ Autorizado → Continúa
   ↓
6. Server Component se renderiza
   ↓
7. Server Component llama a requireAdmin() helper
   ↓
8. Helper verifica nuevamente el rol (defensa en profundidad)
   ↓
9. Consulta a base de datos con RLS activo
   ├─ RLS verifica que user.role = 'admin'
   └─ Retorna datos filtrados
   ↓
10. Renderiza UI con datos
```

#### 2.2.2 Flujo de Mutación (Ejemplo: Cambiar rol de usuario)

```
1. Admin hace clic en "Cambiar rol" en UI
   ↓
2. Client Component llama a Server Action 'updateUserRole'
   ↓
3. Server Action verifica sesión y rol del ejecutor
   ├─ No admin → Lanza UnauthorizedError
   └─ Admin → Continúa
   ↓
4. Server Action valida datos de entrada (Zod)
   ↓
5. Server Action inicia transacción en DB
   ↓
6. Actualiza user_roles table
   ↓
7. Crea entrada en audit_logs
   {
     user_id: admin_id,
     action: 'user.role.update',
     resource_type: 'user',
     resource_id: target_user_id,
     changes: { role: { from: 'user', to: 'moderator' } },
     ip_address: request.ip,
     user_agent: request.headers['user-agent']
   }
   ↓
8. Commit transacción
   ↓
9. Revalidate cache (revalidatePath('/admin/users'))
   ↓
10. Retorna éxito al cliente
   ↓
11. UI se actualiza optimistamente
```

---

## 3. Estructura de Rutas

### 3.1 Jerarquía de Rutas del Admin Panel

```
/admin                          [Layout con sidebar y header]
├── (dashboard)                 [Grupo de ruta - no crea segmento URL]
│   └── page.tsx                → /admin (Dashboard principal)
│
├── users                       [Gestión de usuarios]
│   ├── page.tsx                → /admin/users (Lista)
│   ├── [id]
│   │   ├── page.tsx            → /admin/users/[id] (Detalle)
│   │   └── edit
│   │       └── page.tsx        → /admin/users/[id]/edit
│   └── new
│       └── page.tsx            → /admin/users/new (Crear)
│
├── roles                       [Gestión de roles]
│   ├── page.tsx                → /admin/roles (Lista)
│   ├── [id]
│   │   └── page.tsx            → /admin/roles/[id]
│   └── new
│       └── page.tsx            → /admin/roles/new
│
├── audit-logs                  [Logs de auditoría]
│   ├── page.tsx                → /admin/audit-logs (Lista)
│   └── [id]
│       └── page.tsx            → /admin/audit-logs/[id] (Detalle)
│
├── analytics                   [Reportes y analytics]
│   ├── page.tsx                → /admin/analytics
│   ├── users
│   │   └── page.tsx            → /admin/analytics/users
│   └── activity
│       └── page.tsx            → /admin/analytics/activity
│
├── settings                    [Configuración del sistema]
│   ├── page.tsx                → /admin/settings
│   ├── general
│   │   └── page.tsx            → /admin/settings/general
│   ├── security
│   │   └── page.tsx            → /admin/settings/security
│   └── integrations
│       └── page.tsx            → /admin/settings/integrations
│
├── layout.tsx                  [Layout principal del admin]
├── loading.tsx                 [Loading UI para Suspense]
└── error.tsx                   [Error boundary del admin]
```

### 3.2 API Routes

```
/api/admin
├── users
│   ├── route.ts                → GET /api/admin/users (Lista paginada)
│   ├── [id]
│   │   ├── route.ts            → GET/PUT/DELETE /api/admin/users/[id]
│   │   └── status
│   │       └── route.ts        → PATCH /api/admin/users/[id]/status
│   └── stats
│       └── route.ts            → GET /api/admin/users/stats
│
├── roles
│   ├── route.ts                → GET/POST /api/admin/roles
│   └── [id]
│       └── route.ts            → GET/PUT/DELETE /api/admin/roles/[id]
│
├── audit-logs
│   ├── route.ts                → GET /api/admin/audit-logs
│   └── [id]
│       └── route.ts            → GET /api/admin/audit-logs/[id]
│
├── analytics
│   ├── dashboard
│   │   └── route.ts            → GET /api/admin/analytics/dashboard
│   ├── users
│   │   └── route.ts            → GET /api/admin/analytics/users
│   └── activity
│       └── route.ts            → GET /api/admin/analytics/activity
│
└── settings
    ├── route.ts                → GET/PUT /api/admin/settings
    └── [key]
        └── route.ts            → GET/PUT /api/admin/settings/[key]
```

---

## 4. Arquitectura de Componentes

### 4.1 Jerarquía de Componentes

```
app/admin/layout.tsx (Server Component)
│
├── AdminSidebar (Client Component)
│   ├── Logo
│   ├── Navigation
│   │   ├── NavItem (dashboard)
│   │   ├── NavItem (users) - if hasPermission('users.read')
│   │   ├── NavItem (roles) - if hasPermission('roles.read')
│   │   ├── NavItem (audit-logs) - if hasPermission('logs.read')
│   │   ├── NavItem (analytics) - if hasPermission('analytics.read')
│   │   └── NavItem (settings) - if hasPermission('settings.read')
│   └── UserMenu
│       ├── Profile
│       ├── Settings
│       └── Logout
│
└── AdminHeader (Client Component)
    ├── Breadcrumbs
    ├── SearchBar (Client)
    └── NotificationBell (Client)

app/admin/(dashboard)/page.tsx (Server Component)
│
├── StatsGrid (Server Component)
│   ├── StatCard (total_users)
│   ├── StatCard (active_users)
│   ├── StatCard (new_users_today)
│   └── StatCard (total_roles)
│
├── RecentActivityTable (Server Component)
│   └── ActivityRow[] (renderiza últimas 10 acciones)
│
└── QuickActions (Client Component)
    ├── Button (Create User)
    ├── Button (Create Role)
    └── Button (View Reports)

app/admin/users/page.tsx (Server Component)
│
├── UsersHeader (Client Component)
│   ├── Title
│   ├── CreateUserButton (Client)
│   └── FilterBar (Client)
│       ├── SearchInput
│       ├── RoleFilter
│       └── StatusFilter
│
├── UsersTable (Server Component con Suspense)
│   ├── TableHeader
│   │   ├── Checkbox (Select all)
│   │   ├── SortableColumn (Name)
│   │   ├── SortableColumn (Email)
│   │   ├── SortableColumn (Role)
│   │   ├── SortableColumn (Status)
│   │   └── Column (Actions)
│   │
│   └── TableBody
│       └── UserRow[] (Client Component)
│           ├── Checkbox
│           ├── Avatar + Name
│           ├── Email
│           ├── RoleBadge
│           ├── StatusBadge
│           └── ActionsDropdown (Client)
│               ├── Edit
│               ├── Change Role
│               ├── Toggle Status
│               └── Delete
│
└── Pagination (Client Component)
    ├── PageInfo
    ├── PreviousButton
    ├── PageNumbers
    └── NextButton
```

### 4.2 Patrones de Componentes

#### 4.2.1 Server Components (Por defecto)

**Uso**: Fetching de datos, renderizado estático, acceso a secrets

```tsx
// app/admin/users/page.tsx
import { requireAdmin } from '@/lib/auth/require-admin';
import { getUsers } from '@/lib/admin/queries/users';
import { UsersTable } from '@/components/admin/users/users-table';

export default async function UsersPage({
  searchParams,
}: {
  searchParams: { page?: string; role?: string; status?: string; search?: string };
}) {
  // Verificación de autorización
  await requireAdmin();

  // Parsing de parámetros
  const page = Number(searchParams.page) || 1;
  const filters = {
    role: searchParams.role,
    status: searchParams.status,
    search: searchParams.search,
  };

  // Fetch de datos (con RLS activo)
  const { users, total } = await getUsers({ page, limit: 20, filters });

  return (
    <div className="space-y-6">
      <UsersHeader />
      <UsersTable users={users} total={total} currentPage={page} />
    </div>
  );
}
```

#### 4.2.2 Client Components

**Uso**: Interactividad, estado local, event handlers

```tsx
'use client';

import { useState } from 'react';
import { updateUserRole } from '@/lib/admin/actions/users';
import { toast } from '@/components/ui/use-toast';

export function ChangeRoleDialog({ userId, currentRole }: Props) {
  const [role, setRole] = useState(currentRole);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await updateUserRole(userId, role);
      toast({ title: 'Role updated successfully' });
    } catch (error) {
      toast({ title: 'Error updating role', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (/* Dialog UI */);
}
```

#### 4.2.3 Server Actions (Mutaciones)

**Uso**: Operaciones de escritura, validación server-side

```tsx
'use server';

import { z } from 'zod';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { createAuditLog } from '@/lib/admin/audit';

const updateRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['admin', 'moderator', 'user']),
});

export async function updateUserRole(userId: string, role: string) {
  // 1. Autenticación y autorización
  const admin = await requireAdmin();

  // 2. Validación de entrada
  const validated = updateRoleSchema.parse({ userId, role });

  // 3. Obtener cliente Supabase
  const supabase = await createClient();

  // 4. Obtener rol anterior para audit log
  const { data: currentUser } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', validated.userId)
    .single();

  // 5. Actualizar rol (dentro de transacción)
  const { error } = await supabase
    .from('user_roles')
    .update({ role: validated.role })
    .eq('user_id', validated.userId);

  if (error) throw new Error(`Failed to update role: ${error.message}`);

  // 6. Crear audit log
  await createAuditLog({
    userId: admin.id,
    action: 'user.role.update',
    resourceType: 'user',
    resourceId: validated.userId,
    changes: {
      role: { from: currentUser?.role, to: validated.role },
    },
  });

  // 7. Revalidar cache
  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${validated.userId}`);

  return { success: true };
}
```

---

## 5. Gestión de Estado

### 5.1 Estrategia de Estado

**Principio**: No usar librerías de estado global (Redux, Zustand) innecesariamente. Aprovechar las capacidades nativas de React Server Components.

#### 5.1.1 Estado del Servidor (Server State)

**Método**: React Server Components + Supabase queries

```tsx
// Server Component - datos frescos en cada request
export default async function UsersPage() {
  const users = await getUsers(); // Direct DB query
  return <UsersTable users={users} />;
}
```

**Ventajas**:
- Datos siempre actualizados
- No hay sincronización cliente-servidor
- Menos JavaScript enviado al cliente
- SEO-friendly

#### 5.1.2 Estado de UI Local (UI State)

**Método**: React useState/useReducer dentro de Client Components

```tsx
'use client';

export function FilterBar() {
  const [filters, setFilters] = useState({
    role: '',
    status: '',
    search: '',
  });

  // Sincronizar con URL params
  const router = useRouter();
  const pathname = usePathname();

  const applyFilters = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    router.push(`${pathname}?${params.toString()}`);
  };

  return (/* Filter UI */);
}
```

#### 5.1.3 Estado de Formularios

**Método**: React Hook Form + Zod para validación

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createUserSchema } from '@/lib/admin/schemas';

export function CreateUserForm() {
  const form = useForm({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      name: '',
      role: 'user',
    },
  });

  const onSubmit = async (data) => {
    await createUser(data);
  };

  return (/* Form UI with form.register() */);
}
```

#### 5.1.4 Estado Compartido entre Componentes

**Método**: React Context para estado que debe compartirse sin prop drilling

```tsx
// Solo para estado de UI, NO para datos del servidor
'use client';

import { createContext, useContext, useState } from 'react';

type AdminLayoutContext = {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
};

const AdminLayoutContext = createContext<AdminLayoutContext | null>(null);

export function AdminLayoutProvider({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <AdminLayoutContext.Provider value={{
      isSidebarOpen,
      toggleSidebar: () => setIsSidebarOpen(!isSidebarOpen),
    }}>
      {children}
    </AdminLayoutContext.Provider>
  );
}

export const useAdminLayout = () => {
  const context = useContext(AdminLayoutContext);
  if (!context) throw new Error('useAdminLayout must be used within AdminLayoutProvider');
  return context;
};
```

### 5.2 Sincronización URL-Estado

Usar URL search params como single source of truth para filtros, paginación, etc.

```tsx
// Server Component lee de searchParams
export default async function UsersPage({ searchParams }) {
  const page = Number(searchParams.page) || 1;
  const role = searchParams.role;
  // ...
}

// Client Component actualiza URL
function FilterBar() {
  const router = useRouter();
  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set(key, value);
    router.push(`?${params.toString()}`);
  };
}
```

---

## 6. Sistema de Permisos

### 6.1 Definición de Roles

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

// Un admin tiene todos los permisos de moderator y user
export function hasHigherOrEqualRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}
```

### 6.2 Definición de Permisos

```typescript
// lib/admin/rbac/permissions.ts

export const PERMISSIONS = {
  // Users
  'users.read': ['admin', 'moderator'],
  'users.create': ['admin'],
  'users.update': ['admin'],
  'users.delete': ['admin'],
  'users.change_role': ['admin'],

  // Roles
  'roles.read': ['admin'],
  'roles.create': ['admin'],
  'roles.update': ['admin'],
  'roles.delete': ['admin'],

  // Audit Logs
  'logs.read': ['admin', 'moderator'],
  'logs.export': ['admin'],

  // Analytics
  'analytics.read': ['admin', 'moderator'],
  'analytics.export': ['admin'],

  // Settings
  'settings.read': ['admin'],
  'settings.update': ['admin'],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(userRole: Role, permission: Permission): boolean {
  const allowedRoles = PERMISSIONS[permission];
  return allowedRoles.includes(userRole);
}
```

### 6.3 Helpers de Autorización

```typescript
// lib/admin/auth/require-admin.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ROLES } from '@/lib/admin/rbac/roles';

export async function requireAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims?.sub) {
    redirect('/auth/login');
  }

  // Obtener rol del usuario desde la tabla user_roles
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
    email: data.claims.email,
    role: userRole.role,
  };
}

export async function requireModerator() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims?.sub) {
    redirect('/auth/login');
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
    email: data.claims.email,
    role: userRole.role,
  };
}

export async function requirePermission(permission: Permission) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims?.sub) {
    redirect('/auth/login');
  }

  const { data: userRole, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', data.claims.sub)
    .single();

  if (error || !hasPermission(userRole?.role, permission)) {
    redirect('/unauthorized');
  }

  return {
    id: data.claims.sub,
    email: data.claims.email,
    role: userRole.role,
  };
}
```

---

## 7. Caching y Optimización

### 7.1 Estrategia de Caching

#### 7.1.1 Nivel de Aplicación (Next.js)

```typescript
// Force cache para datos que cambian raramente
export const revalidate = 3600; // 1 hora

// Force dynamic para datos en tiempo real
export const dynamic = 'force-dynamic';

// Revalidate on-demand después de mutaciones
await revalidatePath('/admin/users');
await revalidateTag('users-list');
```

#### 7.1.2 Nivel de Base de Datos

```sql
-- Índices para queries frecuentes
CREATE INDEX idx_users_role ON user_roles(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_audit_logs_user_action ON audit_logs(user_id, action, created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- Vista materializada para stats del dashboard (actualizada cada 5 min)
CREATE MATERIALIZED VIEW admin_dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM users WHERE status = 'active') as active_users,
  (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '24 hours') as new_users_today,
  (SELECT COUNT(*) FROM roles) as total_roles;

CREATE UNIQUE INDEX ON admin_dashboard_stats ((1));

-- Refresh automático vía pg_cron
SELECT cron.schedule('refresh-admin-stats', '*/5 * * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY admin_dashboard_stats');
```

### 7.2 Paginación

```typescript
// lib/admin/queries/users.ts

export async function getUsers({
  page = 1,
  limit = 20,
  filters = {},
}: {
  page?: number;
  limit?: number;
  filters?: {
    role?: string;
    status?: string;
    search?: string;
  };
}) {
  const supabase = await createClient();

  let query = supabase
    .from('users')
    .select('*, user_roles!inner(role)', { count: 'exact' });

  // Aplicar filtros
  if (filters.role) {
    query = query.eq('user_roles.role', filters.role);
  }

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.search) {
    query = query.or(`email.ilike.%${filters.search}%,name.ilike.%${filters.search}%`);
  }

  // Paginación
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  return {
    users: data,
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  };
}
```

### 7.3 Optimización de Consultas

**Evitar N+1 queries con joins**:

```typescript
// Mal: N+1 queries
const users = await supabase.from('users').select('*');
for (const user of users) {
  const role = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();
}

// Bien: Single query con join
const users = await supabase
  .from('users')
  .select('*, user_roles!inner(role)');
```

---

## 8. Seguridad

### 8.1 Defensa en Profundidad

1. **Middleware**: Primera capa - verifica sesión y rol
2. **Server Components**: Segunda capa - llama a requireAdmin/requireModerator
3. **API Routes**: Tercera capa - valida autorización en handlers
4. **Server Actions**: Cuarta capa - valida en cada action
5. **RLS**: Quinta capa - PostgreSQL garantiza acceso correcto

### 8.2 Validación de Entrada

```typescript
// lib/admin/schemas/users.ts
import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email('Invalid email'),
  name: z.string().min(2, 'Name too short').max(100, 'Name too long'),
  role: z.enum(['admin', 'moderator', 'user']),
});

export const updateUserRoleSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  role: z.enum(['admin', 'moderator', 'user']),
});

// Uso en Server Actions
export async function createUser(data: unknown) {
  await requireAdmin();

  const validated = createUserSchema.parse(data); // Lanza ZodError si inválido

  // Proceder con datos validados
}
```

### 8.3 Protección CSRF

Next.js protege Server Actions automáticamente con tokens CSRF. No se requiere configuración adicional.

### 8.4 Rate Limiting

```typescript
// lib/admin/rate-limit.ts
import { createClient } from '@/lib/supabase/server';

const RATE_LIMITS = {
  'user.create': { max: 10, window: 3600 }, // 10 por hora
  'user.delete': { max: 5, window: 3600 }, // 5 por hora
};

export async function checkRateLimit(userId: string, action: string) {
  const supabase = await createClient();
  const limit = RATE_LIMITS[action];

  if (!limit) return true;

  const windowStart = new Date(Date.now() - limit.window * 1000);

  const { count } = await supabase
    .from('audit_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('action', action)
    .gte('created_at', windowStart.toISOString());

  if ((count || 0) >= limit.max) {
    throw new Error(`Rate limit exceeded for ${action}`);
  }

  return true;
}
```

---

## 9. Auditoría y Logging

### 9.1 Sistema de Audit Logs

```typescript
// lib/admin/audit.ts
import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

export async function createAuditLog({
  userId,
  action,
  resourceType,
  resourceId,
  changes = {},
  metadata = {},
}: {
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
}) {
  const supabase = await createClient();
  const headersList = await headers();

  const { error } = await supabase.from('audit_logs').insert({
    user_id: userId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    changes,
    ip_address: headersList.get('x-forwarded-for') || headersList.get('x-real-ip'),
    user_agent: headersList.get('user-agent'),
    metadata,
  });

  if (error) {
    console.error('Failed to create audit log:', error);
  }
}
```

### 9.2 Acciones Auditables

```typescript
// Catálogo de acciones
export const AUDIT_ACTIONS = {
  // Users
  USER_CREATE: 'user.create',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
  USER_ROLE_CHANGE: 'user.role.update',
  USER_STATUS_CHANGE: 'user.status.update',

  // Roles
  ROLE_CREATE: 'role.create',
  ROLE_UPDATE: 'role.update',
  ROLE_DELETE: 'role.delete',

  // Settings
  SETTING_UPDATE: 'setting.update',

  // Auth
  ADMIN_LOGIN: 'admin.login',
  ADMIN_LOGOUT: 'admin.logout',
};
```

---

## 10. Testing Strategy

### 10.1 Niveles de Testing

1. **Unit Tests**: Helpers, utilidades, validaciones (Vitest)
2. **Integration Tests**: Server Actions, API Routes (Vitest + Supabase local)
3. **E2E Tests**: Flujos completos de admin (Playwright)

### 10.2 Ejemplo de Test de Server Action

```typescript
// __tests__/lib/admin/actions/users.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { updateUserRole } from '@/lib/admin/actions/users';
import { createMockUser } from '@/test/factories';

describe('updateUserRole', () => {
  beforeEach(async () => {
    // Setup: crear admin user en DB de test
  });

  it('should update user role when called by admin', async () => {
    const user = await createMockUser({ role: 'user' });

    await updateUserRole(user.id, 'moderator');

    const updated = await getUserById(user.id);
    expect(updated.role).toBe('moderator');
  });

  it('should throw when called by non-admin', async () => {
    // Mock requireAdmin para que falle
    await expect(updateUserRole('user-id', 'admin')).rejects.toThrow();
  });

  it('should create audit log entry', async () => {
    const user = await createMockUser({ role: 'user' });

    await updateUserRole(user.id, 'moderator');

    const logs = await getAuditLogs({ resourceId: user.id });
    expect(logs).toHaveLength(1);
    expect(logs[0].action).toBe('user.role.update');
  });
});
```

---

## 11. Consideraciones de Deployment

### 11.1 Variables de Entorno

```bash
# .env.local (desarrollo)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...

# .env.production (producción - Vercel)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...

# Variables adicionales para admin
ADMIN_EMAIL=admin@example.com  # Email del primer admin
```

### 11.2 Configuración de Vercel

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY": "@supabase-publishable-key"
  }
}
```

### 11.3 Migraciones de Base de Datos

```sql
-- migrations/001_create_admin_tables.sql
-- Ejecutar en orden:
-- 1. Tablas
-- 2. RLS policies
-- 3. Índices
-- 4. Vistas materializadas
-- 5. Seeds (primer admin)
```

---

## 12. Documentación Relacionada

- [ADR-001: RBAC Implementation Strategy](../decisions/adr-001-rbac-implementation.md)
- [ADR-002: Database Schema Design](../decisions/adr-002-database-schema.md)
- [ADR-003: API Route Structure](../decisions/adr-003-api-route-structure.md)
- [ADR-004: Security Layers](../decisions/adr-004-security-layers.md)
- [Database Schema](./database-schema.md)
- [API Specification](./api-specification.md)
- [Security Architecture](./security-architecture.md)
- [Implementation Guide](./implementation-guide.md)

---

## 13. Próximos Pasos

1. Revisar y aprobar este documento arquitectónico
2. Crear los ADRs detallados para cada decisión clave
3. Diseñar schema de base de datos completo
4. Implementar capas de seguridad (middleware, helpers)
5. Desarrollar componentes core del admin panel
6. Implementar sistema de auditoría
7. Testing exhaustivo
8. Deployment a staging
9. Revisión de seguridad
10. Deployment a producción

---

**Aprobaciones**:

- [ ] Tech Lead
- [ ] Security Guardian
- [ ] Product Owner
- [ ] Database Engineer
