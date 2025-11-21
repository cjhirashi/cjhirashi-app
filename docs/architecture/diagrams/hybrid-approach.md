# Arquitectura Híbrida: SQL + Prisma

## Diagrama de Arquitectura

```
┌───────────────────────────────────────────────────────────────────────┐
│                          DEVELOPER WORKFLOW                           │
└───────────────────────────────────────────────────────────────────────┘
                                  │
                                  │
                    ┌─────────────▼─────────────┐
                    │  1. Escribir Migración    │
                    │     (SQL Puro)            │
                    │                           │
                    │  supabase/migrations/     │
                    │  └─ 20250111_*.sql        │
                    │     - Tables              │
                    │     - RLS Policies        │
                    │     - Triggers            │
                    │     - Functions           │
                    │     - Views               │
                    └─────────────┬─────────────┘
                                  │
                                  │ npm run db:push
                                  │
                    ┌─────────────▼─────────────┐
                    │  2. Base de Datos         │
                    │     (PostgreSQL)          │
                    │                           │
                    │  ┌─────────────────────┐  │
                    │  │ Tables              │  │
                    │  │ Indexes             │  │
                    │  │ RLS Policies        │  │
                    │  │ Triggers            │  │
                    │  │ Functions           │  │
                    │  │ Materialized Views  │  │
                    │  └─────────────────────┘  │
                    └─────────────┬─────────────┘
                                  │
                                  │ npm run db:pull
                                  │ (Introspección)
                                  │
                    ┌─────────────▼─────────────┐
                    │  3. Prisma Schema         │
                    │     (Auto-generado)       │
                    │                           │
                    │  prisma/schema.prisma     │
                    │  ┌─────────────────────┐  │
                    │  │ Models (Types)      │  │
                    │  │ Relations           │  │
                    │  │ Indexes             │  │
                    │  └─────────────────────┘  │
                    │                           │
                    │  ⚠️ NOTA: NO incluye     │
                    │     RLS, triggers, views  │
                    └─────────────┬─────────────┘
                                  │
                                  │ npm run db:generate
                                  │
                    ┌─────────────▼─────────────┐
                    │  4. Prisma Client         │
                    │     (TypeScript Types)    │
                    │                           │
                    │  @prisma/client           │
                    │  ┌─────────────────────┐  │
                    │  │ Type-safe API       │  │
                    │  │ Auto-complete       │  │
                    │  │ Type inference      │  │
                    │  └─────────────────────┘  │
                    └─────────────┬─────────────┘
                                  │
                                  │ import { prisma }
                                  │
                    ┌─────────────▼─────────────┐
                    │  5. Application Code      │
                    │     (Next.js)             │
                    │                           │
                    │  ┌─────────────────────┐  │
                    │  │ Type-safe Queries   │  │
                    │  │ Autocomplete        │  │
                    │  │ Refactoring         │  │
                    │  └─────────────────────┘  │
                    └───────────────────────────┘
```

---

## Separación de Responsabilidades

### SQL: Source of Truth

```
┌─────────────────────────────────────────┐
│        SQL MIGRATIONS                   │
│        (supabase/migrations/)           │
├─────────────────────────────────────────┤
│                                         │
│  ✓ CREATE TABLE                         │
│  ✓ CREATE INDEX                         │
│  ✓ ALTER TABLE ... ENABLE RLS           │
│  ✓ CREATE POLICY                        │
│  ✓ CREATE TRIGGER                       │
│  ✓ CREATE FUNCTION                      │
│  ✓ CREATE MATERIALIZED VIEW             │
│  ✓ CREATE EXTENSION                     │
│                                         │
│  → Gestión: Supabase CLI                │
│  → Aplicación: supabase db push         │
│  → Estado: Tabla supabase_migrations    │
│                                         │
└─────────────────────────────────────────┘
```

### Prisma: Type-Safe Interface

```
┌─────────────────────────────────────────┐
│        PRISMA CLIENT                    │
│        (@prisma/client)                 │
├─────────────────────────────────────────┤
│                                         │
│  ✓ findMany()                           │
│  ✓ findUnique()                         │
│  ✓ create()                             │
│  ✓ update()                             │
│  ✓ delete()                             │
│  ✓ $queryRaw<T>()                       │
│  ✓ $executeRaw()                        │
│                                         │
│  → Tipos: Auto-generados desde DB       │
│  → Queries: Type-safe en compile-time   │
│  → Performance: Queries optimizados     │
│                                         │
└─────────────────────────────────────────┘
```

---

## Flujo de Datos

### Migración Nueva

```
Developer
   │
   │ 1. Escribe SQL
   ▼
supabase/migrations/20250111_add_notifications.sql
   │
   │ 2. Aplica migración
   │ $ npm run db:push
   ▼
PostgreSQL (Supabase)
   │
   │ 3. Introspección
   │ $ npm run db:pull
   ▼
prisma/schema.prisma (actualizado)
   │
   │ 4. Genera types
   │ $ npm run db:generate
   ▼
node_modules/@prisma/client (nuevos types)
   │
   │ 5. Usa en app
   ▼
import { prisma } from '@/lib/db/prisma'
const notifications = await prisma.notification.findMany()
```

### Query desde App

```
Application Code
   │
   │ prisma.userRole.findUnique({ where: { userId } })
   ▼
Prisma Client (type-safe)
   │
   │ Valida tipos en compile-time
   │ Genera SQL optimizado
   ▼
PostgreSQL
   │
   │ Ejecuta query
   │ Aplica RLS policies
   ▼
Resultado (tipado)
   │
   │ { userId: string, role: 'admin' | 'moderator' | 'user' }
   ▼
Application Code (con autocomplete)
```

---

## Comparativa: Antes vs Después

### ANTES (Solo SQL)

```typescript
// ❌ Sin types, sin autocomplete
import { createClient } from '@/lib/supabase/server';

async function getUserRole(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_roles')      // ❌ No verifica tabla existe
    .select('role')           // ❌ No verifica columna existe
    .eq('user_id', userId)    // ❌ user_id puede tener typo
    .single();

  if (error) throw error;

  return data.role;           // ❌ TypeScript no sabe el tipo
}

// Uso
const role = await getUserRole('123');
if (role === 'admim') {      // ❌ Typo no detectado!
  // ...
}
```

### DESPUÉS (SQL + Prisma)

```typescript
// ✅ Types, autocomplete, validación
import { prisma } from '@/lib/db/prisma';

async function getUserRole(userId: string) {
  const userRole = await prisma.userRole.findUnique({
    where: { userId },        // ✅ Valida campo existe
    select: { role: true }    // ✅ Autocomplete de campos
  });

  return userRole?.role;      // ✅ TS: 'admin'|'moderator'|'user'|undefined
}

// Uso
const role = await getUserRole('123');
if (role === 'admim') {      // ❌ ERROR en compile-time!
//           ^^^^^^ Tipo '"admim"' no es asignable a '"admin"|"moderator"|"user"'
  // ...
}
```

---

## Coexistencia: Supabase Client vs Prisma Client

### Cuándo usar cada uno

```
┌─────────────────────────────────────────────────────┐
│          SUPABASE CLIENT                            │
│          (@supabase/supabase-js)                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Casos de uso:                                      │
│  ✓ Autenticación (signIn, signOut)                 │
│  ✓ Storage (upload, download)                      │
│  ✓ Realtime (subscriptions)                        │
│  ✓ Queries con RLS del usuario actual              │
│  ✓ Client-side queries (browser)                   │
│                                                     │
│  Ejemplo:                                           │
│  const { data } = await supabase                    │
│    .from('notifications')                           │
│    .select('*')                                     │
│    // RLS aplica automáticamente                    │
│    // Solo notificaciones del usuario actual       │
│                                                     │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│          PRISMA CLIENT                              │
│          (@prisma/client)                           │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Casos de uso:                                      │
│  ✓ Queries administrativos (bypass RLS)            │
│  ✓ Operaciones complejas (joins, aggregations)     │
│  ✓ Type-safety requerido                           │
│  ✓ Server-side only (never browser)                │
│                                                     │
│  Ejemplo:                                           │
│  const notifications = await prisma.notification    │
│    .findMany({                                      │
│      where: { read: false },                        │
│      include: { user: true }                        │
│    })                                               │
│    // Bypasses RLS, ve todas las notificaciones    │
│    // Útil para admin panel                        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Tabla de Decisión

| Necesito... | Usar |
|-------------|------|
| Autenticar usuario | Supabase Client |
| Subir archivo | Supabase Client |
| Subscribir a cambios en tiempo real | Supabase Client |
| Query respetando RLS del usuario | Supabase Client |
| Query desde navegador (client component) | Supabase Client |
| Query administrativo (bypass RLS) | Prisma Client |
| Joins complejos con types | Prisma Client |
| Autocomplete de campos | Prisma Client |
| Operaciones CRUD type-safe | Prisma Client |
| Queries desde server component | Ambos (según necesidad RLS) |

---

## Stack Tecnológico Final

```
┌───────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                       │
│                   (Next.js 15)                            │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────────┐         ┌─────────────────┐         │
│  │ Client          │         │ Server          │         │
│  │ Components      │         │ Components      │         │
│  └────────┬────────┘         └────────┬────────┘         │
│           │                           │                  │
│           │                           │                  │
│  ┌────────▼────────┐         ┌────────▼────────┐         │
│  │ Supabase Client │         │ Prisma Client   │         │
│  │ (RLS-aware)     │         │ (Type-safe)     │         │
│  └────────┬────────┘         └────────┬────────┘         │
│           │                           │                  │
│           └───────────┬───────────────┘                  │
│                       │                                  │
└───────────────────────┼──────────────────────────────────┘
                        │
                        │
┌───────────────────────▼──────────────────────────────────┐
│                   DATABASE LAYER                         │
│                   (PostgreSQL / Supabase)                │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │   Tables   │  │    RLS     │  │  Triggers  │        │
│  └────────────┘  └────────────┘  └────────────┘        │
│                                                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │  Indexes   │  │ Functions  │  │   Views    │        │
│  └────────────┘  └────────────┘  └────────────┘        │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  Gestión: Supabase Migrations (SQL puro)                │
│  Types: Prisma Client (auto-generado)                   │
└──────────────────────────────────────────────────────────┘
```

---

## Ventajas Visualizadas

### Control Total + Type Safety

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  SQL Puro                 Híbrido                   │
│                                                     │
│  ┌──────────┐             ┌──────────┐             │
│  │ Control  │             │ Control  │             │
│  │ Total    │ ────────▶   │ Total    │             │
│  │ ✅       │             │ ✅       │             │
│  └──────────┘             └──────────┘             │
│                                  │                 │
│  ┌──────────┐                    │                 │
│  │ Types    │                    │                 │
│  │ ❌       │                    │                 │
│  └──────────┘                    │                 │
│                           ┌──────▼──────┐          │
│                           │ Types       │          │
│                           │ ✅          │          │
│                           └─────────────┘          │
│                                                     │
│                    = Mejor de ambos mundos         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Resumen Visual

```
╔═══════════════════════════════════════════════════════════╗
║                   ENFOQUE HÍBRIDO                         ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  ✅ RLS Policies          (SQL)                           ║
║  ✅ Triggers              (SQL)                           ║
║  ✅ Functions             (SQL)                           ║
║  ✅ Materialized Views    (SQL)                           ║
║                                                           ║
║  ✅ TypeSafety            (Prisma)                        ║
║  ✅ Autocomplete          (Prisma)                        ║
║  ✅ Refactoring           (Prisma)                        ║
║  ✅ Developer Experience  (Prisma)                        ║
║                                                           ║
║  ✅ Zero conflictos                                       ║
║  ✅ Coexistencia pacífica                                 ║
║  ✅ Mejor de ambos mundos                                 ║
║                                                           ║
╠═══════════════════════════════════════════════════════════╣
║  Setup: 3-4 horas  |  ROI: 1 mes  |  Beneficio: ∞        ║
╚═══════════════════════════════════════════════════════════╝
```

---

**Última actualización**: 2025-11-11
**Ver también**:
- [ADR-005: ORM vs SQL](../../decisions/adr-005-orm-vs-raw-sql.md)
- [Database Workflow](../database-workflow.md)
- [Resumen Ejecutivo](../../PRISMA_DECISION_SUMMARY.md)
