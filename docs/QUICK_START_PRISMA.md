# Quick Start: Implementar Enfoque Híbrido SQL + Prisma

**Tiempo estimado**: 3-4 horas
**Requisitos previos**: Node.js 18+, npm, Supabase CLI

---

## TL;DR (Too Long; Didn't Read)

```bash
# 1. Aplicar migraciones SQL existentes
npm run db:push

# 2. Instalar Prisma
npm install -D prisma@latest
npm install @prisma/client@latest

# 3. Generar schema y client
npx prisma init --datasource-provider postgresql
npx prisma db pull
npx prisma generate

# 4. Crear wrapper
# (ver código en Fase 2)

# 5. ¡Listo! Usa Prisma en tu app
```

---

## Fase 1: Aplicar Migraciones SQL (5 minutos)

### 1.1. Verificar conexión a DB

```bash
# Verificar que .env.local tiene las variables
cat .env.local | grep DATABASE_URL
```

Si no existe, agregar:
```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
```

**Obtener URL**:
1. Ir a Supabase Dashboard
2. Settings → Database
3. Copiar "Connection string" (URI)
4. Reemplazar `[YOUR-PASSWORD]` con tu contraseña

### 1.2. Aplicar migraciones

```bash
# Aplicar las 3 migraciones SQL existentes (698 líneas)
npm run db:push
```

**Salida esperada**:
```
Applying migration 20250101000001_create_core_tables... ✓
Applying migration 20250101000002_create_analytics_views... ✓
Applying migration 20250101000003_seed_initial_data... ✓

Migrations applied successfully!
```

### 1.3. Verificar en Supabase Studio

1. Ir a: https://supabase.com/dashboard/project/[tu-proyecto]/editor
2. Verificar que existen tablas:
   - `user_roles`
   - `user_profiles`
   - `audit_logs`
   - `system_settings`

✅ **Checkpoint**: Tablas creadas correctamente

---

## Fase 2: Instalar y Configurar Prisma (10 minutos)

### 2.1. Instalar dependencias

```bash
# Prisma CLI (dev dependency)
npm install -D prisma@latest

# Prisma Client (runtime dependency)
npm install @prisma/client@latest
```

**Verificar instalación**:
```bash
npx prisma --version
# Debe mostrar: prisma 5.x.x
```

### 2.2. Inicializar Prisma

```bash
npx prisma init --datasource-provider postgresql
```

**Salida esperada**:
```
✔ Your Prisma schema was created at prisma/schema.prisma
  You can now open it in your favorite editor.
```

**Archivos creados**:
- `prisma/schema.prisma` (schema inicial vacío)
- `.env` (con DATABASE_URL template)

### 2.3. Configurar `.env`

**IMPORTANTE**: Prisma usa `.env` en raíz, pero Next.js usa `.env.local`.

**Opción A**: Copiar DATABASE_URL a `.env`
```bash
# Copiar de .env.local a .env
echo "DATABASE_URL=$(grep DATABASE_URL .env.local | cut -d '=' -f2-)" > .env
```

**Opción B**: Configurar en `schema.prisma` para usar `.env.local`
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Y agregar a `package.json`:
```json
{
  "scripts": {
    "db:pull": "dotenv -e .env.local -- npx prisma db pull",
    "db:generate": "npx prisma generate"
  }
}
```

(Requiere: `npm install -D dotenv-cli`)

**Para esta guía, usaremos Opción A (más simple).**

### 2.4. Generar schema desde DB

```bash
npx prisma db pull
```

**Salida esperada**:
```
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "postgres"

Introspecting based on datasource defined in prisma/schema.prisma …

✔ Introspected 4 models and wrote them into prisma/schema.prisma in 234ms

Run prisma generate to generate Prisma Client.
```

**Revisar `prisma/schema.prisma`**:
```prisma
// Este archivo está auto-generado desde la DB
// Deberías ver 4 modelos:
// - UserRole
// - UserProfile
// - AuditLog
// - SystemSetting
```

### 2.5. Generar Prisma Client

```bash
npx prisma generate
```

**Salida esperada**:
```
✔ Generated Prisma Client (5.22.0) to ./node_modules/@prisma/client in 123ms
```

✅ **Checkpoint**: Prisma Client generado con tipos

---

## Fase 3: Integrar con Next.js (15 minutos)

### 3.1. Crear cliente Prisma singleton

Crear archivo: `lib/db/prisma.ts`

```typescript
import { PrismaClient } from '@prisma/client';

// Prevenir múltiples instancias en desarrollo (hot reload)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

**Por qué este patrón**:
- Evita crear múltiples conexiones en dev (Next.js hot reload)
- Similar al patrón de Supabase client
- Log queries solo en desarrollo

### 3.2. Crear helpers para vistas materializadas

Crear archivo: `lib/db/analytics.ts`

```typescript
import { prisma } from './prisma';

/**
 * Obtiene estadísticas del dashboard desde vista materializada
 */
export async function getDashboardStats() {
  const result = await prisma.$queryRaw<Array<{
    total_users: bigint;
    active_users: bigint;
    inactive_users: bigint;
    suspended_users: bigint;
    pending_users: bigint;
    new_users_today: bigint;
    new_users_week: bigint;
    new_users_month: bigint;
    total_admins: bigint;
    total_moderators: bigint;
    total_regular_users: bigint;
    actions_today: bigint;
    actions_week: bigint;
    refreshed_at: Date;
  }>>`
    SELECT * FROM admin_dashboard_stats LIMIT 1
  `;

  return result[0];
}

/**
 * Refresca la vista materializada de estadísticas
 */
export async function refreshDashboardStats() {
  await prisma.$executeRaw`SELECT refresh_dashboard_stats()`;
}

/**
 * Convierte bigint a número (para JSON serialization)
 */
export function bigIntToNumber<T extends Record<string, unknown>>(
  obj: T
): { [K in keyof T]: T[K] extends bigint ? number : T[K] } {
  const result = {} as any;
  for (const [key, value] of Object.entries(obj)) {
    result[key] = typeof value === 'bigint' ? Number(value) : value;
  }
  return result;
}
```

### 3.3. Ejemplo de uso en Server Component

Crear archivo: `app/admin/dashboard/page.tsx`

```typescript
import { requireAdmin } from '@/lib/admin/auth/require-admin';
import { prisma } from '@/lib/db/prisma';
import { getDashboardStats, bigIntToNumber } from '@/lib/db/analytics';

export default async function DashboardPage() {
  const admin = await requireAdmin();

  // Obtener stats del dashboard
  const rawStats = await getDashboardStats();
  const stats = bigIntToNumber(rawStats);

  // Obtener usuarios recientes con Prisma (type-safe!)
  const recentUsers = await prisma.userProfile.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: {
      userId: true,
      fullName: true,
      status: true,
      createdAt: true
    }
  });

  // Obtener roles con type-safety
  const userRoles = await prisma.userRole.findMany({
    where: {
      role: 'admin' // ✅ TypeScript valida que 'admin' es válido
    },
    select: {
      userId: true,
      role: true,
      assignedAt: true
    }
  });

  return (
    <div>
      <h1>Dashboard</h1>

      <div className="stats">
        <div>Total usuarios: {stats.total_users}</div>
        <div>Usuarios activos: {stats.active_users}</div>
        <div>Nuevos hoy: {stats.new_users_today}</div>
      </div>

      <div className="recent-users">
        <h2>Usuarios recientes</h2>
        <ul>
          {recentUsers.map(user => (
            <li key={user.userId}>
              {user.fullName} - {user.status}
            </li>
          ))}
        </ul>
      </div>

      <div className="admin-roles">
        <h2>Administradores</h2>
        <ul>
          {userRoles.map(role => (
            <li key={role.userId}>
              {role.userId} - {role.role}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

**Verificar autocomplete**:
1. Abrir `page.tsx` en VS Code
2. Escribir `prisma.` → debería mostrar todos los modelos
3. Escribir `prisma.userProfile.` → debería mostrar métodos (findMany, create, etc.)
4. Escribir `.where({ })` → debería autocompletar campos

✅ **Checkpoint**: Autocomplete funciona correctamente

### 3.4. Agregar scripts a `package.json`

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",

    "db:push": "supabase db push",
    "db:pull": "npx prisma db pull",
    "db:generate": "npx prisma generate",
    "db:sync": "npm run db:push && npm run db:pull && npm run db:generate",
    "db:studio": "npx prisma studio",
    "db:reset": "supabase db reset && npm run db:pull && npm run db:generate"
  }
}
```

**Uso**:
- `npm run db:push` - Aplicar migraciones SQL a la DB
- `npm run db:pull` - Generar schema Prisma desde DB
- `npm run db:generate` - Generar Prisma Client (tipos)
- `npm run db:sync` - Todo en uno (push → pull → generate)
- `npm run db:studio` - Abrir GUI para explorar datos
- `npm run db:reset` - Resetear DB y regenerar schema

✅ **Checkpoint**: Scripts configurados

---

## Fase 4: Testing (30 minutos)

### 4.1. Test básico de queries

Crear archivo: `__tests__/db/prisma.test.ts`

```typescript
import { prisma } from '@/lib/db/prisma';
import { describe, it, expect, afterAll } from 'vitest';

describe('Prisma Client', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should connect to database', async () => {
    const result = await prisma.$queryRaw<Array<{ now: Date }>>`
      SELECT NOW() as now
    `;

    expect(result[0].now).toBeInstanceOf(Date);
  });

  it('should query user roles with correct types', async () => {
    const roles = await prisma.userRole.findMany({
      take: 1
    });

    if (roles.length > 0) {
      const role = roles[0];

      // TypeScript debe inferir estos tipos correctamente
      expect(['admin', 'moderator', 'user']).toContain(role.role);
      expect(typeof role.userId).toBe('string');
      expect(role.assignedAt).toBeInstanceOf(Date);
    }
  });

  it('should query user profiles', async () => {
    const profiles = await prisma.userProfile.findMany({
      take: 1,
      select: {
        userId: true,
        fullName: true,
        status: true
      }
    });

    if (profiles.length > 0) {
      const profile = profiles[0];

      expect(['active', 'inactive', 'suspended', 'pending'])
        .toContain(profile.status);
    }
  });
});
```

**Ejecutar tests**:
```bash
npm test -- __tests__/db/prisma.test.ts
```

### 4.2. Test de vistas materializadas

Agregar a `__tests__/db/prisma.test.ts`:

```typescript
import { getDashboardStats, refreshDashboardStats } from '@/lib/db/analytics';

describe('Materialized Views', () => {
  it('should query dashboard stats', async () => {
    const stats = await getDashboardStats();

    expect(stats).toBeDefined();
    expect(typeof stats.total_users).toBe('bigint');
    expect(stats.refreshed_at).toBeInstanceOf(Date);
  });

  it('should refresh dashboard stats', async () => {
    // No debería lanzar error
    await expect(refreshDashboardStats()).resolves.not.toThrow();
  });
});
```

### 4.3. Verificar RLS funciona

Crear archivo: `__tests__/db/rls.test.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import { describe, it, expect } from 'vitest';

describe('RLS Policies', () => {
  it('should have RLS enabled on user_roles', async () => {
    const supabase = await createClient();

    // Sin autenticación, no debería poder leer roles
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .limit(1);

    // RLS debería denegar acceso (devuelve [] vacío o error)
    expect(data).toEqual([]);
  });

  it('Prisma should bypass RLS (service role)', async () => {
    // Prisma usa service_role key, bypasses RLS
    const roles = await prisma.userRole.findMany({
      take: 5
    });

    // Debería poder leer (si hay datos)
    expect(Array.isArray(roles)).toBe(true);
  });
});
```

✅ **Checkpoint**: Tests pasan correctamente

---

## Fase 5: Documentación (30 minutos)

### 5.1. Actualizar `CLAUDE.md`

Agregar al final de la sección "Database Layer":

```markdown
### Database Layer

The application uses a **hybrid approach** for database management:

#### Migrations: SQL (Supabase)
- **Source of truth**: SQL files in `supabase/migrations/`
- **Workflow**: Write SQL → `npm run db:push`
- **Includes**: Tables, RLS policies, triggers, functions, materialized views
- **Why**: PostgreSQL advanced features (RLS, triggers) not supported by Prisma

#### Queries: Prisma Client (Type-Safe)
- **Purpose**: Type-safe queries from application code
- **Workflow**: DB changes → `npm run db:pull` → `npm run db:generate`
- **Benefits**: TypeScript types, autocomplete, refactoring
- **Location**: `lib/db/prisma.ts`

**Example**:
```typescript
import { prisma } from '@/lib/db/prisma';

// Type-safe query with autocomplete
const users = await prisma.userProfile.findMany({
  where: { status: 'active' },
  select: { userId: true, fullName: true }
});
// TypeScript knows the exact shape of 'users'
```

**See**: `docs/architecture/database-workflow.md` for detailed workflow
```

### 5.2. Crear README para equipo

Crear archivo: `docs/PRISMA_SETUP.md`

```markdown
# Prisma Setup - Guía para el Equipo

## ¿Qué es esto?

Usamos **enfoque híbrido** SQL + Prisma:
- **SQL puro** para migraciones (schema, RLS, triggers)
- **Prisma Client** para queries type-safe

## Comandos Frecuentes

```bash
# Aplicar cambios de schema
npm run db:sync

# Ver datos en GUI
npm run db:studio

# Resetear DB (⚠️ borra todo!)
npm run db:reset
```

## Workflow: Agregar Nueva Tabla

1. Crear migración SQL:
```sql
-- supabase/migrations/20250111_add_posts.sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content TEXT,
  user_id UUID REFERENCES auth.users(id)
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_posts"
  ON posts FOR SELECT
  USING (auth.uid() = user_id);
```

2. Aplicar y regenerar tipos:
```bash
npm run db:sync
```

3. Usar en app:
```typescript
const posts = await prisma.post.findMany({
  where: { userId: currentUserId }
});
```

## FAQs

**P: ¿Por qué no usar Prisma para migraciones?**
R: Prisma no soporta RLS policies, que son críticas para nuestra seguridad.

**P: ¿Cuándo usar Supabase Client vs Prisma Client?**
R:
- Supabase: Auth, Storage, Realtime, queries con RLS del usuario
- Prisma: Queries admin (bypass RLS), operaciones complejas

**P: ¿Prisma Client va en el bundle del cliente?**
R: No. Solo se usa en server-side (Server Components, API Routes).
```

### 5.3. Commit de cambios

```bash
# Agregar archivos nuevos
git add lib/db/
git add prisma/
git add __tests__/db/
git add docs/

# Commit
git commit -m "feat: implement hybrid SQL + Prisma approach

- Add Prisma Client for type-safe queries
- Keep SQL migrations as source of truth
- Add database helpers for materialized views
- Add comprehensive tests for Prisma queries
- Document hybrid approach in CLAUDE.md

See docs/decisions/adr-005-orm-vs-raw-sql.md for rationale"
```

✅ **Checkpoint**: Todo documentado y commiteado

---

## Fase 6: Validación Final (30 minutos)

### 6.1. Checklist de validación

- [ ] Migraciones SQL aplicadas correctamente
- [ ] Prisma Client generado sin errores
- [ ] Autocomplete funciona en VS Code
- [ ] Tests pasan correctamente
- [ ] Scripts npm funcionan
- [ ] RLS policies funcionan (Supabase Client)
- [ ] Prisma bypasses RLS (queries admin)
- [ ] Vistas materializadas accesibles
- [ ] Documentación actualizada
- [ ] Equipo informado del cambio

### 6.2. Test de integración completo

Crear página de prueba: `app/test-prisma/page.tsx`

```typescript
import { prisma } from '@/lib/db/prisma';
import { getDashboardStats } from '@/lib/db/analytics';

export default async function TestPrismaPage() {
  // Test 1: Query básico
  const userCount = await prisma.userProfile.count();

  // Test 2: Query con where
  const activeUsers = await prisma.userProfile.count({
    where: { status: 'active' }
  });

  // Test 3: Query con select
  const recentUsers = await prisma.userProfile.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      userId: true,
      fullName: true,
      status: true
    }
  });

  // Test 4: Vista materializada
  const stats = await getDashboardStats();

  // Test 5: Query de roles
  const admins = await prisma.userRole.count({
    where: { role: 'admin' }
  });

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Prisma Integration Test</h1>

      <div>
        <h2>✅ Tests Passed</h2>
        <ul>
          <li>Total users: {userCount}</li>
          <li>Active users: {activeUsers}</li>
          <li>Admins: {admins}</li>
          <li>Stats refreshed: {stats.refreshed_at.toISOString()}</li>
        </ul>
      </div>

      <div>
        <h2>Recent Users</h2>
        <ul>
          {recentUsers.map(user => (
            <li key={user.userId}>
              {user.fullName || 'No name'} - {user.status}
            </li>
          ))}
        </ul>
      </div>

      <p style={{ color: 'green' }}>
        ✅ All Prisma queries executed successfully!
      </p>
    </div>
  );
}
```

**Visitar**: http://localhost:3000/test-prisma

**Verificar**:
1. Página carga sin errores
2. Muestra datos correctos
3. No hay warnings en consola
4. TypeScript no muestra errores

### 6.3. Performance baseline

```typescript
// __tests__/db/performance.test.ts
import { prisma } from '@/lib/db/prisma';
import { describe, it, expect } from 'vitest';

describe('Performance Baseline', () => {
  it('should query 100 users in <100ms', async () => {
    const start = Date.now();

    await prisma.userProfile.findMany({
      take: 100,
      select: { userId: true, fullName: true, status: true }
    });

    const duration = Date.now() - start;
    console.log(`Query duration: ${duration}ms`);

    expect(duration).toBeLessThan(100);
  });

  it('should count all users in <50ms', async () => {
    const start = Date.now();

    await prisma.userProfile.count();

    const duration = Date.now() - start;
    console.log(`Count duration: ${duration}ms`);

    expect(duration).toBeLessThan(50);
  });
});
```

✅ **Checkpoint**: Performance aceptable

---

## Troubleshooting

### Problema: "Environment variable not found: DATABASE_URL"

**Solución**:
```bash
# Verificar que existe
cat .env | grep DATABASE_URL

# Si no existe, copiar de .env.local
echo "DATABASE_URL=$(grep DATABASE_URL .env.local | cut -d '=' -f2-)" >> .env
```

### Problema: Prisma no detecta tablas

**Solución**:
```bash
# Verificar conexión
npx prisma db pull --force

# Si falla, verificar DATABASE_URL
npx prisma validate
```

### Problema: Types no se actualizan

**Solución**:
```bash
# Limpiar cache y regenerar
rm -rf node_modules/.prisma
npm run db:generate

# Reiniciar TS server en VS Code
# Cmd+Shift+P → "Restart TS Server"
```

### Problema: RLS bloquea queries de Prisma

**Solución**: Usar service_role key (bypasses RLS)
```env
# En .env, usar connection string de service_role
DATABASE_URL="postgresql://postgres.xxx:[SERVICE_KEY]@aws-0-xxx.pooler.supabase.com:5432/postgres"
```

**Obtener service_role key**:
1. Supabase Dashboard → Settings → Database
2. Copiar "Connection string" bajo "Session mode"
3. Reemplazar `[YOUR-PASSWORD]` con **service_role key** (no anon key)

---

## Siguientes Pasos

### Inmediato (hoy):
- [ ] Ejecutar esta guía completa
- [ ] Verificar que todo funciona
- [ ] Informar al equipo del nuevo workflow

### Corto plazo (esta semana):
- [ ] Refactorizar queries existentes a Prisma (si las hay)
- [ ] Crear helpers adicionales para vistas
- [ ] Configurar CI/CD para regenerar types

### Largo plazo (este mes):
- [ ] Training para el equipo sobre Prisma
- [ ] Establecer code review guidelines
- [ ] Monitoring de queries lentas

---

## Recursos Adicionales

- [ADR-005: ORM vs SQL](./docs/decisions/adr-005-orm-vs-raw-sql.md) - Decisión completa
- [Database Workflow](./docs/architecture/database-workflow.md) - Guía detallada
- [Hybrid Approach Diagram](./docs/architecture/diagrams/hybrid-approach.md) - Visual
- [Prisma Docs](https://www.prisma.io/docs) - Documentación oficial
- [Supabase + Prisma Guide](https://www.prisma.io/docs/guides/database/supabase) - Integración

---

## Soporte

Si encuentras problemas:
1. Revisar troubleshooting arriba
2. Consultar [Database Workflow](./docs/architecture/database-workflow.md)
3. Preguntar en canal de equipo

---

**¡Felicitaciones! 🎉**

Has implementado exitosamente el enfoque híbrido SQL + Prisma.
Ahora tienes:
- ✅ Control total sobre el schema (SQL)
- ✅ Type-safety en queries (Prisma)
- ✅ RLS funcionando (Supabase)
- ✅ Mejor developer experience

**Tiempo invertido**: 3-4 horas
**Beneficio esperado**: ∞

---

**Última actualización**: 2025-11-11
**Próxima revisión**: Después de 1 semana de uso
