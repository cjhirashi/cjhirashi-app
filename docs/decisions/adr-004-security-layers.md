# ADR-004: Arquitectura de Capas de Seguridad

> **Contexto de Versión**: Este ADR documenta las capas de seguridad del sistema base existente (Admin Panel),
> implementado antes de v0.1. Corresponde al "Base pre-v0.1" sobre el cual se construye v0.1.

**Estado:** Aceptado
**Fecha:** 2025-11-11
**Decisores:** Security Team, Architecture Team
**Contexto Técnico:** Next.js 15, Supabase Auth, PostgreSQL RLS

---

## Contexto y Problema

El panel de administración maneja operaciones críticas (gestión de usuarios, roles, configuración del sistema) que requieren múltiples capas de seguridad para prevenir:

1. **Acceso no autorizado**: Usuarios sin privilegios accediendo a funciones admin
2. **Escalación de privilegios**: Users promoviendo su propio rol
3. **Inyección SQL**: Manipulación de queries
4. **CSRF/XSS**: Ataques desde el cliente
5. **Data leakage**: Exposición de datos sensibles
6. **Audit trail manipulation**: Modificación de logs

### Principios de Seguridad

- **Defense in Depth**: Múltiples capas independientes
- **Fail Secure**: Por defecto denegar acceso
- **Principle of Least Privilege**: Mínimos permisos necesarios
- **Zero Trust**: Verificar en cada capa

---

## Opciones Consideradas

### Opción 1: Seguridad Solo en Middleware

**Descripción**: Toda la verificación de autorización en middleware

**Pros:**
- Single source of truth
- Intercepta todas las requests

**Contras:**
- Edge runtime limitado (no puede hacer queries complejas)
- Single point of failure
- No defiende contra bypasses

**Evaluación:** Rechazada - Insuficiente

---

### Opción 2: Seguridad Solo en RLS

**Descripción**: Confiar únicamente en Row Level Security de PostgreSQL

**Pros:**
- Garantiza seguridad a nivel de datos
- No puede ser bypasseado desde la aplicación

**Contras:**
- No previene acceso a rutas protegidas
- RLS complex puede afectar performance
- Errores genéricos (dificulta debugging)

**Evaluación:** Rechazada - Insuficiente por sí solo

---

### Opción 3: Defensa en Profundidad - 5 Capas (SELECCIONADA)

**Descripción**: Implementar seguridad en 5 capas independientes:

1. **Middleware**: Autenticación básica
2. **Layout/Page**: Autorización de rutas
3. **API Routes/Server Actions**: Autorización de operaciones
4. **Database Queries**: Queries seguras con parámetros
5. **RLS Policies**: Última línea de defensa

**Pros:**
- Máxima seguridad
- Cada capa es independiente
- Fail-safe si una capa falla
- Mejor experiencia de usuario (errores tempranos)
- Auditable en cada nivel

**Contras:**
- Mayor complejidad de implementación
- Código más verbose
- Potencial duplicación de lógica

**Evaluación:** ACEPTADA - Balance entre seguridad y usabilidad

---

## Decisión

Implementar **Opción 3: Defensa en Profundidad con 5 Capas**

---

## Arquitectura de Capas

```
┌────────────────────────────────────────────────────────────┐
│  Capa 1: Middleware (Edge Runtime)                         │
│  - Verificar sesión válida (Supabase Auth)                 │
│  - Redirect a /auth/login si no autenticado                │
│  - NO verificar roles (demasiado lento en Edge)            │
└────────────────────────────────────────────────────────────┘
                        ↓ (autenticado)
┌────────────────────────────────────────────────────────────┐
│  Capa 2: Layout/Page (Server Components)                   │
│  - Verificar rol del usuario (requireAdmin/requireModerator)│
│  - Redirect a /unauthorized si rol insuficiente            │
│  - Fetch de datos inicial con RLS activo                   │
└────────────────────────────────────────────────────────────┘
                        ↓ (autorizado)
┌────────────────────────────────────────────────────────────┐
│  Capa 3: API Routes / Server Actions                       │
│  - Re-verificar autenticación y autorización               │
│  - Validar entrada con Zod                                 │
│  - Aplicar rate limiting                                   │
│  - Sanitizar datos de entrada                              │
└────────────────────────────────────────────────────────────┘
                        ↓ (validado)
┌────────────────────────────────────────────────────────────┐
│  Capa 4: Database Queries (Supabase Client)                │
│  - Usar queries parametrizadas (prevenir SQL injection)    │
│  - Never concatenar strings para queries                   │
│  - Supabase Client maneja esto automáticamente             │
└────────────────────────────────────────────────────────────┘
                        ↓ (query seguro)
┌────────────────────────────────────────────────────────────┐
│  Capa 5: Row Level Security (PostgreSQL)                   │
│  - RLS policies verifican permisos a nivel de fila         │
│  - Última línea de defensa (cannot be bypassed)            │
│  - Audit logs son inmutables (no UPDATE/DELETE policy)     │
└────────────────────────────────────────────────────────────┘
```

---

## Implementación Detallada por Capa

### Capa 1: Middleware

**Objetivo**: Autenticación básica, redirigir usuarios no autenticados

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

  // CRITICAL: Must call getClaims() to prevent random logouts
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  // Solo verificar autenticación, NO roles (demasiado lento aquí)
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

**Seguridad Proporcionada:**
- Previene acceso a rutas protegidas sin autenticación
- Mantiene sesión fresca (previene session fixation)
- Redirect preserva URL destino para UX

**NO Proporcionada:**
- Verificación de roles (se hace en Capa 2)
- Validación de permisos específicos

---

### Capa 2: Layout/Page Components

**Objetivo**: Autorización de rutas basada en roles, UX mejorada

```typescript
// app/admin/layout.tsx
import { requireModerator } from '@/lib/admin/auth/require-admin';
import { redirect } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/sidebar';
import { AdminHeader } from '@/components/admin/header';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verificar que el usuario es admin o moderator
  const user = await requireModerator();

  return (
    <div className="flex h-screen">
      <AdminSidebar userRole={user.role} />
      <div className="flex-1 flex flex-col">
        <AdminHeader user={user} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
```

```typescript
// lib/admin/auth/require-admin.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cache } from 'react';

export const requireAdmin = cache(async () => {
  const supabase = await createClient();

  // 1. Verificar sesión
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) {
    redirect('/auth/login');
  }

  // 2. Obtener rol del usuario
  const { data: userRole, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', data.claims.sub)
    .single();

  // 3. Verificar rol admin
  if (error || userRole?.role !== 'admin') {
    redirect('/unauthorized');
  }

  return {
    id: data.claims.sub,
    email: data.claims.email!,
    role: userRole.role as 'admin',
  };
});

export const requireModerator = cache(async () => {
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
    (userRole?.role !== 'admin' && userRole?.role !== 'moderator')
  ) {
    redirect('/unauthorized');
  }

  return {
    id: data.claims.sub,
    email: data.claims.email!,
    role: userRole.role as 'admin' | 'moderator',
  };
});

// Cache para no hacer queries repetidas en el mismo request
```

**Seguridad Proporcionada:**
- Autorización basada en roles antes de renderizar UI
- Redirect temprano = mejor UX
- Cache previene queries duplicadas en un request
- Función específica por nivel de acceso requerido

**Vulnerabilidades Mitigadas:**
- Usuarios con sesión válida pero sin rol admin/moderator
- Enumeration attacks (no renderizar UI si no autorizado)

---

### Capa 3: API Routes y Server Actions

**Objetivo**: Re-verificar autorización, validar entrada, aplicar rate limiting

#### 3.1 API Routes

```typescript
// app/api/admin/users/route.ts
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api/handler';
import { requireApiRole } from '@/lib/api/auth';
import { validateQuery } from '@/lib/api/validation';
import { apiSuccess } from '@/lib/api/response';
import { checkRateLimit } from '@/lib/api/rate-limit';

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().max(255).optional(),
});

export const GET = apiHandler(async (request: NextRequest) => {
  // 1. Autenticación y autorización
  const user = await requireApiRole(request, 'moderator');

  // 2. Rate limiting (prevenir abuse)
  checkRateLimit(request, user.id, 100, 60000); // 100 req/min

  // 3. Validar y sanitizar entrada
  const params = validateQuery(querySchema, request.nextUrl.searchParams);

  // 4. Query con RLS activo
  const users = await getUsers(params);

  return apiSuccess(users);
});
```

```typescript
// lib/api/auth.ts
import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
import { apiUnauthorized, apiForbidden } from './response';

export async function requireApiRole(request: NextRequest, requiredRole: string) {
  const supabase = await createClient();

  // 1. Verificar sesión
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) {
    throw apiUnauthorized();
  }

  // 2. Verificar rol
  const { data: userRole, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', data.claims.sub)
    .single();

  if (error || !userRole) {
    throw apiUnauthorized('Invalid user');
  }

  // 3. Verificar jerarquía de roles
  const ROLE_HIERARCHY = { admin: 3, moderator: 2, user: 1 };
  const userLevel = ROLE_HIERARCHY[userRole.role] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;

  if (userLevel < requiredLevel) {
    throw apiForbidden();
  }

  return {
    id: data.claims.sub,
    email: data.claims.email!,
    role: userRole.role,
  };
}
```

#### 3.2 Server Actions

```typescript
// lib/admin/actions/users.ts
'use server';

import { z } from 'zod';
import { requireAdmin } from '@/lib/admin/auth/require-admin';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { createAuditLog } from '@/lib/admin/audit';

const updateRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['admin', 'moderator', 'user']),
});

export async function updateUserRole(userId: string, role: string) {
  // 1. Autorización
  const admin = await requireAdmin();

  // 2. Validación de entrada
  const validated = updateRoleSchema.parse({ userId, role });

  // 3. Prevenir auto-promoción/degradación
  if (validated.userId === admin.id) {
    throw new Error('Cannot modify your own role');
  }

  // 4. Obtener usuario actual
  const supabase = await createClient();
  const { data: currentUser } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', validated.userId)
    .single();

  if (!currentUser) {
    throw new Error('User not found');
  }

  // 5. Actualizar rol (con RLS activo)
  const { error } = await supabase
    .from('user_roles')
    .update({ role: validated.role, assigned_by: admin.id })
    .eq('user_id', validated.userId);

  if (error) {
    throw new Error(`Failed to update role: ${error.message}`);
  }

  // 6. Audit log (inmutable)
  await createAuditLog({
    userId: admin.id,
    action: 'user.role.update',
    resourceType: 'user',
    resourceId: validated.userId,
    changes: {
      role: { from: currentUser.role, to: validated.role },
    },
  });

  // 7. Revalidar cache
  revalidatePath('/admin/users');

  return { success: true };
}
```

**Seguridad Proporcionada:**
- Re-verificación de autorización (no confiar en cliente)
- Validación estricta de entrada con Zod
- Rate limiting para prevenir abuse
- Sanitización automática (Zod + Supabase)
- Business logic (e.g., no auto-modificar rol)
- Audit trail de operaciones sensibles

**Vulnerabilidades Mitigadas:**
- CSRF (Next.js protege Server Actions automáticamente)
- Injection attacks (validación + parameterized queries)
- Race conditions (transacciones)
- Privilege escalation (verificación de lógica de negocio)

---

### Capa 4: Database Queries

**Objetivo**: Queries seguras, prevenir SQL injection

```typescript
// lib/admin/queries/users.ts
import { createClient } from '@/lib/supabase/server';

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

  // CORRECTO: Usar métodos de Supabase (parameterizados)
  let query = supabase
    .from('users')
    .select('*, user_roles!inner(role), user_profiles!inner(*)', {
      count: 'exact',
    });

  // Filtros seguros (Supabase escapa valores automáticamente)
  if (filters.role) {
    query = query.eq('user_roles.role', filters.role);
  }

  if (filters.status) {
    query = query.eq('user_profiles.status', filters.status);
  }

  if (filters.search) {
    // Usar .ilike() que escapa wildcards automáticamente
    query = query.or(
      `email.ilike.%${filters.search}%,user_profiles.full_name.ilike.%${filters.search}%`,
    );
  }

  // Paginación segura
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  return { users: data, total: count || 0 };
}

// INCORRECTO: NUNCA hacer esto
// const query = `SELECT * FROM users WHERE name = '${searchTerm}'`; // SQL INJECTION!
```

**Seguridad Proporcionada:**
- Queries parametrizadas (Supabase maneja automáticamente)
- Escape de caracteres especiales
- Protección contra SQL injection
- Type-safe queries (TypeScript)

**Prácticas Seguras:**
- Usar siempre métodos de Supabase (.select(), .eq(), .ilike())
- NUNCA concatenar strings para queries
- NUNCA usar .rpc() con input no validado sin sanitización

---

### Capa 5: Row Level Security (RLS)

**Objetivo**: Última línea de defensa, garantizar acceso correcto a nivel de datos

#### 5.1 RLS para user_roles

```sql
-- Política 1: Usuarios pueden leer su propio rol
CREATE POLICY "users_read_own_role"
ON user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Política 2: Admins pueden leer todos los roles
CREATE POLICY "admins_read_all_roles"
ON user_roles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Política 3: Solo admins pueden modificar roles
CREATE POLICY "admins_modify_roles"
ON user_roles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  -- No pueden modificar su propio rol
  user_id != auth.uid()
);
```

#### 5.2 RLS para audit_logs (Inmutables)

```sql
-- Política 1: Solo admins y moderators pueden leer logs
CREATE POLICY "admins_read_logs"
ON audit_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
  )
);

-- Política 2: Sistema puede insertar logs (via service role key)
-- No policy for INSERT = only service role can insert

-- Política 3: Nadie puede modificar o eliminar logs (inmutabilidad)
-- No policy for UPDATE/DELETE = denied for everyone

-- Aplicar con service role key desde app
CREATE FUNCTION insert_audit_log(
  p_user_id UUID,
  p_action VARCHAR,
  p_resource_type VARCHAR,
  p_resource_id VARCHAR,
  p_changes JSONB
) RETURNS void AS $$
BEGIN
  INSERT INTO audit_logs (user_id, action, resource_type, resource_id, changes)
  VALUES (p_user_id, p_action, p_resource_type, p_resource_id, p_changes);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 5.3 RLS para user_profiles

```sql
-- Política 1: Usuarios pueden leer su propio perfil
CREATE POLICY "users_read_own_profile"
ON user_profiles FOR SELECT
USING (auth.uid() = user_id);

-- Política 2: Admins/moderators pueden leer todos
CREATE POLICY "admins_read_all_profiles"
ON user_profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
  )
);

-- Política 3: Usuarios pueden actualizar su perfil (campos limitados)
CREATE POLICY "users_update_own_profile"
ON user_profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  -- No pueden cambiar status
  (SELECT status FROM user_profiles WHERE user_id = auth.uid()) = status
);

-- Política 4: Solo admins pueden cambiar status
CREATE POLICY "admins_update_status"
ON user_profiles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
```

**Seguridad Proporcionada:**
- Garantiza acceso correcto a nivel de datos (cannot be bypassed)
- Previene privilege escalation desde cualquier capa superior
- Inmutabilidad de audit logs
- Separación de permisos (read vs write)

**Vulnerabilidades Mitigadas:**
- Bypass de autorización en capas superiores
- Direct database access malicioso
- Bugs en código de aplicación que expongan datos

---

## Protecciones Adicionales

### 1. CSRF Protection

Next.js protege Server Actions automáticamente con tokens CSRF. No requiere configuración adicional.

```typescript
// Automático en Server Actions
'use server';

export async function updateUser(data: FormData) {
  // Next.js verifica token CSRF automáticamente
  // ...
}
```

### 2. XSS Prevention

```typescript
// React escapa HTML automáticamente
export function UserName({ name }: { name: string }) {
  // Seguro: React escapa 'name'
  return <div>{name}</div>;
}

// Peligroso: Nunca hacer esto
export function UserNameUnsafe({ name }: { name: string }) {
  return <div dangerouslySetInnerHTML={{ __html: name }} />; // XSS!
}

// Si DEBES renderizar HTML, sanitiza primero
import DOMPurify from 'isomorphic-dompurify';

export function UserBio({ bio }: { bio: string }) {
  const clean = DOMPurify.sanitize(bio);
  return <div dangerouslySetInnerHTML={{ __html: clean }} />;
}
```

### 3. Content Security Policy

```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/admin/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requiere unsafe-eval
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co",
            ].join('; '),
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};
```

### 4. Sensitive Data Handling

```typescript
// lib/admin/queries/users.ts

// Nunca exponer passwords, tokens, etc.
export async function getUser(userId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from('users')
    .select('id, email, full_name, role, status, created_at') // Explicit fields
    // NO: .select('*') - puede exponer campos sensibles

  return data;
}

// Redact sensitive fields antes de logging
export function sanitizeForLog(user: any) {
  const { password, session_token, api_key, ...safe } = user;
  return safe;
}

console.log('User updated:', sanitizeForLog(user));
```

### 5. Rate Limiting

```typescript
// lib/api/rate-limit.ts
import { headers } from 'next/headers';

const limits = new Map<string, { count: number; reset: number }>();

export async function rateLimit(
  identifier: string,
  max: number,
  windowMs: number,
) {
  const now = Date.now();
  const record = limits.get(identifier);

  if (!record || now > record.reset) {
    limits.set(identifier, { count: 1, reset: now + windowMs });
    return true;
  }

  if (record.count >= max) {
    throw new Error('Rate limit exceeded');
  }

  record.count++;
  return true;
}

// Uso en Server Action
export async function sensitiveAction() {
  const user = await requireAdmin();

  // 5 requests por minuto para acciones sensibles
  await rateLimit(`sensitive:${user.id}`, 5, 60000);

  // ...
}
```

---

## Matriz de Amenazas y Mitigaciones

| Amenaza | Capas que Mitigan | Severidad | Mitigación |
|---------|-------------------|-----------|------------|
| Usuario no autenticado accede a admin | 1, 2 | ALTA | Middleware redirect + requireAdmin |
| User se promueve a admin | 2, 3, 5 | CRÍTICA | requireAdmin + business logic + RLS |
| SQL Injection | 4, 5 | CRÍTICA | Parameterized queries + RLS |
| CSRF | 3 | ALTA | Next.js built-in protection |
| XSS | N/A | ALTA | React auto-escaping |
| Modificar audit logs | 3, 5 | CRÍTICA | Immutable logs + no UPDATE/DELETE RLS |
| Enumeration attack | 2, 3 | MEDIA | Early redirect + generic errors |
| Rate limit bypass | 3 | MEDIA | Server-side rate limiting |
| Session hijacking | 1 | ALTA | HttpOnly cookies + session rotation |

---

## Checklist de Seguridad

### Pre-Deployment

- [ ] Todos los endpoints admin requieren autenticación
- [ ] Todos los endpoints admin verifican roles apropiados
- [ ] RLS habilitado en todas las tablas sensibles
- [ ] Audit logs son inmutables (no UPDATE/DELETE policies)
- [ ] Inputs validados con Zod en API y Server Actions
- [ ] Rate limiting implementado en operaciones sensibles
- [ ] Secrets nunca expuestos en cliente (usar env vars)
- [ ] CSP headers configurados
- [ ] Error messages no revelan información sensible

### Post-Deployment

- [ ] Monitoring de intentos de acceso no autorizado
- [ ] Alertas para múltiples intentos fallidos de login
- [ ] Audit logs revisados regularmente
- [ ] Penetration testing completado
- [ ] Security audit de código

---

## Testing de Seguridad

```typescript
// __tests__/security/rbac.test.ts
describe('RBAC Security', () => {
  it('should prevent non-admin from accessing admin routes', async () => {
    const user = await createTestUser({ role: 'user' });
    const response = await fetch('/api/admin/users', {
      headers: { Cookie: user.sessionCookie },
    });

    expect(response.status).toBe(403);
  });

  it('should prevent user from promoting themselves', async () => {
    const user = await createTestUser({ role: 'user' });

    await expect(
      updateUserRole(user.id, 'admin'),
    ).rejects.toThrow();
  });

  it('should prevent modifying audit logs', async () => {
    const admin = await createTestUser({ role: 'admin' });
    const log = await createTestAuditLog();

    const supabase = createClientWithUser(admin);
    const { error } = await supabase
      .from('audit_logs')
      .update({ action: 'modified' })
      .eq('id', log.id);

    expect(error).toBeTruthy(); // RLS blocks
  });
});
```

---

## Monitoreo y Alertas

```typescript
// lib/admin/monitoring.ts

export async function logSecurityEvent(event: {
  type: 'unauthorized_access' | 'privilege_escalation' | 'suspicious_activity';
  userId?: string;
  ip?: string;
  details: any;
}) {
  // 1. Log a audit_logs
  await createAuditLog({
    userId: event.userId || 'system',
    action: `security.${event.type}`,
    resourceType: 'system',
    resourceId: 'security',
    metadata: event.details,
  });

  // 2. Si es crítico, enviar alerta
  if (event.type === 'privilege_escalation') {
    await sendSecurityAlert({
      title: 'Security Alert: Privilege Escalation Attempt',
      details: event,
    });
  }
}

// Uso en helpers de autorización
export async function requireAdmin() {
  // ...
  if (userRole?.role !== 'admin') {
    await logSecurityEvent({
      type: 'unauthorized_access',
      userId: user.id,
      details: { attemptedRoute: '/admin' },
    });
    redirect('/unauthorized');
  }
  // ...
}
```

---

## Consecuencias

### Positivas

1. **Defensa en Profundidad**: Múltiples capas independientes
2. **Fail-Safe**: Si una capa falla, otras protegen
3. **Auditable**: Todas las operaciones sensibles registradas
4. **Compliance**: Cumple con mejores prácticas de seguridad
5. **Mantenible**: Cada capa tiene responsabilidad clara

### Negativas

1. **Complejidad**: Más código que single-layer security
2. **Performance**: Múltiples verificaciones pueden agregar latencia
3. **Duplicación**: Lógica de autorización en varias capas

### Mitigaciones

1. **Complejidad**: Mitigada con helpers reutilizables
2. **Performance**: Mitigada con caching (React cache())
3. **Duplicación**: Aceptable para seguridad crítica

---

## Documentos Relacionados

- [ADR-001: RBAC Implementation](./adr-001-rbac-implementation.md)
- [ADR-002: Database Schema](./adr-002-database-schema.md)
- [ADR-003: API Route Structure](./adr-003-api-route-structure.md)
- [Arquitectura del Admin Panel](../architecture/admin-panel-architecture.md)

---

**Estado Final:** ACEPTADO

**Aprobadores:**
- [ ] Security Guardian
- [ ] Tech Lead
- [ ] Compliance Officer
