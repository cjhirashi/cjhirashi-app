# Dashboard Principal - Estructura Visual

## Árbol de Directorios

```
C:\PROYECTOS\APPS\cjhirashi-app\
│
├── components/dashboard/
│   ├── stats-card.tsx                   (111 líneas) - Tarjeta de estadística
│   ├── user-status-chart.tsx            (82 líneas)  - Gráfico pie/donut
│   ├── role-distribution-chart.tsx      (94 líneas)  - Gráfico barras
│   ├── recent-activity-table.tsx        (120 líneas) - Tabla actividad
│   ├── top-users-list.tsx               (162 líneas) - Top 5 usuarios
│   ├── system-status-card.tsx           (115 líneas) - Estado sistema
│   ├── quick-actions.tsx                (87 líneas)  - Acciones rápidas
│   ├── index.tsx                        (23 líneas)  - Exports
│   └── README.md                        - Documentación componentes
│
├── hooks/
│   └── use-refresh-stats.ts             (45 líneas)  - Hook refrescar
│
├── app/api/admin/
│   └── refresh-stats/
│       └── route.ts                     (54 líneas)  - API endpoint
│
├── app/admin/
│   ├── page.tsx                         (175 líneas) - Dashboard
│   ├── layout.tsx                       (existente)  - Layout
│   ├── DASHBOARD_GUIDE.md               - Guía detallada
│   └── ...otras páginas
│
└── Documentación
    ├── DASHBOARD_IMPLEMENTATION.md      - Resumen técnico
    ├── DASHBOARD_CHECKLIST.md           - Lista de control
    └── DASHBOARD_STRUCTURE.md           - Este archivo
```

## Componentes

### 1. StatsCard (111 líneas)
**Propósito**: Mostrar una métrica individual con icon, valor y tendencia

**Props**:
- title: string
- value: number | string
- description?: string
- icon?: LucideIcon
- trend?: { value: number, isPositive: boolean, label: string }
- variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
- loading?: boolean

**Características**:
- Skeleton loader para estado de carga
- Badge de tendencia colorizado
- Icono representativo
- Left border coloreado según variante

**Variantes de Color**:
- default: gris (#6b7280)
- success: verde (#10b981)
- warning: amarillo (#f59e0b)
- danger: rojo (#ef4444)
- info: azul (#3b82f6)

### 2. UserStatusChart (82 líneas)
**Propósito**: Visualizar distribución de usuarios por estado

**Datos**:
- active (verde #10b981)
- inactive (gris #6b7280)
- suspended (rojo #ef4444)
- pending (amarillo #f59e0b)

**Librería**: Recharts (PieChart, Pie, Cell, Tooltip, Legend)

**Características**:
- Pie/Donut chart responsive
- Tooltip con detalles
- Legend con nombres en español
- Labels en chart

### 3. RoleDistributionChart (94 líneas)
**Propósito**: Mostrar distribución de usuarios por rol

**Datos**:
- admin (azul #3b82f6)
- moderator (púrpura #a855f7)
- user (gris #6b7280)

**Librería**: Recharts (BarChart, Bar, XAxis, YAxis, Tooltip)

**Características**:
- Bar chart horizontal responsive
- Percentages en grid debajo
- Grid de 3 columnas con stats
- Layout horizontal 120px para labels

### 4. RecentActivityTable (120 líneas)
**Propósito**: Mostrar últimas actividades del sistema

**Columnas**:
- Avatar (AvatarFallback con iniciales)
- Usuario (nombre + email)
- Acción (badge + resource type)
- Timestamp (relativo con date-fns)

**Características**:
- Scroll area 400px altura
- Max 10 items por defecto
- Categorías coloreadas (auth, user_mgmt, content, system)
- Link a audit logs completos
- Formato compacto con truncate

### 5. TopUsersList (162 líneas)
**Propósito**: Mostrar los 5 usuarios más activos

**Información por usuario**:
- Avatar + nombre + email
- Badges: rol + estado
- Barra de progreso (% del máximo)
- Desglose: hoy/semana/mes

**Características**:
- Links a perfil de usuario
- Hover states interactivos
- Botón "Ver todos" al final
- Cards con border y transiciones

### 6. SystemStatusCard (115 líneas)
**Propósito**: Mostrar estado del sistema y controles

**Información**:
- Conexión BD (verde/rojo)
- Última actualización (timestamp + "hace X")
- Versión app
- Botón refrescar

**Características**:
- Integración con hook useRefreshStats
- Loading state con spinner
- Error display con AlertCircle
- Disabled para no-admins
- Separator entre secciones

### 7. QuickActions (87 líneas)
**Propósito**: Acciones rápidas basadas en rol

**Acciones**:
- Usuarios (todas las roles)
- Roles (todas las roles)
- Auditoría (moderator+)
- Analítica (admin+)
- Configuración (admin+)

**Layout**:
- Grid responsive: 5 col desktop, 2-4 col tablet, 2 col mobile
- Botones outline con icono + label + descripción
- Hover states con cambio de color

## Página Principal (/admin)

### Layout General
```
┌─────────────────────────────────────────────┐
│  Encabezado                                 │
│  "Panel de Administración"                  │
│  "Bienvenido, user@email.com"               │
└─────────────────────────────────────────────┘

┌──────────────────┬──────────────────┐       ┬─ Stats 1
│  Stats Card 1    │  Stats Card 2    │       │  Stats 2
├──────────────────┼──────────────────┤       │  Stats 3
│  Stats Card 3    │  Stats Card 4    │       │  Stats 4
├──────────────────┼──────────────────┤       │  Stats 5
│  Stats Card 5    │  Stats Card 6    │       │  Stats 6
└──────────────────┴──────────────────┘       ┴─ (4 col en XL)

┌──────────────────────┬──────────────────────┐
│  User Status Chart   │ Role Distribution    │
│  (Pie Chart)         │ (Bar Chart)          │
└──────────────────────┴──────────────────────┘

┌──────────────────────┬──────────────────────┐
│ Recent Activity      │ Top Users            │
│ (Table - scroll)     │ (List - cards)       │
│                      ├──────────────────────┤
│                      │ System Status Card   │
└──────────────────────┴──────────────────────┘

┌──────────────────────────────────────────────┐
│  Quick Actions                               │
│  [Users] [Roles] [Logs] [Analytics] [Config] │
└──────────────────────────────────────────────┘
```

## Data Flow

### Server-side
```
Admin Page (Server Component)
    ↓
Promise.all([
  getCurrentUser(),
  getDashboardStats(),
  getRecentActivity(10),
  getUserActivitySummary(5)
])
    ↓
Parallel fetch from database views
    ↓
Data passed to components as props
```

### Client-side
```
Charts (Client Components)
    ↓
Recharts renders with ResponsiveContainer
    ↓
Interactive tooltips and legends
    ↓
User interactions (hover, click)
    ↓
System Status Card
    ↓
useRefreshStats hook
    ↓
POST /api/admin/refresh-stats
```

## Colores por Categoría

### Estados de Usuario
```
Active    → Verde #10b981 (bg-green-500)
Inactive  → Gris #6b7280 (bg-gray-500)
Suspended → Rojo #ef4444 (bg-red-500)
Pending   → Amarillo #f59e0b (bg-amber-500)
```

### Roles
```
Admin     → Azul #3b82f6 (bg-blue-500)
Moderator → Púrpura #a855f7 (bg-violet-500)
User      → Gris #6b7280 (bg-gray-500)
```

### Categorías de Actividad
```
Authentication   → Azul (bg-blue-100)
User Management  → Púrpura (bg-purple-100)
Content Mgmt     → Verde (bg-green-100)
System           → Naranja (bg-orange-100)
Default          → Gris (bg-gray-100)
```

### Variantes de Stats Card
```
default → Gray border-l-slate-400
success → Green border-l-green-500
warning → Yellow border-l-yellow-500
danger  → Red border-l-red-500
info    → Blue border-l-blue-500
```

## Responsividad

### Breakpoints
```
Mobile    < 768px    (Tailwind: base)
Tablet    768px      (Tailwind: md)
Desktop   1024px     (Tailwind: lg)
XL        1280px     (Tailwind: xl)
2XL       1536px     (Tailwind: 2xl)
```

### Grid Layout
```
Stats Cards:
  Mobile: grid-cols-1
  Tablet: md:grid-cols-2
  Desktop: lg:grid-cols-3
  XL: xl:grid-cols-4

Charts:
  Mobile: 1 col (stacked)
  Tablet: md:grid-cols-2
  Desktop: md:grid-cols-2

Activity & Users:
  Mobile: 1 col (stacked)
  Tablet: md:grid-cols-2
  Desktop: md:grid-cols-2

Quick Actions:
  Mobile: grid-cols-2
  Tablet: md:grid-cols-3
  Desktop: lg:grid-cols-4
  XL: xl:grid-cols-5
```

## Integración con BD

### Vistas Materializadas Usadas

**admin_dashboard_stats**
- total_users
- active_users, inactive_users, suspended_users, pending_users
- new_users_today, new_users_week, new_users_month
- total_admins, total_moderators, total_regular_users
- actions_today, actions_week
- refreshed_at

**recent_activity**
- id, action, action_category
- resource_type, resource_id
- created_at
- user_email, user_name, user_role

**user_activity_summary**
- id, full_name, email, role, status
- last_login_at, user_since
- total_actions, actions_today, actions_week, actions_month

## API Endpoints

### POST /api/admin/refresh-stats
```
Request:
  Method: POST
  Path: /api/admin/refresh-stats
  Auth: Bearer session-token

Response (200):
  {
    "success": true,
    "message": "Dashboard statistics refreshed successfully",
    "timestamp": "2024-01-15T10:30:00Z"
  }

Error Responses:
  401: "Unauthorized: User not authenticated"
  403: "Forbidden: Admin access required"
  500: "Internal Server Error" + message
```

## Dependencias

### Nuevas
- **recharts**: ^3.14.0 (36 packages)
  - PieChart, Pie, Cell
  - BarChart, Bar
  - XAxis, YAxis, CartesianGrid
  - Tooltip, Legend
  - ResponsiveContainer

- **date-fns**: ^3.6.0
  - formatDistanceToNow
  - es (Spanish locale)

### Existentes
- next: ^15.0.0
- react: ^19.0.0
- typescript: ^5.0.0
- tailwindcss: ^4.0.0
- lucide-react: ^0.511.0
- shadcn/ui: (installed)

## Líneas de Código

```
Componentes:
  stats-card.tsx              111
  user-status-chart.tsx        82
  role-distribution-chart      94
  recent-activity-table       120
  top-users-list.tsx          162
  system-status-card.tsx      115
  quick-actions.tsx            87
  index.tsx                    23
  ────────────────────────────────
  Subtotal                    794

App:
  page.tsx (updated)          175

API & Hooks:
  route.ts                     54
  use-refresh-stats.ts         45
  ────────────────────────────────
  Subtotal                     99

Documentación:
  components/dashboard/README  200+
  app/admin/DASHBOARD_GUIDE   500+
  DASHBOARD_IMPLEMENTATION    600+
  DASHBOARD_CHECKLIST         400+
  DASHBOARD_STRUCTURE         400+
  ────────────────────────────────
  Subtotal                   2100+

TOTAL: ~3000+ líneas (incluyendo documentación)
Código: ~1100 líneas
Docs: ~2100+ líneas
```

## Status Final

| Aspecto | Status |
|---------|--------|
| Build | ✓ Exitoso |
| TypeScript | ✓ 0 errores |
| Linting | ✓ Limpio |
| Funcionalidad | ✓ 100% |
| Documentación | ✓ Completa |
| Accesibilidad | ✓ WCAG AA |
| Responsivo | ✓ Todos los breakpoints |
| Seguridad | ✓ Validado |
| Performance | ✓ Optimizado |
| Production | ✓ Ready |

---

**Versión**: 1.0.0
**Fecha**: 11 de Noviembre, 2024
**Status**: Implementación Completada
