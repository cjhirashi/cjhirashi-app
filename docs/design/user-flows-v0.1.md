# User Flows - CJHIRASHI APP v0.1

**Versión**: v0.1
**Fecha**: 2025-11-21
**Responsable**: user-flow-designer (Fase 3)
**Tipo**: Diseño Detallado de Flujos de Usuario

---

## Visión General

Este documento define los **flujos de navegación** y **user journeys** completos para CJHIRASHI APP v0.1, diferenciando claramente entre:

1. **Admin Flows** (`/admin/*`) - Gestión de agentes y corpus global
2. **User Flows** (`/dashboard/*`) - Proyectos, corpus personal, chat con agentes
3. **Auth Flows** (`/auth/*`) - Registro, login, recuperación de contraseña

**Base Arquitectónica**:
- Frontend: `docs/design/uxui-design-system-v0.1.md` (Fase 2)
- API: `docs/api/api-design-detailed-v0.1.md` (Fase 3)
- NextJS App Router con Server Components + Client Components

---

## Tabla de Contenidos

1. [State Management Strategy](#state-management-strategy)
2. [Navigation Patterns](#navigation-patterns)
3. [Auth Flows](#auth-flows)
4. [Admin Flows](#admin-flows)
5. [User Flows](#user-flows)
6. [Form Patterns](#form-patterns)
7. [Loading States](#loading-states)
8. [Error Handling](#error-handling)

---

## State Management Strategy

### 1.1 Server State (Data Fetching)

**Herramientas**: NextJS Server Components + Suspense + Streaming

```typescript
// Pattern: Server Component with async data fetching
// app/dashboard/projects/page.tsx

import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { ProjectsList } from '@/components/projects/projects-list';
import { ProjectsListSkeleton } from '@/components/projects/projects-list-skeleton';

export default async function ProjectsPage() {
  return (
    <div>
      <h1>Mis Proyectos</h1>
      <Suspense fallback={<ProjectsListSkeleton />}>
        <ProjectsData />
      </Suspense>
    </div>
  );
}

async function ProjectsData() {
  const supabase = await createClient();
  await supabase.auth.getClaims();

  const { data: projects } = await supabase
    .from('projects')
    .select('*, agent:agents(*)')
    .order('updated_at', { ascending: false });

  return <ProjectsList projects={projects || []} />;
}
```

**Beneficios**:
- Fetching en servidor (más rápido)
- Streaming progresivo (mejor UX)
- Cache automático de NextJS

---

### 1.2 Client State (UI Interactions)

**Herramientas**: React hooks (`useState`, `useOptimistic`, `useFormStatus`)

```typescript
// Pattern: Client Component con estado local
// components/projects/create-project-form.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createProject } from '@/lib/actions/projects';

export function CreateProjectForm({ agents }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setError(null);

    const result = await createProject(formData);

    if (result.success) {
      router.push(`/dashboard/projects/${result.data.id}`);
      router.refresh(); // Revalidate server data
    } else {
      setError(result.error);
      setIsSubmitting(false);
    }
  }

  return (
    <form action={handleSubmit}>
      {/* form fields */}
      {error && <p className="text-red-500">{error}</p>}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creando...' : 'Crear Proyecto'}
      </button>
    </form>
  );
}
```

**Beneficios**:
- Estado UI simple (loading, error)
- Server Actions para mutations (CSRF protection built-in)
- Optimistic updates con `useOptimistic`

---

### 1.3 Optimistic Updates Pattern

```typescript
'use client';

import { useOptimistic } from 'react';
import { archiveProject } from '@/lib/actions/projects';

export function ProjectCard({ project }) {
  const [optimisticProject, addOptimisticUpdate] = useOptimistic(
    project,
    (state, newStatus) => ({ ...state, status: newStatus })
  );

  async function handleArchive() {
    // Update UI immediately (optimistic)
    addOptimisticUpdate('archived');

    // Send mutation to server
    const result = await archiveProject(project.id);

    if (!result.success) {
      // Rollback if server fails (automatic)
      console.error(result.error);
    }
  }

  return (
    <div className={optimisticProject.status === 'archived' ? 'opacity-50' : ''}>
      <h3>{project.name}</h3>
      <button onClick={handleArchive}>Archivar</button>
    </div>
  );
}
```

---

## Navigation Patterns

### 2.1 App Router Structure

```
/
├── auth/
│   ├── login/
│   ├── sign-up/
│   └── forgot-password/
├── admin/ (requires admin role)
│   ├── layout.tsx (admin auth check)
│   ├── page.tsx (dashboard)
│   ├── agents/
│   │   ├── page.tsx (list)
│   │   ├── new/page.tsx (create)
│   │   └── [id]/
│   │       ├── page.tsx (detail)
│   │       └── edit/page.tsx (edit)
│   └── corpus/
│       ├── page.tsx (list)
│       ├── new/page.tsx (create)
│       └── [id]/
│           ├── page.tsx (detail)
│           └── documents/page.tsx (upload docs)
└── dashboard/ (requires user auth)
    ├── layout.tsx (user auth check)
    ├── page.tsx (home)
    ├── projects/
    │   ├── page.tsx (list)
    │   ├── new/page.tsx (create)
    │   └── [id]/
    │       ├── page.tsx (detail)
    │       └── chat/page.tsx (chat con agente)
    └── corpus/
        ├── page.tsx (list)
        ├── new/page.tsx (create)
        └── [id]/
            ├── page.tsx (detail)
            └── documents/page.tsx (upload docs)
```

---

### 2.2 Layout Hierarchy (Auth Checks)

#### Admin Layout

```typescript
// app/admin/layout.tsx

import { requireAdmin } from '@/lib/actions/auth';
import { redirect } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/admin-sidebar';

export default async function AdminLayout({ children }) {
  try {
    await requireAdmin();
  } catch {
    redirect('/unauthorized');
  }

  return (
    <div className="flex h-screen">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-8 bg-slate-900">
        {children}
      </main>
    </div>
  );
}
```

#### Dashboard Layout

```typescript
// app/dashboard/layout.tsx

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';

export default async function DashboardLayout({ children }) {
  const supabase = await createClient();
  await supabase.auth.getClaims();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <DashboardNav user={user} />
      <main className="container mx-auto py-8 px-4">
        {children}
      </main>
    </div>
  );
}
```

---

### 2.3 Navigation Components

#### Admin Sidebar

```typescript
// components/admin/admin-sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, Users, Database, Activity } from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: Activity },
  { href: '/admin/agents', label: 'Agentes', icon: Users },
  { href: '/admin/corpus', label: 'Corpus Global', icon: Database },
  { href: '/admin/settings', label: 'Configuración', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-800 border-r border-slate-700">
      <div className="p-6">
        <h2 className="text-xl font-bold text-blue-400">Admin Panel</h2>
      </div>
      <nav className="px-4 space-y-2">
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              pathname === item.href
                ? 'bg-blue-500 text-white'
                : 'text-slate-300 hover:bg-slate-700'
            }`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
```

#### Dashboard Nav

```typescript
// components/dashboard/dashboard-nav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FolderOpen, Database, MessageSquare, Settings } from 'lucide-react';
import { UserButton } from './user-button';

const navItems = [
  { href: '/dashboard', label: 'Inicio', icon: MessageSquare },
  { href: '/dashboard/projects', label: 'Proyectos', icon: FolderOpen },
  { href: '/dashboard/corpus', label: 'Corpus Personal', icon: Database },
  { href: '/dashboard/settings', label: 'Configuración', icon: Settings },
];

export function DashboardNav({ user }) {
  const pathname = usePathname();

  return (
    <nav className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-xl">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="text-2xl font-bold text-cyan-400">
            CJHIRASHI
          </Link>
          <div className="flex gap-2">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                  pathname === item.href
                    ? 'bg-cyan-500 text-white'
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
        <UserButton user={user} />
      </div>
    </nav>
  );
}
```

---

## Auth Flows

### 3.1 Login Flow

**Happy Path**:
1. User lands on `/auth/login`
2. User enters email + password
3. Client validates inputs (Zod)
4. Client calls `supabase.auth.signInWithPassword()`
5. If success → Redirect to `/dashboard`
6. If error → Display inline error message

**Error Paths**:
- Invalid credentials → "Email o contraseña incorrectos"
- Account not confirmed → "Por favor confirma tu email"
- Network error → "Error de conexión. Intenta nuevamente"

```typescript
// app/auth/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const supabase = createClient();

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setIsLoading(false);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-slate-800 p-8 shadow-xl">
        <div>
          <h2 className="text-3xl font-bold text-cyan-400">Iniciar Sesión</h2>
          <p className="mt-2 text-sm text-slate-400">
            Accede a tu cuenta de CJHIRASHI
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300">
              Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300">
              Contraseña
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-cyan-500 hover:bg-cyan-600"
          >
            {isLoading ? 'Cargando...' : 'Iniciar Sesión'}
          </Button>
        </form>

        <div className="text-center text-sm">
          <Link
            href="/auth/forgot-password"
            className="text-cyan-400 hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <div className="text-center text-sm text-slate-400">
          ¿No tienes cuenta?{' '}
          <Link href="/auth/sign-up" className="text-cyan-400 hover:underline">
            Regístrate
          </Link>
        </div>
      </div>
    </div>
  );
}
```

---

### 3.2 Sign Up Flow

**Happy Path**:
1. User lands on `/auth/sign-up`
2. User enters email + password + confirm password
3. Client validates (passwords match, strength)
4. Client calls `supabase.auth.signUp()`
5. Supabase sends confirmation email
6. User sees "Revisa tu email para confirmar cuenta"
7. User clicks link in email → `/auth/confirm?token=xxx`
8. Redirect to `/dashboard`

**Error Paths**:
- Passwords don't match → "Las contraseñas no coinciden"
- Email already exists → "Este email ya está registrado"
- Weak password → "La contraseña debe tener al menos 8 caracteres"

---

### 3.3 Forgot Password Flow

**Happy Path**:
1. User lands on `/auth/forgot-password`
2. User enters email
3. Client calls `supabase.auth.resetPasswordForEmail()`
4. Supabase sends reset link
5. User sees "Revisa tu email para restablecer contraseña"
6. User clicks link → Redirects to reset form
7. User sets new password
8. Redirect to `/auth/login`

---

## Admin Flows

### 4.1 Agent Management Flow

#### 4.1.1 List Agents

**URL**: `/admin/agents`

**Happy Path**:
1. Admin navigates to `/admin/agents`
2. Server Component fetches agents via Supabase
3. Display agents table (name, status, model, actions)
4. Admin can filter by status (active/inactive)
5. Admin can search by name

**UI Components**:
- AgentsTable (Server Component)
- AgentRow (Client Component for actions)
- CreateAgentButton (links to `/admin/agents/new`)

```typescript
// app/admin/agents/page.tsx

import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { AgentsTable } from '@/components/admin/agents-table';
import { AgentsTableSkeleton } from '@/components/admin/agents-table-skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function AgentsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Agentes</h1>
        <Link href="/admin/agents/new">
          <Button className="bg-blue-500 hover:bg-blue-600">
            Crear Agente
          </Button>
        </Link>
      </div>

      <Suspense fallback={<AgentsTableSkeleton />}>
        <AgentsData status={searchParams.status} />
      </Suspense>
    </div>
  );
}

async function AgentsData({ status }: { status?: string }) {
  const supabase = await createClient();
  await supabase.auth.getClaims();

  let query = supabase
    .from('agents')
    .select('*, agent_models(*)')
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('is_active', status === 'active');
  }

  const { data: agents } = await query;

  return <AgentsTable agents={agents || []} />;
}
```

---

#### 4.1.2 Create Agent

**URL**: `/admin/agents/new`

**Happy Path**:
1. Admin navigates to `/admin/agents/new`
2. Form displays with fields:
   - Name (text, required, max 100)
   - Description (textarea, optional)
   - Specialization (text, optional)
   - Model Provider (select: openai/anthropic/google)
   - Model Name (text, required)
   - Temperature (number, 0-2, default 0.7)
   - Max Tokens (number, optional)
   - Allows Personal Corpus (checkbox, default false)
   - Allows Global Corpus (checkbox, default true)
   - Project Type (text, optional)
3. Admin fills form
4. Client validates (Zod)
5. Submit via Server Action `createAgent(formData)`
6. Server creates agent + audit log
7. Redirect to `/admin/agents/[id]`
8. Show success toast

**Error Paths**:
- Validation error → Display inline errors
- Server error → Display toast "Error al crear agente"

```typescript
// app/admin/agents/new/page.tsx

import { CreateAgentForm } from '@/components/admin/create-agent-form';

export default function NewAgentPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Crear Agente</h1>
        <p className="mt-2 text-slate-400">
          Configura un nuevo agente inteligente
        </p>
      </div>

      <CreateAgentForm />
    </div>
  );
}
```

```typescript
// components/admin/create-agent-form.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createAgent } from '@/lib/actions/admin/agents';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

export function CreateAgentForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setError(null);

    const result = await createAgent(formData);

    if (result.success) {
      router.push(`/admin/agents/${result.data.id}`);
      router.refresh();
    } else {
      setError(result.error);
      setIsSubmitting(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6 bg-slate-800 p-6 rounded-xl">
      <div>
        <label className="block text-sm font-medium">Nombre *</label>
        <Input name="name" required maxLength={100} className="mt-1" />
      </div>

      <div>
        <label className="block text-sm font-medium">Descripción</label>
        <Textarea name="description" rows={3} className="mt-1" />
      </div>

      <div>
        <label className="block text-sm font-medium">Especialización</label>
        <Input name="specialization" maxLength={100} className="mt-1" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Proveedor *</label>
          <Select name="default_model_provider" required className="mt-1">
            <option value="">Selecciona...</option>
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="google">Google</option>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium">Modelo *</label>
          <Input
            name="default_model_name"
            required
            placeholder="gpt-4o, claude-3-5-sonnet..."
            className="mt-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">
            Temperature (0-2)
          </label>
          <Input
            name="temperature"
            type="number"
            step="0.1"
            min="0"
            max="2"
            defaultValue="0.7"
            className="mt-1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Max Tokens</label>
          <Input
            name="max_tokens"
            type="number"
            min="1"
            placeholder="4096"
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Tipo de Proyecto</label>
        <Input
          name="project_type"
          placeholder="Libro, Análisis, etc."
          maxLength={50}
          className="mt-1"
        />
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2">
          <Checkbox name="allows_personal_corpus" />
          <span className="text-sm">Permitir corpus personal</span>
        </label>

        <label className="flex items-center gap-2">
          <Checkbox name="allows_global_corpus" defaultChecked />
          <span className="text-sm">Permitir corpus global</span>
        </label>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="flex gap-4">
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
  );
}
```

---

#### 4.1.3 Edit Agent

**URL**: `/admin/agents/[id]/edit`

**Similar a Create Agent**, pero:
- Form pre-populated con datos existentes
- Submit usa `updateAgent(id, formData)` Server Action
- Muestra audit trail de cambios (opcional)

---

#### 4.1.4 Delete/Deactivate Agent

**Trigger**: Click "Desactivar" button en agent detail

**Happy Path**:
1. Admin clicks "Desactivar" en `/admin/agents/[id]`
2. Confirmation dialog appears: "¿Desactivar agente X?"
3. Admin confirms
4. Client calls `deleteAgent(id)` Server Action
5. Server sets `is_active = false` + audit log
6. Redirect to `/admin/agents`
7. Show success toast

**Error Paths**:
- Agent has active projects → "No se puede desactivar (proyectos activos)"

---

### 4.2 Global Corpus Management Flow

#### 4.2.1 List Global Corpus

**URL**: `/admin/corpus`

**Similar a List Agents**, displays:
- Corpus name
- Document count
- Assigned agents count
- Status (active/inactive)
- Actions (view, edit, assign, upload)

---

#### 4.2.2 Create Global Corpus

**URL**: `/admin/corpus/new`

**Form Fields**:
- Name (text, required, max 200)
- Description (textarea, optional)
- Tags (multi-select or text input, optional)

**Submit**: `createGlobalCorpus(formData)` → Redirect to `/admin/corpus/[id]`

---

#### 4.2.3 Assign Corpus to Agents

**URL**: `/admin/corpus/[id]` (section within detail page)

**Happy Path**:
1. Admin views corpus detail
2. Section "Agentes Asignados" displays current assignments
3. Button "Asignar a Agentes" opens dialog
4. Dialog shows multi-select checklist of agents
5. Admin selects agents (with filter: `allows_global_corpus = true`)
6. Submit calls `assignCorpusToAgents(corpusId, agentIds)` Server Action
7. Success → Refresh assignments list + toast

**Error Paths**:
- Agent doesn't allow global corpus → Checkbox disabled + tooltip

---

#### 4.2.4 Upload Document to Global Corpus

**URL**: `/admin/corpus/[id]/documents`

**Happy Path**:
1. Admin navigates to documents page
2. Displays current documents (filename, status, size, date)
3. Drag-and-drop zone OR file picker button
4. Admin selects file (PDF, TXT, MD, DOCX)
5. Client validates file type + size (max 10MB)
6. Upload via `fetch('/api/admin/corpus/[id]/documents', FormData)`
7. Server creates `corpus_documents` record (status: pending)
8. Background job processes:
   - Extract text
   - Chunk text
   - Generate embeddings
   - Upload to Qdrant
   - Update status: processing → indexed
9. UI shows progress indicator (polling or websocket)
10. Success → Document appears in list with status "indexed"

**Error Paths**:
- Invalid file type → "Tipo de archivo no soportado"
- File too large → "Archivo muy grande (máximo 10MB)"
- Processing failed → Status "failed" + error message

---

## User Flows

### 5.1 Dashboard Home

**URL**: `/dashboard`

**Content**:
1. Welcome message: "Hola, {user.name}"
2. Quick stats cards:
   - Total proyectos activos
   - Total conversaciones
   - Corpus personales
3. Recent projects (últimos 5)
4. Recent conversations (últimas 5)
5. CTA buttons:
   - "Crear Proyecto"
   - "Chatear con Agente"
   - "Explorar Agentes"

---

### 5.2 Project Management Flow

#### 5.2.1 List Projects

**URL**: `/dashboard/projects`

**Similar a Admin Agents**, displays:
- Project cards (glassmorphic design)
- Project name, description, agent name
- Status badge (active/archived/completed)
- Last updated timestamp
- Actions (view, chat, archive)

**Filters**:
- Status dropdown
- Agent filter
- Search by name

---

#### 5.2.2 Create Project

**URL**: `/dashboard/projects/new`

**Happy Path**:
1. User navigates to `/dashboard/projects/new`
2. Step 1: Select Agent
   - Grid of available agents (cards con agent info)
   - User clicks agent card → Selects agent
3. Step 2: Project Details
   - Name (text, required)
   - Description (textarea, optional)
4. Submit via `createProject(formData)` Server Action
5. Server creates project (inherits `project_type` from agent)
6. Redirect to `/dashboard/projects/[id]/chat`
7. Show success toast + "Empieza a chatear con {agent.name}"

**UI Pattern**: Multi-step form with state management

```typescript
// components/projects/create-project-wizard.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createProject } from '@/lib/actions/projects';

type Step = 'select-agent' | 'project-details';

export function CreateProjectWizard({ agents }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('select-agent');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    if (!selectedAgent) return;

    formData.set('agent_id', selectedAgent);
    setIsSubmitting(true);

    const result = await createProject(formData);

    if (result.success) {
      router.push(`/dashboard/projects/${result.data.id}/chat`);
      router.refresh();
    } else {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      {step === 'select-agent' && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Selecciona un Agente</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map(agent => (
              <button
                key={agent.id}
                onClick={() => {
                  setSelectedAgent(agent.id);
                  setStep('project-details');
                }}
                className="glass-card p-6 text-left hover:border-cyan-400"
              >
                <h3 className="text-xl font-semibold">{agent.name}</h3>
                <p className="text-sm text-slate-400 mt-2">
                  {agent.description}
                </p>
                <div className="mt-4 text-xs text-cyan-400">
                  {agent.model_provider} · {agent.model_name}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'project-details' && (
        <form action={handleSubmit} className="max-w-2xl">
          <h2 className="text-2xl font-bold mb-6">Detalles del Proyecto</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium">Nombre *</label>
              <Input name="name" required maxLength={200} className="mt-1" />
            </div>

            <div>
              <label className="block text-sm font-medium">Descripción</label>
              <Textarea name="description" rows={4} className="mt-1" />
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-cyan-500 hover:bg-cyan-600"
              >
                {isSubmitting ? 'Creando...' : 'Crear Proyecto'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('select-agent')}
              >
                Atrás
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
```

---

### 5.3 Chat with Agent Flow

**URL**: `/dashboard/projects/[id]/chat`

**Happy Path**:
1. User navigates to project chat
2. Server Component fetches:
   - Project details
   - Agent configuration
   - Conversation history (if exists)
3. Chat UI displays:
   - Agent avatar + name (header)
   - Message history (scrollable)
   - Input box (textarea + send button)
4. User types message
5. User clicks "Send" or presses Enter
6. Client sends POST to `/api/agents/[id]/chat` with:
   - `project_id`
   - `messages` array (user message)
   - `stream: true`
7. Server performs RAG retrieval:
   - Fetches assigned corpus (global + personal)
   - Semantic search in Qdrant (top-5 chunks)
   - Injects chunks into system prompt
8. LLM streams response (SSE)
9. Client displays response word-by-word (streaming UX)
10. Save conversation to DB
11. User can continue chatting

**UI Components**:
- ChatContainer (Client Component)
- MessageBubble (Server/Client hybrid)
- ChatInput (Client Component with optimistic update)

```typescript
// components/chat/chat-container.tsx
'use client';

import { useState } from 'react';
import { useChat } from '@vercel/ai/react'; // Vercel AI SDK
import { MessageBubble } from './message-bubble';
import { ChatInput } from './chat-input';

export function ChatContainer({ projectId, agentId, initialMessages }) {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: `/api/agents/${agentId}/chat`,
    body: { project_id: projectId },
    initialMessages,
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message, i) => (
          <MessageBubble key={i} message={message} />
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-slate-400">
            <div className="animate-pulse">●</div>
            <div className="animate-pulse animation-delay-200">●</div>
            <div className="animate-pulse animation-delay-400">●</div>
          </div>
        )}
      </div>

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

**Error Paths**:
- Network error → "Error de conexión. Intenta nuevamente"
- Agent unavailable → "Agente temporalmente no disponible"
- Rate limit → "Límite de mensajes alcanzado. Espera un momento"

---

### 5.4 Personal Corpus Management Flow

**Similar a Admin Global Corpus**, pero:
- URL: `/dashboard/corpus`
- User can only manage OWN corpus
- When assigning to agents: validate `allows_personal_corpus = true`

---

## Form Patterns

### 6.1 Form Validation (Client-Side)

**Strategy**: Zod schemas in both client and server (DRY)

```typescript
// lib/validation/shared.ts (SHARED entre client y server)
import { z } from 'zod';

export const agentFormSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(100),
  // ... rest of schema
});
```

```typescript
// Client Component
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { agentFormSchema } from '@/lib/validation/shared';

export function CreateAgentForm() {
  const form = useForm({
    resolver: zodResolver(agentFormSchema),
    defaultValues: {
      name: '',
      // ...
    },
  });

  async function onSubmit(data) {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.set(key, value as string);
    });

    const result = await createAgent(formData);
    // ...
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Input {...form.register('name')} />
      {form.formState.errors.name && (
        <p className="text-red-500 text-sm">
          {form.formState.errors.name.message}
        </p>
      )}
      {/* ... */}
    </form>
  );
}
```

---

### 6.2 Form Submission States

**States**:
1. **Idle**: Form ready, button enabled
2. **Validating**: Client-side validation in progress
3. **Submitting**: Server Action executing, button disabled
4. **Success**: Redirect or show success message
5. **Error**: Display error, button re-enabled

**Visual Feedback**:
- Button text changes: "Crear" → "Creando..." → "Creado ✓"
- Spinner icon during submission
- Disable all inputs during submission
- Show inline errors below fields

---

## Loading States

### 7.1 Suspense Boundaries

**Strategy**: Wrap async components in Suspense with skeletons

```typescript
// app/dashboard/projects/page.tsx

import { Suspense } from 'react';
import { ProjectsList } from '@/components/projects/projects-list';
import { ProjectsListSkeleton } from '@/components/projects/projects-list-skeleton';

export default function ProjectsPage() {
  return (
    <div>
      <h1>Proyectos</h1>
      <Suspense fallback={<ProjectsListSkeleton />}>
        <ProjectsData />
      </Suspense>
    </div>
  );
}

async function ProjectsData() {
  const projects = await fetchProjects(); // async server fetch
  return <ProjectsList projects={projects} />;
}
```

---

### 7.2 Skeleton Components

**Design**: Match layout of actual component, use shimmer animation

```typescript
// components/projects/projects-list-skeleton.tsx

export function ProjectsListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="glass-card p-6 space-y-3 animate-pulse">
          <div className="h-6 bg-slate-700 rounded w-3/4"></div>
          <div className="h-4 bg-slate-700 rounded w-full"></div>
          <div className="h-4 bg-slate-700 rounded w-5/6"></div>
          <div className="flex gap-2 mt-4">
            <div className="h-8 bg-slate-700 rounded w-20"></div>
            <div className="h-8 bg-slate-700 rounded w-20"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

### 7.3 Streaming Data (Chat)

**Strategy**: SSE (Server-Sent Events) with Vercel AI SDK

```typescript
// Client displays tokens progressively as they stream
// Managed by useChat() hook (Vercel AI SDK)
```

---

## Error Handling

### 8.1 Error Boundaries

**Strategy**: Catch React errors, display fallback UI

```typescript
// app/error.tsx (Global error boundary)

'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-red-400">
          Algo salió mal
        </h2>
        <p className="text-slate-400">{error.message}</p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-cyan-500 rounded hover:bg-cyan-600"
        >
          Intentar nuevamente
        </button>
      </div>
    </div>
  );
}
```

---

### 8.2 API Error Handling

**Strategy**: Standardized error responses + user-friendly messages

```typescript
// Client Component error handling

async function handleSubmit(formData: FormData) {
  try {
    const result = await createProject(formData);

    if (!result.success) {
      // Expected error (validation, business logic)
      setError(result.error);
    } else {
      // Success
      router.push(`/dashboard/projects/${result.data.id}`);
    }
  } catch (err) {
    // Unexpected error (network, server)
    setError('Error inesperado. Por favor intenta nuevamente.');
    console.error(err);
  }
}
```

---

### 8.3 Toast Notifications

**Strategy**: Use toast library (e.g., sonner) for transient feedback

```typescript
import { toast } from 'sonner';

// Success toast
toast.success('Proyecto creado exitosamente');

// Error toast
toast.error('Error al crear proyecto');

// Info toast
toast.info('Documento procesándose...');
```

---

## Resumen de Flujos

### Admin Flows

| Flow | URL | Components | Actions |
|------|-----|------------|---------|
| List Agents | `/admin/agents` | AgentsTable | - |
| Create Agent | `/admin/agents/new` | CreateAgentForm | createAgent |
| Edit Agent | `/admin/agents/[id]/edit` | EditAgentForm | updateAgent |
| Delete Agent | `/admin/agents/[id]` | ConfirmDialog | deleteAgent |
| List Corpus | `/admin/corpus` | CorpusTable | - |
| Create Corpus | `/admin/corpus/new` | CreateCorpusForm | createGlobalCorpus |
| Assign Corpus | `/admin/corpus/[id]` | AssignAgentsDialog | assignCorpusToAgents |
| Upload Document | `/admin/corpus/[id]/documents` | DocumentUploader | POST /api/admin/corpus/[id]/documents |

### User Flows

| Flow | URL | Components | Actions |
|------|-----|------------|---------|
| Dashboard Home | `/dashboard` | DashboardStats, RecentProjects | - |
| List Projects | `/dashboard/projects` | ProjectsList | - |
| Create Project | `/dashboard/projects/new` | CreateProjectWizard | createProject |
| Edit Project | `/dashboard/projects/[id]/edit` | EditProjectForm | updateProject |
| Chat with Agent | `/dashboard/projects/[id]/chat` | ChatContainer | POST /api/agents/[id]/chat |
| List Corpus | `/dashboard/corpus` | CorpusList | - |
| Create Corpus | `/dashboard/corpus/new` | CreateCorpusForm | createPersonalCorpus |
| Assign Corpus | `/dashboard/corpus/[id]` | AssignAgentsDialog | assignPersonalCorpusToAgents |
| Upload Document | `/dashboard/corpus/[id]/documents` | DocumentUploader | POST /api/corpus/[id]/documents |

### Auth Flows

| Flow | URL | Components | Actions |
|------|-----|------------|---------|
| Login | `/auth/login` | LoginForm | supabase.auth.signInWithPassword |
| Sign Up | `/auth/sign-up` | SignUpForm | supabase.auth.signUp |
| Forgot Password | `/auth/forgot-password` | ForgotPasswordForm | supabase.auth.resetPasswordForEmail |
| Confirm Email | `/auth/confirm` | ConfirmPage | supabase.auth.verifyOtp |

---

## Próximos Pasos (Fase 4 - Desarrollo)

1. Implementar layouts (Admin, Dashboard, Auth)
2. Implementar navigation components (Sidebar, Nav)
3. Implementar page components (list, detail, create, edit)
4. Implementar form components (con react-hook-form + Zod)
5. Implementar chat interface (con Vercel AI SDK)
6. Implementar loading states (Suspense + skeletons)
7. Implementar error handling (error boundaries + toast)
8. Testing de flujos (Fase 5)

---

**Fecha de Diseño**: 2025-11-21
**Responsable**: user-flow-designer (Fase 3)
**Estado**: COMPLETO
**Próximo Paso**: Validar coherencia API ↔ Flows con design-validator
