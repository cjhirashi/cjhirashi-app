# Database Workflow: SQL + Prisma Híbrido

**Última actualización**: 2025-11-11
**Estado**: Implementación propuesta
**Relacionado**: ADR-005 (ORM vs SQL)

---

## Resumen

Este documento describe el workflow completo para trabajar con la base de datos utilizando un **enfoque híbrido**:
- **SQL puro** para migraciones (schema, RLS, triggers, funciones)
- **Prisma Client** para queries type-safe desde la aplicación

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                   DEVELOPER WORKFLOW                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  1. Crear SQL Migration                                     │
│     supabase/migrations/YYYYMMDD_description.sql            │
│     - Tables, indexes, constraints                          │
│     - RLS policies                                          │
│     - Triggers & functions                                  │
│     - Views & materialized views                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Aplicar Migración                                       │
│     $ npm run db:push                                       │
│     (supabase db push)                                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Introspección Prisma                                    │
│     $ npm run db:pull                                       │
│     (prisma db pull)                                        │
│     - Detecta tablas, columnas, tipos                       │
│     - Genera schema.prisma automáticamente                  │
│     - IGNORA: RLS, triggers, functions, views               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Generar Prisma Client                                   │
│     $ npm run db:generate                                   │
│     (prisma generate)                                       │
│     - Genera tipos TypeScript                               │
│     - Crea cliente type-safe                                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  5. Usar en Aplicación                                      │
│     import { prisma } from '@/lib/db/prisma'                │
│     - Queries con autocomplete                              │
│     - TypeScript valida tipos en compile-time               │
└─────────────────────────────────────────────────────────────┘
```

---

## Scripts NPM

Agregar al `package.json`:

```json
{
  "scripts": {
    "db:push": "supabase db push",
    "db:pull": "npx prisma db pull",
    "db:generate": "npx prisma generate",
    "db:sync": "npm run db:push && npm run db:pull && npm run db:generate",
    "db:studio": "npx prisma studio",
    "db:reset": "supabase db reset && npm run db:pull && npm run db:generate"
  }
}
```

---

## Workflow Detallado

### 1. Crear Nueva Migración SQL

**Cuándo**: Necesitas crear/modificar tablas, agregar RLS, triggers, etc.

```bash
# Crear archivo de migración
touch supabase/migrations/$(date +%Y%m%d%H%M%S)_add_notifications_table.sql
```

**Contenido de ejemplo**:
```sql
-- Crear tabla
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Índices
  CONSTRAINT notifications_pkey PRIMARY KEY (id)
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);

-- RLS Policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "admins_read_all_notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Trigger para updated_at
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentarios
COMMENT ON TABLE public.notifications IS 'User notifications system';
```

### 2. Validar Migración Localmente

```bash
# Verificar sintaxis SQL (opcional)
psql $DATABASE_URL -f supabase/migrations/20250111120000_add_notifications_table.sql --dry-run

# O aplicar directamente
npm run db:push
```

**Verificar en Supabase Studio**:
1. Ir a Table Editor
2. Verificar que la tabla existe
3. Verificar RLS policies en Authentication > Policies

### 3. Introspección con Prisma

```bash
# Generar schema.prisma desde DB
npm run db:pull
```

**Resultado**:
```prisma
// prisma/schema.prisma (AUTO-GENERADO)

model Notification {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  title     String   @db.VarChar(255)
  message   String
  read      Boolean  @default(false)
  createdAt DateTime @default(now()) @map("created_at")

  @@index([userId], map: "idx_notifications_user_id")
  @@index([read], map: "idx_notifications_read")
  @@map("notifications")
}
```

**Notas**:
- Prisma NO detecta RLS policies (es esperado)
- Prisma NO detecta triggers (es esperado)
- Prisma NO detecta comentarios SQL (agregarlos manualmente con `///`)

### 4. Ajustar Schema Prisma (Opcional)

```prisma
// Agregar comentarios de documentación
/// Notificaciones del sistema para usuarios
model Notification {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  /// ID del usuario propietario
  userId    String   @map("user_id") @db.Uuid
  /// Título de la notificación
  title     String   @db.VarChar(255)
  message   String
  /// Si la notificación ha sido leída
  read      Boolean  @default(false)
  createdAt DateTime @default(now()) @map("created_at")

  @@index([userId], map: "idx_notifications_user_id")
  @@index([read], map: "idx_notifications_read")
  @@map("notifications")
}
```

### 5. Generar Prisma Client

```bash
npm run db:generate
```

**Salida esperada**:
```
✔ Generated Prisma Client (5.22.0) to ./node_modules/@prisma/client
```

### 6. Usar en Aplicación

```typescript
// app/admin/notifications/page.tsx
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/admin/auth/require-admin';

export default async function NotificationsPage() {
  const admin = await requireAdmin();

  // Query type-safe con autocomplete
  const notifications = await prisma.notification.findMany({
    where: {
      read: false
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 50
  });

  // TypeScript sabe que notifications es Notification[]
  return (
    <div>
      <h1>Notificaciones</h1>
      {notifications.map(notif => (
        <div key={notif.id}>
          <h3>{notif.title}</h3>
          <p>{notif.message}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## Casos de Uso Comunes

### A. Crear Nueva Tabla

```sql
-- supabase/migrations/20250111_create_table.sql
CREATE TABLE public.my_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.my_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read" ON public.my_table FOR SELECT USING (true);
```

```bash
npm run db:sync  # push + pull + generate
```

### B. Agregar Columna a Tabla Existente

```sql
-- supabase/migrations/20250111_add_column.sql
ALTER TABLE public.user_profiles
ADD COLUMN company VARCHAR(255);

CREATE INDEX idx_user_profiles_company
ON public.user_profiles(company)
WHERE company IS NOT NULL;
```

```bash
npm run db:sync
```

### C. Modificar RLS Policy

```sql
-- supabase/migrations/20250111_update_rls.sql
DROP POLICY IF EXISTS "users_read_own_profile" ON public.user_profiles;

CREATE POLICY "users_read_own_profile"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  );
```

```bash
npm run db:sync
# Prisma NO detecta cambios en RLS (es normal)
# Solo verifica que queries funcionen correctamente
```

### D. Crear Vista Materializada

```sql
-- supabase/migrations/20250111_create_view.sql
CREATE MATERIALIZED VIEW public.user_stats AS
SELECT
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE status = 'active') as active_users
FROM public.user_profiles;

CREATE UNIQUE INDEX ON public.user_stats ((1));

CREATE OR REPLACE FUNCTION refresh_user_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Usar desde aplicación**:
```typescript
// lib/db/analytics.ts
import { prisma } from './prisma';

export async function getUserStats() {
  const result = await prisma.$queryRaw<Array<{
    total_users: bigint;
    active_users: bigint;
  }>>`SELECT * FROM user_stats LIMIT 1`;

  return result[0];
}

export async function refreshUserStats() {
  await prisma.$executeRaw`SELECT refresh_user_stats()`;
}
```

### E. Crear Función PL/pgSQL

```sql
-- supabase/migrations/20250111_create_function.sql
CREATE OR REPLACE FUNCTION get_user_role(p_user_id UUID)
RETURNS user_role AS $$
DECLARE
  v_role user_role;
BEGIN
  SELECT role INTO v_role
  FROM public.user_roles
  WHERE user_id = p_user_id;

  RETURN COALESCE(v_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Usar desde aplicación**:
```typescript
// lib/db/roles.ts
import { prisma } from './prisma';

export async function getUserRole(userId: string) {
  const result = await prisma.$queryRaw<Array<{ get_user_role: string }>>`
    SELECT get_user_role(${userId}::uuid)
  `;

  return result[0].get_user_role as 'admin' | 'moderator' | 'user';
}
```

---

## Trabajar con Vistas

Prisma NO detecta vistas, pero podemos queryarlas con `$queryRaw`:

### Crear Type-Safe Wrapper

```typescript
// lib/db/views/user-activity.ts
import { prisma } from '../prisma';
import type { UserRole, UserStatus } from '@prisma/client';

export interface UserActivitySummary {
  id: string;
  full_name: string | null;
  email: string;
  role: UserRole;
  status: UserStatus;
  last_login_at: Date | null;
  user_since: Date;
  total_actions: bigint;
  actions_today: bigint;
  actions_week: bigint;
  actions_month: bigint;
}

export async function getUserActivitySummary(limit = 100) {
  return await prisma.$queryRaw<UserActivitySummary[]>`
    SELECT * FROM user_activity_summary
    ORDER BY last_login_at DESC NULLS LAST
    LIMIT ${limit}
  `;
}

export async function getUserActivityById(userId: string) {
  const result = await prisma.$queryRaw<UserActivitySummary[]>`
    SELECT * FROM user_activity_summary
    WHERE id = ${userId}::uuid
  `;

  return result[0] ?? null;
}
```

**Uso**:
```typescript
// app/admin/analytics/page.tsx
import { getUserActivitySummary } from '@/lib/db/views/user-activity';

export default async function AnalyticsPage() {
  const users = await getUserActivitySummary(50);

  return (
    <table>
      <thead>
        <tr>
          <th>Usuario</th>
          <th>Email</th>
          <th>Role</th>
          <th>Acciones (mes)</th>
        </tr>
      </thead>
      <tbody>
        {users.map(user => (
          <tr key={user.id}>
            <td>{user.full_name}</td>
            <td>{user.email}</td>
            <td>{user.role}</td>
            <td>{Number(user.actions_month)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

## Testing

### Unit Tests para Queries

```typescript
// __tests__/db/notifications.test.ts
import { prisma } from '@/lib/db/prisma';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Notifications Queries', () => {
  let testUserId: string;

  beforeAll(async () => {
    // Crear usuario de prueba
    const user = await prisma.$queryRaw<Array<{ id: string }>>`
      INSERT INTO auth.users (email)
      VALUES ('test@example.com')
      RETURNING id
    `;
    testUserId = user[0].id;
  });

  afterAll(async () => {
    // Limpiar
    await prisma.$executeRaw`
      DELETE FROM auth.users WHERE email = 'test@example.com'
    `;
    await prisma.$disconnect();
  });

  it('should create notification with correct types', async () => {
    const notification = await prisma.notification.create({
      data: {
        userId: testUserId,
        title: 'Test Notification',
        message: 'This is a test',
        read: false
      }
    });

    expect(notification.id).toBeDefined();
    expect(notification.title).toBe('Test Notification');
    expect(notification.read).toBe(false);
  });

  it('should query unread notifications', async () => {
    const unread = await prisma.notification.findMany({
      where: {
        userId: testUserId,
        read: false
      }
    });

    expect(Array.isArray(unread)).toBe(true);
    unread.forEach(notif => {
      expect(notif.read).toBe(false);
    });
  });
});
```

### Testing de RLS

```typescript
// __tests__/db/rls.test.ts
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';

describe('RLS Policies', () => {
  it('should prevent user from reading other user notifications', async () => {
    const supabase = await createClient();

    // Intentar leer notificaciones de otro usuario
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', 'other-user-id');

    // RLS debe bloquear esto
    expect(data).toEqual([]);
    expect(error).toBeNull(); // RLS devuelve [] vacío, no error
  });

  it('should allow admin to read all notifications', async () => {
    // Crear sesión como admin
    const supabase = await createClient();

    const { data } = await supabase
      .from('notifications')
      .select('*');

    // Admin puede ver todas
    expect(Array.isArray(data)).toBe(true);
  });
});
```

---

## Troubleshooting

### Problema: Prisma no detecta cambios

**Síntoma**:
```bash
npm run db:pull
# Prisma: No changes detected
```

**Soluciones**:
1. Verificar que migración se aplicó: `npm run db:push`
2. Verificar conexión: `echo $DATABASE_URL`
3. Forzar introspección: `npx prisma db pull --force`
4. Limpiar cache: `rm -rf node_modules/.prisma && npm run db:generate`

### Problema: Types no se actualizan en IDE

**Síntoma**: TypeScript no reconoce nuevos campos/tablas

**Soluciones**:
1. Regenerar client: `npm run db:generate`
2. Reiniciar TypeScript server: `Cmd+Shift+P` → "Restart TS Server"
3. Reiniciar IDE completamente

### Problema: RLS bloquea queries de Prisma

**Síntoma**:
```typescript
const users = await prisma.userProfile.findMany();
// Devuelve [] vacío, pero sabemos que hay datos
```

**Causa**: Prisma no puede autenticarse como usuario de Supabase.

**Soluciones**:

**Opción 1**: Usar service role key (solo en server-side)
```typescript
// lib/db/prisma.ts
import { PrismaClient } from '@prisma/client';

// Usar service_role connection string (bypasses RLS)
const databaseUrl = process.env.DATABASE_URL_UNPOOLED
  || process.env.DATABASE_URL;

export const prisma = new PrismaClient({
  datasources: {
    db: { url: databaseUrl }
  }
});
```

**Opción 2**: Usar Supabase Client para queries con RLS
```typescript
// Para queries que necesitan RLS, usar Supabase Client
import { createClient } from '@/lib/supabase/server';

const supabase = await createClient();
const { data } = await supabase.from('user_profiles').select('*');

// Para queries administrativas sin RLS, usar Prisma
import { prisma } from '@/lib/db/prisma';
const profiles = await prisma.userProfile.findMany(); // Bypasses RLS
```

### Problema: Migrations fallan en producción

**Síntoma**: Migración funciona local pero falla en Supabase Cloud

**Soluciones**:
1. Verificar extensiones: `CREATE EXTENSION IF NOT EXISTS "pg_trgm"`
2. Verificar permisos: Usar `public` schema explícitamente
3. Usar transacciones: Envolver en `BEGIN; ... COMMIT;`
4. Testing: Probar en staging antes de producción

---

## Best Practices

### 1. Naming Conventions

**SQL**:
```sql
-- Tablas: snake_case plural
CREATE TABLE user_profiles (...)

-- Columnas: snake_case
created_at TIMESTAMPTZ

-- Políticas RLS: descripción clara
CREATE POLICY "users_read_own_profile" ...

-- Funciones: snake_case verb_noun
CREATE FUNCTION refresh_dashboard_stats() ...
```

**Prisma** (auto-generado):
```prisma
// Modelos: PascalCase singular
model UserProfile {
  // Campos: camelCase
  createdAt DateTime
}
```

### 2. Migración Naming

```bash
supabase/migrations/
  20250101000001_create_core_tables.sql          # create_*
  20250101000002_add_notifications_table.sql     # add_*
  20250111120000_alter_user_profiles.sql         # alter_*
  20250111130000_drop_deprecated_columns.sql     # drop_*
  20250111140000_update_rls_policies.sql         # update_*
```

### 3. Comentarios SQL

```sql
-- Siempre agregar comentarios a tablas
COMMENT ON TABLE public.notifications IS 'User notification system';

-- Documentar columnas complejas
COMMENT ON COLUMN public.notifications.metadata IS 'JSON metadata for notification customization';

-- Explicar lógica de RLS
COMMENT ON POLICY "users_read_own_notifications" ON public.notifications IS
  'Users can only read their own notifications unless they are admin';
```

### 4. Prisma Schema Organization

```prisma
// prisma/schema.prisma

// Agrupar por dominio con comentarios

// ============================================================================
// AUTHENTICATION & AUTHORIZATION
// ============================================================================

/// Roles de usuarios para RBAC
model UserRole {
  // ...
}

/// Perfiles extendidos de usuarios
model UserProfile {
  // ...
}

// ============================================================================
// AUDIT & LOGGING
// ============================================================================

/// Registro inmutable de acciones administrativas
model AuditLog {
  // ...
}

// ============================================================================
// SYSTEM CONFIGURATION
// ============================================================================

/// Configuración del sistema (key-value store)
model SystemSetting {
  // ...
}
```

### 5. Type-Safe Helpers

```typescript
// lib/db/helpers/index.ts

// Helper para queries parametrizadas seguras
export function buildWhereClause<T>(
  filters: Partial<T>
): Prisma.Sql {
  const conditions = Object.entries(filters)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => Prisma.sql`${Prisma.raw(key)} = ${value}`);

  return Prisma.join(conditions, ' AND ');
}

// Helper para paginación
export interface PaginationParams {
  page: number;
  pageSize: number;
}

export function paginate<T>(
  query: T[],
  { page, pageSize }: PaginationParams
) {
  return {
    data: query.slice((page - 1) * pageSize, page * pageSize),
    meta: {
      total: query.length,
      page,
      pageSize,
      totalPages: Math.ceil(query.length / pageSize)
    }
  };
}
```

---

## Monitoreo y Performance

### 1. Logging de Queries

```typescript
// lib/db/prisma.ts
export const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
  ],
});

// Log queries lentas (> 100ms)
prisma.$on('query', (e) => {
  if (e.duration > 100) {
    console.warn('Slow query detected:', {
      query: e.query,
      duration: `${e.duration}ms`,
      params: e.params
    });
  }
});
```

### 2. Prisma Studio para Debugging

```bash
npm run db:studio
```

Abre interfaz gráfica en `http://localhost:5555` para:
- Explorar datos
- Ejecutar queries
- Ver relaciones
- Debugging visual

### 3. Query Optimization

```typescript
// Mal: N+1 queries
const users = await prisma.userProfile.findMany();
for (const user of users) {
  const role = await prisma.userRole.findUnique({
    where: { userId: user.userId }
  });
}

// Bien: Include relation
const users = await prisma.userProfile.findMany({
  include: {
    role: true
  }
});

// Mejor: Select solo campos necesarios
const users = await prisma.userProfile.findMany({
  select: {
    userId: true,
    fullName: true,
    role: {
      select: {
        role: true
      }
    }
  }
});
```

---

## Checklist: Migración SQL

Antes de hacer commit de una migración:

- [ ] Archivo nombrado correctamente: `YYYYMMDDHHMMSS_description.sql`
- [ ] Wrapped en transacción: `BEGIN; ... COMMIT;`
- [ ] Tablas usan `CREATE TABLE IF NOT EXISTS`
- [ ] Índices usan `CREATE INDEX IF NOT EXISTS`
- [ ] RLS está habilitado: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
- [ ] Políticas RLS están creadas
- [ ] Triggers están asociados
- [ ] Comentarios agregados a tablas/columnas
- [ ] Tested localmente: `npm run db:push`
- [ ] Prisma schema actualizado: `npm run db:pull && npm run db:generate`
- [ ] Types verificados en IDE (no errores TypeScript)
- [ ] Documentación actualizada si necesario

---

## Recursos Adicionales

- [Prisma Docs: Database Workflows](https://www.prisma.io/docs/guides/database/developing-with-prisma-migrate)
- [Supabase Docs: Migrations](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [PostgreSQL Docs: RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [ADR-005: ORM vs SQL Decision](../decisions/adr-005-orm-vs-raw-sql.md)

---

**Última revisión**: 2025-11-11
**Próxima revisión**: Después de implementación (2025-11-14)
