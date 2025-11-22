# User Flows & Navigation - CJHIRASHI APP v0.1

**Versión**: v0.1
**Fecha**: 2025-11-21
**Responsable**: architect (fase-2-arquitectura-leader)
**ADR Relacionado**: ADR-006

---

## Visión General

CJHIRASHI APP v0.1 define flujos de usuario diferenciados según rol:

- **Admin/Moderator**: Flujos administrativos + flujos regulares
- **User**: Flujos regulares únicamente

**Objetivos**:
1. Experiencia intuitiva por rol
2. Navegación clara entre paneles (para admins)
3. Flujos optimizados para tareas frecuentes
4. Acceso rápido a funcionalidades críticas

---

## 1. Roles y Permisos

### 1.1 Matriz de Permisos

| Funcionalidad | Admin | Moderator | User |
|---------------|-------|-----------|------|
| **Admin Panel** |
| Gestionar agentes | ✅ | ✅ | ❌ |
| Gestionar corpus global | ✅ | ✅ | ❌ |
| Ver usuarios | ✅ | ✅ | ❌ |
| Gestionar roles | ✅ | ❌ | ❌ |
| Ver audit logs | ✅ | ✅ | ❌ |
| Configuración sistema | ✅ | ❌ | ❌ |
| **User Dashboard** |
| Ver dashboard | ✅ | ✅ | ✅ |
| Crear proyectos | ✅ | ✅ | ✅ |
| Gestionar corpus personal | ✅ | ✅ | ✅ |
| Chat con agentes | ✅ | ✅ | ✅ |
| Ver agentes disponibles | ✅ | ✅ | ✅ |

---

## 2. Admin/Moderator Flows

### 2.1 Flow: Navegar entre Admin Panel y Dashboard

**Actor**: Admin o Moderator
**Objetivo**: Cambiar entre área administrativa y área de usuario
**Frecuencia**: Media

**Pasos**:
1. Usuario está en `/admin/*` o `/dashboard/*`
2. Usuario ve **Panel Toggle** en header
3. Click en toggle:
   - Si en Admin → Redirige a `/dashboard`
   - Si en Dashboard → Redirige a `/admin`
4. Usuario accede al otro panel sin perder sesión

**Componentes**:
- `PanelToggle.tsx` (header de ambas áreas)
- Middleware: Valida rol antes de permitir acceso

**Diagrama**:
```
Admin Panel (/admin/*)
        ↕
   Panel Toggle
        ↕
User Dashboard (/dashboard/*)
```

---

### 2.2 Flow: Crear Agente (Admin)

**Actor**: Admin o Moderator
**Objetivo**: Crear agente nuevo para usuarios
**Frecuencia**: Baja (setup inicial)

**Pasos**:
1. Admin navega a `/admin` (dashboard admin)
2. Sidebar: Click en "Agentes"
3. Redirige a `/admin/agents` (listado de agentes)
4. Click botón "Crear Agente"
5. Redirige a `/admin/agents/new` (formulario)
6. Admin completa formulario:
   - Nombre
   - Descripción
   - System Prompt
   - Model Provider (select: OpenAI, Anthropic, Google)
   - Model Name (input: ej. `gpt-4o`)
   - Temperature (slider: 0.0-2.0)
   - Max Tokens (input)
   - Permite Corpus Personal (checkbox)
   - Tipo de Proyecto (input: ej. "Libro")
7. Admin click "Guardar"
8. Validación (Zod):
   - Nombre requerido (max 100 chars)
   - System Prompt requerido (min 10 chars)
   - Model Provider válido
   - Temperature en rango
9. Server Action: `createAgent(formData)`
10. Success:
    - Toast: "Agente creado exitosamente"
    - Redirect a `/admin/agents` (listado actualizado)
11. Error:
    - Toast: Mensaje de error específico
    - Usuario permanece en formulario

**Validaciones**:
- Nombre único (no duplicados)
- Model Name válido según provider
- Temperature en rango 0.0-2.0

**Audit Log**:
- Action: `agent.create`
- Category: `agent`
- Resource: `agents/{id}`
- Changes: Full object created

**Componentes**:
- `app/admin/agents/page.tsx` (listado)
- `app/admin/agents/new/page.tsx` (formulario)
- `components/admin/AgentForm.tsx` (form component)
- `lib/actions/admin/agents.ts` (Server Action)
- `lib/validation/agents.ts` (Zod schema)

---

### 2.3 Flow: Crear Corpus Global y Asignar a Agentes (Admin)

**Actor**: Admin o Moderator
**Objetivo**: Crear corpus organizacional y asignarlo a agentes específicos
**Frecuencia**: Media

**Pasos**:
1. Admin navega a `/admin/corpus`
2. Click botón "Crear Corpus Global"
3. Redirige a `/admin/corpus/new`
4. Admin completa formulario:
   - Nombre (ej: "Manual de Estilo Corporativo")
   - Descripción
   - Tipo: `global` (fijo)
5. Admin click "Crear"
6. Server Action: `createGlobalCorpus(formData)`
7. Corpus creado → Redirige a `/admin/corpus/{id}` (detalles)
8. Admin ve página de detalles del corpus:
   - Información básica
   - Sección "Agentes Asignados" (vacía inicialmente)
   - Botón "Asignar a Agentes"
9. Admin click "Asignar a Agentes"
10. Modal se abre con:
    - Multiselect de agentes disponibles
    - Checkbox list: Escritor de Libros, Analista de Datos, etc.
11. Admin selecciona agentes (ej: "Escritor de Libros", "Investigador Técnico")
12. Admin click "Asignar"
13. Server Action: `assignCorpusToAgents(corpusId, agentIds)`
14. Success:
    - Toast: "Corpus asignado a 2 agentes"
    - Tabla "Agentes Asignados" se actualiza
15. Admin puede subir documentos:
    - Click "Subir Documento"
    - File input: PDF, TXT, MD, DOCX
    - Click "Upload"
    - POST `/api/admin/corpus/{id}/documents`
    - Documento procesado en background (chunking → embeddings → Qdrant)
    - Status: `pending` → `processing` → `indexed`

**Validaciones**:
- Nombre único
- Al menos 1 agente seleccionado para asignación
- Archivo < 10MB, tipos permitidos

**Audit Logs**:
- `corpus.create`
- `corpus.assign` (registra agentes asignados)
- `corpus.document.upload`

**Componentes**:
- `app/admin/corpus/page.tsx` (listado)
- `app/admin/corpus/new/page.tsx` (formulario)
- `app/admin/corpus/[id]/page.tsx` (detalles + asignación)
- `components/admin/CorpusForm.tsx`
- `components/admin/CorpusAssignmentModal.tsx`
- `components/corpus/DocumentUploader.tsx`
- `lib/actions/admin/corpus.ts`

---

## 3. User Flows

### 3.1 Flow: Login y Acceso a Dashboard

**Actor**: Usuario regular (cualquier rol)
**Objetivo**: Acceder al sistema
**Frecuencia**: Alta

**Pasos**:
1. Usuario navega a `/` (home pública)
2. Click "Iniciar Sesión" → Redirige a `/auth/login`
3. Usuario ingresa email y contraseña
4. Click "Ingresar"
5. Supabase Auth valida credenciales
6. Success:
   - Middleware valida sesión
   - Redirige según rol:
     - Admin/Moderator → `/admin` o `/dashboard` (configurable)
     - User → `/dashboard`
7. Usuario ve dashboard correspondiente

**Error Handling**:
- Credenciales inválidas → Toast: "Email o contraseña incorrectos"
- Usuario no confirmado → Toast: "Por favor confirma tu email"

**Componentes**:
- `app/auth/login/page.tsx` (EXISTING v1.0)
- `middleware.ts` (session validation)
- Redirect logic según rol

---

### 3.2 Flow: Ver Dashboard con Métricas

**Actor**: Usuario regular
**Objetivo**: Ver resumen de actividad
**Frecuencia**: Alta

**Pasos**:
1. Usuario accede a `/dashboard` (home del dashboard)
2. Layout glassmorphic renderiza:
   - Sidebar con navegación
   - Header con user profile
   - Main content area
3. Dashboard muestra 4 Metrics Cards:
   - **Proyectos Activos**: Conteo de proyectos con `status = 'active'`
   - **Agentes Usados**: Conteo de agentes distintos en proyectos del usuario
   - **Corpus Personales**: Conteo de corpus del usuario
   - **Última Actividad**: Timestamp de última conversación
4. Usuario ve datos actualizados desde Supabase (Server Component)
5. Cards son glassmorphic con animaciones hover

**Queries**:
```sql
-- Proyectos activos
SELECT COUNT(*) FROM projects WHERE user_id = auth.uid() AND status = 'active';

-- Agentes usados
SELECT COUNT(DISTINCT agent_id) FROM projects WHERE user_id = auth.uid();

-- Corpus personales
SELECT COUNT(*) FROM corpora WHERE owner_user_id = auth.uid() AND corpus_type = 'personal';

-- Última actividad
SELECT MAX(created_at) FROM conversations WHERE user_id = auth.uid();
```

**Componentes**:
- `app/dashboard/page.tsx` (Server Component)
- `components/dashboard/MetricsCard.tsx`
- `components/dashboard/DashboardCard.tsx` (wrapper glassmorphic)

---

### 3.3 Flow: Crear Proyecto Personal

**Actor**: Usuario regular
**Objetivo**: Crear proyecto asignado a un agente
**Frecuencia**: Alta

**Pasos**:
1. Usuario en `/dashboard` → Sidebar: Click "Proyectos"
2. Redirige a `/dashboard/projects` (listado de proyectos)
3. Usuario ve:
   - Cards glassmorphic de proyectos existentes
   - Botón "Crear Proyecto" (floating action button)
4. Click "Crear Proyecto"
5. Redirige a `/dashboard/projects/new` (formulario)
6. Usuario completa formulario:
   - **Nombre del Proyecto** (input)
   - **Descripción** (textarea opcional)
   - **Seleccionar Agente** (select dropdown)
     - Dropdown muestra agentes activos (`is_active = true`)
     - Cada opción: Nombre del agente + descripción breve
   - **Tipo de Proyecto** (readonly, heredado de agente seleccionado)
     - Al seleccionar agente → campo se auto-completa
     - Ej: Selecciono "Escritor de Libros" → Tipo: "Libro"
7. Usuario click "Crear Proyecto"
8. Validación (Zod):
   - Nombre requerido (max 200 chars)
   - Agente seleccionado (UUID válido)
9. Server Action: `createProject(formData)`
   - Lógica interna:
     - `user_id = auth.uid()` (auto-inject)
     - Fetch `agents.project_type` → Asignar a `projects.project_type`
     - `status = 'active'` (default)
10. Success:
    - Toast: "Proyecto creado exitosamente"
    - Redirect a `/dashboard/projects/{id}` (detalles del proyecto)
11. Error:
    - Toast: Mensaje de error
    - Usuario permanece en formulario

**Validaciones**:
- Usuario autenticado (layout protection)
- Agente existe y está activo
- Nombre no vacío

**RLS**:
- `user_id = auth.uid()` garantiza que usuario solo crea SUS proyectos

**Componentes**:
- `app/dashboard/projects/page.tsx` (listado)
- `app/dashboard/projects/new/page.tsx` (formulario)
- `components/dashboard/ProjectForm.tsx`
- `components/dashboard/AgentSelector.tsx` (dropdown agentes)
- `lib/actions/projects.ts`
- `lib/validation/projects.ts`

---

### 3.4 Flow: Chatear con Agente en Proyecto (RAG-Enabled)

**Actor**: Usuario regular
**Objetivo**: Interactuar con agente usando contexto de corpus
**Frecuencia**: Muy Alta

**Pasos**:
1. Usuario en `/dashboard/projects/{id}` (detalles del proyecto)
2. Usuario ve:
   - Información del proyecto (nombre, descripción, agente asignado)
   - Botón "Iniciar Chat" o "Continuar Chat" (si hay conversaciones previas)
3. Click "Iniciar Chat"
4. Redirige a `/dashboard/projects/{id}/chat`
5. Chat Interface renderiza:
   - Header: Nombre del proyecto + agente
   - Message Area: Historial de conversación (scroll)
   - Input Area: Textarea + botón "Enviar"
6. Usuario escribe mensaje: "¿Cómo estructuro el primer capítulo?"
7. Usuario click "Enviar" (o Enter)
8. Client-side:
   - Mensaje se agrega a UI (optimistic update)
   - POST `/api/agents/{agentId}/chat`
   - Body: `{ project_id, messages: [...], stream: true }`
9. Server-side (RAG Retrieval):
   - Identifica corpus asignados al agente:
     - **Corpus Global**: Todos los corpus globales asignados al agente
     - **Corpus Personal**: Corpus personales del usuario asignados al agente (si `allows_personal_corpus = true`)
   - User query → Semantic search en Qdrant:
     - Filters: `agent_id`, `user_id` (para corpus personal)
     - Top-k chunks: 5-10 chunks más relevantes
   - Context builder:
     - Inyecta chunks en system prompt del agente
     - Formato: "CONTEXTO RELEVANTE:\n[chunks]\n\nUSER QUERY:\n{query}"
10. LLM genera respuesta (Vercel AI SDK):
    - Model provider según agente (OpenAI o Anthropic)
    - Streaming: Server-Sent Events (SSE)
11. Client-side:
    - Streaming response se renderiza token por token
    - Animación de escritura (typing effect)
12. Conversación guardada:
    - POST a tabla `conversations` (user message + assistant response)
    - `project_id`, `agent_id`, `user_id` registrados
13. Usuario puede continuar conversación (multi-turn)

**RAG Context Example**:
```
SYSTEM PROMPT: Eres un escritor creativo experto...

CONTEXTO RELEVANTE:
[CHUNK 1 - Corpus Global "Manual de Estilo"]:
"El primer capítulo debe establecer el tono y presentar el protagonista..."

[CHUNK 2 - Corpus Personal "Mis Notas"]:
"Mi protagonista es un científico en una estación espacial..."

USER QUERY:
¿Cómo estructuro el primer capítulo?
```

**Componentes**:
- `app/dashboard/projects/[id]/chat/page.tsx`
- `components/chat/ChatInterface.tsx` (main UI)
- `components/chat/ChatMessage.tsx` (individual message)
- `components/chat/ChatInput.tsx` (textarea + send button)
- `app/api/agents/[id]/chat/route.ts` (API endpoint)
- `lib/rag/retrieval.ts` (semantic search)
- `lib/rag/context-builder.ts` (inject chunks in prompt)
- `lib/ai/chat.ts` (Vercel AI SDK integration)

**Hooks**:
```tsx
// Using Vercel AI SDK useChat hook
import { useChat } from 'ai/react';

const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
  api: `/api/agents/${agentId}/chat`,
  body: { project_id: projectId }
});
```

---

### 3.5 Flow: Crear Corpus Personal y Asignar a Agente

**Actor**: Usuario regular
**Objetivo**: Crear corpus privado para agentes que lo permitan
**Frecuencia**: Media

**Pasos**:
1. Usuario en `/dashboard` → Sidebar: Click "Corpus"
2. Redirige a `/dashboard/corpus` (listado de corpus personales)
3. Usuario ve:
   - Cards de corpus personales existentes
   - Botón "Crear Corpus Personal"
4. Click "Crear Corpus Personal"
5. Redirige a `/dashboard/corpus/new` (formulario)
6. Usuario completa formulario:
   - **Nombre** (ej: "Mis Notas de Proyecto X")
   - **Descripción**
   - Tipo: `personal` (fijo, oculto en UI)
7. Click "Crear"
8. Server Action: `createPersonalCorpus(formData)`
   - Lógica interna:
     - `owner_user_id = auth.uid()` (auto-inject)
     - `corpus_type = 'personal'` (fixed)
9. Success:
   - Redirect a `/dashboard/corpus/{id}` (detalles)
10. Usuario ve detalles del corpus:
    - Información básica
    - Sección "Agentes Asignados" (vacía)
    - Botón "Asignar a Agentes"
11. Click "Asignar a Agentes"
12. Modal se abre:
    - **CRÍTICO**: Solo muestra agentes con `allows_personal_corpus = true`
    - Multiselect de agentes permitidos
13. Usuario selecciona agentes (ej: "Escritor de Libros")
14. Click "Asignar"
15. **Validación Backend**:
    - Verificar que TODOS los agentes tengan `allows_personal_corpus = true`
    - Si alguno NO permite → Error 400: "El agente X no permite corpus personal"
16. Success:
    - Server Action: `assignPersonalCorpusToAgents(corpusId, agentIds)`
    - Toast: "Corpus asignado a 1 agente"
17. Usuario puede subir documentos:
    - Click "Subir Documento"
    - File input: PDF, TXT, MD, DOCX
    - Upload → POST `/api/corpus/{id}/documents`
    - Procesamiento background

**Validaciones Críticas**:
- **Frontend**: Selector solo muestra agentes con `allows_personal_corpus = true`
- **Backend**: Doble validación antes de asignar (security layer)

**RLS**:
- Usuario solo ve SUS corpus (`owner_user_id = auth.uid()`)
- Usuario solo puede asignar SUS corpus

**Componentes**:
- `app/dashboard/corpus/page.tsx` (listado)
- `app/dashboard/corpus/new/page.tsx` (formulario)
- `app/dashboard/corpus/[id]/page.tsx` (detalles + asignación)
- `components/dashboard/PersonalCorpusForm.tsx`
- `components/dashboard/PersonalCorpusAssignmentModal.tsx`
- `components/corpus/DocumentUploader.tsx`
- `lib/actions/corpus.ts`

---

## 4. Navigation Structure

### 4.1 Admin Panel Sidebar (`/admin/*`)

```tsx
// Sidebar Navigation (EXISTING v1.0, EXTENDED for v0.1)
<Sidebar>
  <Logo />
  <NavSection title="Dashboard">
    <NavLink href="/admin" icon={<LayoutDashboard />}>
      Dashboard
    </NavLink>
  </NavSection>

  <NavSection title="Usuarios">
    <NavLink href="/admin/users" icon={<Users />}>
      Usuarios
    </NavLink>
    <NavLink href="/admin/roles" icon={<Shield />}>
      Roles
    </NavLink>
  </NavSection>

  {/* NEW v0.1 */}
  <NavSection title="Agentes & Corpus">
    <NavLink href="/admin/agents" icon={<Bot />}>
      Agentes
    </NavLink>
    <NavLink href="/admin/corpus" icon={<Book />}>
      Corpus Global
    </NavLink>
  </NavSection>

  <NavSection title="Sistema">
    <NavLink href="/admin/audit-logs" icon={<FileText />}>
      Audit Logs
    </NavLink>
    <NavLink href="/admin/analytics" icon={<BarChart />}>
      Analytics
    </NavLink>
    <NavLink href="/admin/settings" icon={<Settings />}>
      Configuración
    </NavLink>
  </NavSection>

  {/* Panel Toggle (if admin/moderator) */}
  <PanelToggle userRole="admin" />

  <UserProfile />
</Sidebar>
```

### 4.2 User Dashboard Sidebar (`/dashboard/*`)

```tsx
// Sidebar Navigation (NEW v0.1)
<DashboardSidebar>
  <Logo variant="glassmorphic" />

  <NavLinks>
    <NavLink href="/dashboard" icon={<Home />} active>
      Dashboard
    </NavLink>
    <NavLink href="/dashboard/projects" icon={<Folder />}>
      Proyectos
    </NavLink>
    <NavLink href="/dashboard/agents" icon={<Bot />}>
      Agentes
    </NavLink>
    <NavLink href="/dashboard/corpus" icon={<Book />}>
      Corpus Personal
    </NavLink>
  </NavLinks>

  {/* Panel Toggle (if admin/moderator) */}
  {isAdminOrModerator && <PanelToggle userRole={userRole} />}

  <UserProfile />
</DashboardSidebar>
```

### 4.3 Breadcrumbs

**Admin Panel**:
```tsx
// Ejemplo: /admin/agents/new
<Breadcrumbs>
  <BreadcrumbItem href="/admin">Dashboard</BreadcrumbItem>
  <BreadcrumbItem href="/admin/agents">Agentes</BreadcrumbItem>
  <BreadcrumbItem current>Crear Agente</BreadcrumbItem>
</Breadcrumbs>
```

**User Dashboard**:
```tsx
// Ejemplo: /dashboard/projects/{id}/chat
<Breadcrumbs>
  <BreadcrumbItem href="/dashboard">Dashboard</BreadcrumbItem>
  <BreadcrumbItem href="/dashboard/projects">Proyectos</BreadcrumbItem>
  <BreadcrumbItem href={`/dashboard/projects/${projectId}`}>
    {projectName}
  </BreadcrumbItem>
  <BreadcrumbItem current>Chat</BreadcrumbItem>
</Breadcrumbs>
```

---

## 5. Error Handling & Edge Cases

### 5.1 Permission Denied

**Scenario**: User intenta acceder a `/admin/*` sin permisos

**Flow**:
1. Middleware detecta ruta `/admin/*`
2. Valida rol del usuario
3. Si NO es admin/moderator:
   - Redirige a `/unauthorized`
   - Página muestra: "No tienes permisos para acceder a esta área"
   - Botón "Volver al Dashboard" → Redirige a `/dashboard`

**Componente**:
- `app/unauthorized/page.tsx` (EXISTING v1.0)

---

### 5.2 Resource Not Found

**Scenario**: User intenta acceder a proyecto que no existe o no le pertenece

**Flow**:
1. User navega a `/dashboard/projects/{invalidId}`
2. Server Component query:
   ```sql
   SELECT * FROM projects WHERE id = {id} AND user_id = auth.uid();
   ```
3. Si NO existe o no es owner:
   - Redirige a `/dashboard/projects`
   - Toast: "Proyecto no encontrado"

---

### 5.3 Agente Inactivo

**Scenario**: Admin desactiva agente mientras usuario tiene proyecto con ese agente

**Flow**:
1. Usuario intenta chatear con proyecto asignado a agente inactivo
2. API `/api/agents/{id}/chat` valida:
   ```sql
   SELECT is_active FROM agents WHERE id = {agentId};
   ```
3. Si `is_active = false`:
   - Error 400: "Agente no disponible. Contacta al administrador."
   - Usuario ve mensaje en chat: "Este agente ha sido desactivado. Por favor selecciona otro agente para tu proyecto."

---

### 5.4 Corpus Personal Asignado a Agente que NO Permite

**Scenario**: User intenta asignar corpus personal a agente con `allows_personal_corpus = false`

**Flow**:
1. Frontend: Modal de asignación solo muestra agentes con `allows_personal_corpus = true`
2. Si usuario manipula request (bypass frontend):
3. Backend validación:
   ```typescript
   const agent = await supabase
     .from('agents')
     .select('allows_personal_corpus')
     .eq('id', agentId)
     .single();

   if (!agent.allows_personal_corpus) {
     return apiError('VALIDATION_ERROR', 'Agente no permite corpus personal');
   }
   ```
4. Error 400 retornado
5. Toast: "El agente X no permite corpus personal"

---

## 6. Mobile Responsive Flows

### 6.1 Mobile Sidebar Navigation

**Desktop (>1024px)**:
- Sidebar fijo visible (240px width)

**Tablet (641-1024px)**:
- Sidebar collapsible (botón hamburger)
- Overlay cuando abierto

**Mobile (<640px)**:
- Sidebar oculto por defecto
- Hamburger menu en header
- Sidebar full-screen overlay cuando abierto

**Componente**:
```tsx
// components/dashboard/MobileSidebar.tsx (NEW v0.1)
export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 glass-sidebar transform transition-transform',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Sidebar content */}
      </aside>
    </>
  );
}
```

---

## 7. Keyboard Shortcuts

### 7.1 Global Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| `Ctrl+K` (Cmd+K) | Open command palette | Anywhere (future) |
| `Esc` | Close modal/drawer | When modal open |
| `/` | Focus search | Dashboard/Admin |

### 7.2 Chat Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Send message |
| `Shift+Enter` | New line |
| `Ctrl+L` | Clear conversation (future) |

---

## 8. Notification & Feedback Patterns

### 8.1 Toast Notifications

**Success**:
```tsx
import { toast } from '@/components/ui/use-toast';

toast({
  title: 'Éxito',
  description: 'Proyecto creado exitosamente',
  variant: 'success'
});
```

**Error**:
```tsx
toast({
  title: 'Error',
  description: 'No se pudo crear el proyecto',
  variant: 'destructive'
});
```

**Info**:
```tsx
toast({
  title: 'Información',
  description: 'El documento está siendo procesado',
  variant: 'default'
});
```

### 8.2 Loading States

**Buttons**:
```tsx
<Button disabled={isLoading}>
  {isLoading ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Creando...
    </>
  ) : (
    'Crear Proyecto'
  )}
</Button>
```

**Pages**:
```tsx
{isLoading ? (
  <div className="grid grid-cols-3 gap-4">
    <Skeleton className="h-32" />
    <Skeleton className="h-32" />
    <Skeleton className="h-32" />
  </div>
) : (
  <ProjectsList projects={projects} />
)}
```

---

## 9. Sitemap

### 9.1 Admin Panel Routes

```
/admin
├── / (Dashboard admin)
├── /users (User management)
│   ├── /new (Create user)
│   └── /[id] (Edit user)
├── /roles (Role management)
├── /audit-logs (Audit logs)
├── /analytics (Analytics)
├── /settings (System settings)
├── /agents (NEW v0.1 - Agent management)
│   ├── /new (Create agent)
│   └── /[id] (Edit agent)
└── /corpus (NEW v0.1 - Global corpus)
    ├── /new (Create corpus)
    └── /[id] (Corpus details + assignments)
```

### 9.2 User Dashboard Routes

```
/dashboard (NEW v0.1)
├── / (Dashboard home with metrics)
├── /projects (Project list)
│   ├── /new (Create project)
│   └── /[id] (Project details)
│       └── /chat (Chat with agent)
├── /agents (View available agents)
│   └── /[id] (Agent details - public info)
└── /corpus (Personal corpus list)
    ├── /new (Create personal corpus)
    └── /[id] (Corpus details + assignments)
```

---

## 10. First-Time User Experience (FTUE)

### 10.1 New User Onboarding (Future Enhancement)

**Current v0.1**: No onboarding flow (simple redirect to dashboard)

**Future v0.2+**:
1. First login → Onboarding modal
2. Steps:
   - Welcome screen
   - "Crea tu primer proyecto" (guided flow)
   - "Explora agentes disponibles"
   - "Aprende sobre corpus personal"
3. Skip option available
4. Onboarding completion flag: `user_profiles.onboarding_completed`

---

**Fecha de Diseño**: 2025-11-21
**Responsable**: architect (fase-2-arquitectura-leader)
**Estado**: COMPLETO
**Próximo Paso**: Diseñar RAG Architecture
