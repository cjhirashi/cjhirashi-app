# ADR-005: Selección de ORM vs SQL Puro para Migraciones de Base de Datos

**Estado**: Propuesta
**Fecha**: 2025-11-11
**Autores**: Architecture Team
**Contexto**: Sistema Admin Panel con Supabase/PostgreSQL

---

## Resumen Ejecutivo

**Recomendación: Mantener SQL Puro con Supabase Migrations + Prisma para TypeSafety en Queries**

Se recomienda un **enfoque híbrido** que combine las fortalezas de ambas estrategias:
- **SQL puro** para migraciones (esquema, RLS, triggers, funciones)
- **Prisma Client** para queries type-safe desde la aplicación

---

## Contexto

### Situación Actual

Ya se han desarrollado **3 archivos de migración SQL** (698 líneas totales):
1. `20250101000001_create_core_tables.sql` (523 líneas)
2. `20250101000002_create_analytics_views.sql` (113 líneas)
3. `20250101000003_seed_initial_data.sql` (62 líneas)

**Estado**: Aún NO aplicadas a la base de datos.

### Características PostgreSQL Avanzadas en Uso

Las migraciones actuales utilizan:

1. **ENUMs personalizados**:
   - `user_role` (admin, moderator, user)
   - `user_status` (active, inactive, suspended, pending)
   - `audit_action_category` (auth, user, role, setting, system)
   - `setting_type` (string, number, boolean, json)

2. **Row Level Security (RLS)**: 15 políticas diferentes
   - `users_read_own_role`, `admins_read_all_roles`
   - `users_update_own_profile`, `admins_update_all_profiles`
   - `admins_read_logs`, `public_settings_readable`

3. **Triggers**: 4 triggers automáticos
   - `update_user_roles_updated_at`
   - `update_user_profiles_updated_at`
   - `on_auth_user_created` (sincronización con auth.users)
   - `update_system_settings_updated_at`

4. **Funciones PL/pgSQL**: Múltiples funciones
   - `update_updated_at_column()` - Timestamp automático
   - `handle_new_user()` - Creación automática de perfil
   - `refresh_dashboard_stats()` - Refresco de vistas materializadas

5. **Índices avanzados**:
   - Índices B-tree estándar (14 índices)
   - Índices GIN para JSONB (2 índices)
   - Índice trigrama (pg_trgm) para búsqueda full-text
   - Índices compuestos para queries complejas

6. **Vistas materializadas**:
   - `admin_dashboard_stats` (estadísticas en cache)
   - Con índice único para `REFRESH CONCURRENTLY`

7. **Vistas regulares**:
   - `user_activity_summary` (métricas de usuarios)
   - `recent_activity` (últimas 100 acciones)

8. **Extensiones PostgreSQL**:
   - `pg_trgm` (búsqueda fuzzy de texto)
   - `pgcrypto` (potencial uso futuro)

---

## Análisis Técnico: Prisma vs SQL Puro

### 1. Capacidades de Prisma

#### Lo que Prisma PUEDE hacer:

| Característica | Soporte en Prisma | Notas |
|----------------|-------------------|-------|
| Tablas básicas | Sí | Excelente soporte |
| Relaciones FK | Sí | Con `@relation` |
| Índices simples | Sí | Con `@@index` |
| Índices únicos | Sí | Con `@@unique` |
| Constraints CHECK | Sí (desde v4.0) | Con `@@check` |
| JSONB | Sí | Con tipo `Json` |
| Timestamps automáticos | Sí | Con `@default(now())` y `@updatedAt` |
| ENUMs | Sí | Con `enum` en schema |
| Índices compuestos | Sí | Con `@@index([field1, field2])` |
| TypeSafety completo | Sí | Principal ventaja |

#### Lo que Prisma NO PUEDE hacer (o hace mal):

| Característica | Soporte en Prisma | Limitación |
|----------------|-------------------|-----------|
| RLS Policies | **NO** | Imposible definir políticas en Prisma Schema |
| Triggers | **NO** | Requiere migraciones SQL personalizadas |
| Funciones PL/pgSQL | **NO** | Solo mediante `prisma migrate` raw SQL |
| Vistas materializadas | **NO** | No hay sintaxis en Prisma Schema |
| Vistas regulares | **Parcial** | Solo con `--sql` (experimental) |
| Índices GIN | **Parcial** | Requiere raw SQL en migration |
| Extensiones PostgreSQL | **NO** | Requiere SQL manual |
| REFRESH CONCURRENTLY | **NO** | Gestión manual fuera de Prisma |

#### RLS (Row Level Security) - El Problema Crítico

**Prisma NO soporta RLS de ninguna forma**:
- No puede definir políticas en el schema
- No puede gestionarlas en migraciones automáticas
- Requiere migraciones SQL manuales (`prisma migrate dev --create-only`)
- No valida que las políticas existan o estén correctas

Esto significa que para nuestro sistema con **15 políticas RLS**, tendríamos que:
1. Crear el schema en Prisma
2. Generar la migración
3. Editar manualmente la migración SQL
4. Agregar todas las políticas RLS a mano
5. Ejecutar `prisma migrate dev`

**Problema**: Cada vez que Prisma regenera el schema, no incluye RLS, perdiendo visibilidad de las políticas.

---

### 2. Comparativa Detallada

#### A. Gestión de Migraciones

| Aspecto | Prisma | SQL Puro (Supabase) | Ganador |
|---------|--------|---------------------|---------|
| Control granular | Limitado (auto-genera) | Total (escribes todo) | SQL |
| Previsibilidad | Media (Prisma decide) | Alta (tú decides) | SQL |
| Funciones avanzadas | Requiere raw SQL | Nativo | SQL |
| Validación schema | Automática | Manual | Prisma |
| Rollback automático | Sí (con shadow DB) | Manual | Prisma |
| Sincronización Supabase | Compleja | Directa | SQL |

#### B. Developer Experience

| Aspecto | Prisma | SQL Puro | Ganador |
|---------|--------|----------|---------|
| TypeSafety en queries | Excelente | Manual (types a mano) | **Prisma** |
| Autocomplete IDE | Sí | No | **Prisma** |
| Curva de aprendizaje | Baja | Alta (SQL + PostgreSQL) | **Prisma** |
| Debugging queries | Fácil (Prisma Studio) | Manual (Supabase UI) | **Prisma** |
| Refactoring | Automático | Manual (search & replace) | **Prisma** |
| Schema as Code | Sí (`.prisma`) | No (múltiples `.sql`) | **Prisma** |

#### C. Performance y Escalabilidad

| Aspecto | Prisma | SQL Puro | Ganador |
|---------|--------|----------|---------|
| Queries simples | Igual | Igual | Empate |
| Queries complejas | Puede ser subóptimo | Optimizado manualmente | SQL |
| Joins múltiples | Puede generar N+1 | Control total | SQL |
| Uso de índices | Depende de Prisma | Control total | SQL |
| Vistas materializadas | No soportado | Soporte completo | SQL |
| Query optimization | Limitado | Total | SQL |

#### D. Seguridad y Compliance

| Aspecto | Prisma | SQL Puro | Ganador |
|---------|--------|----------|---------|
| RLS Policies | **NO SOPORTADO** | Soporte nativo | **SQL** |
| Defense in depth | Depende de app | RLS en DB | **SQL** |
| Auditabilidad | Logs de Prisma | Triggers + audit_logs | **SQL** |
| Compliance (GDPR, etc.) | Nivel aplicación | Nivel base de datos | **SQL** |

#### E. Mantenibilidad

| Aspecto | Prisma | SQL Puro | Ganador |
|---------|--------|----------|---------|
| Schema legible | Muy legible (.prisma) | SQL verboso | Prisma |
| Documentación inline | Sí (`/// comment`) | Sí (`COMMENT ON`) | Empate |
| Migraciones versionadas | Sí | Sí | Empate |
| Onboarding nuevos devs | Más rápido | Más lento | Prisma |
| Debugging schema | Prisma Studio | Supabase Studio | Empate |

---

### 3. Caso Específico: Admin Panel con RBAC

Para nuestro sistema con:
- **RBAC con jerarquía** (admin > moderator > user)
- **RLS para defense-in-depth** (última línea de defensa)
- **Audit logging inmutable** (compliance)
- **Vistas materializadas** (performance analytics)

#### Factores Críticos:

1. **RLS es NO NEGOCIABLE**: La seguridad multi-capa requiere políticas a nivel de base de datos
2. **Triggers para audit**: Cada acción debe ser registrada automáticamente
3. **Vistas materializadas**: Dashboard stats debe ser performante
4. **Funciones PL/pgSQL**: Lógica de negocio compleja en DB (ej: `handle_new_user()`)

**Conclusión**: Prisma SOLO no puede cumplir estos requisitos.

---

## Opciones Evaluadas

### Opción 1: Prisma Puro (Descartar SQL)

**Descripción**: Reemplazar todas las migraciones SQL con Prisma Schema y migrations.

#### Implementación:
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  admin
  moderator
  user
}

model UserRole {
  userId     String   @id @map("user_id") @db.Uuid
  role       UserRole @default(user)
  assignedBy String?  @map("assigned_by") @db.Uuid
  assignedAt DateTime @default(now()) @map("assigned_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  user     User  @relation("UserRoleUser", fields: [userId], references: [id], onDelete: Cascade)
  assigner User? @relation("UserRoleAssigner", fields: [assignedBy], references: [id], onDelete: SetNull)

  @@index([role])
  @@index([assignedBy])
  @@map("user_roles")
}
```

Luego:
```bash
npx prisma migrate dev --name init
# Editar manualmente la migración para agregar RLS, triggers, etc.
npx prisma generate
```

#### Pros:
- TypeSafety completo en queries de aplicación
- Prisma Studio para debugging visual
- Autocomplete en IDE
- Schema declarativo y legible
- Refactoring automático de modelos

#### Contras:
- **CRÍTICO**: NO soporta RLS (requiere SQL manual)
- **CRÍTICO**: NO soporta triggers (requiere SQL manual)
- **CRÍTICO**: NO soporta vistas materializadas
- **CRÍTICO**: NO soporta funciones PL/pgSQL
- Requiere editar migraciones generadas (pierde ventaja de Prisma)
- Complejidad adicional: Prisma + SQL manual
- Dificulta sincronización con Supabase Studio
- Shadow database puede conflictuar con Supabase
- Necesita 698 líneas SQL de todas formas (en migrations)

#### Esfuerzo de Migración:
- Crear `schema.prisma` con 4 modelos
- Ejecutar `prisma migrate dev --create-only`
- **Copiar manualmente** las 698 líneas SQL a la migración
- Ajustar nombres de tablas y tipos
- Testing completo de RLS policies
- Actualizar toda la documentación

**Tiempo estimado**: 8-12 horas

#### Veredicto:
**RECHAZADA** - Los contras superan ampliamente los pros. Prisma no puede manejar RLS, que es un requisito no negociable para el sistema RBAC.

---

### Opción 2: SQL Puro (Status Quo)

**Descripción**: Mantener las migraciones SQL actuales sin cambios.

#### Implementación:
```bash
# Aplicar migraciones existentes
supabase db push
```

Queries manuales:
```typescript
// lib/db/queries.ts
import { createClient } from '@/lib/supabase/server';

export async function getUserRole(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data.role; // TypeScript no sabe que esto es 'admin' | 'moderator' | 'user'
}
```

#### Pros:
- Control total sobre schema y optimizaciones
- Soporte nativo para RLS, triggers, funciones
- Vistas materializadas funcionan perfectamente
- Integración directa con Supabase
- Sin dependencias adicionales
- Ya está implementado (698 líneas completas)

#### Contras:
- **NO TypeSafety** en queries de aplicación
- Sin autocomplete de tablas/columnas
- Refactoring manual (buscar y reemplazar)
- Curva de aprendizaje más alta para nuevos devs
- Más propenso a errores de tipado
- Queries SQL en strings (sin syntax highlighting)

#### Esfuerzo de Mantenimiento:
- Crear tipos TypeScript manualmente para cada tabla
- Mantener tipos sincronizados con schema
- Testing manual de tipos

#### Veredicto:
**ACEPTABLE PERO MEJORABLE** - Funciona para RLS/triggers, pero sacrifica developer experience y type safety.

---

### Opción 3: Enfoque Híbrido (RECOMENDADO)

**Descripción**: Combinar SQL puro para migraciones + Prisma Client para queries type-safe.

#### Arquitectura:

```
┌─────────────────────────────────────────────────────┐
│           APPLICATION LAYER (Next.js)               │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────────────────────────────┐     │
│  │     Prisma Client (TypeSafe Queries)     │     │
│  │  - Auto-generated types                  │     │
│  │  - Autocomplete                          │     │
│  │  - Type checking                         │     │
│  └──────────────────────────────────────────┘     │
│                      │                             │
│                      ▼                             │
├─────────────────────────────────────────────────────┤
│          DATABASE LAYER (PostgreSQL)                │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────────────────────────────┐     │
│  │    SQL Migrations (Supabase)             │     │
│  │  - Tables, indexes                       │     │
│  │  - RLS Policies                          │     │
│  │  - Triggers                              │     │
│  │  - Functions                             │     │
│  │  - Materialized Views                    │     │
│  └──────────────────────────────────────────┘     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### Workflow:

1. **Crear/Modificar Schema**: Editar SQL en `supabase/migrations/`
2. **Aplicar Migración**: `supabase db push`
3. **Generar Prisma Schema**: `supabase db pull` + script de conversión
4. **Generar Prisma Client**: `npx prisma generate`
5. **Usar en Aplicación**: Queries type-safe con Prisma Client

#### Implementación:

**Paso 1: Mantener SQL Migrations**
```sql
-- supabase/migrations/20250101000001_create_core_tables.sql
-- (Mantener las 698 líneas actuales SIN CAMBIOS)
```

**Paso 2: Crear Prisma Schema (Auto-generado desde DB)**
```bash
# Después de aplicar migraciones SQL
npx prisma db pull
```

**Paso 3: Ajustar Schema Prisma (Ignorar lo que no soporta)**
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  admin
  moderator
  user
}

enum UserStatus {
  active
  inactive
  suspended
  pending
}

// Prisma detecta automáticamente las tablas
model UserRole {
  userId     String   @id @map("user_id") @db.Uuid
  role       UserRole @default(user)
  assignedBy String?  @map("assigned_by") @db.Uuid
  assignedAt DateTime @default(now()) @map("assigned_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  @@index([role])
  @@map("user_roles")
}

// Prisma NO maneja RLS, triggers, views - pero eso está bien
// Ya están definidos en las migraciones SQL
```

**Paso 4: Usar Prisma Client en Aplicación**
```typescript
// lib/db/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

```typescript
// lib/admin/auth/require-admin.ts
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import { redirect } from 'next/navigation';

export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  // Prisma Client con TypeSafety completo
  const userRole = await prisma.userRole.findUnique({
    where: { userId: user.id },
    select: { role: true }
  });

  // TypeScript sabe que role es 'admin' | 'moderator' | 'user' | null
  if (userRole?.role !== 'admin') {
    redirect('/unauthorized');
  }

  return user;
}
```

#### Gestión de Vistas y Funciones:

Prisma NO detecta vistas, pero podemos hacer queries raw type-safe:

```typescript
// lib/db/analytics.ts
import { prisma } from './prisma';
import type { Prisma } from '@prisma/client';

// Type-safe raw query
export async function getDashboardStats() {
  return await prisma.$queryRaw<{
    total_users: bigint;
    active_users: bigint;
    new_users_today: bigint;
    // ... otros campos
  }>`
    SELECT * FROM admin_dashboard_stats LIMIT 1
  `;
}
```

#### Pros:
- **TypeSafety completo** en queries de aplicación
- **Autocomplete** de tablas, columnas, relaciones
- **Refactoring automático** (renombrar campos)
- **RLS, triggers, funciones** en SQL (donde deben estar)
- **Vistas materializadas** funcionan perfectamente
- **Zero overhead** - Prisma solo genera types, no modifica DB
- **Integración con Supabase** sin conflictos
- **Mejor de ambos mundos**

#### Contras:
- **Dependencia adicional**: Prisma Client (~2MB en bundle)
- **Workflow adicional**: `db pull` + `generate` después de migrations
- **Schema duplicado**: SQL en migrations + Prisma schema (pero auto-generado)
- **Vistas no detectadas**: Requiere raw queries para vistas
- **Learning curve**: Equipo debe conocer SQL Y Prisma

#### Esfuerzo de Implementación:
1. Aplicar migraciones SQL actuales: `supabase db push` (5 min)
2. Instalar Prisma: `npm install -D prisma && npm install @prisma/client` (2 min)
3. Inicializar Prisma: `npx prisma init` (1 min)
4. Generar schema desde DB: `npx prisma db pull` (2 min)
5. Ajustar schema (comentarios, etc.): (15 min)
6. Generar client: `npx prisma generate` (2 min)
7. Crear wrapper `lib/db/prisma.ts`: (5 min)
8. Refactorizar queries existentes (si hay): (1-2 horas)
9. Documentar workflow: (30 min)

**Tiempo total estimado**: 3-4 horas

#### Veredicto:
**RECOMENDADO** - Combina control total de SQL con developer experience de Prisma.

---

## Decisión

### Enfoque Seleccionado: **Opción 3 - Híbrido (SQL + Prisma Client)**

**Rationale**:

1. **RLS es crítico**: No podemos sacrificar Row Level Security por conveniencia de DX
2. **TypeSafety mejora calidad**: Reduce bugs y mejora productividad
3. **No son mutuamente excluyentes**: SQL para schema, Prisma para queries
4. **Costo razonable**: 3-4 horas de setup vs semanas de bugs de tipos
5. **Escalabilidad**: Más fácil onboarding de nuevos devs
6. **Alineado con best practices**: Prisma es estándar en Next.js + PostgreSQL

### Principios de Implementación:

1. **SQL es la fuente de verdad**: Todas las migraciones se escriben en SQL
2. **Prisma es el cliente**: Solo se usa para queries type-safe
3. **Nunca usar `prisma migrate`**: Solo `prisma db pull` + `prisma generate`
4. **Supabase mantiene control**: Migrations, RLS, triggers en Supabase
5. **Prisma mejora DX**: Types, autocomplete, refactoring

---

## Consecuencias

### Positivas:
- TypeSafety en toda la capa de datos
- Reducción de errores de tipado en runtime
- Mejor autocomplete y refactoring
- Onboarding más rápido para nuevos devs
- Mantiene todas las capacidades avanzadas de PostgreSQL
- Compatible con Supabase y sus herramientas

### Negativas:
- Dependencia adicional (Prisma Client)
- Workflow ligeramente más complejo (SQL → pull → generate)
- Schema duplicado (pero auto-generado)
- Necesidad de conocer ambas herramientas

### Riesgos y Mitigaciones:

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Prisma detecta schema incorrecto | Media | Bajo | Revisar `schema.prisma` después de `db pull` |
| Bundle size aumenta (+2MB) | Alta | Bajo | Aceptable para admin panel, no para landing page |
| Devs olvidan hacer `generate` | Media | Medio | Documentar en README + pre-commit hook |
| Queries raw para vistas complejas | Alta | Bajo | Crear helpers type-safe en `lib/db/` |

---

## Plan de Implementación

### Fase 1: Setup Inicial (1 hora)

1. **Aplicar migraciones SQL existentes**:
```bash
supabase db push
```

2. **Instalar Prisma**:
```bash
npm install -D prisma@latest
npm install @prisma/client@latest
```

3. **Inicializar Prisma**:
```bash
npx prisma init --datasource-provider postgresql
```

4. **Configurar `.env`**:
```env
DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"
```

### Fase 2: Generar Schema (30 minutos)

5. **Generar schema desde DB**:
```bash
npx prisma db pull
```

6. **Revisar y ajustar `schema.prisma`**:
   - Agregar comentarios `///`
   - Verificar relaciones detectadas
   - Ajustar nombres si es necesario

7. **Generar Prisma Client**:
```bash
npx prisma generate
```

### Fase 3: Integración con Next.js (1 hora)

8. **Crear cliente Prisma singleton**:
```typescript
// lib/db/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

9. **Crear helpers para vistas materializadas**:
```typescript
// lib/db/analytics.ts
import { prisma } from './prisma';

export async function getDashboardStats() {
  const result = await prisma.$queryRaw<Array<{
    total_users: bigint;
    active_users: bigint;
    // ... campos
    refreshed_at: Date;
  }>>`SELECT * FROM admin_dashboard_stats LIMIT 1`;

  return result[0];
}

export async function refreshDashboardStats() {
  await prisma.$executeRaw`SELECT refresh_dashboard_stats()`;
}
```

10. **Refactorizar queries existentes** (si las hay):
```typescript
// Antes (Supabase Client)
const { data } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', userId)
  .single();

// Después (Prisma Client)
const userRole = await prisma.userRole.findUnique({
  where: { userId },
  select: { role: true }
});
```

### Fase 4: Documentación (30 minutos)

11. **Actualizar `CLAUDE.md`**:
```markdown
## Database Layer

- **Migrations**: SQL puro en `supabase/migrations/`
- **Type-Safe Queries**: Prisma Client (`@prisma/client`)
- **Schema Source of Truth**: PostgreSQL (via Supabase)
- **Prisma Schema**: Auto-generado desde DB con `prisma db pull`

### Workflow para cambios de schema:

1. Crear migración SQL en `supabase/migrations/`
2. Aplicar: `supabase db push`
3. Regenerar Prisma: `npx prisma db pull && npx prisma generate`
4. Commit ambos: `.sql` y `schema.prisma`
```

12. **Crear guía en `docs/architecture/database-workflow.md`**

13. **Agregar scripts en `package.json`**:
```json
{
  "scripts": {
    "db:push": "supabase db push",
    "db:pull": "npx prisma db pull",
    "db:generate": "npx prisma generate",
    "db:sync": "npm run db:push && npm run db:pull && npm run db:generate",
    "db:studio": "npx prisma studio"
  }
}
```

### Fase 5: Testing (1 hora)

14. **Testing de queries type-safe**:
```typescript
// __tests__/db/prisma.test.ts
import { prisma } from '@/lib/db/prisma';

describe('Prisma Client', () => {
  it('should query user roles with correct types', async () => {
    const role = await prisma.userRole.findFirst();
    expect(role?.role).toMatch(/^(admin|moderator|user)$/);
  });
});
```

15. **Verificar que RLS funciona**:
```bash
# Ejecutar script de verificación existente
psql $DATABASE_URL -f supabase/scripts/verify_setup.sql
```

### Fase 6: Rollout (Opcional)

16. **Migrar queries existentes gradualmente** (si ya hay código)
17. **Code review de PRs**: Asegurar que nuevos queries usen Prisma
18. **Monitoring**: Verificar que no hay degradación de performance

---

## Comparativa Final: Enfoque Híbrido vs Alternativas

| Criterio | SQL Puro | Prisma Puro | **Híbrido** | Ganador |
|----------|----------|-------------|-------------|---------|
| RLS Support | Sí | No | Sí | Híbrido/SQL |
| TypeSafety | No | Sí | Sí | **Híbrido/Prisma** |
| DX (Autocomplete) | No | Sí | Sí | **Híbrido/Prisma** |
| Funciones PL/pgSQL | Sí | No | Sí | Híbrido/SQL |
| Vistas Materializadas | Sí | No | Sí | Híbrido/SQL |
| Complejidad Setup | Baja | Media | Media-Alta | SQL |
| Mantenibilidad | Media | Alta | **Muy Alta** | **Híbrido** |
| Performance | Excelente | Buena | Excelente | Híbrido/SQL |
| Bundle Size | 0 KB | +2 MB | +2 MB | SQL |
| Onboarding Devs | Lento | Rápido | **Medio-Rápido** | **Híbrido** |
| Control DB | Total | Limitado | Total | Híbrido/SQL |

**PUNTUACIÓN TOTAL**:
- SQL Puro: 6/11
- Prisma Puro: 5/11 (descalificado por RLS)
- **Híbrido: 10/11** 🏆

---

## Referencias

### Documentación:
- [Prisma with Supabase](https://www.prisma.io/docs/guides/database/supabase)
- [Prisma Introspection](https://www.prisma.io/docs/concepts/components/prisma-schema/introspection)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/trigger-definition.html)

### ADRs Relacionados:
- ADR-001: RBAC Implementation (requiere RLS)
- ADR-002: Database Schema (estructura actual)
- ADR-004: Security Layers (RLS como última defensa)

### Discusiones Relevantes:
- [Prisma + RLS Discussion](https://github.com/prisma/prisma/discussions/8939)
- [Supabase + Prisma Best Practices](https://github.com/supabase/supabase/discussions/1490)

---

## Aprobación

**Estado**: Pendiente de aprobación
**Revisores requeridos**: Tech Lead, Backend Team
**Fecha límite decisión**: 2025-11-13

Una vez aprobado, este ADR será marcado como **Aceptado** y se procederá con la implementación en Fase 1.
