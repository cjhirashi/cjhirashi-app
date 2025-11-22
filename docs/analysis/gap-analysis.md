# GAP Analysis - CJHIRASHI APP v0.1
## Sistema Base vs Sistema Deseado (v0.1)

**Fecha de Análisis**: 2025-11-21
**Analista**: system-analyzer (fase-1-conceptualizacion-leader)
**Versión Actual**: Base pre-v0.1 (Admin Panel + RBAC)
**Versión Objetivo**: v0.1 (Core Funcional + Dashboard - En desarrollo)

---

## Resumen Ejecutivo

### Contexto
CJHIRASHI APP tiene una base con Admin Panel completo y RBAC (Role-Based Access Control). El sistema está diseñado para escalar hacia una plataforma de agentes inteligentes con RAG, pero actualmente solo cuenta con la fundación administrativa.

### Objetivo del GAP Analysis
Identificar los componentes **Missing** (nuevos), **Existing** (reutilizables), y **Update** (modificables) necesarios para implementar v0.1, que incluye:
- Dashboard glassmorphic para usuarios regulares
- Sistema de agentes inteligentes
- Gestión de proyectos personales
- Sistema RAG con corpus de 2 niveles (Global + Personal)

### Fases Priorizadas para v2.0
1. **Fase 11**: Corrección de errores TypeScript (1-2 días)
2. **Fase 12**: Dashboard Glassmorphic (2 semanas)
3. **Fase 13**: Agents & Projects (4 semanas)
4. **Fase 15**: RAG System (4 semanas)

**Duración Total Estimada**: ~11 semanas

---

## Categorización de GAPs

### Definiciones

| Categoría | Descripción | Acción Requerida |
|-----------|-------------|------------------|
| **Missing** | Componente NO existe en v1.0 | Crear desde cero |
| **Existing** | Componente existe y es reutilizable | Usar sin modificar |
| **Update** | Componente existe pero requiere modificación | Modificar componente existente |

---

## 1. FASE 11: Corrección de Errores TypeScript

### 1.1 GAPs Identificados

#### Missing Components
_Ninguno (solo correcciones)_

#### Existing Components (Reutilizables)
| Componente | Ubicación | Estado Actual | Acción |
|------------|-----------|---------------|--------|
| Analytics Module | `app/admin/analytics/page.tsx` | Con errores TypeScript | Reutilizar después de corrección |
| Analytics Components | `components/analytics/` | Con errores TypeScript | Reutilizar después de corrección |

#### Update Components
| Componente | Ubicación | Problema Actual | Modificación Necesaria |
|------------|-----------|----------------|------------------------|
| Analytics Page | `app/admin/analytics/page.tsx` | Error: `Date \| undefined` | Agregar validación de tipos, safe guards |
| Analytics Charts | `components/analytics/*` | Error: Props de fecha opcionales | Agregar tipos estrictos, defaults |
| TypeScript Config | `tsconfig.json` | Permisivo | Asegurar strict mode habilitado |

### 1.2 Análisis Detallado

**Problema Raíz**:
- Componentes de analytics no validan correctamente tipos de fecha
- Posibles props opcionales (`Date | undefined`) sin safe guards

**Solución Propuesta**:
1. Identificar todos los errores TypeScript con `tsc --noEmit`
2. Agregar validaciones de tipo en componentes afectados
3. Usar `?` operators y defaults para props opcionales
4. Ejecutar `npm run build` hasta 0 errores

**Impacto**: Crítico (bloqueante para deployment)
**Complejidad**: Baja
**Dependencias**: Ninguna

---

## 2. FASE 12: Dashboard Glassmorphic

### 2.1 GAPs Identificados

#### Missing Components (Crear)

| Componente | Tipo | Descripción | Prioridad |
|------------|------|-------------|-----------|
| `/app/dashboard/layout.tsx` | Layout | Layout principal del dashboard de usuario | Crítica |
| `/app/dashboard/page.tsx` | Page | Home del dashboard con métricas | Crítica |
| `/app/dashboard/projects/page.tsx` | Page | Listado de proyectos (preparación) | Alta |
| `/components/dashboard/DashboardCard.tsx` | Component | Card glassmorphic reutilizable | Crítica |
| `/components/dashboard/Sidebar.tsx` | Component | Sidebar glassmorphic con navegación | Crítica |
| `/components/dashboard/Header.tsx` | Component | Header con user profile | Alta |
| `/components/dashboard/MetricsCard.tsx` | Component | Card de métrica específico | Alta |
| `/lib/constants/dashboard-routes.ts` | Config | Rutas del dashboard | Media |
| `/styles/glassmorphic.css` | Styles | Clases CSS para efecto glassmorphic | Alta |

#### Existing Components (Reutilizables)

| Componente | Ubicación Actual | Uso en v2.0 | Modificación |
|------------|------------------|-------------|--------------|
| shadcn/ui Card | `components/ui/card.tsx` | Base para DashboardCard | Ninguna |
| shadcn/ui Avatar | `components/ui/avatar.tsx` | Header user profile | Ninguna |
| Supabase Client | `lib/supabase/client.ts` | Fetching de datos | Ninguna |
| Auth Middleware | `middleware.ts` | Protección de `/dashboard/*` | Ninguna |
| RBAC Utils | `lib/admin/auth/require-*.ts` | Validación de roles | Ninguna |

#### Update Components (Modificar)

| Componente | Ubicación | Modificación Necesaria | Razón |
|------------|-----------|----------------------|-------|
| Middleware | `middleware.ts` | Agregar rutas `/dashboard/*` a matcher | Proteger nuevas rutas |
| Tailwind Config | `tailwind.config.ts` | Agregar colores cyan glassmorphic | Nuevo tema |
| Navigation Layout | `app/layout.tsx` | Agregar link "Dashboard" para admins | Navegación entre áreas |
| globals.css | `app/globals.css` | Importar glassmorphic styles | Nuevo tema |

### 2.2 Análisis Detallado

**Arquitectura de Paneles Separados** (Confirmado por Usuario):

```
/admin/*          →  Admin Panel (solo admin + moderator)
/dashboard/*      →  User Dashboard (todos los usuarios autenticados)
```

**Branding**: ÚNICO para toda la aplicación (mismo logo, colores base)
**Diferenciación Visual**: Dashboard usa efecto glassmorphic más pronunciado

**Componentes Clave a Crear**:

1. **Dashboard Layout**:
   - Sidebar glassmorphic (cyan-500 con alpha)
   - Navigation links: Home, Projects, Agents, Corpus (preparación)
   - Header con user avatar, logout
   - Responsive design

2. **Dashboard Home**:
   - Métricas en cards glassmorphic:
     - Proyectos activos (conteo)
     - Agentes usados (conteo)
     - Corpus personales (conteo)
     - Última actividad (timestamp)
   - Datos desde Supabase (queries simples)

3. **Glassmorphic Theme**:
   ```css
   .glass-card {
     background: rgba(15, 23, 42, 0.7); /* Slate-900 con alpha */
     backdrop-filter: blur(12px);
     border: 1px solid rgba(34, 211, 238, 0.2); /* Cyan-400 con alpha */
     border-radius: 16px;
     box-shadow: 0 8px 32px 0 rgba(6, 182, 212, 0.1);
   }
   ```

**Impacto**: Alto (experiencia de usuario moderna)
**Complejidad**: Media
**Dependencias**: Fase 11 completa (build sin errores)

---

## 3. FASE 13: Agents & Projects

### 3.1 GAPs de Base de Datos

#### Missing Tables (Crear)

| Tabla | Schema | Descripción | RLS |
|-------|--------|-------------|-----|
| `agents` | public | Agentes configurables por admin | Sí (admin full, users read) |
| `projects` | public | Proyectos personales por usuario | Sí (user solo SUS proyectos) |

**Schema Detallado**:

```sql
-- agents
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  model_provider VARCHAR(50) NOT NULL, -- 'openai', 'anthropic', 'google'
  model_name VARCHAR(100) NOT NULL, -- 'gpt-4o', 'claude-3.5-sonnet'
  temperature DECIMAL(2,1) DEFAULT 0.7,
  max_tokens INTEGER,
  allows_personal_corpus BOOLEAN DEFAULT false,
  project_type VARCHAR(50), -- 'Libro', 'Análisis', 'Investigación'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE RESTRICT,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  project_type VARCHAR(50), -- Heredado de agent.project_type
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'archived', 'completed'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_agent_id ON projects(agent_id);
CREATE INDEX idx_projects_status ON projects(status);
```

**RLS Policies**:

```sql
-- agents: Admin crea, todos leen
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on agents" ON agents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can read active agents" ON agents
  FOR SELECT USING (is_active = true);

-- projects: Usuario solo SUS proyectos
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own projects" ON projects
  FOR ALL USING (user_id = auth.uid());
```

#### Existing Tables (Reutilizables)

| Tabla | Uso en v0.1 | Modificación |
|-------|-------------|--------------|
| `auth.users` | FK en `projects.user_id` | Ninguna |
| `user_roles` | Verificación de admin para `agents` | Ninguna |
| `audit_logs` | Logging de operaciones CRUD | Ninguna |

#### Update Tables (Modificar)

_Ninguna modificación necesaria en tablas existentes_

### 3.2 GAPs de Backend

#### Missing API Routes (Crear)

| Endpoint | Método | Descripción | Autenticación |
|----------|--------|-------------|---------------|
| `/api/admin/agents` | GET | Listar agentes (admin) | requireAdmin |
| `/api/admin/agents` | POST | Crear agente (admin) | requireAdmin |
| `/api/admin/agents/[id]` | GET | Detalles de agente (admin) | requireAdmin |
| `/api/admin/agents/[id]` | PUT | Actualizar agente (admin) | requireAdmin |
| `/api/admin/agents/[id]` | DELETE | Soft delete agente (admin) | requireAdmin |
| `/api/projects` | GET | Listar proyectos del usuario | requireAuth |
| `/api/projects` | POST | Crear proyecto | requireAuth |
| `/api/projects/[id]` | GET | Detalles de proyecto | requireAuth + owner |
| `/api/projects/[id]` | PUT | Actualizar proyecto | requireAuth + owner |
| `/api/projects/[id]` | DELETE | Archivar proyecto | requireAuth + owner |
| `/api/agents` | GET | Listar agentes activos (user) | requireAuth |

#### Missing Server Actions (Crear)

| Action | Ubicación | Propósito |
|--------|-----------|-----------|
| `createAgent` | `lib/actions/admin/agents.ts` | Form mutation (admin) |
| `updateAgent` | `lib/actions/admin/agents.ts` | Form mutation (admin) |
| `createProject` | `lib/actions/projects.ts` | Form mutation (user) |
| `updateProject` | `lib/actions/projects.ts` | Form mutation (user) |

#### Existing Backend (Reutilizable)

| Componente | Ubicación | Uso en v0.1 |
|------------|-----------|-------------|
| API Handler Pattern | `lib/api/handler.ts` | Reutilizar para nuevos endpoints |
| Zod Validation | `lib/validation/` | Crear schemas para agents, projects |
| Audit Logging | `lib/admin/audit/` | Logging de CRUD operations |
| Auth Helpers | `lib/admin/auth/` | `requireAdmin()`, `requireAuth()` |

### 3.3 GAPs de Frontend

#### Missing Pages (Crear)

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/admin/agents` | `app/admin/agents/page.tsx` | Listado de agentes (admin) |
| `/admin/agents/new` | `app/admin/agents/new/page.tsx` | Crear agente (admin) |
| `/admin/agents/[id]` | `app/admin/agents/[id]/page.tsx` | Editar agente (admin) |
| `/dashboard/projects` | `app/dashboard/projects/page.tsx` | Listado de proyectos (user) |
| `/dashboard/projects/new` | `app/dashboard/projects/new/page.tsx` | Crear proyecto (user) |
| `/dashboard/projects/[id]` | `app/dashboard/projects/[id]/page.tsx` | Detalles/editar proyecto (user) |
| `/dashboard/agents` | `app/dashboard/agents/page.tsx` | Ver agentes disponibles (user) |

#### Missing Components (Crear)

| Componente | Ubicación | Descripción |
|------------|-----------|-------------|
| AgentForm | `components/admin/AgentForm.tsx` | Formulario CRUD de agente |
| AgentsTable | `components/admin/AgentsTable.tsx` | Tabla de agentes |
| ProjectForm | `components/dashboard/ProjectForm.tsx` | Formulario CRUD de proyecto |
| ProjectCard | `components/dashboard/ProjectCard.tsx` | Card de proyecto glassmorphic |
| AgentSelector | `components/dashboard/AgentSelector.tsx` | Dropdown para seleccionar agente |
| AgentCard | `components/dashboard/AgentCard.tsx` | Card de agente disponible |

#### Missing Validations (Crear)

| Schema | Ubicación | Propósito |
|--------|-----------|-----------|
| `agentSchema` | `lib/validation/agents.ts` | Validación de input de agente |
| `projectSchema` | `lib/validation/projects.ts` | Validación de input de proyecto |

#### Existing Frontend (Reutilizable)

| Componente | Ubicación | Uso en v0.1 |
|------------|-----------|-------------|
| shadcn/ui Form | `components/ui/form.tsx` | Base para AgentForm, ProjectForm |
| shadcn/ui Table | `components/ui/table.tsx` | Base para AgentsTable |
| shadcn/ui Select | `components/ui/select.tsx` | AgentSelector |
| shadcn/ui Dialog | `components/ui/dialog.tsx` | Modals de confirmación |

### 3.4 Seed Data

#### Missing Data (Crear)

**Agentes Pre-configurados** (mínimo 3):

```typescript
const seedAgents = [
  {
    name: "Escritor de Libros",
    description: "Agente especializado en escritura creativa de libros",
    system_prompt: "Eres un escritor creativo experto...",
    model_provider: "anthropic",
    model_name: "claude-3.5-sonnet-20241022",
    temperature: 0.8,
    max_tokens: 4000,
    allows_personal_corpus: true,
    project_type: "Libro",
    is_active: true
  },
  {
    name: "Analista de Datos",
    description: "Agente especializado en análisis cuantitativo",
    system_prompt: "Eres un analista de datos experto...",
    model_provider: "openai",
    model_name: "gpt-4o",
    temperature: 0.3,
    max_tokens: 2000,
    allows_personal_corpus: true,
    project_type: "Análisis",
    is_active: true
  },
  {
    name: "Investigador Técnico",
    description: "Agente especializado en investigación técnica",
    system_prompt: "Eres un investigador técnico riguroso...",
    model_provider: "anthropic",
    model_name: "claude-3.5-sonnet-20241022",
    temperature: 0.5,
    max_tokens: 3000,
    allows_personal_corpus: false,
    project_type: "Investigación",
    is_active: true
  }
];
```

**Script de Seed**:
- Ubicación: `prisma/seeds/agents.seed.ts`
- Ejecutar: Durante migración de Fase 13

### 3.5 Análisis Detallado

**Modelo de Proyectos** (Confirmado por Usuario):
- Proyectos son **personales** (pertenecen a un usuario)
- NO hay colaboración multi-usuario en v2.0
- Capacidad de proyectos configurable por agente (vía `project_type`)
- Usuario puede tener proyectos ilimitados (sin tier system en v2.0)

**Flujo de Creación de Proyecto**:
1. Usuario navega a `/dashboard/projects/new`
2. Formulario muestra:
   - Nombre del proyecto (input)
   - Descripción (textarea)
   - Agente (selector dropdown)
3. Al seleccionar agente → `project_type` se hereda automáticamente
4. Submit → POST `/api/projects` → Crea proyecto con `user_id = auth.uid()`
5. Redirect a `/dashboard/projects` → Muestra proyecto nuevo

**Impacto**: Crítico (core del sistema)
**Complejidad**: Alta
**Dependencias**: Fase 12 completa (dashboard layout)

---

## 4. FASE 15: RAG System

### 4.1 GAPs de Base de Datos

#### Missing Tables (Crear)

| Tabla | Schema | Descripción | RLS |
|-------|--------|-------------|-----|
| `corpora` | public | Corpus de conocimiento (Global + Personal) | Sí (según tipo) |
| `corpus_agent_assignments` | public | Asignación de corpus a agentes | Sí |
| `corpus_documents` | public | Documentos dentro de un corpus | Sí |
| `embeddings` | public | Embeddings de chunks (referencia a Qdrant) | Sí |

**Schema Detallado**:

```sql
-- corpora
CREATE TABLE corpora (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  corpus_type VARCHAR(20) NOT NULL, -- 'global' | 'personal'
  created_by UUID NOT NULL REFERENCES auth.users(id),
  owner_user_id UUID REFERENCES auth.users(id), -- NULL si global, user_id si personal
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_corpus_type CHECK (corpus_type IN ('global', 'personal')),
  CONSTRAINT check_personal_has_owner CHECK (
    (corpus_type = 'global' AND owner_user_id IS NULL) OR
    (corpus_type = 'personal' AND owner_user_id IS NOT NULL)
  )
);

-- corpus_agent_assignments
CREATE TABLE corpus_agent_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corpus_id UUID NOT NULL REFERENCES corpora(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(corpus_id, agent_id)
);

-- corpus_documents
CREATE TABLE corpus_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corpus_id UUID NOT NULL REFERENCES corpora(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL, -- Supabase Storage URL
  file_size INTEGER,
  mime_type VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'indexed', 'failed'
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- embeddings
CREATE TABLE embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corpus_id UUID NOT NULL REFERENCES corpora(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES corpus_documents(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  qdrant_point_id UUID NOT NULL, -- ID del vector en Qdrant
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_corpora_type ON corpora(corpus_type);
CREATE INDEX idx_corpora_owner ON corpora(owner_user_id);
CREATE INDEX idx_corpus_assignments_corpus ON corpus_agent_assignments(corpus_id);
CREATE INDEX idx_corpus_assignments_agent ON corpus_agent_assignments(agent_id);
CREATE INDEX idx_corpus_docs_corpus ON corpus_documents(corpus_id);
CREATE INDEX idx_corpus_docs_status ON corpus_documents(status);
CREATE INDEX idx_embeddings_corpus ON embeddings(corpus_id);
CREATE INDEX idx_embeddings_document ON embeddings(document_id);
CREATE INDEX idx_embeddings_qdrant ON embeddings(qdrant_point_id);
```

**RLS Policies**:

```sql
-- corpora: Global (admin crea, todos leen), Personal (user solo SUS corpus)
ALTER TABLE corpora ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on corpora" ON corpora
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users read global corpora" ON corpora
  FOR SELECT USING (corpus_type = 'global' AND is_active = true);

CREATE POLICY "Users manage own personal corpora" ON corpora
  FOR ALL USING (
    corpus_type = 'personal' AND owner_user_id = auth.uid()
  );

-- corpus_agent_assignments: Visible según corpus
CREATE POLICY "Admin full access on assignments" ON corpus_agent_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users read assignments of accessible corpora" ON corpus_agent_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM corpora
      WHERE corpora.id = corpus_agent_assignments.corpus_id
      AND (
        corpora.corpus_type = 'global' OR
        corpora.owner_user_id = auth.uid()
      )
    )
  );

-- corpus_documents: Misma lógica que corpora
-- embeddings: Misma lógica que corpora
```

#### Existing Tables (Reutilizables)

| Tabla | Uso en v2.0 | Modificación |
|-------|-------------|--------------|
| `agents` | FK en `corpus_agent_assignments.agent_id` | Ninguna |
| `auth.users` | FK en `corpora.created_by`, `owner_user_id` | Ninguna |

### 4.2 GAPs de Infraestructura

#### Missing Integrations (Crear)

| Servicio | Propósito | Configuración |
|----------|-----------|---------------|
| Qdrant Cloud | Vector database para embeddings | `QDRANT_URL`, `QDRANT_API_KEY` |
| Vercel AI SDK Embeddings | Generación de embeddings | Configurado en código |
| Supabase Storage | Almacenamiento de documentos | Bucket `corpus-documents` |

**Qdrant Setup**:
- Crear cuenta en Qdrant Cloud
- Crear colección: `cjhirashi_corpus_vectors`
- Dimensiones: 1536 (OpenAI text-embedding-3-small) o 768 (según modelo)
- Distancia: Cosine similarity

**Supabase Storage Setup**:
- Crear bucket: `corpus-documents`
- RLS policies:
  - Admin puede subir a cualquier corpus
  - User puede subir solo a SUS corpus personales

#### Missing Environment Variables (Configurar)

```env
# Qdrant
QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your_api_key

# LLM Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Vercel AI SDK (si usa provider propio)
VERCEL_AI_SDK_KEY=your_key
```

### 4.3 GAPs de Backend

#### Missing API Routes (Crear)

| Endpoint | Método | Descripción | Autenticación |
|----------|--------|-------------|---------------|
| `/api/admin/corpus` | GET | Listar corpus global (admin) | requireAdmin |
| `/api/admin/corpus` | POST | Crear corpus global (admin) | requireAdmin |
| `/api/admin/corpus/[id]` | PUT | Actualizar corpus global (admin) | requireAdmin |
| `/api/admin/corpus/[id]/assign` | POST | Asignar corpus a agentes (admin) | requireAdmin |
| `/api/corpus` | GET | Listar corpus personal (user) | requireAuth |
| `/api/corpus` | POST | Crear corpus personal (user) | requireAuth |
| `/api/corpus/[id]` | PUT | Actualizar corpus personal (user) | requireAuth + owner |
| `/api/corpus/[id]/documents` | POST | Upload documento a corpus (user) | requireAuth + owner |
| `/api/corpus/[id]/assign` | POST | Asignar corpus personal a agente (user) | requireAuth + owner |
| `/api/agents/[id]/chat` | POST | Chat con agente (RAG retrieval) | requireAuth |
| `/api/embeddings/generate` | POST | Generar embeddings de documento | requireAuth |

#### Missing Workers/Jobs (Crear)

| Worker | Propósito | Trigger |
|--------|-----------|---------|
| Document Processor | Chunking de documentos | Upload de documento |
| Embedding Generator | Generar embeddings de chunks | Después de chunking |
| Qdrant Indexer | Indexar embeddings en Qdrant | Después de embeddings |

**Pipeline Completo**:
```
Upload documento → Supabase Storage
  ↓
Document Processor → Chunking (500-1000 tokens/chunk)
  ↓
Embedding Generator → Vercel AI SDK → OpenAI Embeddings
  ↓
Qdrant Indexer → Store en Qdrant + DB
  ↓
Status: indexed
```

#### Missing Utils (Crear)

| Util | Ubicación | Propósito |
|------|-----------|-----------|
| `qdrant-client.ts` | `lib/qdrant/` | Cliente de Qdrant Cloud |
| `embeddings.ts` | `lib/ai/` | Generación de embeddings vía Vercel AI SDK |
| `chunking.ts` | `lib/rag/` | Chunking de documentos |
| `retrieval.ts` | `lib/rag/` | Semantic search en Qdrant |
| `context-builder.ts` | `lib/rag/` | Inyectar chunks en prompt de agente |

### 4.4 GAPs de Frontend

#### Missing Pages (Crear)

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/admin/corpus` | `app/admin/corpus/page.tsx` | Listado corpus global (admin) |
| `/admin/corpus/new` | `app/admin/corpus/new/page.tsx` | Crear corpus global (admin) |
| `/admin/corpus/[id]` | `app/admin/corpus/[id]/page.tsx` | Detalles corpus global (admin) |
| `/dashboard/corpus` | `app/dashboard/corpus/page.tsx` | Listado corpus personal (user) |
| `/dashboard/corpus/new` | `app/dashboard/corpus/new/page.tsx` | Crear corpus personal (user) |
| `/dashboard/corpus/[id]` | `app/dashboard/corpus/[id]/page.tsx` | Detalles corpus personal (user) |
| `/dashboard/projects/[id]/chat` | `app/dashboard/projects/[id]/chat/page.tsx` | Chat con agente (RAG) |

#### Missing Components (Crear)

| Componente | Ubicación | Descripción |
|------------|-----------|-------------|
| CorpusForm | `components/admin/CorpusForm.tsx` | Formulario CRUD corpus global |
| CorpusTable | `components/admin/CorpusTable.tsx` | Tabla de corpus global |
| CorpusAssignmentForm | `components/admin/CorpusAssignmentForm.tsx` | Asignar corpus a agentes |
| PersonalCorpusForm | `components/dashboard/PersonalCorpusForm.tsx` | Formulario corpus personal |
| PersonalCorpusCard | `components/dashboard/PersonalCorpusCard.tsx` | Card corpus personal |
| DocumentUploader | `components/corpus/DocumentUploader.tsx` | Upload de documentos |
| DocumentList | `components/corpus/DocumentList.tsx` | Listado de documentos |
| ChatInterface | `components/chat/ChatInterface.tsx` | UI de chat con agente |
| ChatMessage | `components/chat/ChatMessage.tsx` | Mensaje individual |
| ChatInput | `components/chat/ChatInput.tsx` | Input de chat con streaming |

#### Existing Frontend (Reutilizable)

| Componente | Ubicación | Uso en v2.0 |
|------------|-----------|-------------|
| shadcn/ui Form | `components/ui/form.tsx` | Base para CorpusForm |
| shadcn/ui Table | `components/ui/table.tsx` | Base para CorpusTable |
| shadcn/ui Textarea | `components/ui/textarea.tsx` | ChatInput |
| shadcn/ui Scroll Area | `components/ui/scroll-area.tsx` | Chat messages scroll |

### 4.5 Análisis Detallado

**Modelo de Corpus de 2 Niveles** (Confirmado por Usuario):

**Corpus Global**:
- Admin crea corpus (ej: "Manual de Estilo Corporativo")
- Admin asigna corpus a agentes específicos (ej: "Escritor de Libros")
- Todos los usuarios que usen ese agente acceden al corpus global
- Uso: Conocimiento organizacional compartido

**Corpus Personal**:
- Usuario crea corpus (ej: "Mis Notas de Proyecto X")
- Usuario asigna corpus solo a agentes con `allows_personal_corpus = true`
- Corpus es privado del usuario (solo él lo ve)
- Uso: Conocimiento personal, proyectos específicos, datos sensibles

**Flujo de Retrieval en Chat**:
```
1. Usuario inicia chat con agente en proyecto
   ↓
2. Sistema identifica corpus asignados al agente:
   - Corpus global del agente (todos)
   - Corpus personal del usuario asignados al agente (si permite)
   ↓
3. User query → Semantic search en Qdrant
   - Búsqueda en corpus global + personal combinados
   - Top-k chunks (k=5-10)
   ↓
4. Chunks relevantes → Inyectados en prompt del agente
   ↓
5. LLM genera respuesta con contexto enriquecido
   ↓
6. Streaming response al usuario
```

**Validación Crítica**:
- Usuario NO puede asignar corpus personal a agente con `allows_personal_corpus = false`
- Interfaz solo muestra agentes permitidos en selector

**Impacto**: Crítico (diferenciador vs ChatGPT)
**Complejidad**: Muy Alta
**Dependencias**: Fase 13 completa (agentes y proyectos funcionales)

---

## 5. Resumen de GAPs por Categoría

### 5.1 GAPs Missing (Componentes Nuevos)

#### Base de Datos (5 tablas)
- `agents` (Fase 13)
- `projects` (Fase 13)
- `corpora` (Fase 15)
- `corpus_agent_assignments` (Fase 15)
- `corpus_documents` (Fase 15)
- `embeddings` (Fase 15)

**Total**: 6 tablas nuevas

#### Backend (28 endpoints + utils)
**API Routes**:
- Agents: 6 endpoints (admin + user)
- Projects: 5 endpoints
- Corpus: 9 endpoints (admin + user)
- Chat: 1 endpoint (con RAG)
- Embeddings: 1 endpoint

**Server Actions**:
- Agents: 2 actions (admin)
- Projects: 2 actions (user)
- Corpus: 2 actions (admin/user)

**Utils & Workers**:
- Qdrant client
- Embeddings generator
- Chunking processor
- Retrieval system
- Context builder
- Document processor worker

**Total**: ~28 componentes backend nuevos

#### Frontend (35+ componentes)
**Pages**: 13 nuevas páginas
- Dashboard: 4 páginas
- Admin Agents: 3 páginas
- Dashboard Projects: 3 páginas
- Admin Corpus: 3 páginas
- Dashboard Corpus: 3 páginas
- Chat: 1 página

**Components**: 22+ componentes
- Dashboard: 5 componentes glassmorphic
- Agents: 3 componentes (admin + user)
- Projects: 3 componentes
- Corpus: 5 componentes (admin + user)
- Chat: 3 componentes
- Validations: 3 schemas Zod

**Total**: ~35 componentes frontend nuevos

#### Infraestructura
- Qdrant Cloud setup
- Supabase Storage bucket
- 4 environment variables

**Total**: ~70 componentes Missing (crear desde cero)

---

### 5.2 GAPs Existing (Componentes Reutilizables)

#### Base de Datos (5 tablas)
- `auth.users` (Supabase Auth)
- `user_roles` (RBAC)
- `audit_logs` (Auditoría)
- `system_settings` (Configuración)
- `user_profiles` (Perfiles)

**Total**: 5 tablas reutilizables

#### Backend (15+ componentes)
- API Handler pattern (`lib/api/handler.ts`)
- Auth helpers (`lib/admin/auth/`)
- Audit logging (`lib/admin/audit/`)
- Supabase clients (`lib/supabase/`)
- Validation utils (`lib/validation/`)

**Total**: ~15 componentes backend reutilizables

#### Frontend (20+ componentes)
- shadcn/ui components (15+ componentes UI)
- Layouts existentes (`app/layout.tsx`, `app/admin/layout.tsx`)
- Auth components

**Total**: ~20 componentes frontend reutilizables

**Total**: ~40 componentes Existing (usar sin modificar)

---

### 5.3 GAPs Update (Componentes a Modificar)

#### Fase 11 (TypeScript Fixes)
- Analytics Page (`app/admin/analytics/page.tsx`)
- Analytics Components (`components/analytics/*`)
- TypeScript config (`tsconfig.json`)

**Total**: ~5 archivos a corregir

#### Fase 12 (Dashboard)
- Middleware (`middleware.ts`) - Agregar `/dashboard/*`
- Tailwind Config (`tailwind.config.ts`) - Colores cyan
- Navigation Layout (`app/layout.tsx`) - Link "Dashboard"
- globals.css (`app/globals.css`) - Import glassmorphic styles

**Total**: 4 archivos a modificar

#### Fase 13 (Agents & Projects)
_Ninguna modificación necesaria en componentes existentes_

#### Fase 15 (RAG System)
_Ninguna modificación necesaria en componentes existentes_

**Total**: ~9 componentes Update (modificar)

---

## 6. Stack Tecnológico Confirmado

### 6.1 Existing Stack (v1.0)

| Categoría | Tecnología | Estado |
|-----------|------------|--------|
| Framework | Next.js 15+ (App Router) | ✅ Implementado |
| UI Library | React 19 | ✅ Implementado |
| Styling | Tailwind CSS + shadcn/ui | ✅ Implementado |
| Backend | Next.js API Routes + Server Actions | ✅ Implementado |
| Auth | Supabase Auth (cookie-based) | ✅ Implementado |
| Database | PostgreSQL 15+ (Supabase) | ✅ Implementado |
| ORM | Prisma Client | ✅ Implementado |
| Validation | Zod | ✅ Implementado |

### 6.2 New Stack for v2.0

| Categoría | Tecnología | Estado | Fase |
|-----------|------------|--------|------|
| AI SDK | Vercel AI SDK | 🔄 Pendiente | Fase 13-15 |
| LLM | OpenAI GPT-4o | 🔄 Pendiente | Fase 13 |
| LLM | Anthropic Claude 3.5 Sonnet | 🔄 Pendiente | Fase 13 |
| Vector DB | Qdrant Cloud | 🔄 Pendiente | Fase 15 |
| Embeddings | Vercel AI SDK (OpenAI) | 🔄 Pendiente | Fase 15 |
| File Storage | Supabase Storage | 🔄 Pendiente | Fase 15 |

**CRÍTICO**: v2.0 usa Vercel AI SDK (NO LangChain), Qdrant (NO Pinecone/Weaviate)

---

## 7. Análisis de Riesgos

### 7.1 Riesgos Técnicos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Integración Qdrant compleja | Media | Alto | Usar SDK oficial, tests de integración |
| Costos de API LLM sin tier system | Alta | Alto | Monitoreo manual, rate limiting básico |
| Performance de embeddings | Media | Medio | Chunking optimizado, batch processing |
| Complejidad de RLS policies | Media | Alto | Tests exhaustivos de autorización |
| TypeScript errors recurrentes | Baja | Medio | Strict mode, linting continuo |

### 7.2 Riesgos de Negocio

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Scope creep (7 módulos en ROADMAP) | Alta | Crítico | Priorización confirmada (solo 4 fases en v2.0) |
| Timeline de 11 semanas muy optimista | Media | Alto | Fases secuenciales, validaciones GO/NO-GO |
| Costos de infraestructura (Qdrant, APIs) | Media | Medio | Estimación previa, monitoreo |

---

## 8. Dependencias Entre Fases

```
Fase 11 (TypeScript Fixes)
  ↓
  BLOQUEANTE para:
  ↓
Fase 12 (Dashboard)
  ↓
  BLOQUEANTE para:
  ↓
Fase 13 (Agents & Projects)
  ↓
  BLOQUEANTE para:
  ↓
Fase 15 (RAG System)
```

**CRÍTICO**: Implementación SECUENCIAL. Cada fase depende de la anterior.

**Razón de Secuencialidad**:
- Dashboard necesita build limpio (Fase 11)
- Projects necesitan dashboard funcional (Fase 12)
- RAG necesita agentes y proyectos operativos (Fase 13)

---

## 9. Esfuerzo Estimado por Fase

| Fase | Duración | Missing | Existing | Update | Complejidad |
|------|----------|---------|----------|--------|-------------|
| Fase 11 | 1-2 días | 0 | 5 | 5 | Baja |
| Fase 12 | 2 semanas | 10 | 10 | 4 | Media |
| Fase 13 | 4 semanas | 30 | 15 | 0 | Alta |
| Fase 15 | 4 semanas | 30 | 10 | 0 | Muy Alta |

**Total Estimado**: ~11 semanas (77 días hábiles)

**Breakdown**:
- Missing (crear): ~70 componentes
- Existing (reutilizar): ~40 componentes
- Update (modificar): ~9 componentes

**Ratio de Reutilización**: ~33% (40/119 componentes)

---

## 10. Conclusiones y Recomendaciones

### 10.1 Conclusiones

1. **GAPs Bien Definidos**: Sistema base (pre-v0.1) proporciona fundación sólida para v0.1
2. **Reutilización Alta**: 33% de componentes son reutilizables (auth, RBAC, utils)
3. **Complejidad Concentrada**: Fases 13 y 15 son las más complejas (agents + RAG)
4. **Secuencialidad Crítica**: No paralelizable, cada fase depende de la anterior
5. **Riesgo de Costos**: Sin tier system, riesgo de costos de API LLM no controlados

### 10.2 Recomendaciones

#### Prioridad Alta
1. ✅ **Mantener priorización confirmada** (Fases 11-12-13-15)
2. ✅ **Implementar rate limiting básico** en endpoints de chat (mitigar costos)
3. ✅ **Crear tests exhaustivos de RLS** (seguridad crítica en corpus personal)
4. ✅ **Monitorear costos de API** durante Fase 13-15

#### Prioridad Media
5. **Considerar API keys pool** (múltiples keys OpenAI/Anthropic para redundancia)
6. **Implementar caching de embeddings** (reducir regeneración innecesaria)
7. **Documentar flujo de RAG** detalladamente (complejidad alta)

#### Prioridad Baja (Diferir a v3.0)
8. Tier & Billing system (control fino de costos)
9. MCP Integrations (Drive, Notion, Gmail)
10. Artifacts versioning
11. Customization avanzada

---

## Apéndices

### A. Inventario Completo de Sistema Base (pre-v0.1)

**Rutas Implementadas**:
- `/` - Home pública
- `/auth/*` - Login, signup, password reset
- `/protected` - Página protegida ejemplo
- `/admin/*` - Admin panel completo
  - `/admin` - Dashboard admin
  - `/admin/users` - User management
  - `/admin/roles` - Role management
  - `/admin/audit-logs` - Audit logs
  - `/admin/settings` - System settings
  - `/admin/analytics` - Analytics (con errores TS)

**Tablas Implementadas** (6 tablas custom):
- `user_roles` (RBAC)
- `user_profiles` (Metadata)
- `audit_logs` (Auditoría)
- `system_settings` (Configuración)

**Componentes Implementados** (30+ componentes):
- Admin components (users, roles, audit, analytics, settings)
- UI components (shadcn/ui completo)
- Auth components (forms, buttons)

**Documentación Implementada**:
- 5 ADRs (Architecture Decision Records)
- Database schema documentation
- Implementation guides
- Security assessment report

### B. Lista Completa de Componentes Missing

**Backend (28 componentes)**:
1. `/api/admin/agents` (GET)
2. `/api/admin/agents` (POST)
3. `/api/admin/agents/[id]` (GET/PUT/DELETE)
4. `/api/agents` (GET)
5. `/api/projects` (GET/POST)
6. `/api/projects/[id]` (GET/PUT/DELETE)
7. `/api/admin/corpus` (GET/POST)
8. `/api/admin/corpus/[id]` (PUT)
9. `/api/admin/corpus/[id]/assign` (POST)
10. `/api/corpus` (GET/POST)
11. `/api/corpus/[id]` (PUT)
12. `/api/corpus/[id]/documents` (POST)
13. `/api/corpus/[id]/assign` (POST)
14. `/api/agents/[id]/chat` (POST)
15. `/api/embeddings/generate` (POST)
16-18. Server Actions (agents, projects, corpus)
19-23. Utils (qdrant, embeddings, chunking, retrieval, context)
24-28. Workers (document processor, embedding generator, indexer)

**Frontend (35+ componentes)**:
- 13 páginas nuevas
- 22+ componentes React
- 3 schemas Zod
- 1 archivo CSS glassmorphic

**Database (6 tablas)**:
- `agents`
- `projects`
- `corpora`
- `corpus_agent_assignments`
- `corpus_documents`
- `embeddings`

**Infraestructura (4 items)**:
- Qdrant Cloud setup
- Supabase Storage bucket
- Environment variables
- Seed data (3 agentes)

---

**Fecha de Finalización del Análisis**: 2025-11-21
**Analista**: system-analyzer (fase-1-conceptualizacion-leader)
**Estado**: COMPLETO
**Próximo Paso**: scope-validator validará completitud de alcances + GAPs
