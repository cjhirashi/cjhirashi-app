# UI Components Design - CJHIRASHI APP v0.1

**Versión**: v0.1
**Fecha**: 2025-11-21
**Responsable**: ui-designer (Fase 3)
**Tipo**: Diseño Detallado de Componentes UI

---

## Visión General

Este documento define la **arquitectura de componentes UI** completa para CJHIRASHI APP v0.1, siguiendo NextJS 15+ patterns con Server Components y Client Components.

**Base Arquitectónica**:
- Design System: `docs/design/uxui-design-system-v0.1.md` (Fase 2)
- User Flows: `docs/design/user-flows-v0.1.md` (Fase 3)
- shadcn/ui components (base primitives)

**Objetivos**:
1. Component hierarchy clara (Server vs Client)
2. Reutilización máxima de componentes
3. Props typing estricto (TypeScript)
4. Glassmorphic design para Dashboard
5. Professional dark design para Admin Panel

---

## Tabla de Contenidos

1. [Component Hierarchy](#component-hierarchy)
2. [Server Components](#server-components)
3. [Client Components](#client-components)
4. [shadcn/ui Components Used](#shadcnui-components-used)
5. [Component Specifications](#component-specifications)
6. [Glassmorphic Component Styles](#glassmorphic-component-styles)

---

## Component Hierarchy

### Full Component Tree

```
app/
├── layout.tsx (RootLayout - Server Component)
│   └── Providers (Client Component - theme, toast)
│
├── auth/
│   ├── layout.tsx (AuthLayout - Server Component)
│   └── login/page.tsx (Client Component - form interactivity)
│       └── LoginForm (Client Component)
│           ├── Input (shadcn/ui)
│           └── Button (shadcn/ui)
│
├── admin/
│   ├── layout.tsx (AdminLayout - Server Component - auth check)
│   │   ├── AdminSidebar (Client Component - active state)
│   │   └── main (Server Component wrapper)
│   │
│   ├── page.tsx (AdminDashboard - Server Component)
│   │   ├── StatsCard (Server Component)
│   │   └── RecentActivity (Server Component)
│   │
│   └── agents/
│       ├── page.tsx (AgentsListPage - Server Component)
│       │   ├── Suspense
│       │   └── AgentsData (Server Component - async fetch)
│       │       └── AgentsTable (Client Component - filtering)
│       │           └── AgentRow (Client Component - actions)
│       │               ├── Badge (shadcn/ui)
│       │               ├── Button (shadcn/ui)
│       │               └── DropdownMenu (shadcn/ui)
│       │
│       └── new/page.tsx (NewAgentPage - Server Component)
│           └── CreateAgentForm (Client Component - form state)
│               ├── Input (shadcn/ui)
│               ├── Textarea (shadcn/ui)
│               ├── Select (shadcn/ui)
│               └── Button (shadcn/ui)
│
└── dashboard/
    ├── layout.tsx (DashboardLayout - Server Component - auth check)
    │   ├── DashboardNav (Client Component - active state)
    │   │   └── UserButton (Client Component - dropdown)
    │   └── main (Server Component wrapper)
    │
    ├── page.tsx (DashboardHome - Server Component)
    │   ├── Suspense
    │   └── DashboardData (Server Component - async fetch)
    │       ├── WelcomeCard (Glassmorphic Server Component)
    │       ├── StatsGrid (Server Component)
    │       │   └── StatCard (Glassmorphic Client Component)
    │       ├── RecentProjects (Server Component)
    │       │   └── ProjectCard (Glassmorphic Client Component)
    │       └── QuickActions (Server Component)
    │           └── ActionButton (Glassmorphic Client Component)
    │
    └── projects/
        ├── page.tsx (ProjectsListPage - Server Component)
        │   ├── Suspense
        │   └── ProjectsData (Server Component - async fetch)
        │       └── ProjectsList (Client Component - filtering)
        │           └── ProjectCard (Glassmorphic Client Component)
        │               ├── Badge (shadcn/ui)
        │               ├── Button (shadcn/ui - glassmorphic variant)
        │               └── DropdownMenu (shadcn/ui)
        │
        ├── new/page.tsx (NewProjectPage - Server Component)
        │   └── CreateProjectWizard (Client Component - multi-step)
        │       ├── AgentGrid (Server Component)
        │       │   └── AgentCard (Glassmorphic Client Component)
        │       └── ProjectDetailsForm (Client Component)
        │           ├── Input (shadcn/ui - glassmorphic)
        │           └── Textarea (shadcn/ui - glassmorphic)
        │
        └── [id]/
            ├── page.tsx (ProjectDetailPage - Server Component)
            │   ├── Suspense
            │   └── ProjectData (Server Component - async fetch)
            │       ├── ProjectHeader (Glassmorphic Server Component)
            │       ├── ProjectTabs (Client Component - tab state)
            │       │   ├── TabsList (shadcn/ui)
            │       │   └── TabsContent (shadcn/ui)
            │       └── ConversationsList (Server Component)
            │
            └── chat/page.tsx (ProjectChatPage - Server Component)
                ├── Suspense
                └── ChatData (Server Component - async fetch conversation)
                    └── ChatContainer (Client Component - streaming)
                        ├── MessageBubble (Server/Client hybrid)
                        ├── ChatInput (Client Component - input state)
                        └── StreamingIndicator (Client Component)
```

---

## Server Components

Server Components fetch data asynchronously and render on the server. They CANNOT use hooks or event handlers.

### 1.1 Layouts

#### `app/layout.tsx` (RootLayout)

```typescript
import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import { Providers } from '@/components/providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CJHIRASHI - AI Agents Platform',
  description: 'Intelligent agents with RAG capabilities',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${poppins.variable} dark`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-slate-900 text-slate-50 antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

**Props**: `{ children: ReactNode }`
**Type**: Server Component
**Dependencies**: Next.js fonts, Providers (Client Component)

---

#### `app/admin/layout.tsx` (AdminLayout)

```typescript
import { requireAdmin } from '@/lib/actions/auth';
import { redirect } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/admin-sidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireAdmin();
  } catch {
    redirect('/unauthorized');
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-900">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}
```

**Props**: `{ children: ReactNode }`
**Type**: Server Component (async auth check)
**Dependencies**: AdminSidebar (Client Component)
**Auth**: `requireAdmin()` throws/redirects if not admin

---

#### `app/dashboard/layout.tsx` (DashboardLayout)

```typescript
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  await supabase.auth.getClaims();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <DashboardNav user={user} />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
```

**Props**: `{ children: ReactNode }`
**Type**: Server Component (async auth check)
**Dependencies**: DashboardNav (Client Component)
**Auth**: Redirects to `/auth/login` if no user

---

### 1.2 Pages (Server Components)

#### `app/dashboard/page.tsx` (Dashboard Home)

```typescript
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { WelcomeCard } from '@/components/dashboard/welcome-card';
import { StatsGrid } from '@/components/dashboard/stats-grid';
import { RecentProjects } from '@/components/dashboard/recent-projects';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';

export default async function DashboardPage() {
  return (
    <div className="space-y-8">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardData />
      </Suspense>
    </div>
  );
}

async function DashboardData() {
  const supabase = await createClient();
  await supabase.auth.getClaims();

  const { data: { user } } = await supabase.auth.getUser();

  // Parallel fetch
  const [projectsResult, conversationsResult, corporaResult] = await Promise.all([
    supabase
      .from('projects')
      .select('*')
      .eq('user_id', user!.id)
      .eq('status', 'active')
      .limit(5)
      .order('updated_at', { ascending: false }),
    supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user!.id)
      .limit(5)
      .order('updated_at', { ascending: false }),
    supabase
      .from('corpora')
      .select('*')
      .eq('owner_user_id', user!.id)
      .eq('corpus_type', 'personal'),
  ]);

  const stats = {
    totalProjects: projectsResult.count || 0,
    totalConversations: conversationsResult.count || 0,
    totalCorpora: corporaResult.count || 0,
  };

  return (
    <>
      <WelcomeCard user={user!} />
      <StatsGrid stats={stats} />
      <RecentProjects projects={projectsResult.data || []} />
      <QuickActions />
    </>
  );
}
```

**Type**: Server Component (async data fetching)
**Dependencies**: Multiple glassmorphic components
**Pattern**: Suspense boundary for streaming

---

#### `app/dashboard/projects/page.tsx` (Projects List)

```typescript
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { ProjectsList } from '@/components/projects/projects-list';
import { ProjectsListSkeleton } from '@/components/projects/projects-list-skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: { status?: string; agent_id?: string };
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold font-poppins text-cyan-400">
            Mis Proyectos
          </h1>
          <p className="mt-2 text-slate-400">
            Gestiona tus proyectos con agentes inteligentes
          </p>
        </div>
        <Link href="/dashboard/projects/new">
          <Button className="glass-button">
            <PlusCircle size={20} className="mr-2" />
            Nuevo Proyecto
          </Button>
        </Link>
      </div>

      <Suspense
        key={`${searchParams.status}-${searchParams.agent_id}`}
        fallback={<ProjectsListSkeleton />}
      >
        <ProjectsData searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ProjectsData({ searchParams }: { searchParams: any }) {
  const supabase = await createClient();
  await supabase.auth.getClaims();

  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase
    .from('projects')
    .select('*, agent:agents(*), conversations(count)')
    .eq('user_id', user!.id)
    .order('updated_at', { ascending: false });

  if (searchParams.status) {
    query = query.eq('status', searchParams.status);
  }

  if (searchParams.agent_id) {
    query = query.eq('agent_id', searchParams.agent_id);
  }

  const { data: projects } = await query;

  return <ProjectsList projects={projects || []} />;
}
```

**Type**: Server Component (async with search params)
**Dependencies**: ProjectsList (Client Component for filtering)
**Pattern**: Suspense with key for re-fetch on filter change

---

### 1.3 Data Components

#### `components/dashboard/welcome-card.tsx`

```typescript
import { User } from '@supabase/supabase-js';

export function WelcomeCard({ user }: { user: User }) {
  const greeting = getGreeting();

  return (
    <div className="glass-card p-8">
      <h2 className="text-3xl font-bold font-poppins text-cyan-400">
        {greeting}, {user.email?.split('@')[0] || 'Usuario'}
      </h2>
      <p className="mt-2 text-slate-300">
        Bienvenido de vuelta a tu plataforma de agentes inteligentes
      </p>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return '¡Buenos días';
  if (hour < 18) return '¡Buenas tardes';
  return '¡Buenas noches';
}
```

**Props**: `{ user: User }`
**Type**: Server Component
**Style**: Glassmorphic card

---

#### `components/dashboard/stats-grid.tsx`

```typescript
import { StatCard } from './stat-card';
import { FolderOpen, MessageSquare, Database } from 'lucide-react';

interface StatsGridProps {
  stats: {
    totalProjects: number;
    totalConversations: number;
    totalCorpora: number;
  };
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard
        icon={FolderOpen}
        label="Proyectos Activos"
        value={stats.totalProjects}
        color="cyan"
      />
      <StatCard
        icon={MessageSquare}
        label="Conversaciones"
        value={stats.totalConversations}
        color="blue"
      />
      <StatCard
        icon={Database}
        label="Corpus Personales"
        value={stats.totalCorpora}
        color="purple"
      />
    </div>
  );
}
```

**Props**: `{ stats: StatsGridProps }`
**Type**: Server Component
**Children**: StatCard (Client Component for hover effects)

---

## Client Components

Client Components handle interactivity, state, and event handlers. They use `'use client'` directive.

### 2.1 Navigation Components

#### `components/admin/admin-sidebar.tsx`

```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Database,
  Settings,
  ChevronLeft,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/agents', label: 'Agentes', icon: Users },
  { href: '/admin/corpus', label: 'Corpus Global', icon: Database },
  { href: '/admin/settings', label: 'Configuración', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-slate-700 bg-slate-800 transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-700">
        {!isCollapsed && (
          <h2 className="text-xl font-bold text-blue-400">Admin Panel</h2>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="rounded-lg p-1.5 hover:bg-slate-700"
        >
          <ChevronLeft
            size={20}
            className={cn(
              'transition-transform',
              isCollapsed && 'rotate-180'
            )}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-500 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              )}
            >
              <item.icon size={20} className="shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-700 p-4">
        {!isCollapsed && (
          <p className="text-xs text-slate-500">v0.1 - Admin Panel</p>
        )}
      </div>
    </aside>
  );
}
```

**Props**: None
**Type**: Client Component
**State**: `isCollapsed` (collapse/expand sidebar)
**Hooks**: `usePathname()` (active route highlighting)

---

#### `components/dashboard/dashboard-nav.tsx`

```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { FolderOpen, Database, MessageSquare, Settings } from 'lucide-react';
import { UserButton } from './user-button';
import type { User } from '@supabase/supabase-js';

const navItems = [
  { href: '/dashboard', label: 'Inicio', icon: MessageSquare },
  { href: '/dashboard/projects', label: 'Proyectos', icon: FolderOpen },
  { href: '/dashboard/corpus', label: 'Corpus', icon: Database },
  { href: '/dashboard/settings', label: 'Configuración', icon: Settings },
];

export function DashboardNav({ user }: { user: User }) {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-700/50 bg-slate-800/50 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="text-2xl font-bold font-poppins text-cyan-400">
            CJHIRASHI
          </div>
        </Link>

        {/* Nav Items */}
        <div className="flex items-center gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                  isActive
                    ? 'glass-card-active text-cyan-400 shadow-cyan-500/20'
                    : 'text-slate-300 hover:glass-card hover:text-white'
                )}
              >
                <item.icon size={18} />
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* User Button */}
        <UserButton user={user} />
      </div>
    </nav>
  );
}
```

**Props**: `{ user: User }`
**Type**: Client Component
**State**: None (pathname from hook)
**Style**: Glassmorphic with backdrop blur

---

#### `components/dashboard/user-button.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Settings, LogOut } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export function UserButton({ user }: { user: SupabaseUser }) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  }

  const initials = user.email
    ?.split('@')[0]
    .substring(0, 2)
    .toUpperCase() || 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="glass-card rounded-full p-1 hover:border-cyan-400">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-cyan-500 text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="glass-card w-56">
        <DropdownMenuLabel className="text-cyan-400">
          Mi Cuenta
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem>
          <User size={16} className="mr-2" />
          <span>Perfil</span>
        </DropdownMenuItem>

        <DropdownMenuItem>
          <Settings size={16} className="mr-2" />
          <span>Configuración</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="text-red-400 focus:text-red-400"
        >
          <LogOut size={16} className="mr-2" />
          <span>{isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

**Props**: `{ user: SupabaseUser }`
**Type**: Client Component
**State**: `isLoggingOut` (logout loading state)
**Dependencies**: shadcn/ui DropdownMenu, Avatar

---

### 2.2 Form Components

#### `components/admin/create-agent-form.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createAgent } from '@/lib/actions/admin/agents';
import { agentSchema } from '@/lib/validation/agents';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function CreateAgentForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      name: '',
      description: '',
      specialization: '',
      default_model_provider: 'anthropic',
      default_model_name: '',
      temperature: 0.7,
      max_tokens: undefined,
      allows_personal_corpus: false,
      allows_global_corpus: true,
      project_type: '',
      is_active: true,
    },
  });

  async function onSubmit(data: any) {
    setIsSubmitting(true);

    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.set(key, value.toString());
      }
    });

    const result = await createAgent(formData);

    if (result.success) {
      toast.success('Agente creado exitosamente');
      router.push(`/admin/agents/${result.data.id}`);
      router.refresh();
    } else {
      toast.error(result.error || 'Error al crear agente');
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 bg-slate-800 p-6 rounded-xl">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Escritor de Libros" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea {...field} rows={3} placeholder="Agente especializado en..." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="specialization"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Especialización</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Escritura creativa" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="default_model_provider"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Proveedor *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                    <SelectItem value="google">Google</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="default_model_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Modelo *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="claude-3-5-sonnet-20241022" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="temperature"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Temperature (0-2)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.1" min="0" max="2" {...field} />
                </FormControl>
                <FormDescription>
                  Controla la creatividad del agente
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="max_tokens"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Tokens</FormLabel>
                <FormControl>
                  <Input type="number" min="1" {...field} placeholder="4096" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="project_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Proyecto</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Libro, Análisis, etc." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-3">
          <FormField
            control={form.control}
            name="allows_personal_corpus"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Permitir corpus personal</FormLabel>
                  <FormDescription>
                    Los usuarios podrán asignar sus corpus personales a este agente
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="allows_global_corpus"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Permitir corpus global</FormLabel>
                  <FormDescription>
                    El agente puede usar corpus globales del sistema
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-4 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-500 hover:bg-blue-600"
          >
            {isSubmitting ? 'Creando...' : 'Crear Agente'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  );
}
```

**Props**: None
**Type**: Client Component
**State**: `isSubmitting`, form state (react-hook-form)
**Validation**: Zod schema resolver
**Dependencies**: shadcn/ui Form components

---

### 2.3 Card Components (Glassmorphic)

#### `components/dashboard/stat-card.tsx`

```typescript
'use client';

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  color: 'cyan' | 'blue' | 'purple' | 'green';
}

const colorClasses = {
  cyan: 'text-cyan-400 group-hover:shadow-cyan-500/20',
  blue: 'text-blue-400 group-hover:shadow-blue-500/20',
  purple: 'text-purple-400 group-hover:shadow-purple-500/20',
  green: 'text-green-400 group-hover:shadow-green-500/20',
};

export function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  return (
    <div className="glass-card group cursor-default transition-all hover:border-cyan-400/40">
      <div className="flex items-center gap-4">
        <div className={cn('rounded-lg bg-slate-800/50 p-3', colorClasses[color])}>
          <Icon size={24} />
        </div>
        <div>
          <p className="text-3xl font-bold font-poppins">{value}</p>
          <p className="text-sm text-slate-400">{label}</p>
        </div>
      </div>
    </div>
  );
}
```

**Props**: `{ icon, label, value, color }`
**Type**: Client Component (for hover effects)
**Style**: Glassmorphic card with hover state

---

#### `components/projects/project-card.tsx`

```typescript
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { archiveProject } from '@/lib/actions/projects';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FolderOpen, MessageSquare, MoreVertical, Archive, Trash } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description?: string;
    status: string;
    agent: {
      name: string;
    };
    updated_at: string;
    conversations?: { count: number }[];
  };
}

export function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();
  const [isArchiving, setIsArchiving] = useState(false);

  async function handleArchive() {
    setIsArchiving(true);

    const result = await archiveProject(project.id);

    if (result.success) {
      toast.success('Proyecto archivado');
      router.refresh();
    } else {
      toast.error(result.error || 'Error al archivar');
      setIsArchiving(false);
    }
  }

  const conversationCount = project.conversations?.[0]?.count || 0;

  return (
    <div className="glass-card group transition-all hover:border-cyan-400">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Link href={`/dashboard/projects/${project.id}`}>
            <h3 className="text-xl font-semibold font-poppins text-cyan-400 group-hover:underline">
              {project.name}
            </h3>
          </Link>

          {project.description && (
            <p className="mt-2 text-sm text-slate-400 line-clamp-2">
              {project.description}
            </p>
          )}

          <div className="mt-4 flex items-center gap-3">
            <Badge variant="outline" className="glass-badge">
              {project.agent.name}
            </Badge>

            <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
              {project.status}
            </Badge>
          </div>

          <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <MessageSquare size={14} />
              <span>{conversationCount} conversaciones</span>
            </div>

            <span>
              Actualizado {formatDistanceToNow(new Date(project.updated_at), {
                addSuffix: true,
                locale: es,
              })}
            </span>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="glass-button">
              <MoreVertical size={18} />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="glass-card">
            <DropdownMenuItem>
              <FolderOpen size={16} className="mr-2" />
              Ver Detalles
            </DropdownMenuItem>

            <DropdownMenuItem>
              <MessageSquare size={16} className="mr-2" />
              Abrir Chat
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={handleArchive}
              disabled={isArchiving}
            >
              <Archive size={16} className="mr-2" />
              {isArchiving ? 'Archivando...' : 'Archivar'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-6 flex gap-3">
        <Link href={`/dashboard/projects/${project.id}/chat`} className="flex-1">
          <Button className="glass-button w-full">
            <MessageSquare size={18} className="mr-2" />
            Chatear
          </Button>
        </Link>
      </div>
    </div>
  );
}
```

**Props**: `{ project: ProjectCardProps['project'] }`
**Type**: Client Component
**State**: `isArchiving` (archive action state)
**Dependencies**: shadcn/ui Badge, Button, DropdownMenu
**Style**: Glassmorphic with hover effects

---

### 2.4 Chat Components

#### `components/chat/chat-container.tsx`

```typescript
'use client';

import { useChat } from '@ai-sdk/react';
import { MessageBubble } from './message-bubble';
import { ChatInput } from './chat-input';
import { StreamingIndicator } from './streaming-indicator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEffect, useRef } from 'react';

interface ChatContainerProps {
  projectId: string;
  agentId: string;
  agentName: string;
  initialMessages?: any[];
}

export function ChatContainer({
  projectId,
  agentId,
  agentName,
  initialMessages = [],
}: ChatContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: `/api/agents/${agentId}/chat`,
    body: { project_id: projectId },
    initialMessages,
  });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="glass-card mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
            <span className="text-lg">{agentName[0]}</span>
          </div>
          <div>
            <h3 className="font-semibold text-cyan-400">{agentName}</h3>
            <p className="text-xs text-slate-400">Agente Inteligente con RAG</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 px-4">
        <div className="space-y-4 pb-4">
          {messages.length === 0 && (
            <div className="text-center text-slate-400 py-12">
              <p>Empieza una conversación con {agentName}</p>
            </div>
          )}

          {messages.map((message, i) => (
            <MessageBubble key={i} message={message} />
          ))}

          {isLoading && <StreamingIndicator />}
        </div>
      </ScrollArea>

      {/* Input */}
      <ChatInput
        value={input}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        disabled={isLoading}
      />
    </div>
  );
}
```

**Props**: `{ projectId, agentId, agentName, initialMessages }`
**Type**: Client Component
**Hooks**: `useChat()` from Vercel AI SDK (streaming)
**Dependencies**: MessageBubble, ChatInput, StreamingIndicator
**Pattern**: Auto-scroll on new messages

---

#### `components/chat/message-bubble.tsx`

```typescript
'use client';

import { cn } from '@/lib/utils';
import { User, Bot } from 'lucide-react';

interface MessageBubbleProps {
  message: {
    role: 'user' | 'assistant';
    content: string;
  };
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      <div
        className={cn(
          'h-8 w-8 shrink-0 rounded-full flex items-center justify-center',
          isUser ? 'bg-cyan-500' : 'bg-slate-700'
        )}
      >
        {isUser ? <User size={18} /> : <Bot size={18} />}
      </div>

      {/* Message Bubble */}
      <div
        className={cn(
          'max-w-[70%] rounded-2xl px-4 py-3',
          isUser
            ? 'glass-card border-cyan-400/40 text-slate-100'
            : 'bg-slate-800 text-slate-200'
        )}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {message.content}
        </p>
      </div>
    </div>
  );
}
```

**Props**: `{ message: MessageBubbleProps['message'] }`
**Type**: Client Component
**Style**: Glassmorphic for user, solid for assistant

---

#### `components/chat/chat-input.tsx`

```typescript
'use client';

import { FormEvent } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: FormEvent) => void;
  disabled?: boolean;
}

export function ChatInput({ value, onChange, onSubmit, disabled }: ChatInputProps) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e);
    }
  }

  return (
    <form onSubmit={onSubmit} className="glass-card mt-4">
      <div className="flex gap-3">
        <Textarea
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Escribe tu mensaje... (Enter para enviar, Shift+Enter para nueva línea)"
          rows={3}
          className="flex-1 resize-none bg-transparent border-0 focus:ring-0"
        />
        <Button
          type="submit"
          disabled={disabled || !value.trim()}
          className="glass-button self-end"
        >
          <Send size={18} />
        </Button>
      </div>
    </form>
  );
}
```

**Props**: `{ value, onChange, onSubmit, disabled }`
**Type**: Client Component
**Feature**: Enter to send, Shift+Enter for new line

---

## shadcn/ui Components Used

### Installed Components

| Component | Usage | Variants |
|-----------|-------|----------|
| `button` | Buttons, links | default, outline, ghost, glass-button (custom) |
| `input` | Text inputs | default, glassmorphic |
| `textarea` | Multi-line inputs | default, glassmorphic |
| `select` | Dropdowns | default |
| `checkbox` | Checkboxes | default |
| `badge` | Status badges | default, outline, glass-badge (custom) |
| `card` | Card containers | default, glass-card (custom) |
| `dropdown-menu` | Action menus | default |
| `avatar` | User avatars | default |
| `scroll-area` | Scrollable areas | default |
| `form` | Form management | with react-hook-form |
| `separator` | Dividers | default |
| `tabs` | Tab navigation | default |
| `skeleton` | Loading states | default |

### Custom Variants (Glassmorphic)

#### `components/ui/button.tsx` (Extended)

```typescript
// Add glass-button variant
const buttonVariants = cva(
  // ... existing base classes
  {
    variants: {
      variant: {
        // ... existing variants
        glass: 'glass-button',
      },
    },
  }
);
```

#### `global.css` - Glassmorphic Utilities

```css
/* Glassmorphic Card */
.glass-card {
  @apply bg-slate-900/70 backdrop-blur-xl border border-cyan-400/20 rounded-xl p-6 shadow-lg;
  box-shadow: 0 8px 32px 0 rgba(6, 182, 212, 0.1);
}

.glass-card-active {
  @apply glass-card border-cyan-400/60;
  box-shadow: 0 12px 48px 0 rgba(6, 182, 212, 0.2);
}

.glass-card:hover {
  @apply border-cyan-400/40;
  box-shadow: 0 12px 48px 0 rgba(6, 182, 212, 0.15);
}

/* Glassmorphic Button */
.glass-button {
  @apply bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 backdrop-blur-sm hover:bg-cyan-500/20 hover:border-cyan-400/50 transition-all;
}

/* Glassmorphic Badge */
.glass-badge {
  @apply bg-slate-800/50 border border-cyan-400/30 text-cyan-400 backdrop-blur-sm;
}

/* Glassmorphic Input */
.glass-input {
  @apply bg-slate-900/50 border border-cyan-400/20 backdrop-blur-sm focus:border-cyan-400/50 focus:ring-cyan-400/20;
}
```

---

## Component Specifications

### Server Component Specs

| Component | File Path | Props | Data Source | Children |
|-----------|-----------|-------|-------------|----------|
| RootLayout | `app/layout.tsx` | `{ children }` | None | Providers |
| AdminLayout | `app/admin/layout.tsx` | `{ children }` | Auth check | AdminSidebar |
| DashboardLayout | `app/dashboard/layout.tsx` | `{ children }` | Auth check | DashboardNav |
| DashboardPage | `app/dashboard/page.tsx` | None | Supabase (user projects, convos, corpora) | WelcomeCard, StatsGrid, RecentProjects |
| ProjectsPage | `app/dashboard/projects/page.tsx` | `{ searchParams }` | Supabase (projects filtered) | ProjectsList |
| WelcomeCard | `components/dashboard/welcome-card.tsx` | `{ user }` | None | None |
| StatsGrid | `components/dashboard/stats-grid.tsx` | `{ stats }` | None | StatCard[] |

### Client Component Specs

| Component | File Path | Props | State | Hooks | Events |
|-----------|-----------|-------|-------|-------|--------|
| AdminSidebar | `components/admin/admin-sidebar.tsx` | None | `isCollapsed` | `usePathname()` | onClick (collapse) |
| DashboardNav | `components/dashboard/dashboard-nav.tsx` | `{ user }` | None | `usePathname()` | - |
| UserButton | `components/dashboard/user-button.tsx` | `{ user }` | `isLoggingOut` | `useRouter()` | onClick (logout) |
| CreateAgentForm | `components/admin/create-agent-form.tsx` | None | form state | `useForm()`, `useRouter()` | onSubmit |
| StatCard | `components/dashboard/stat-card.tsx` | `{ icon, label, value, color }` | None | - | - |
| ProjectCard | `components/projects/project-card.tsx` | `{ project }` | `isArchiving` | `useRouter()` | onClick (archive) |
| ChatContainer | `components/chat/chat-container.tsx` | `{ projectId, agentId, agentName }` | chat state | `useChat()`, `useEffect()` | onSubmit (message) |
| MessageBubble | `components/chat/message-bubble.tsx` | `{ message }` | None | - | - |
| ChatInput | `components/chat/chat-input.tsx` | `{ value, onChange, onSubmit, disabled }` | None | - | onSubmit, onKeyDown |

---

## Glassmorphic Component Styles

### Design Tokens (CSS Variables)

```css
:root {
  /* Glassmorphic Backgrounds */
  --glass-bg: rgba(15, 23, 42, 0.7); /* Slate-900 with alpha */
  --glass-bg-hover: rgba(15, 23, 42, 0.85);

  /* Glassmorphic Borders */
  --glass-border: rgba(34, 211, 238, 0.2); /* Cyan-400 with alpha */
  --glass-border-hover: rgba(34, 211, 238, 0.4);
  --glass-border-active: rgba(34, 211, 238, 0.6);

  /* Glassmorphic Shadows */
  --glass-shadow: 0 8px 32px 0 rgba(6, 182, 212, 0.1);
  --glass-shadow-hover: 0 12px 48px 0 rgba(6, 182, 212, 0.15);
  --glass-shadow-active: 0 12px 48px 0 rgba(6, 182, 212, 0.2);

  /* Glassmorphic Backdrop */
  --glass-backdrop: blur(12px);
}
```

### Component Examples

#### Glassmorphic Card

```tsx
<div className="glass-card">
  <h3 className="text-cyan-400">Card Title</h3>
  <p className="text-slate-300">Card content</p>
</div>
```

#### Glassmorphic Button

```tsx
<Button className="glass-button">
  <Icon size={18} className="mr-2" />
  Button Text
</Button>
```

#### Glassmorphic Input

```tsx
<Input className="glass-input" placeholder="Enter text..." />
```

---

## Resumen de Componentes

### Total Counts

- **Server Components**: 15+ (layouts, pages, data components)
- **Client Components**: 20+ (navigation, forms, cards, chat)
- **shadcn/ui Primitives**: 13 base components
- **Custom Glassmorphic Variants**: 4 (card, button, badge, input)

### Component Distribution

| Type | Admin Panel | Dashboard | Auth | Shared |
|------|-------------|-----------|------|--------|
| Layouts | 1 | 1 | 1 | 1 (Root) |
| Navigation | AdminSidebar | DashboardNav | - | - |
| Forms | CreateAgentForm, CreateCorpusForm | CreateProjectForm, CreateCorpusForm | LoginForm, SignUpForm | - |
| Cards | AgentCard, CorpusCard | ProjectCard, StatCard | - | - |
| Tables | AgentsTable, CorpusTable | ProjectsList | - | - |
| Chat | - | ChatContainer, MessageBubble, ChatInput | - | - |

---

## Próximos Pasos (Fase 4 - Desarrollo)

1. Implementar RootLayout + Providers
2. Implementar Auth layouts y forms
3. Implementar Admin layouts + navigation
4. Implementar Admin pages + forms + tables
5. Implementar Dashboard layouts + navigation
6. Implementar Dashboard pages + glassmorphic components
7. Implementar Project creation wizard
8. Implementar Chat interface (with Vercel AI SDK)
9. Implementar loading skeletons para Suspense boundaries
10. Testing de componentes (Fase 5)

---

**Fecha de Diseño**: 2025-11-21
**Responsable**: ui-designer (Fase 3)
**Estado**: COMPLETO
**Próximo Paso**: Validación FINAL con design-validator (DB ↔ API ↔ Flows ↔ UI)
