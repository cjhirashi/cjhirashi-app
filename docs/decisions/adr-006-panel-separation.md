# ADR-006: Arquitectura de Paneles Separados

**Fecha**: 2025-11-21
**Estado**: Aprobado
**Contexto**: CJHIRASHI APP v0.1
**Responsables**: architect, uxui-specialist (fase-2-arquitectura-leader)

---

## Contexto y Problema

CJHIRASHI APP v0.1 necesita proporcionar dos experiencias de usuario distintas:
1. **Admin Panel**: Gestión administrativa del sistema (agentes, corpus global, usuarios)
2. **User Dashboard**: Interfaz de usuario regular (proyectos, corpus personal, chat)

**Problema**: ¿Cómo estructurar la aplicación para soportar ambas experiencias sin duplicar código ni comprometer UX?

**Opciones consideradas**:
- **Opción A**: Panel único con secciones condicionales por rol
- **Opción B**: Paneles separados con rutas distintas
- **Opción C**: Subdominios separados (admin.app.com vs app.com)

---

## Decisión

**Adoptamos Opción B: Paneles Separados con rutas distintas**

### Estructura de Rutas

```
/admin/*          →  Admin Panel (solo admin + moderator)
/dashboard/*      →  User Dashboard (todos los usuarios autenticados)
```

### Características Clave

1. **Layouts Independientes**:
   - `/app/admin/layout.tsx`: Layout administrativo profesional
   - `/app/dashboard/layout.tsx`: Layout glassmorphic moderno

2. **Control de Acceso Diferenciado**:
   - Middleware valida rol antes de permitir acceso
   - RLS policies aseguran datos según rol

3. **Navegación Cruzada** (para admins):
   - Componente `PanelToggle` en header
   - Admins/Moderators pueden navegar entre ambas áreas sin perder sesión

4. **Branding Unificado**:
   - Mismo logo en ambas áreas
   - Misma tipografía (Inter + Poppins)
   - Paleta de colores consistente (diferentes acentos)

---

## Justificación

### Ventajas de Opción B (Seleccionada)

✅ **Separación Clara de Responsabilidades**:
- Admin panel enfocado en gestión administrativa
- Dashboard enfocado en experiencia de usuario final
- Cada panel optimizado para su público objetivo

✅ **UX Optimizada por Rol**:
- Admin panel: Profesional, eficiente, orientado a datos
- Dashboard: Moderno, vibrante, orientado a interacción

✅ **Mantenibilidad**:
- Código organizado por contexto (admin vs user)
- Facilita agregar funcionalidades por área
- Reduce riesgo de conflictos en actualizaciones

✅ **Escalabilidad**:
- Facilita agregar más paneles en el futuro (ej: `/partner/*`)
- Permite optimizar cada área independientemente
- Performance: lazy loading por panel

✅ **Testing**:
- Tests unitarios por panel
- Tests de integración aislados
- Facilita mocking de permisos

### Desventajas de Opciones Descartadas

❌ **Opción A (Panel Único)**:
- UI compleja con condicionales por rol
- Dificulta optimización de UX por público
- Código difícil de mantener (muchos `if (role === 'admin')`)
- Performance: carga componentes innecesarios

❌ **Opción C (Subdominios)**:
- Requiere infraestructura adicional (DNS, certificates)
- Complejidad en compartir sesiones
- Costos de hosting duplicados
- Overkill para v0.1

---

## Arquitectura Técnica

### Middleware Protection

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin panel protection
  if (pathname.startsWith('/admin')) {
    const supabase = createServerClient(/* ... */);
    await supabase.auth.getClaims();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // Check role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!roleData || !['admin', 'moderator'].includes(roleData.role)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  // Dashboard protection (solo autenticación)
  if (pathname.startsWith('/dashboard')) {
    const supabase = createServerClient(/* ... */);
    await supabase.auth.getClaims();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  return NextResponse.next();
}
```

### Layout Protection (Defensa Adicional)

```typescript
// app/admin/layout.tsx
import { requireAdmin } from '@/lib/admin/auth/require-admin';

export default async function AdminLayout({ children }) {
  await requireAdmin(); // Valida admin/moderator, redirige si no

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main>{children}</main>
    </div>
  );
}

// app/dashboard/layout.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({ children }) {
  const supabase = await createClient();
  await supabase.auth.getClaims();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth/login');
  }

  return (
    <div className="dashboard-layout glassmorphic">
      <DashboardSidebar />
      <main>{children}</main>
    </div>
  );
}
```

### Panel Toggle Component

```tsx
// components/navigation/PanelToggle.tsx
'use client';

import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function PanelToggle({ userRole }: { userRole: 'admin' | 'moderator' | 'user' }) {
  const pathname = usePathname();
  const isAdminPanel = pathname.startsWith('/admin');

  // Solo mostrar toggle para admins y moderators
  if (!['admin', 'moderator'].includes(userRole)) {
    return null;
  }

  return (
    <div className="panel-toggle">
      {isAdminPanel ? (
        <Link href="/dashboard">
          <Button variant="outline">Ver Dashboard de Usuario</Button>
        </Link>
      ) : (
        <Link href="/admin">
          <Button variant="outline">Ver Panel Admin</Button>
        </Link>
      )}
    </div>
  );
}
```

---

## Impacto en el Sistema

### Componentes Nuevos

| Componente | Ubicación | Descripción |
|------------|-----------|-------------|
| Dashboard Layout | `app/dashboard/layout.tsx` | Layout glassmorphic principal |
| Dashboard Sidebar | `components/dashboard/Sidebar.tsx` | Sidebar glassmorphic con navegación |
| Dashboard Header | `components/dashboard/Header.tsx` | Header con user profile |
| Panel Toggle | `components/navigation/PanelToggle.tsx` | Toggle admin/dashboard |

### Componentes Actualizados

| Componente | Modificación |
|------------|--------------|
| Middleware | Agregar protección `/dashboard/*` |
| Tailwind Config | Agregar colores cyan glassmorphic |
| globals.css | Importar `glassmorphic.css` |

### Rutas Nuevas (Dashboard)

```
/dashboard/                     → Home con métricas
/dashboard/projects/            → Listado de proyectos
/dashboard/projects/new         → Crear proyecto
/dashboard/projects/[id]        → Detalles de proyecto
/dashboard/projects/[id]/chat   → Chat con agente
/dashboard/agents/              → Ver agentes disponibles
/dashboard/corpus/              → Listado de corpus personales
/dashboard/corpus/new           → Crear corpus personal
/dashboard/corpus/[id]          → Detalles de corpus personal
```

---

## Diferenciación Visual

### Admin Panel (Profesional)

```css
/* Admin Panel */
--admin-accent: #3b82f6;        /* Blue-500 */
--admin-bg: #1e293b;            /* Slate-800 */
--admin-card: solid #1e293b;    /* Solid card */
```

**Características**:
- Sidebar oscuro sólido
- Cards estándar (sin glassmorphic)
- Tablas y formularios eficientes
- Enfoque en densidad de información

### User Dashboard (Moderno Glassmorphic)

```css
/* Dashboard Glassmorphic */
--glass-accent: #06b6d4;                /* Cyan-500 */
--glass-bg: rgba(15, 23, 42, 0.7);      /* Slate-900 con alpha */
--glass-border: rgba(34, 211, 238, 0.2); /* Cyan-400 con alpha */
--glass-backdrop: blur(12px);
```

**Características**:
- Sidebar glassmorphic con efecto de vidrio
- Cards con backdrop-filter y border translúcido
- Animaciones sutiles (Framer Motion)
- Enfoque en experiencia visual

---

## Consideraciones de Performance

1. **Lazy Loading**:
   - Componentes de `/dashboard/*` solo se cargan si usuario accede
   - Admin components solo si tiene permisos

2. **Code Splitting**:
   - Next.js automáticamente hace code splitting por ruta
   - Resultado: Bundles más pequeños por área

3. **Caching**:
   - Server Components cached por defecto
   - Invalidación selectiva por área

---

## Consideraciones de Seguridad

### Defense in Depth (5 Capas)

1. **Middleware**: Session validation + role check (admin panel)
2. **Layout**: `requireAdmin()` o `requireAuth()` (re-validación)
3. **API Routes**: `requireApiRole()` (backend protection)
4. **Server Actions**: CSRF protection (built-in NextJS)
5. **RLS Policies**: PostgreSQL row-level security (última defensa)

**Garantía**: Usuario sin permisos NO puede acceder a `/admin/*` incluso con manipulación de URL.

---

## Alternativas Consideradas y Descartadas

### 1. Panel Único con Tabs por Rol

**Concepto**: Una sola ruta `/app/*` con tabs condicionales según rol.

**Descartado porque**:
- UI compleja con muchos condicionales
- Dificulta optimización de UX por público
- Performance: carga componentes innecesarios
- Testing: difícil aislar tests por rol

### 2. Subdominios Separados

**Concepto**: `admin.cjhirashi.com` vs `cjhirashi.com`

**Descartado porque**:
- Requiere infraestructura adicional (DNS, SSL)
- Complejidad en compartir sesiones (cross-domain)
- Costos de hosting duplicados
- Overkill para v0.1 (puede considerarse en v2.0+ si escala)

### 3. Aplicaciones Separadas (Monorepo)

**Concepto**: Dos apps NextJS independientes en monorepo (Turborepo).

**Descartado porque**:
- Complejidad de setup
- Duplicación de código compartido
- CI/CD más complejo
- Innecesario para v0.1

---

## Decisiones Relacionadas

- **ADR-002: Database Schema** - RLS policies separadas por rol
- **ADR-003: API Route Structure** - Endpoints separados `/api/admin/*` vs `/api/*`
- **ADR-004: Security Layers** - Defense in depth aplicado por panel
- **ADR-007: Modelo de Proyectos Personales** - Solo en dashboard (user area)

---

## Referencias

- [NextJS App Router Documentation](https://nextjs.org/docs/app)
- [NextJS Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- `docs/architecture/panel-separation-architecture.md` - Diseño técnico detallado

---

**Fecha de Decisión**: 2025-11-21
**Estado**: ✅ Aprobado
**Próximo ADR**: ADR-007 (Modelo de Proyectos Personales)
