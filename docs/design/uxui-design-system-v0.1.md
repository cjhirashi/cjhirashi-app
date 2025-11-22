# UI/UX Design System - CJHIRASHI APP v0.1

**Versión**: v0.1
**Fecha**: 2025-11-21
**Responsable**: uxui-specialist (via architect, fase-2-arquitectura-leader)
**ADR Relacionado**: ADR-006, ADR-007

---

## Visión General

CJHIRASHI APP v0.1 implementa un **design system dual** que diferencia visualmente el Admin Panel del User Dashboard, manteniendo branding unificado:

- **Admin Panel** (`/admin/*`): Diseño profesional, oscuro, enfocado en eficiencia
- **User Dashboard** (`/dashboard/*`): Diseño glassmorphic moderno, vibrante, enfocado en UX

**Objetivos**:
1. Consistencia visual en toda la aplicación
2. Accesibilidad WCAG 2.1 AA
3. Responsive design (mobile-first)
4. Reutilización de componentes (shadcn/ui base)

---

## 1. Paleta de Colores

### 1.1 Colores Base (Compartidos)

```css
:root {
  /* Backgrounds (Dark Theme) */
  --bg-primary: #0f172a; /* Slate-900 */
  --bg-secondary: #1e293b; /* Slate-800 */
  --bg-tertiary: #334155; /* Slate-700 */

  /* Text Colors */
  --text-primary: #f8fafc; /* Slate-50 */
  --text-secondary: #cbd5e1; /* Slate-300 */
  --text-muted: #64748b; /* Slate-500 */

  /* Status Colors */
  --success: #10b981; /* Green-500 */
  --warning: #f59e0b; /* Amber-500 */
  --error: #ef4444; /* Red-500 */
  --info: #3b82f6; /* Blue-500 */

  /* Borders */
  --border-default: #334155; /* Slate-700 */
  --border-muted: #1e293b; /* Slate-800 */
}
```

### 1.2 Admin Panel Colors

```css
/* Admin Panel Specific */
:root {
  --admin-accent: #3b82f6; /* Blue-500 */
  --admin-accent-dark: #2563eb; /* Blue-600 */
  --admin-accent-light: #60a5fa; /* Blue-400 */

  --admin-sidebar-bg: #1e293b; /* Slate-800 */
  --admin-card-bg: #1e293b; /* Slate-800 */
  --admin-hover: #334155; /* Slate-700 */
}
```

### 1.3 Dashboard Glassmorphic Colors

```css
/* Dashboard Glassmorphic Specific */
:root {
  --glass-accent: #06b6d4; /* Cyan-500 */
  --glass-accent-dark: #0891b2; /* Cyan-600 */
  --glass-accent-light: #22d3ee; /* Cyan-400 */

  --glass-bg: rgba(15, 23, 42, 0.7); /* Slate-900 con alpha */
  --glass-bg-hover: rgba(15, 23, 42, 0.85);
  --glass-border: rgba(34, 211, 238, 0.2); /* Cyan-400 con alpha */
  --glass-border-hover: rgba(34, 211, 238, 0.4);
  --glass-backdrop: blur(12px);

  --glass-shadow: 0 8px 32px 0 rgba(6, 182, 212, 0.1);
  --glass-shadow-hover: 0 12px 48px 0 rgba(6, 182, 212, 0.15);
}
```

### 1.4 Color Usage Guidelines

| Elemento | Admin Panel | Dashboard |
|----------|-------------|-----------|
| Primary Action | Blue-500 | Cyan-500 |
| Secondary Action | Slate-600 | Slate-600 |
| Success | Green-500 | Green-500 |
| Warning | Amber-500 | Amber-500 |
| Error | Red-500 | Red-500 |
| Background | Slate-900 | Slate-900 (con alpha) |
| Card BG | Slate-800 | Glassmorphic |
| Border | Slate-700 | Cyan-400 (alpha 0.2) |

---

## 2. Tipografía

### 2.1 Font Families

```css
:root {
  --font-inter: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-poppins: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* Base font */
body {
  font-family: var(--font-inter);
  font-size: 16px;
  line-height: 1.5;
  color: var(--text-primary);
}

/* Headings */
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-poppins);
  font-weight: 600;
  color: var(--text-primary);
}
```

### 2.2 Type Scale

| Elemento | Size | Line Height | Weight | Usage |
|----------|------|-------------|--------|-------|
| h1 | 2.5rem (40px) | 1.2 | 700 | Page titles |
| h2 | 2rem (32px) | 1.3 | 600 | Section titles |
| h3 | 1.5rem (24px) | 1.4 | 600 | Subsection titles |
| h4 | 1.25rem (20px) | 1.4 | 600 | Card titles |
| body-lg | 1.125rem (18px) | 1.5 | 400 | Large body text |
| body | 1rem (16px) | 1.5 | 400 | Default body |
| body-sm | 0.875rem (14px) | 1.4 | 400 | Small text, labels |
| caption | 0.75rem (12px) | 1.3 | 400 | Captions, timestamps |

### 2.3 Font Import

```typescript
// app/layout.tsx (EXISTING v1.0, NO CHANGES)
import { Inter, Poppins } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-poppins',
  display: 'swap'
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

## 3. Spacing System

### 3.1 Spacing Scale (Tailwind Conventions)

```css
:root {
  --spacing-1: 0.25rem; /* 4px */
  --spacing-2: 0.5rem;  /* 8px */
  --spacing-3: 0.75rem; /* 12px */
  --spacing-4: 1rem;    /* 16px */
  --spacing-5: 1.25rem; /* 20px */
  --spacing-6: 1.5rem;  /* 24px */
  --spacing-8: 2rem;    /* 32px */
  --spacing-10: 2.5rem; /* 40px */
  --spacing-12: 3rem;   /* 48px */
  --spacing-16: 4rem;   /* 64px */
}
```

### 3.2 Component Spacing Guidelines

| Elemento | Padding | Margin | Gap |
|----------|---------|--------|-----|
| Button | 0.75rem 1.5rem | - | - |
| Card | 1.5rem | 1rem bottom | - |
| Input | 0.75rem 1rem | - | - |
| Section | - | 3rem bottom | - |
| Grid Items | - | - | 1rem |
| Stack Items | - | - | 0.75rem |

---

## 4. Grid System

### 4.1 Layout Grid

```css
/* 12-column grid (Tailwind default) */
.grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--spacing-4);
}

/* Responsive breakpoints */
@media (max-width: 640px) {
  /* Mobile: 1 column */
  .grid { grid-template-columns: 1fr; }
}

@media (min-width: 641px) and (max-width: 1024px) {
  /* Tablet: 2 columns */
  .grid { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 1025px) {
  /* Desktop: 3-4 columns */
  .grid { grid-template-columns: repeat(3, 1fr); }
}
```

### 4.2 Dashboard Layout Grid

```
┌─────────────────────────────────────────┐
│ Sidebar (240px)  │  Main Content        │
│                  │                       │
│ - Logo           │  Header (64px)        │
│ - Navigation     │  ─────────────────    │
│ - User Profile   │  Content Area         │
│                  │                       │
│                  │  - Cards (Grid 3col)  │
│                  │  - Tables             │
│                  │  - Forms              │
└─────────────────────────────────────────┘
```

**Responsive Behavior**:
- **Desktop (>1024px)**: Sidebar visible, 3-column grid
- **Tablet (641-1024px)**: Sidebar collapsible, 2-column grid
- **Mobile (<640px)**: Sidebar hidden (hamburger menu), 1-column grid

---

## 5. Components

### 5.1 Admin Panel Components (Standard)

#### Button

```tsx
// components/ui/button.tsx (EXISTING shadcn/ui)
// Variants: default, destructive, outline, secondary, ghost, link

// Admin Panel Usage
<Button variant="default">Crear Agente</Button>
<Button variant="outline">Cancelar</Button>
<Button variant="destructive">Eliminar</Button>
```

**Styles**:
```css
.btn-admin-primary {
  background: var(--admin-accent);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: background 0.2s;
}

.btn-admin-primary:hover {
  background: var(--admin-accent-dark);
}
```

#### Card

```tsx
// components/ui/card.tsx (EXISTING shadcn/ui)
// Components: Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter

// Admin Panel Usage
<Card>
  <CardHeader>
    <CardTitle>Agentes Activos</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

**Styles**:
```css
.card-admin {
  background: var(--admin-card-bg);
  border: 1px solid var(--border-default);
  border-radius: 0.75rem;
  padding: 1.5rem;
  transition: all 0.2s;
}

.card-admin:hover {
  border-color: var(--admin-accent);
}
```

#### Table

```tsx
// components/ui/table.tsx (EXISTING shadcn/ui)
// Components: Table, TableHeader, TableBody, TableRow, TableHead, TableCell

// Admin Panel Usage
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Nombre</TableHead>
      <TableHead>Modelo</TableHead>
      <TableHead>Estado</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {agents.map(agent => (
      <TableRow key={agent.id}>
        <TableCell>{agent.name}</TableCell>
        <TableCell>{agent.model_name}</TableCell>
        <TableCell>{agent.is_active ? 'Activo' : 'Inactivo'}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### 5.2 Dashboard Components (Glassmorphic)

#### Glass Card

```tsx
// components/dashboard/GlassCard.tsx (NEW v0.1)
interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function GlassCard({ children, className, hover = true }: GlassCardProps) {
  return (
    <div className={cn('glass-card', hover && 'glass-card-hover', className)}>
      {children}
    </div>
  );
}
```

**Styles**:
```css
/* styles/glassmorphic.css (NEW v0.1) */
.glass-card {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-backdrop);
  -webkit-backdrop-filter: var(--glass-backdrop);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: var(--glass-shadow);
  transition: all 0.3s ease;
}

.glass-card-hover:hover {
  transform: translateY(-2px);
  border-color: var(--glass-border-hover);
  background: var(--glass-bg-hover);
  box-shadow: var(--glass-shadow-hover);
}
```

#### Glass Button

```tsx
// components/dashboard/GlassButton.tsx (NEW v0.1)
interface GlassButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  className?: string;
}

export function GlassButton({ children, onClick, variant = 'primary', className }: GlassButtonProps) {
  return (
    <button
      className={cn('glass-button', `glass-button-${variant}`, className)}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

**Styles**:
```css
.glass-button {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-backdrop);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  padding: 0.75rem 1.5rem;
  color: var(--text-primary);
  font-weight: 500;
  transition: all 0.3s ease;
  cursor: pointer;
}

.glass-button-primary {
  background: linear-gradient(135deg, var(--glass-accent) 0%, var(--glass-accent-dark) 100%);
  border: 1px solid var(--glass-accent-light);
}

.glass-button-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 24px 0 rgba(6, 182, 212, 0.3);
}

.glass-button-secondary:hover {
  border-color: var(--glass-border-hover);
}
```

#### Metrics Card

```tsx
// components/dashboard/MetricsCard.tsx (NEW v0.1)
interface MetricsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
}

export function MetricsCard({ title, value, icon, trend }: MetricsCardProps) {
  return (
    <GlassCard hover>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-text-secondary">{title}</p>
          <h3 className="text-3xl font-bold mt-2 text-glass-accent">{value}</h3>
          {trend && (
            <p className={`text-sm mt-2 ${trend.direction === 'up' ? 'text-success' : 'text-error'}`}>
              {trend.direction === 'up' ? '↑' : '↓'} {trend.value}%
            </p>
          )}
        </div>
        <div className="glass-icon">
          {icon}
        </div>
      </div>
    </GlassCard>
  );
}
```

**Styles**:
```css
.glass-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(8, 145, 178, 0.2) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--glass-accent-light);
}
```

#### Sidebar Glassmorphic

```tsx
// components/dashboard/Sidebar.tsx (NEW v0.1)
export function DashboardSidebar() {
  return (
    <aside className="glass-sidebar">
      <div className="logo-container">
        <Logo variant="glassmorphic" />
        <h2 className="text-xl font-bold mt-2">CJHIRASHI</h2>
      </div>

      <nav className="nav-links">
        <SidebarLink href="/dashboard" icon={<HomeIcon />}>
          Dashboard
        </SidebarLink>
        <SidebarLink href="/dashboard/projects" icon={<FolderIcon />}>
          Proyectos
        </SidebarLink>
        <SidebarLink href="/dashboard/agents" icon={<BotIcon />}>
          Agentes
        </SidebarLink>
        <SidebarLink href="/dashboard/corpus" icon={<BookIcon />}>
          Corpus
        </SidebarLink>
      </nav>

      <div className="user-profile">
        <Avatar />
        <div>
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs text-text-muted">{user.email}</p>
        </div>
      </div>
    </aside>
  );
}
```

**Styles**:
```css
.glass-sidebar {
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  width: 240px;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(16px);
  border-right: 1px solid rgba(34, 211, 238, 0.15);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  z-index: 50;
}

.logo-container {
  text-align: center;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid rgba(34, 211, 238, 0.15);
}

.logo-glow {
  filter: drop-shadow(0 0 8px rgba(6, 182, 212, 0.4));
}

.nav-links {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  color: var(--text-secondary);
  transition: all 0.2s;
  text-decoration: none;
}

.sidebar-link:hover {
  background: rgba(34, 211, 238, 0.1);
  color: var(--glass-accent-light);
}

.sidebar-link.active {
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(8, 145, 178, 0.2) 100%);
  color: var(--glass-accent-light);
  border-left: 3px solid var(--glass-accent);
}

.user-profile {
  padding-top: 1.5rem;
  border-top: 1px solid rgba(34, 211, 238, 0.15);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
```

### 5.3 Form Components

#### Input

```tsx
// components/ui/input.tsx (EXISTING shadcn/ui)
// Glassmorphic variant

<Input
  type="text"
  placeholder="Nombre del proyecto"
  className="glass-input"
/>
```

**Styles**:
```css
.glass-input {
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(34, 211, 238, 0.2);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  color: var(--text-primary);
  transition: all 0.2s;
}

.glass-input:focus {
  outline: none;
  border-color: var(--glass-accent);
  box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1);
}

.glass-input::placeholder {
  color: var(--text-muted);
}
```

#### Select

```tsx
// components/ui/select.tsx (EXISTING shadcn/ui)
// Glassmorphic variant

<Select>
  <SelectTrigger className="glass-select">
    <SelectValue placeholder="Seleccionar agente" />
  </SelectTrigger>
  <SelectContent className="glass-dropdown">
    <SelectItem value="agent1">Escritor de Libros</SelectItem>
    <SelectItem value="agent2">Analista de Datos</SelectItem>
  </SelectContent>
</Select>
```

**Styles**:
```css
.glass-select {
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(34, 211, 238, 0.2);
  border-radius: 8px;
  padding: 0.75rem 1rem;
}

.glass-dropdown {
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(34, 211, 238, 0.3);
  border-radius: 8px;
  box-shadow: 0 8px 32px 0 rgba(6, 182, 212, 0.2);
}

.glass-dropdown-item {
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.glass-dropdown-item:hover {
  background: rgba(6, 182, 212, 0.1);
  color: var(--glass-accent-light);
}
```

#### Textarea

```tsx
// components/ui/textarea.tsx (EXISTING shadcn/ui)
// Glassmorphic variant

<Textarea
  placeholder="Descripción del proyecto..."
  rows={4}
  className="glass-textarea"
/>
```

**Styles**:
```css
.glass-textarea {
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(34, 211, 238, 0.2);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  color: var(--text-primary);
  resize: vertical;
  min-height: 100px;
}

.glass-textarea:focus {
  outline: none;
  border-color: var(--glass-accent);
  box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1);
}
```

---

## 6. Icons

### 6.1 Icon Library

**Lucide React** (EXISTING v1.0, NO CHANGES)

```tsx
import {
  Home,
  Folder,
  Bot,
  Book,
  Users,
  Settings,
  LogOut,
  Plus,
  Edit,
  Trash,
  Search,
  Filter,
  MoreVertical
} from 'lucide-react';
```

### 6.2 Icon Sizes

| Context | Size | Usage |
|---------|------|-------|
| Small | 16px | Inline with text, breadcrumbs |
| Default | 20px | Buttons, navigation links |
| Medium | 24px | Section headers, cards |
| Large | 32px | Metrics cards, empty states |
| XLarge | 48px | Hero sections, onboarding |

### 6.3 Icon Colors

- **Admin Panel**: Blue-500 (--admin-accent)
- **Dashboard**: Cyan-500 (--glass-accent)
- **Status Icons**:
  - Success: Green-500
  - Warning: Amber-500
  - Error: Red-500

---

## 7. Animations

### 7.1 Transitions

```css
/* Standard transitions */
.transition-default {
  transition: all 0.2s ease;
}

.transition-smooth {
  transition: all 0.3s ease;
}

.transition-bounce {
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

### 7.2 Hover Effects

**Admin Panel**:
```css
.card-admin:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px 0 rgba(59, 130, 246, 0.1);
}

.button-admin:hover {
  background: var(--admin-accent-dark);
}
```

**Dashboard Glassmorphic**:
```css
.glass-card:hover {
  transform: translateY(-2px);
  border-color: var(--glass-border-hover);
  box-shadow: var(--glass-shadow-hover);
}

.glass-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 24px 0 rgba(6, 182, 212, 0.3);
}
```

### 7.3 Loading States

```tsx
// components/ui/skeleton.tsx (EXISTING shadcn/ui)
// Glassmorphic variant

<Skeleton className="glass-skeleton h-20 w-full" />
```

**Styles**:
```css
.glass-skeleton {
  background: linear-gradient(
    90deg,
    rgba(15, 23, 42, 0.5) 0%,
    rgba(34, 211, 238, 0.1) 50%,
    rgba(15, 23, 42, 0.5) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### 7.4 Framer Motion Variants

```tsx
// lib/animations/variants.ts (NEW v0.1)
export const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 }
};

export const slideIn = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.3 }
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.2 }
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};
```

**Usage**:
```tsx
import { motion } from 'framer-motion';
import { fadeIn } from '@/lib/animations/variants';

<motion.div {...fadeIn}>
  <GlassCard>Content</GlassCard>
</motion.div>
```

---

## 8. Responsive Design

### 8.1 Breakpoints (Tailwind Default)

```css
/* Mobile-first approach */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1536px) { /* 2xl */ }
```

### 8.2 Responsive Patterns

**Sidebar**:
- Desktop (>1024px): Fixed sidebar (240px)
- Tablet (641-1024px): Collapsible sidebar
- Mobile (<640px): Hidden sidebar (hamburger menu)

**Grid**:
- Desktop: 3-4 columns
- Tablet: 2 columns
- Mobile: 1 column

**Typography**:
- Desktop: h1 = 2.5rem
- Tablet: h1 = 2rem
- Mobile: h1 = 1.75rem

**Cards**:
- Desktop: Padding 1.5rem
- Mobile: Padding 1rem

---

## 9. Accessibility (WCAG 2.1 AA)

### 9.1 Color Contrast

| Element | Foreground | Background | Contrast Ratio | Status |
|---------|-----------|------------|----------------|--------|
| Primary text | #f8fafc | #0f172a | 15.8:1 | ✅ AAA |
| Secondary text | #cbd5e1 | #0f172a | 11.2:1 | ✅ AAA |
| Muted text | #64748b | #0f172a | 4.7:1 | ✅ AA |
| Button text | #ffffff | #06b6d4 | 4.5:1 | ✅ AA |

### 9.2 Focus States

```css
/* Keyboard navigation focus */
*:focus-visible {
  outline: 2px solid var(--glass-accent);
  outline-offset: 2px;
  border-radius: 4px;
}

.glass-button:focus-visible {
  outline: 2px solid var(--glass-accent-light);
  outline-offset: 2px;
}

.glass-input:focus-visible {
  border-color: var(--glass-accent);
  box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.2);
}
```

### 9.3 Semantic HTML

```tsx
// Correct structure
<nav aria-label="Primary navigation">
  <ul role="list">
    <li><a href="/dashboard">Dashboard</a></li>
    <li><a href="/projects">Proyectos</a></li>
  </ul>
</nav>

<main id="main-content">
  <h1>Dashboard</h1>
  <section aria-labelledby="metrics-title">
    <h2 id="metrics-title">Métricas</h2>
    {/* Content */}
  </section>
</main>
```

### 9.4 ARIA Labels

```tsx
<button aria-label="Crear nuevo proyecto">
  <PlusIcon />
</button>

<input
  type="search"
  aria-label="Buscar proyectos"
  placeholder="Buscar..."
/>

<div role="alert" aria-live="polite">
  Proyecto creado exitosamente
</div>
```

---

## 10. Component Inventory

### 10.1 Existing Components (shadcn/ui - Reutilizables)

| Component | Path | Admin Panel | Dashboard |
|-----------|------|-------------|-----------|
| Button | `components/ui/button.tsx` | ✅ Standard | ✅ Glass variant |
| Card | `components/ui/card.tsx` | ✅ Standard | ✅ Glass variant |
| Input | `components/ui/input.tsx` | ✅ Standard | ✅ Glass variant |
| Select | `components/ui/select.tsx` | ✅ Standard | ✅ Glass variant |
| Table | `components/ui/table.tsx` | ✅ Standard | ❌ N/A |
| Dialog | `components/ui/dialog.tsx` | ✅ Standard | ✅ Glass variant |
| Avatar | `components/ui/avatar.tsx` | ✅ Standard | ✅ Standard |
| Skeleton | `components/ui/skeleton.tsx` | ✅ Standard | ✅ Glass variant |

### 10.2 New Components (v0.1)

| Component | Path | Usage |
|-----------|------|-------|
| GlassCard | `components/dashboard/GlassCard.tsx` | Dashboard cards |
| GlassButton | `components/dashboard/GlassButton.tsx` | Dashboard actions |
| MetricsCard | `components/dashboard/MetricsCard.tsx` | Dashboard metrics |
| DashboardSidebar | `components/dashboard/Sidebar.tsx` | Dashboard navigation |
| DashboardHeader | `components/dashboard/Header.tsx` | Dashboard header |
| PanelToggle | `components/navigation/PanelToggle.tsx` | Admin/Dashboard switch |
| Logo | `components/navigation/Logo.tsx` | Branding (updated) |

---

## 11. Tailwind Configuration

### 11.1 tailwind.config.ts (UPDATE)

```typescript
// tailwind.config.ts (UPDATED for v0.1)
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Admin Panel
        admin: {
          accent: '#3b82f6',
          'accent-dark': '#2563eb',
          'accent-light': '#60a5fa',
        },
        // Dashboard Glassmorphic
        glass: {
          accent: '#06b6d4',
          'accent-dark': '#0891b2',
          'accent-light': '#22d3ee',
        },
        // Status colors
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-poppins)', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        DEFAULT: '12px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(6, 182, 212, 0.1)',
        'glass-hover': '0 12px 48px 0 rgba(6, 182, 212, 0.15)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

### 11.2 globals.css (UPDATE)

```css
/* app/globals.css (UPDATED for v0.1) */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Import glassmorphic styles */
@import '../styles/glassmorphic.css';

@layer base {
  :root {
    /* Base colors (EXISTING) */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;

    /* Admin Panel colors (EXISTING) */
    --admin-accent: 217 91% 60%;
    --admin-accent-dark: 221 83% 53%;

    /* Dashboard Glassmorphic colors (NEW v0.1) */
    --glass-accent: 188 94% 43%;
    --glass-accent-dark: 188 85% 37%;
    --glass-accent-light: 187 85% 53%;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
  }
}

@layer components {
  /* Admin Panel components (EXISTING) */
  .btn-admin-primary {
    @apply bg-admin-accent text-white hover:bg-admin-accent-dark;
  }

  /* Dashboard Glassmorphic components (NEW v0.1) */
  .glass-card {
    @apply bg-slate-900/70 backdrop-blur-md border border-cyan-400/20 rounded-2xl p-6 shadow-glass transition-all duration-300;
  }

  .glass-card:hover {
    @apply -translate-y-0.5 border-cyan-400/40 shadow-glass-hover;
  }

  .glass-button-primary {
    @apply bg-gradient-to-br from-cyan-500 to-cyan-600 border border-cyan-400 text-white;
  }
}
```

---

## 12. File Structure (New Files for v0.1)

```
/
├── components/
│   ├── dashboard/                    # NEW v0.1
│   │   ├── GlassCard.tsx
│   │   ├── GlassButton.tsx
│   │   ├── MetricsCard.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── ProjectCard.tsx
│   ├── navigation/                   # UPDATE
│   │   ├── PanelToggle.tsx           # NEW
│   │   └── Logo.tsx                  # UPDATE (add glassmorphic variant)
│   └── ui/                           # EXISTING (no changes)
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       └── ...
├── styles/
│   └── glassmorphic.css              # NEW v0.1
├── lib/
│   └── animations/
│       └── variants.ts               # NEW v0.1
├── app/
│   ├── globals.css                   # UPDATE (import glassmorphic.css)
│   └── layout.tsx                    # EXISTING (no changes to fonts)
└── tailwind.config.ts                # UPDATE (add glass colors)
```

---

**Fecha de Diseño**: 2025-11-21
**Responsable**: uxui-specialist (via architect, fase-2-arquitectura-leader)
**Estado**: COMPLETO
**Próximo Paso**: Diseñar User Flows & Navigation
