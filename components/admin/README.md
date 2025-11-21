# Admin Panel Layout & Navigation System

Sistema completo de layout y navegación para el panel de administración con soporte de permisos, diseño responsive y tema claro/oscuro.

## Componentes

### Layout Principal (`app/admin/layout.tsx`)

Layout principal que envuelve todas las páginas del admin. Incluye:
- Sidebar desktop (colapsable)
- Sidebar móvil (drawer/sheet)
- Header con breadcrumbs y menús
- Área de contenido responsive

```tsx
// Se aplica automáticamente a todas las rutas /admin/*
```

### Sidebar (`components/admin/sidebar.tsx`)

Barra lateral de navegación con:
- **Logo y título** del panel
- **Menú de navegación** con permisos
- **Badge de rol** del usuario
- **Botón de colapsar/expandir**
- **Información de versión**

**Características:**
- Integración completa con sistema de permisos
- Estado colapsado/expandido persistente
- Oculta automáticamente items según permisos del usuario
- Soporte para submenús expandibles
- Scroll interno para menús largos

**Permisos por sección:**
- Dashboard: Todos los usuarios
- Usuarios: `VIEW_USERS`, `CREATE_USERS`
- Roles: `VIEW_ROLES`
- Logs: `VIEW_AUDIT_LOGS`
- Analytics: `VIEW_ANALYTICS`
- Configuración: `VIEW_SETTINGS` (solo admin)

### MobileSidebar (`components/admin/mobile-sidebar.tsx`)

Versión móvil del sidebar usando Sheet (drawer):
- Se abre con el botón de menú en el header
- Misma navegación que el sidebar desktop
- Se cierra automáticamente al hacer clic en un link
- Overlay oscuro de fondo

### Header (`components/admin/header.tsx`)

Cabecera superior con:
- **Botón de menú móvil** (solo en mobile)
- **Breadcrumbs dinámicos**
- **Toggle de tema** (claro/oscuro)
- **Icono de notificaciones** (placeholder)
- **Menú de usuario** con dropdown

### UserMenu (`components/admin/user-menu.tsx`)

Dropdown del usuario con:
- Avatar (imagen o iniciales)
- Nombre y email
- Badge de rol y estado
- Opciones:
  - Ver Perfil
  - Configuración
  - Cerrar Sesión
- Función de logout integrada

### Breadcrumbs (`components/admin/breadcrumbs.tsx`)

Breadcrumbs dinámicos generados automáticamente:
- Se generan desde la ruta actual
- Links navegables a niveles superiores
- Último item sin link (página actual)
- Icono de home para ir al dashboard
- Labels traducidos al español

**Mapeo de rutas:**
```tsx
admin → Admin
users → Usuarios
roles → Roles
settings → Configuración
analytics → Analytics
audit-logs → Logs de Actividad
profile → Perfil
new → Nuevo
edit → Editar
```

### NavItem (`components/admin/nav-item.tsx`)

Item de navegación reutilizable:
- Icono + label
- Estado activo automático
- Soporte para submenús
- Integración con permisos
- Animaciones de hover y activo
- Funciona en modo colapsado

**Props:**
```tsx
interface NavItemProps {
  href: string
  icon: LucideIcon
  label: string
  collapsed?: boolean
  subItems?: SubItem[]
  visible?: boolean
}
```

### ThemeToggle (`components/admin/theme-toggle.tsx`)

Selector de tema:
- Claro
- Oscuro
- Sistema (automático)
- Integrado con `next-themes`

## Responsive Design

### Desktop (≥ 1024px)
- Sidebar visible y colapsable
- Header completo
- Contenido amplio

### Tablet (768-1023px)
- Sidebar colapsado por defecto
- Header completo
- Contenido adaptado

### Mobile (< 768px)
- Sidebar como drawer (Sheet)
- Botón de menú visible en header
- Diseño optimizado para touch

## Sistema de Permisos

La navegación se integra completamente con el sistema de permisos de `@/lib/auth`:

```tsx
import { usePermission } from '@/lib/auth/hooks'
import { Permission } from '@/lib/auth/types'

// En el componente
const canViewUsers = usePermission(Permission.VIEW_USERS)

// El NavItem se oculta automáticamente
<NavItem
  href="/admin/users"
  icon={Users}
  label="Usuarios"
  visible={canViewUsers}
/>
```

**Permisos disponibles:**
- `VIEW_USERS`, `CREATE_USERS`, `EDIT_USERS`, `DELETE_USERS`
- `VIEW_ROLES`, `EDIT_ROLES`
- `VIEW_AUDIT_LOGS`
- `VIEW_SETTINGS`, `EDIT_SETTINGS`
- `VIEW_ANALYTICS`
- `MANAGE_USER_ROLES`

**Roles por defecto:**
- **Admin**: Todos los permisos
- **Moderator**: Vista de usuarios, roles, logs, analytics
- **User**: Solo dashboard

## Páginas de Ejemplo

Se incluyen páginas placeholder para cada sección:

- `/admin` - Dashboard principal
- `/admin/users` - Gestión de usuarios
- `/admin/roles` - Gestión de roles
- `/admin/audit-logs` - Logs de actividad
- `/admin/analytics` - Analytics y métricas
- `/admin/settings` - Configuración del sistema

Cada página tiene protección de permisos implementada.

## Accesibilidad

### Navegación por teclado
- Tab para navegar entre elementos
- Enter/Space para activar botones
- Escape para cerrar menús/modales

### ARIA Labels
- Botones con `aria-label` descriptivo
- Breadcrumbs con `aria-label="Breadcrumb"`
- Último breadcrumb con `aria-current="page"`
- Links con texto descriptivo

### Focus States
- Estados de focus visibles en todos los elementos
- Outline personalizado según el tema
- Focus trap en modales y dropdowns

### Screen Readers
- Textos descriptivos en iconos
- `sr-only` para textos ocultos pero accesibles
- Estructura semántica correcta (nav, header, main)

## Estilos y Tema

### Variables CSS
El sistema usa las variables de shadcn/ui:
- `--background`
- `--foreground`
- `--card`
- `--primary`
- `--muted`
- `--accent`
- `--border`
- etc.

### Clases Tailwind comunes
- `h-screen` - Altura completa
- `flex flex-col` - Layout vertical
- `border-r` - Bordes
- `bg-background` - Fondos
- `text-muted-foreground` - Textos secundarios
- `rounded-lg` - Bordes redondeados
- `shadow-sm` - Sombras sutiles

### Dark Mode
- Soporte completo con `next-themes`
- Variables CSS que se adaptan automáticamente
- Transiciones suaves entre temas
- Iconos de sol/luna en el toggle

## Extensión

### Agregar nueva sección

1. **Definir permiso** (si es necesario) en `lib/auth/types.ts`:
```tsx
export enum Permission {
  // ...
  VIEW_NEW_SECTION = 'view_new_section',
}
```

2. **Agregar al rol** en `ROLE_PERMISSIONS`:
```tsx
admin: [
  // ...
  Permission.VIEW_NEW_SECTION,
],
```

3. **Agregar al sidebar** en `components/admin/sidebar.tsx`:
```tsx
import { NewIcon } from 'lucide-react'

const canViewNewSection = usePermission(Permission.VIEW_NEW_SECTION)

<NavItem
  href="/admin/new-section"
  icon={NewIcon}
  label="Nueva Sección"
  visible={canViewNewSection}
/>
```

4. **Agregar al mobile sidebar** en `components/admin/mobile-sidebar.tsx`

5. **Agregar label** en `components/admin/breadcrumbs.tsx`:
```tsx
const SEGMENT_LABELS: Record<string, string> = {
  // ...
  'new-section': 'Nueva Sección',
}
```

6. **Crear la página** en `app/admin/new-section/page.tsx`

### Agregar submenú

```tsx
<NavItem
  href="/admin/users"
  icon={Users}
  label="Usuarios"
  visible={canViewUsers}
  subItems={[
    {
      href: '/admin/users',
      label: 'Lista',
      visible: canViewUsers,
    },
    {
      href: '/admin/users/new',
      label: 'Nuevo Usuario',
      visible: canCreateUsers,
    },
  ]}
/>
```

## Troubleshooting

### El sidebar no se colapsa
- Verificar que el estado se esté manejando correctamente
- Revisar las clases de Tailwind para transiciones

### Los items no se ocultan por permisos
- Verificar que el hook `usePermission` esté retornando correctamente
- Revisar que el usuario tenga la sesión activa
- Verificar la configuración de `ROLE_PERMISSIONS`

### Breadcrumbs no muestran el label correcto
- Agregar el mapeo en `SEGMENT_LABELS`
- Verificar que la ruta sea correcta

### El tema no cambia
- Verificar que `ThemeProvider` esté en el root layout
- Revisar que las variables CSS estén definidas
- Verificar `suppressHydrationWarning` en el tag `<html>`

## Mejoras Futuras

- [ ] Notificaciones en tiempo real
- [ ] Búsqueda global
- [ ] Atajos de teclado
- [ ] Favoritos/Quick links personalizados
- [ ] Panel de notificaciones completo
- [ ] Preferencias de usuario (sidebar colapsado por defecto, etc.)
- [ ] Animaciones más elaboradas
- [ ] Soporte para múltiples idiomas
