# ADR-001: Estrategia de Implementación de RBAC

**Estado:** Aceptado
**Fecha:** 2025-11-11
**Decisores:** Architecture Team
**Contexto Técnico:** Next.js 15, Supabase Auth, PostgreSQL

---

## Contexto y Problema

Necesitamos implementar un sistema de Control de Acceso Basado en Roles (RBAC) para el panel de administración que:

1. Soporte tres roles iniciales: `admin`, `moderator`, `user`
2. Sea escalable para agregar más roles y permisos en el futuro
3. Proporcione múltiples capas de seguridad
4. Funcione tanto en el cliente como en el servidor
5. Integre con el sistema de autenticación Supabase existente

### Restricciones

- Debe usar Supabase Auth (cookie-based) existente
- No puede afectar el rendimiento del middleware (Edge runtime)
- Debe soportar Row Level Security (RLS) en PostgreSQL
- Debe ser auditable (todas las acciones deben registrarse)

---

## Opciones Consideradas

### Opción 1: RBAC Basado en Claims JWT

**Descripción**: Almacenar el rol del usuario directamente en el JWT token como custom claim.

**Pros:**
- Verificación rápida en middleware (no requiere consulta a DB)
- Menor latencia en cada request
- Rol disponible en cliente y servidor sin queries adicionales

**Contras:**
- Complejidad en actualización de roles (requiere re-login o refresh token)
- JWT no se puede invalidar inmediatamente al cambiar roles
- Tamaño del token aumenta con cada claim
- Supabase Auth tiene limitaciones en custom claims

**Evaluación:** Rechazada - La imposibilidad de actualizar roles sin re-login es inaceptable.

---

### Opción 2: RBAC Basado en Tabla + Cache

**Descripción**: Almacenar roles en tabla PostgreSQL `user_roles`, cachear en Redis/memoria.

**Pros:**
- Actualización de roles instantánea
- Fácil de auditar (todos los cambios en DB)
- Consultas rápidas con cache
- Soporte nativo para RLS

**Contras:**
- Requiere consulta a DB o cache en cada verificación
- Mayor complejidad de infraestructura (Redis)
- Cache invalidation puede ser complejo

**Evaluación:** Considerada pero rechazada por complejidad de Redis en esta fase.

---

### Opción 3: RBAC Híbrido - Tabla DB + Verificación en Múltiples Capas (SELECCIONADA)

**Descripción**:
- Almacenar roles en tabla PostgreSQL `user_roles`
- NO cachear en middleware (mantener Edge runtime simple)
- Verificar roles en Server Components y Server Actions (donde tenemos acceso completo a Supabase)
- Usar RLS como capa de seguridad final

**Pros:**
- Actualización de roles instantánea
- Middleware permanece ligero (solo valida sesión)
- Defensa en profundidad (múltiples capas)
- No requiere infraestructura adicional
- Auditable completamente
- Compatible con RLS
- Escalable a permisos granulares

**Contras:**
- Consulta adicional a DB en cada página protegida
- Latencia ligeramente mayor que Opción 1

**Evaluación:** ACEPTADA - Balance óptimo entre seguridad, mantenibilidad y rendimiento.

---

## Decisión

Implementaremos **Opción 3: RBAC Híbrido con Tabla DB y Verificación en Múltiples Capas**.

### Arquitectura de Implementación

#### 1. Schema de Base de Datos

```sql
-- Enum para roles
CREATE TYPE user_role AS ENUM ('admin', 'moderator', 'user');

-- Tabla de roles
CREATE TABLE user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'user',
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para queries frecuentes
CREATE INDEX idx_user_roles_role ON user_roles(role);

-- RLS policies
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Users pueden leer su propio rol
CREATE POLICY "Users can read own role" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Solo admins pueden modificar roles
CREATE POLICY "Only admins can modify roles" ON user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Trigger para updated_at
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### 2. Capa de Middleware (Ligera)

```typescript
// middleware.ts - Solo verifica sesión, NO verifica roles
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  if (!hasEnvVars) return supabaseResponse;

  const supabase = createServerClient(/* ... */);
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  // Solo verificar autenticación, NO roles
  if (
    !user &&
    request.nextUrl.pathname.startsWith('/admin') &&
    !request.nextUrl.pathname.startsWith('/auth')
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
```

**Justificación**: El middleware Edge tiene limitaciones y debe ser lo más rápido posible. Verificar roles requiere consultas a DB que pueden ser lentas. Movemos esta verificación a capas posteriores.

#### 3. Capa de Autorización (Server Components y Server Actions)

```typescript
// lib/admin/auth/require-admin.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function requireAdmin() {
  const supabase = await createClient();

  // 1. Obtener sesión
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) redirect('/auth/login');

  // 2. Obtener rol del usuario desde DB
  const { data: userRole, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', data.claims.sub)
    .single();

  // 3. Verificar rol
  if (error || userRole?.role !== 'admin') {
    redirect('/unauthorized');
  }

  return {
    id: data.claims.sub,
    email: data.claims.email!,
    role: userRole.role,
  };
}

export async function requireModerator() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims?.sub) redirect('/auth/login');

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
    role: userRole.role,
  };
}

export async function getCurrentUser() {
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
    role: userRole?.role || 'user',
  };
}
```

#### 4. Uso en Server Components

```typescript
// app/admin/users/page.tsx
import { requireAdmin } from '@/lib/admin/auth/require-admin';

export default async function AdminUsersPage() {
  // Verificar autorización ANTES de cualquier lógica
  const admin = await requireAdmin();

  // Si llega aquí, el usuario es admin
  const users = await getUsers();

  return <UsersTable users={users} />;
}
```

#### 5. Uso en Server Actions

```typescript
// lib/admin/actions/users.ts
'use server';

import { requireAdmin } from '@/lib/admin/auth/require-admin';
import { revalidatePath } from 'next/cache';

export async function updateUserRole(userId: string, role: string) {
  // Verificar autorización
  const admin = await requireAdmin();

  // Actualizar rol
  const supabase = await createClient();
  const { error } = await supabase
    .from('user_roles')
    .update({ role, assigned_by: admin.id })
    .eq('user_id', userId);

  if (error) throw error;

  // Crear audit log
  await createAuditLog({
    userId: admin.id,
    action: 'user.role.update',
    resourceType: 'user',
    resourceId: userId,
    changes: { role },
  });

  revalidatePath('/admin/users');
  return { success: true };
}
```

#### 6. Capa de RLS (Última Defensa)

Incluso si la verificación en código falla, RLS garantiza que solo los usuarios con rol correcto pueden acceder a los datos.

```sql
-- Ejemplo: Solo admins pueden ver todos los usuarios
CREATE POLICY "Admins can see all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Usuarios regulares solo ven su propio perfil
CREATE POLICY "Users can see own profile" ON users
  FOR SELECT USING (id = auth.uid());
```

---

## Consecuencias

### Positivas

1. **Seguridad Robusta**: Múltiples capas de verificación
2. **Actualización Inmediata**: Cambios de rol efectivos sin re-login
3. **Auditable**: Todos los cambios de roles registrados en DB
4. **Escalable**: Fácil agregar nuevos roles y permisos
5. **Mantenible**: Lógica clara y separada por capas
6. **Sin Infraestructura Adicional**: No requiere Redis u otros servicios
7. **Compatible con Supabase**: Usa patrones nativos de Supabase

### Negativas

1. **Consulta Extra**: Cada página protegida requiere una query adicional a DB
2. **Latencia**: ~20-50ms adicionales por verificación de rol
3. **No Offline**: Rol no disponible en cliente sin network request

### Mitigaciones

1. **Consulta Extra**:
   - Query es muy rápida (índice en user_id)
   - Solo se ejecuta en páginas protegidas (no en cada request)
   - Puede cachearse en el futuro con Redis si es necesario

2. **Latencia**:
   - Aceptable para panel de administración (no tiempo crítico)
   - Mucho menor que la latencia de rendering

3. **No Offline**:
   - No es un problema para admin panel (requiere conexión)

---

## Sistema de Permisos Granulares (Fase 2)

En una fase futura, podemos extender este sistema con permisos granulares:

```typescript
// lib/admin/rbac/permissions.ts
export const PERMISSIONS = {
  'users.read': ['admin', 'moderator'],
  'users.create': ['admin'],
  'users.update': ['admin'],
  'users.delete': ['admin'],
  'users.change_role': ['admin'],
  // ... más permisos
};

export async function requirePermission(permission: keyof typeof PERMISSIONS) {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login');

  const allowedRoles = PERMISSIONS[permission];
  if (!allowedRoles.includes(user.role)) {
    redirect('/unauthorized');
  }

  return user;
}
```

---

## Ejemplos de Implementación

### Server Component Protegido

```typescript
// app/admin/settings/page.tsx
import { requireAdmin } from '@/lib/admin/auth/require-admin';
import { SettingsForm } from '@/components/admin/settings-form';

export default async function SettingsPage() {
  await requireAdmin(); // Verifica y redirige si no es admin

  const settings = await getSettings();
  return <SettingsForm settings={settings} />;
}
```

### Client Component con Verificación

```typescript
'use client';

import { useEffect, useState } from 'react';
import { getCurrentUser } from '@/lib/admin/auth/require-admin';

export function AdminButton() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    getCurrentUser().then((user) => {
      setIsAdmin(user?.role === 'admin');
    });
  }, []);

  if (!isAdmin) return null;

  return <button>Admin Action</button>;
}
```

**Nota**: Para Client Components, es mejor pasar el rol desde el Server Component padre:

```typescript
// app/admin/layout.tsx (Server Component)
import { getCurrentUser } from '@/lib/admin/auth/require-admin';
import { AdminNav } from '@/components/admin/admin-nav';

export default async function AdminLayout({ children }) {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login');

  return (
    <div>
      <AdminNav userRole={user.role} />
      {children}
    </div>
  );
}

// components/admin/admin-nav.tsx (Client Component)
'use client';

export function AdminNav({ userRole }: { userRole: string }) {
  return (
    <nav>
      <NavItem href="/admin">Dashboard</NavItem>
      {userRole === 'admin' && (
        <NavItem href="/admin/settings">Settings</NavItem>
      )}
    </nav>
  );
}
```

---

## Referencia a Documentos Relacionados

- [Arquitectura del Admin Panel](../architecture/admin-panel-architecture.md)
- [ADR-002: Database Schema Design](./adr-002-database-schema.md)
- [ADR-004: Security Layers](./adr-004-security-layers.md)

---

## Métricas de Éxito

1. **Seguridad**: Cero brechas de acceso no autorizado en 6 meses
2. **Performance**: Verificación de rol < 50ms en p99
3. **Usabilidad**: Cambio de rol efectivo en < 1 segundo
4. **Auditabilidad**: 100% de acciones críticas registradas

---

## Notas de Implementación

### Orden de Implementación

1. Crear migración SQL con tabla `user_roles` y RLS policies
2. Implementar helpers de autorización (`requireAdmin`, `requireModerator`)
3. Crear seed para asignar rol 'admin' al primer usuario
4. Proteger rutas `/admin/*` con helpers
5. Implementar sistema de auditoría
6. Testing exhaustivo
7. Agregar permisos granulares (fase 2)

### Testing

```typescript
// __tests__/lib/admin/auth/require-admin.test.ts
describe('requireAdmin', () => {
  it('should allow admin users', async () => {
    const admin = await createTestUser({ role: 'admin' });
    await expect(requireAdmin()).resolves.toMatchObject({
      role: 'admin',
    });
  });

  it('should redirect non-admin users', async () => {
    const user = await createTestUser({ role: 'user' });
    await expect(requireAdmin()).rejects.toThrow(); // redirect throws
  });

  it('should redirect unauthenticated users', async () => {
    // Sin sesión
    await expect(requireAdmin()).rejects.toThrow();
  });
});
```

---

**Estado Final:** ACEPTADO

**Aprobadores:**
- [ ] Tech Lead
- [ ] Security Guardian
- [ ] Backend Architect
