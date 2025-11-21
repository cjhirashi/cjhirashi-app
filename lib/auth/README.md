# Sistema de Autenticación y Autorización

Este módulo proporciona un sistema completo de roles y permisos para el panel de administración.

## Roles

El sistema maneja tres roles:

- **admin**: Acceso completo a todas las funcionalidades
- **moderator**: Puede gestionar usuarios y contenido, pero no configuraciones del sistema
- **user**: Usuario regular con acceso limitado

## Permisos

Los permisos se definen en `types.ts` usando el enum `Permission`. Cada rol tiene un conjunto específico de permisos definido en `ROLE_PERMISSIONS`.

### Lista de Permisos

**Gestión de Usuarios:**
- `VIEW_USERS` - Ver lista de usuarios
- `CREATE_USERS` - Crear nuevos usuarios
- `EDIT_USERS` - Editar usuarios existentes
- `DELETE_USERS` - Eliminar usuarios
- `MANAGE_USER_ROLES` - Cambiar roles de usuarios

**Gestión de Roles:**
- `VIEW_ROLES` - Ver roles del sistema
- `EDIT_ROLES` - Modificar permisos de roles

**Logs de Auditoría:**
- `VIEW_AUDIT_LOGS` - Ver logs de actividad

**Configuraciones:**
- `VIEW_SETTINGS` - Ver configuraciones del sistema
- `EDIT_SETTINGS` - Modificar configuraciones

**Dashboard y Analytics:**
- `VIEW_DASHBOARD` - Acceso al dashboard
- `VIEW_ANALYTICS` - Ver estadísticas y analytics

**Gestión de Contenido:**
- `VIEW_CONTENT` - Ver contenido
- `CREATE_CONTENT` - Crear nuevo contenido
- `EDIT_CONTENT` - Editar contenido
- `DELETE_CONTENT` - Eliminar contenido

## Uso en el Servidor (Server Components y API Routes)

### Obtener el usuario actual

```typescript
import { getCurrentUser } from '@/lib/auth'

export default async function MyPage() {
  const user = await getCurrentUser()

  if (!user) {
    return <div>No autenticado</div>
  }

  return <div>Hola {user.email}</div>
}
```

### Verificar permisos

```typescript
import { hasPermission, Permission } from '@/lib/auth'

export default async function UsersPage() {
  const canViewUsers = await hasPermission(Permission.VIEW_USERS)

  if (!canViewUsers) {
    return <div>No tienes permisos</div>
  }

  // ... mostrar lista de usuarios
}
```

### Requerir permisos (con error)

```typescript
import { requirePermission, Permission, AuthorizationError } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    await requirePermission(Permission.CREATE_USERS)

    // ... crear usuario
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      )
    }
    throw error
  }
}
```

### Requerir rol admin

```typescript
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  await requireAdmin() // Lanza error si no es admin

  // Solo admins llegan aquí
  const settings = await getSystemSettings()
  return NextResponse.json(settings)
}
```

## Uso en el Cliente (Client Components)

### Hook useUser

```typescript
'use client'

import { useUser } from '@/lib/auth'

export function UserProfile() {
  const { user, loading, error } = useUser()

  if (loading) return <div>Cargando...</div>
  if (error) return <div>Error: {error.message}</div>
  if (!user) return <div>No autenticado</div>

  return (
    <div>
      <p>Email: {user.email}</p>
      <p>Rol: {user.role}</p>
      <p>Estado: {user.status}</p>
    </div>
  )
}
```

### Hook usePermission

```typescript
'use client'

import { usePermission, Permission } from '@/lib/auth'

export function CreateUserButton() {
  const canCreate = usePermission(Permission.CREATE_USERS)

  if (!canCreate) return null

  return <button>Crear Usuario</button>
}
```

### Hooks de rol

```typescript
'use client'

import { useIsAdmin, useIsModerator } from '@/lib/auth'

export function AdminPanel() {
  const isAdmin = useIsAdmin()
  const isModerator = useIsModerator()

  return (
    <div>
      {isAdmin && <AdminSettings />}
      {isModerator && <UserManagement />}
    </div>
  )
}
```

## Componentes de Autorización

### PermissionGuard

Renderiza contenido solo si el usuario tiene el permiso requerido:

```typescript
import { PermissionGuard, Permission } from '@/lib/auth'

export function UsersList() {
  return (
    <PermissionGuard
      permission={Permission.VIEW_USERS}
      fallback={<div>No tienes permiso para ver usuarios</div>}
    >
      <UsersTable />
    </PermissionGuard>
  )
}
```

### AdminOnly

Renderiza solo para administradores:

```typescript
import { AdminOnly } from '@/lib/auth'

export function SettingsPage() {
  return (
    <AdminOnly fallback={<div>Solo admins</div>}>
      <SystemSettings />
    </AdminOnly>
  )
}
```

### ModeratorOnly

Renderiza para moderadores y admins:

```typescript
import { ModeratorOnly } from '@/lib/auth'

export function ModerationPanel() {
  return (
    <ModeratorOnly>
      <UserModeration />
    </ModeratorOnly>
  )
}
```

### RoleGuard

Renderiza para roles específicos:

```typescript
import { RoleGuard } from '@/lib/auth'

export function SpecialFeature() {
  return (
    <RoleGuard role={['admin', 'moderator']}>
      <AdvancedFeatures />
    </RoleGuard>
  )
}
```

## Middleware

El middleware protege automáticamente todas las rutas bajo `/admin`:

- Verifica que el usuario esté autenticado
- Verifica que el usuario tenga rol `admin` o `moderator`
- Redirige a `/unauthorized` si no tiene permisos
- Redirige a `/auth/login` si no está autenticado

No necesitas hacer nada adicional, todas las rutas `/admin/*` están protegidas automáticamente.

## Ejemplos Completos

### API Route con verificación de permisos

```typescript
// app/api/users/route.ts
import { NextResponse } from 'next/server'
import { requirePermission, Permission, getCurrentUser, AuthorizationError } from '@/lib/auth'
import { createAuditLog } from '@/lib/db/helpers'

export async function POST(request: Request) {
  try {
    // Verificar permiso
    await requirePermission(Permission.CREATE_USERS)

    // Obtener usuario actual para audit log
    const currentUser = await getCurrentUser()

    const body = await request.json()

    // Crear usuario (tu lógica aquí)
    const newUser = await createUser(body)

    // Registrar en audit log
    await createAuditLog({
      user_id: currentUser!.id,
      action: 'user.created',
      category: 'user_management',
      entity_type: 'user',
      entity_id: newUser.id,
      description: `Created user ${body.email}`,
    })

    return NextResponse.json(newUser)
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Página protegida del lado del servidor

```typescript
// app/admin/users/page.tsx
import { requirePermission, Permission, getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function UsersPage() {
  // Verificar permiso
  try {
    await requirePermission(Permission.VIEW_USERS)
  } catch {
    redirect('/unauthorized')
  }

  const user = await getCurrentUser()
  const users = await getUsers()

  return (
    <div>
      <h1>Gestión de Usuarios</h1>
      <p>Hola, {user?.email}</p>
      <UsersList users={users} />
    </div>
  )
}
```

### Componente cliente con múltiples verificaciones

```typescript
'use client'

import { useUser, usePermission, useIsAdmin, Permission } from '@/lib/auth'

export function UserActionsMenu({ userId }: { userId: string }) {
  const { user } = useUser()
  const canEdit = usePermission(Permission.EDIT_USERS)
  const canDelete = usePermission(Permission.DELETE_USERS)
  const isAdmin = useIsAdmin()

  if (!user) return null

  return (
    <div>
      <button>Ver Perfil</button>

      {canEdit && (
        <button>Editar</button>
      )}

      {canDelete && userId !== user.id && (
        <button>Eliminar</button>
      )}

      {isAdmin && (
        <button>Configuración Avanzada</button>
      )}
    </div>
  )
}
```

## Seguridad

### Defensa en Profundidad

El sistema implementa múltiples capas de seguridad:

1. **Row Level Security (RLS)** en la base de datos
2. **Middleware** protege rutas del admin
3. **Verificaciones del servidor** en API routes y Server Components
4. **Verificaciones del cliente** para UX (no confiar solo en esto)

### Mejores Prácticas

1. **Siempre verificar en el servidor**: Las verificaciones del cliente son solo para UX
2. **Usar `requirePermission`** en API routes críticas
3. **Registrar acciones** en audit_logs para trazabilidad
4. **No confiar en el rol del cliente**: Siempre obtenerlo del servidor/database

### Ejemplo de Seguridad Incorrecta ❌

```typescript
// ❌ NUNCA hacer esto
'use client'
export function DeleteButton({ userId }: { userId: string }) {
  const isAdmin = useIsAdmin()

  async function handleDelete() {
    if (isAdmin) {  // ❌ Solo verificación cliente
      await fetch(`/api/users/${userId}`, { method: 'DELETE' })
    }
  }

  return isAdmin ? <button onClick={handleDelete}>Delete</button> : null
}
```

### Ejemplo de Seguridad Correcta ✅

```typescript
// ✅ Verificación en servidor
// app/api/users/[id]/route.ts
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requirePermission(Permission.DELETE_USERS)  // ✅ Verificación servidor

    // ... eliminar usuario
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    throw error
  }
}

// Cliente
'use client'
export function DeleteButton({ userId }: { userId: string }) {
  const canDelete = usePermission(Permission.DELETE_USERS)

  async function handleDelete() {
    // El servidor verificará permisos de nuevo
    await fetch(`/api/users/${userId}`, { method: 'DELETE' })
  }

  return canDelete ? <button onClick={handleDelete}>Delete</button> : null
}
```

## Testing

Para testing, puedes mockear las funciones de autorización:

```typescript
import { vi } from 'vitest'
import * as auth from '@/lib/auth'

vi.spyOn(auth, 'getCurrentUser').mockResolvedValue({
  id: 'test-user-id',
  email: 'test@example.com',
  role: 'admin',
  status: 'active',
  created_at: new Date(),
})
```
