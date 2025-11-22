# Documentación de Arquitectura - Admin Panel

Este directorio contiene toda la documentación arquitectónica para el panel de administración con RBAC.

---

## Documentos Principales

### 1. [Arquitectura del Admin Panel](./admin-panel-architecture.md)
**Propósito:** Documento maestro que define la arquitectura completa del sistema

**Contenido:**
- Visión general de la arquitectura
- Diagramas de flujo de datos
- Estructura de rutas (/admin/*)
- Arquitectura de componentes
- Gestión de estado
- Sistema de permisos
- Caching y optimización
- Seguridad (5 capas)
- Auditoría y logging
- Testing strategy
- Deployment considerations

**Audiencia:** Todos los miembros del equipo técnico

---

### 2. [Database Schema](./database-schema.md)
**Propósito:** Especificación detallada del schema de base de datos

**Contenido:**
- Diagrama entidad-relación
- Migración 001: Tablas core (user_roles, user_profiles, audit_logs, system_settings)
- Migración 002: Vistas de analytics
- Migración 003: Seed data
- Índices y optimizaciones
- Triggers automáticos
- RLS policies
- Funciones helpers
- Queries de mantenimiento

**Audiencia:** data-engineer, backend-developer

---

### 3. [Implementation Guide](./implementation-guide.md)
**Propósito:** Guía paso a paso para implementar el sistema

**Contenido:**
- Fase 1: Configuración de base de datos
- Fase 2: Implementación de seguridad
- Fase 3: Implementación de backend
- Fase 4: Implementación de frontend
- Checklist de implementación
- Testing end-to-end

**Audiencia:** Todos los implementadores

---

## Architecture Decision Records (ADRs)

Los ADRs documentan las decisiones arquitectónicas clave y su razonamiento.

### [ADR-001: RBAC Implementation Strategy](../decisions/adr-001-rbac-implementation.md)
**Decisión:** Implementar RBAC híbrido con tabla DB + verificación en múltiples capas

**Alternativas Consideradas:**
- ❌ RBAC basado en JWT claims
- ❌ RBAC con tabla + cache (Redis)
- ✅ RBAC híbrido (seleccionada)

**Justificación:**
- Actualización de roles instantánea
- Sin infraestructura adicional (Redis)
- Defensa en profundidad
- Escalable a permisos granulares

---

### [ADR-002: Database Schema Design](../decisions/adr-002-database-schema.md)
**Decisión:** Schema modular iterativo con tablas core ahora, extensiones futuras

**Tablas Core:**
- user_roles: RBAC
- user_profiles: Metadatos extendidos
- audit_logs: Auditoría inmutable
- system_settings: Configuración

**Justificación:**
- Balance entre completitud y simplicidad
- Iterativo y escalable
- Cubre necesidades inmediatas

---

### [ADR-003: API Route Structure](../decisions/adr-003-api-route-structure.md)
**Decisión:** Híbrido de API Routes + Server Actions

**Justificación:**
- API Routes: CRUD, listados, integraciones externas
- Server Actions: Mutaciones desde formularios
- RESTful para documentación y testing
- Type-safe con TypeScript

---

### [ADR-004: Security Layers](../decisions/adr-004-security-layers.md)
**Decisión:** Defensa en profundidad con 5 capas de seguridad

**Capas:**
1. Middleware: Autenticación básica
2. Layout/Page: Autorización de rutas
3. API Routes/Server Actions: Autorización de operaciones
4. Database Queries: Queries parametrizadas
5. RLS Policies: Última línea de defensa

**Justificación:**
- Máxima seguridad
- Cada capa independiente
- Fail-safe si una falla

---

## Diagramas de Arquitectura

### Diagrama de Flujo de Autenticación y Autorización

```
Usuario → Middleware → Layout/Page → API/Action → Database → RLS
  ↓          ↓            ↓              ↓            ↓         ↓
Session   Redirect    requireAdmin   Validate   Parametrized  Policies
Valid?    if no auth  or requireMod  Input      Queries       Enforce
```

### Diagrama de Capas del Sistema

```
┌────────────────────────────────────────────┐
│  Presentation Layer                        │
│  - Server Components (fetch data)          │
│  - Client Components (interactivity)       │
└────────────────────────────────────────────┘
                   ↓
┌────────────────────────────────────────────┐
│  Authorization Layer                       │
│  - requireAdmin()                          │
│  - requireModerator()                      │
│  - hasPermission()                         │
└────────────────────────────────────────────┘
                   ↓
┌────────────────────────────────────────────┐
│  Business Logic Layer                      │
│  - API Routes (GET/POST/PUT/DELETE)        │
│  - Server Actions (form submissions)       │
│  - Queries (read operations)               │
│  - Mutations (write operations)            │
└────────────────────────────────────────────┘
                   ↓
┌────────────────────────────────────────────┐
│  Data Access Layer                         │
│  - Supabase Client (type-safe)             │
│  - Audit Log System                        │
└────────────────────────────────────────────┘
                   ↓
┌────────────────────────────────────────────┐
│  Database Layer (PostgreSQL)               │
│  - Tables + RLS Policies                   │
│  - Triggers + Functions                    │
│  - Indexes + Views                         │
└────────────────────────────────────────────┘
```

---

## Convenciones de Código

### Naming Conventions

**Archivos y Directorios:**
- Server Components: `page.tsx`, `layout.tsx`
- Client Components: `use-client.tsx`, `*-button.tsx`
- API Routes: `route.ts`
- Server Actions: `actions.ts`
- Queries: `queries/*.ts`
- Mutations: `mutations/*.ts`

**Funciones:**
- Queries: `getUsers()`, `getUserById()`, `getAuditLogs()`
- Mutations: `updateUser()`, `createUser()`, `deleteUser()`
- Helpers: `requireAdmin()`, `hasPermission()`, `createAuditLog()`
- API Responses: `apiSuccess()`, `apiError()`, `apiValidationError()`

**Variables:**
- React state: `const [users, setUsers] = useState([])`
- Props: `interface UserCardProps { user: User }`
- Types: `type Role = 'admin' | 'moderator' | 'user'`

### File Organization

```
app/
├── admin/
│   ├── layout.tsx              # Layout con sidebar/header
│   ├── page.tsx                # Dashboard principal
│   ├── users/
│   │   ├── page.tsx            # Lista de usuarios
│   │   └── [id]/
│   │       └── page.tsx        # Detalle de usuario
│   └── ...

lib/
├── admin/
│   ├── auth/
│   │   └── require-admin.ts    # Helpers de autorización
│   ├── rbac/
│   │   ├── roles.ts            # Definición de roles
│   │   └── permissions.ts      # Definición de permisos
│   ├── queries/
│   │   ├── users.ts            # Queries de usuarios
│   │   └── audit-logs.ts       # Queries de audit logs
│   ├── mutations/
│   │   └── users.ts            # Mutations de usuarios
│   └── audit/
│       └── index.ts            # Sistema de auditoría
│
├── api/
│   ├── response.ts             # Helpers de respuestas
│   ├── auth.ts                 # Auth para API routes
│   ├── handler.ts              # Error handler wrapper
│   └── validation.ts           # Validación con Zod
│
└── supabase/
    ├── server.ts               # Cliente para Server Components
    ├── client.ts               # Cliente para Client Components
    └── middleware.ts           # Cliente para Middleware

components/
└── admin/
    ├── sidebar.tsx             # Sidebar del admin
    ├── header.tsx              # Header del admin
    ├── dashboard/
    │   ├── stats-grid.tsx
    │   └── recent-activity.tsx
    └── users/
        └── users-table.tsx
```

---

## Stack Tecnológico

### Frontend
- **Framework:** Next.js 15+ (App Router)
- **UI Library:** React 19
- **Styling:** Tailwind CSS + shadcn/ui (new-york style)
- **Icons:** Lucide React
- **Forms:** React Hook Form + Zod
- **State Management:** React Server Components (no global state)

### Backend
- **API:** Next.js API Routes + Server Actions
- **Auth:** Supabase Auth (cookie-based)
- **Database:** PostgreSQL (Supabase)
- **ORM:** Supabase Client (type-safe)
- **Validation:** Zod

### Infrastructure
- **Hosting:** Vercel
- **Database:** Supabase (PostgreSQL 15+)
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage (opcional)

---

## Principios de Diseño

### 1. Security First
- Defensa en profundidad (5 capas)
- Principio de menor privilegio
- Zero trust (verificar en cada capa)
- Audit trail completo

### 2. Type Safety
- TypeScript strict mode
- Zod para validación en runtime
- Supabase types auto-generados
- No `any` permitido

### 3. Performance
- Server Components por defecto
- Client Components solo cuando necesario
- Paginación en todas las listas
- Índices DB optimizados
- Materialized views para analytics

### 4. Developer Experience
- Código auto-documentado
- Convenciones claras
- Helpers reutilizables
- Tests comprehensivos

### 5. Maintainability
- Separación de responsabilidades
- DRY (Don't Repeat Yourself)
- SOLID principles
- Documentación completa

---

## Próximos Pasos

### Fase Actual: Implementación
1. ✅ Diseño arquitectónico completo
2. ✅ ADRs documentados
3. ⏳ Implementación de database
4. ⏳ Implementación de seguridad
5. ⏳ Implementación de backend
6. ⏳ Implementación de frontend

### Fase Futura: Mejoras
1. Sistema de permisos granulares
2. Notificaciones en tiempo real
3. Dashboard analytics avanzado
4. Exportación de datos (CSV, PDF)
5. Webhooks para integraciones
6. API pública documentada (OpenAPI)

---

## Recursos Adicionales

### Documentación Externa
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [PostgreSQL RLS Guide](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

### Ejemplos de Referencia
- [Vercel Admin Dashboard](https://vercel.com/templates/next.js/admin-dashboard-tailwind-postgres-react-nextjs)
- [Supabase Auth Example](https://github.com/supabase/supabase/tree/master/examples/auth/nextjs)

---

## Contacto y Soporte

Para preguntas sobre la arquitectura, contactar:
- **Arquitecto Principal:** Software Architect (Claude)
- **Security Guardian:** app-security-guardian
- **Database Engineer:** data-engineer
- **Tech Lead:** Tech Lead

---

**Última Actualización:** 2025-11-11
**Versión de Documentación:** 1.0
