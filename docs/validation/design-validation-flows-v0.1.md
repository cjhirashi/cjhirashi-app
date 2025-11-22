# Design Validation Report - User Flows v0.1

**Versión**: v0.1
**Fecha**: 2025-11-21
**Responsable**: design-validator (Fase 3)
**Tipo**: Validación Iterativa 3 (API ↔ Flows Coherence)

---

## Objetivo de Validación

Validar la coherencia entre:
- **API Design** (`api-design-detailed-v0.1.md`)
- **User Flows** (`user-flows-v0.1.md`)

**Criterios de Validación**:
1. Flujos usan endpoints definidos en API
2. Navegación es coherente con arquitectura
3. State management usa Server State apropiadamente
4. Autenticación es consistente

---

## Criterio 1: Flujos Usan Endpoints Definidos en API

### Validación de Endpoints Usados

#### Admin Flows

| Flow | Endpoint/Action Usado | Definido en API? | Status |
|------|----------------------|------------------|--------|
| Create Agent | `createAgent(formData)` Server Action | ✅ `lib/actions/admin/agents.ts` | ✅ PASS |
| Update Agent | `updateAgent(id, formData)` Server Action | ✅ `lib/actions/admin/agents.ts` | ✅ PASS |
| Delete Agent | `deleteAgent(id)` Server Action | ✅ `lib/actions/admin/agents.ts` | ✅ PASS |
| List Agents | Server Component fetch via Supabase | ✅ Direct DB query (expected) | ✅ PASS |
| Create Global Corpus | `createGlobalCorpus(formData)` Server Action | ✅ `lib/actions/admin/corpus.ts` | ✅ PASS |
| Assign Corpus | `assignCorpusToAgents(corpusId, agentIds)` Server Action | ✅ `lib/actions/admin/corpus.ts` | ✅ PASS |
| Upload Document | POST `/api/admin/corpus/[id]/documents` | ✅ Route Handler defined | ✅ PASS |

#### User Flows

| Flow | Endpoint/Action Usado | Definido en API? | Status |
|------|----------------------|------------------|--------|
| Create Project | `createProject(formData)` Server Action | ✅ `lib/actions/projects.ts` | ✅ PASS |
| Update Project | `updateProject(id, formData)` Server Action | ✅ `lib/actions/projects.ts` | ✅ PASS |
| Archive Project | `archiveProject(id)` Server Action | ✅ `lib/actions/projects.ts` | ✅ PASS |
| List Projects | Server Component fetch via Supabase | ✅ Direct DB query (expected) | ✅ PASS |
| Chat with Agent | POST `/api/agents/[id]/chat` | ✅ Route Handler defined | ✅ PASS |
| Create Personal Corpus | `createPersonalCorpus(formData)` Server Action | ✅ `lib/actions/corpus.ts` | ✅ PASS |
| Assign Personal Corpus | `assignPersonalCorpusToAgents(corpusId, agentIds)` Server Action | ✅ `lib/actions/corpus.ts` | ✅ PASS |
| Upload Document | POST `/api/corpus/[id]/documents` | ✅ Route Handler defined | ✅ PASS |

#### Auth Flows

| Flow | Endpoint Usado | Definido en API? | Status |
|------|----------------|------------------|--------|
| Login | `supabase.auth.signInWithPassword()` | ✅ Supabase Auth (built-in) | ✅ PASS |
| Sign Up | `supabase.auth.signUp()` | ✅ Supabase Auth (built-in) | ✅ PASS |
| Forgot Password | `supabase.auth.resetPasswordForEmail()` | ✅ Supabase Auth (built-in) | ✅ PASS |
| Confirm Email | `supabase.auth.verifyOtp()` | ✅ Supabase Auth (built-in) | ✅ PASS |

**Resultado**: ✅ **TODOS los flujos usan endpoints/actions definidos en API Design**

---

## Criterio 2: Navegación es Coherente con Arquitectura

### Validación de Estructura de Rutas

#### App Router Structure (Esperado)

```
/auth/*          → Public routes (login, sign-up, forgot-password)
/admin/*         → Admin routes (requires admin role)
/dashboard/*     → User routes (requires auth)
```

#### User Flows - Rutas Usadas

| Flow | Ruta | Layout Esperado | Auth Check | Status |
|------|------|-----------------|------------|--------|
| Login | `/auth/login` | Public | No auth required | ✅ PASS |
| Sign Up | `/auth/sign-up` | Public | No auth required | ✅ PASS |
| Admin Agents List | `/admin/agents` | AdminLayout | `requireAdmin()` | ✅ PASS |
| Admin Create Agent | `/admin/agents/new` | AdminLayout | `requireAdmin()` | ✅ PASS |
| Admin Edit Agent | `/admin/agents/[id]/edit` | AdminLayout | `requireAdmin()` | ✅ PASS |
| Admin Corpus List | `/admin/corpus` | AdminLayout | `requireAdmin()` | ✅ PASS |
| Dashboard Home | `/dashboard` | DashboardLayout | `requireAuth()` | ✅ PASS |
| Projects List | `/dashboard/projects` | DashboardLayout | `requireAuth()` | ✅ PASS |
| Create Project | `/dashboard/projects/new` | DashboardLayout | `requireAuth()` | ✅ PASS |
| Project Chat | `/dashboard/projects/[id]/chat` | DashboardLayout | `requireAuth()` | ✅ PASS |
| Corpus List | `/dashboard/corpus` | DashboardLayout | `requireAuth()` | ✅ PASS |

**Resultado**: ✅ **Navegación es coherente con arquitectura de rutas**

---

### Validación de Layouts

#### AdminLayout

**User Flows Spec**:
```typescript
// app/admin/layout.tsx
export default async function AdminLayout({ children }) {
  try {
    await requireAdmin();
  } catch {
    redirect('/unauthorized');
  }
  // ... sidebar + main content
}
```

**API Auth Helper**:
```typescript
// lib/actions/auth.ts
export async function requireAdmin() {
  const supabase = await createClient();
  await supabase.auth.getClaims();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!roleData || !['admin', 'moderator'].includes(roleData.role)) {
    redirect('/unauthorized');
  }

  return { user, role: roleData.role };
}
```

**Validación**:
- ✅ Layout usa `requireAdmin()` helper definido en API
- ✅ Redirect a `/unauthorized` si no admin (coherente)
- ✅ Sidebar component rendering (UI, no afecta API coherence)

**Resultado**: ✅ **COHERENTE**

---

#### DashboardLayout

**User Flows Spec**:
```typescript
// app/dashboard/layout.tsx
export default async function DashboardLayout({ children }) {
  const supabase = await createClient();
  await supabase.auth.getClaims();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // ... nav + main content
}
```

**Validación**:
- ✅ Layout usa `createClient()` helper (consistent with API design)
- ✅ Calls `getClaims()` (required per middleware pattern)
- ✅ Redirect a `/auth/login` si no auth (coherente)

**Resultado**: ✅ **COHERENTE**

---

## Criterio 3: State Management Usa Server State Apropiadamente

### Validación de Server Components (Data Fetching)

#### Example: Projects List

**User Flows Spec**:
```typescript
// app/dashboard/projects/page.tsx
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

**API Endpoint Equivalent**: GET `/api/projects`

**Validación**:
- ✅ User Flows usa Server Component (optimal for data fetching)
- ✅ Fetches data via Supabase client (aligned with API design pattern)
- ✅ Uses Suspense boundary (progressive streaming, good UX)
- ❌ **DISCREPANCY**: Flows usa direct Supabase query, pero API tiene Route Handler `/api/projects`

**Análisis**:
- **Option 1 (Current)**: Server Component fetch directly from DB (más eficiente)
- **Option 2**: Server Component fetch via API Route (más indirecto)
- **Recomendación**: **ACCEPTABLE** - Server Components SHOULD fetch directly from DB (best practice NextJS 15+)
- **Conclusión**: Route Handler `/api/projects` es para Client Components o external access, Server Components van directo a DB

**Resultado**: ✅ **COHERENTE** (discrepancia es intencional y correcta)

---

### Validación de Client Components (UI State)

#### Example: CreateProjectForm

**User Flows Spec**:
```typescript
'use client';

export function CreateProjectForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    const result = await createProject(formData); // Server Action

    if (result.success) {
      router.push(`/dashboard/projects/${result.data.id}`);
    } else {
      setError(result.error);
      setIsSubmitting(false);
    }
  }

  return <form action={handleSubmit}>...</form>;
}
```

**API Server Action**: `createProject(formData)` in `lib/actions/projects.ts`

**Validación**:
- ✅ Form usa Server Action (CSRF protection built-in)
- ✅ Client state SOLO para UI (isSubmitting, error) - CORRECTO
- ✅ Data mutation delegada a Server Action (no client-side DB access) - CORRECTO
- ✅ Error handling consistente con API response format (`{ success, error }`)

**Resultado**: ✅ **COHERENTE**

---

### Validación de Optimistic Updates

**User Flows Spec**:
```typescript
const [optimisticProject, addOptimisticUpdate] = useOptimistic(
  project,
  (state, newStatus) => ({ ...state, status: newStatus })
);

async function handleArchive() {
  addOptimisticUpdate('archived');
  const result = await archiveProject(project.id);
  // Rollback automatic if server fails
}
```

**API Server Action**: `archiveProject(id)` in `lib/actions/projects.ts`

**Validación**:
- ✅ Optimistic update pattern (modern React pattern)
- ✅ Server Action returns success/error for rollback logic
- ✅ No client-side DB mutation (delegated to server)

**Resultado**: ✅ **COHERENTE**

---

## Criterio 4: Autenticación es Consistente

### Validación de Auth Flows

#### Login Flow

**User Flows Spec**:
```typescript
const { error } = await supabase.auth.signInWithPassword({ email, password });

if (error) {
  setError(error.message);
} else {
  router.push('/dashboard');
  router.refresh();
}
```

**API Auth Helper**: Uses Supabase Auth (built-in)

**Validación**:
- ✅ Uses `createClient()` from `@/lib/supabase/client` (consistent)
- ✅ Redirect to `/dashboard` after login (expected)
- ✅ `router.refresh()` triggers server re-fetch (correct)

**Resultado**: ✅ **COHERENTE**

---

#### Admin Auth Check

**User Flows - AdminLayout**:
```typescript
await requireAdmin(); // Throws/redirects if not admin
```

**API Auth Helper - Server Actions**:
```typescript
export async function requireAdmin() {
  const supabase = await createClient();
  await supabase.auth.getClaims();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!roleData || !['admin', 'moderator'].includes(roleData.role)) {
    redirect('/unauthorized');
  }

  return { user, role: roleData.role };
}
```

**Validación**:
- ✅ MISMO helper usado en flows y API design
- ✅ MISMA lógica de auth check
- ✅ MISMOS redirects

**Resultado**: ✅ **COHERENTE**

---

#### API Route Auth Check

**API Design - requireApiRole**:
```typescript
export async function requireApiRole(request: NextRequest, role: 'admin' | 'moderator') {
  const { user, supabase } = await requireAuth(request);

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!roleData || !['admin', 'moderator'].includes(roleData.role)) {
    throw new Response(
      JSON.stringify(apiError('FORBIDDEN', 'Insufficient permissions')),
      { status: 403 }
    );
  }

  return { user, supabase, role: roleData.role };
}
```

**User Flows - Usage**:
- Admin flows NO llaman API Routes directamente (usan Server Actions)
- Server Actions usan `requireAdmin()` (layout level)
- API Routes usan `requireApiRole()` (cuando Client Component llama API directamente)

**Validación**:
- ✅ Lógica de role check es CONSISTENTE entre helpers
- ✅ Diferencia en error handling (redirect vs throw Response) es CORRECTA (context-specific)

**Resultado**: ✅ **COHERENTE**

---

## Resumen de Validación

### Checklist Completo

- [x] Flujos usan endpoints definidos en API
- [x] Server Actions corresponden a definiciones en API
- [x] Route Handlers corresponden a definiciones en API
- [x] Navegación es coherente con arquitectura de rutas
- [x] Layouts implementan auth checks correctamente
- [x] Server Components fetch data directamente (correcto)
- [x] Client Components usan Server Actions (correcto)
- [x] State management es apropiado (Server State + Client UI State)
- [x] Optimistic updates siguen patrón correcto
- [x] Auth flows son consistentes (login, sign-up, forgot password)
- [x] Auth checks en layouts matchean helpers de API
- [x] Error handling es consistente

---

## Issues Detectados

**NINGUNO**. La coherencia API ↔ Flows es **100% consistente**.

### Observaciones (No Bloqueantes)

1. **Server Components fetch directamente vs API Routes**:
   - Server Components: fetch via Supabase client (directo a DB)
   - API Routes: disponibles para Client Components o external access
   - **Conclusión**: Es el patrón CORRECTO de NextJS 15+ (no es inconsistencia)

2. **Navigation patterns son extensos**:
   - User Flows incluye muchos componentes de navegación (Sidebar, Nav)
   - **Impacto**: NO afecta coherencia con API (solo UI)
   - **Recomendación**: Separar componentes UI en fase de UI Components Design (siguiente paso)

---

## Resultado Final de Validación

### Status: ✅ **APROBADO**

**Coherencia API ↔ Flows**: **100%**

**Intentos de Validación**: 1/3 (aprobado en primer intento)

**Recomendación**: Continuar a **Paso 6: UI Components Design**

---

**Fecha de Validación**: 2025-11-21
**Responsable**: design-validator (Fase 3)
**Próximo Paso**: Delegar a ui-designer para diseño de componentes UI NextJS
