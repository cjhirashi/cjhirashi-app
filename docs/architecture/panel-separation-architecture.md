# Arquitectura de Paneles Separados - CJHIRASHI APP v0.1

**Versión**: v0.1
**Fecha**: 2025-11-21
**Responsable**: architect (fase-2-arquitectura-leader)
**ADR Relacionado**: ADR-006

---

## Visión General

CJHIRASHI APP v0.1 implementa **dos paneles separados** con rutas, layouts y diseños distintos:

1. **Admin Panel** (`/admin/*`) - Gestión administrativa del sistema
2. **User Dashboard** (`/dashboard/*`) - Interfaz de usuario regular

---

## Estructura de Rutas

```
/
├── admin/*                    → Panel Admin (admin, moderator)
│   ├── layout.tsx            → Layout admin existente (v1.0)
│   ├── page.tsx              → Dashboard admin
│   ├── users/*               → User management (v1.0)
│   ├── roles/*               → Role management (v1.0)
│   ├── audit-logs/*          → Audit logs (v1.0)
│   ├── settings/*            → System settings (v1.0)
│   ├── analytics/*           → Analytics (pre-v0.1, con fix TS en Fase 11)
│   ├── agents/*              → **NUEVO v0.1**: Agent management
│   │   ├── page.tsx          → Listado de agentes
│   │   ├── new/page.tsx      → Crear agente
│   │   └── [id]/page.tsx     → Editar agente
│   └── corpus/*              → **NUEVO v0.1**: Corpus global management
│       ├── page.tsx          → Listado corpus global
│       ├── new/page.tsx      → Crear corpus global
│       └── [id]/page.tsx     → Detalles/editar corpus global
│
└── dashboard/*                → **NUEVO v0.1**: Panel Usuario (todos)
    ├── layout.tsx            → Layout glassmorphic
    ├── page.tsx              → Home dashboard (métricas)
    ├── agents/page.tsx       → Ver agentes disponibles
    ├── projects/*            → Gestión de proyectos personales
    │   ├── page.tsx          → Listado de proyectos
    │   ├── new/page.tsx      → Crear proyecto
    │   ├── [id]/page.tsx     → Detalles proyecto
    │   └── [id]/chat/page.tsx → Chat con agente (RAG)
    └── corpus/*              → Gestión de corpus personales
        ├── page.tsx          → Listado corpus personales
        ├── new/page.tsx      → Crear corpus personal
        └── [id]/page.tsx     → Detalles/editar corpus personal
```

---

## Control de Acceso por Panel

### Admin Panel (`/admin/*`)

**Roles Permitidos**: `admin`, `moderator`

**Middleware Protection**:
```typescript
// middleware.ts (ACTUALIZACIÓN)
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

  // ... resto de middleware
}
```

**Layout Protection** (defensa adicional):
```typescript
// app/admin/layout.tsx (EXISTENTE v1.0)
import { requireAdmin } from '@/lib/admin/auth/require-admin';

export default async function AdminLayout({ children }) {
  await requireAdmin(); // Valida admin/moderator, redirige si no

  return (
    <div className="admin-layout">
      {/* Sidebar admin existente */}
      {children}
    </div>
  );
}
```

---

### User Dashboard (`/dashboard/*`)

**Roles Permitidos**: `admin`, `moderator`, `user` (TODOS los usuarios autenticados)

**Middleware Protection**:
```typescript
// middleware.ts (ACTUALIZACIÓN)
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Dashboard protection (solo autenticación)
  if (pathname.startsWith('/dashboard')) {
    const supabase = createServerClient(/* ... */);
    await supabase.auth.getClaims();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // No validación de rol (todos los usuarios autenticados)
  }

  // ... resto de middleware
}
```

**Layout Protection**:
```typescript
// app/dashboard/layout.tsx (NUEVO v0.1)
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
      {/* Sidebar glassmorphic */}
      {children}
    </div>
  );
}
```

---

## Navegación Entre Paneles

### Para Admins y Moderators

Los admins y moderators pueden acceder a **ambas áreas**. Se implementa navegación cruzada:

**Opción 1: Toggle en Header**

```typescript
// components/navigation/PanelToggle.tsx (NUEVO v0.1)
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
          <Button variant="outline">
            Ver Dashboard de Usuario
          </Button>
        </Link>
      ) : (
        <Link href="/admin">
          <Button variant="outline">
            Ver Panel Admin
          </Button>
        </Link>
      )}
    </div>
  );
}
```

**Uso en Layouts**:
```typescript
// app/admin/layout.tsx
import { PanelToggle } from '@/components/navigation/PanelToggle';

export default async function AdminLayout({ children }) {
  const admin = await requireAdmin();

  return (
    <div>
      <header>
        {/* ... header content ... */}
        <PanelToggle userRole={admin.role} />
      </header>
      {children}
    </div>
  );
}

// app/dashboard/layout.tsx
import { PanelToggle } from '@/components/navigation/PanelToggle';

export default async function DashboardLayout({ children }) {
  const supabase = await createClient();
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  return (
    <div>
      <header>
        {/* ... header content ... */}
        <PanelToggle userRole={roleData?.role || 'user'} />
      </header>
      {children}
    </div>
  );
}
```

---

## Diferenciación Visual

### Admin Panel (pre-v0.1 - Existente)

**Diseño**: Profesional, oscuro, consistente con v1.0

**Componentes**:
- Sidebar oscuro con navegación admin
- Header con breadcrumbs
- Cards estándar (shadcn/ui sin glassmorphic)
- Tablas y formularios estándar

**Paleta de Colores**:
```css
/* Admin Panel (pre-v0.1) */
--admin-bg-primary: #0f172a; /* Slate-900 */
--admin-bg-secondary: #1e293b; /* Slate-800 */
--admin-accent: #3b82f6; /* Blue-500 */
```

---

### User Dashboard (v0.1 - Glassmorphic)

**Diseño**: Moderno, glassmorphic, cyan vibrante

**Componentes**:
- Sidebar glassmorphic con efecto de vidrio
- Header glassmorphic con user profile
- Cards con backdrop-filter y border translúcido
- Animaciones sutiles (Framer Motion)

**Paleta de Colores Glassmorphic**:
```css
/* Dashboard Glassmorphic (v0.1) */
--glass-bg: rgba(15, 23, 42, 0.7); /* Slate-900 con alpha */
--glass-border: rgba(34, 211, 238, 0.2); /* Cyan-400 con alpha */
--glass-accent: #06b6d4; /* Cyan-500 */
--glass-backdrop: blur(12px);
```

**Efecto Glassmorphic**:
```css
/* styles/glassmorphic.css (NUEVO v0.1) */
.glass-card {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-backdrop);
  -webkit-backdrop-filter: var(--glass-backdrop);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  box-shadow: 0 8px 32px 0 rgba(6, 182, 212, 0.1);
  transition: all 0.3s ease;
}

.glass-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 48px 0 rgba(6, 182, 212, 0.15);
}

.glass-sidebar {
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(16px);
  border-right: 1px solid rgba(34, 211, 238, 0.15);
}
```

---

## Branding Unificado

**Decisión**: Mismo logo, misma identidad visual en **ambas áreas**.

### Logo

**Ubicación**:
- `/public/logo.svg` (mismo archivo)
- Usado en `/admin/*` y `/dashboard/*`

**Tamaño**:
- Admin Panel: Logo estándar (48px altura)
- Dashboard: Logo con efecto glow sutil

**Implementación**:
```typescript
// components/navigation/Logo.tsx (ACTUALIZACIÓN)
import Image from 'next/image';

export function Logo({ variant = 'standard' }: { variant?: 'standard' | 'glassmorphic' }) {
  return (
    <div className={variant === 'glassmorphic' ? 'logo-glow' : ''}>
      <Image
        src="/logo.svg"
        alt="CJHIRASHI APP"
        width={48}
        height={48}
      />
    </div>
  );
}
```

```css
/* styles/glassmorphic.css */
.logo-glow {
  filter: drop-shadow(0 0 8px rgba(6, 182, 212, 0.4));
}
```

### Tipografía

**Fuentes**: Mismas en ambas áreas
- Primaria: Inter (sans-serif)
- Headings: Poppins (bold)

**Implementación**:
```typescript
// app/layout.tsx (EXISTENTE v1.0, sin cambios)
import { Inter, Poppins } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-poppins'
});

export default function RootLayout({ children }) {
  return (
    <html className={`${inter.variable} ${poppins.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

---

## Middleware Matcher (Actualización)

```typescript
// middleware.ts (ACTUALIZACIÓN para incluir /dashboard/*)
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected routes
  const protectedRoutes = ['/admin', '/dashboard', '/protected'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
    const supabase = createServerClient(/* ... */);
    const supabaseResponse = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    await supabase.auth.getClaims();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // Admin-specific check
    if (pathname.startsWith('/admin')) {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (!roleData || !['admin', 'moderator'].includes(roleData.role)) {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
    }

    // CRÍTICO: Return supabaseResponse with cookies
    supabaseResponse.cookies.setAll(supabaseResponse.cookies.getAll());
    return supabaseResponse;
  }

  return NextResponse.next();
}
```

---

## Resumen de Componentes Nuevos (Fase 12)

### Missing Components (Crear)

| Componente | Ubicación | Descripción |
|------------|-----------|-------------|
| Dashboard Layout | `app/dashboard/layout.tsx` | Layout glassmorphic principal |
| Dashboard Home | `app/dashboard/page.tsx` | Home con métricas |
| Dashboard Sidebar | `components/dashboard/Sidebar.tsx` | Sidebar glassmorphic |
| Dashboard Header | `components/dashboard/Header.tsx` | Header con user profile |
| Dashboard Card | `components/dashboard/DashboardCard.tsx` | Card reutilizable glassmorphic |
| Panel Toggle | `components/navigation/PanelToggle.tsx` | Toggle admin/dashboard |
| Glassmorphic Styles | `styles/glassmorphic.css` | CSS para efecto glassmorphic |

### Update Components (Modificar)

| Componente | Ubicación | Modificación |
|------------|-----------|--------------|
| Middleware | `middleware.ts` | Agregar `/dashboard/*` protection |
| Tailwind Config | `tailwind.config.ts` | Agregar colores cyan glassmorphic |
| Root Layout | `app/layout.tsx` | Import glassmorphic.css |
| Logo Component | `components/navigation/Logo.tsx` | Agregar variant glassmorphic |

---

## Validación de Decisión de Usuario

**Decisiones Confirmadas por Usuario** (según project-scope.md):
1. ✅ Paneles separados: `/admin/*` vs `/dashboard/*`
2. ✅ Admin/moderator pueden acceder a ambas áreas
3. ✅ Branding único (mismo logo, colores)
4. ✅ Dashboard glassmorphic más vibrante

**Estado**: ✅ **ARQUITECTURA ALINEADA CON DECISIONES DEL USUARIO**

---

**Fecha de Diseño**: 2025-11-21
**Responsable**: architect (fase-2-arquitectura-leader)
**Estado**: COMPLETO
**Próximo Paso**: Diseñar Database Schema Completo
