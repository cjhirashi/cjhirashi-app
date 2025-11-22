# API Structure - CJHIRASHI APP v0.1

**Versión**: v0.1
**Fecha**: 2025-11-21
**Responsable**: architect (fase-2-arquitectura-leader)
**ADR Relacionado**: ADR-009

---

## Visión General

CJHIRASHI APP v0.1 implementa una API RESTful siguiendo el patrón establecido en ADR-003 (API Route Structure) de la base pre-v0.1, extendido para soportar:

- **Admin API**: Gestión de agentes y corpus global
- **User API**: Gestión de proyectos, corpus personal, chat con agentes
- **Server Actions**: Form mutations con CSRF protection
- **Streaming API**: Chat con agentes usando Vercel AI SDK

---

## Estructura de Endpoints

### Admin API Routes (`/api/admin/*`)

#### 1. Agents Management

**GET** `/api/admin/agents`
- **Descripción**: Listar todos los agentes (activos e inactivos)
- **Autenticación**: `requireApiRole(request, 'admin')`
- **Query Params**:
  - `is_active` (optional): `true` | `false` (filtrar por estado)
  - `model_provider` (optional): `openai` | `anthropic` | `google`
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid",
        "name": "Escritor de Libros",
        "description": "Agente especializado en escritura creativa",
        "system_prompt": "Eres un escritor creativo experto...",
        "model_provider": "anthropic",
        "model_name": "claude-3-5-sonnet-20241022",
        "temperature": 0.8,
        "max_tokens": 4000,
        "allows_personal_corpus": true,
        "project_type": "Libro",
        "is_active": true,
        "created_at": "2025-11-21T00:00:00Z",
        "updated_at": "2025-11-21T00:00:00Z"
      }
    ]
  }
  ```

**POST** `/api/admin/agents`
- **Descripción**: Crear nuevo agente
- **Autenticación**: `requireApiRole(request, 'admin')`
- **Body** (Zod validation):
  ```typescript
  {
    name: string, // max 100
    description?: string,
    system_prompt: string,
    model_provider: 'openai' | 'anthropic' | 'google',
    model_name: string, // ej: 'gpt-4o', 'claude-3-5-sonnet-20241022'
    temperature?: number, // 0.0-2.0, default 0.7
    max_tokens?: number,
    allows_personal_corpus?: boolean, // default false
    project_type?: string, // ej: 'Libro', 'Análisis'
    is_active?: boolean // default true
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": { /* agent object */ },
    "message": "Agente creado exitosamente"
  }
  ```
- **Audit Log**: `agent.create` action logged

**GET** `/api/admin/agents/[id]`
- **Descripción**: Obtener detalles de un agente
- **Autenticación**: `requireApiRole(request, 'admin')`
- **Response**: Single agent object

**PUT** `/api/admin/agents/[id]`
- **Descripción**: Actualizar agente existente
- **Autenticación**: `requireApiRole(request, 'admin')`
- **Body**: Same as POST (partial update allowed)
- **Audit Log**: `agent.update` action logged

**DELETE** `/api/admin/agents/[id]`
- **Descripción**: Soft delete (is_active = false)
- **Autenticación**: `requireApiRole(request, 'admin')`
- **Response**:
  ```json
  {
    "success": true,
    "message": "Agente desactivado exitosamente"
  }
  ```
- **Audit Log**: `agent.delete` action logged

---

#### 2. Global Corpus Management

**GET** `/api/admin/corpus`
- **Descripción**: Listar corpus globales
- **Autenticación**: `requireApiRole(request, 'admin')`
- **Query Params**:
  - `is_active` (optional): `true` | `false`
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid",
        "name": "Manual de Estilo Corporativo",
        "description": "Guía de estilo para documentos oficiales",
        "corpus_type": "global",
        "created_by": "admin_user_id",
        "owner_user_id": null,
        "is_active": true,
        "created_at": "2025-11-21T00:00:00Z",
        "updated_at": "2025-11-21T00:00:00Z",
        "assigned_agents": [
          {
            "agent_id": "uuid",
            "agent_name": "Escritor de Libros"
          }
        ],
        "document_count": 5
      }
    ]
  }
  ```

**POST** `/api/admin/corpus`
- **Descripción**: Crear corpus global
- **Autenticación**: `requireApiRole(request, 'admin')`
- **Body**:
  ```typescript
  {
    name: string, // max 200
    description?: string,
    corpus_type: 'global', // fixed
    is_active?: boolean // default true
  }
  ```
- **Response**: Corpus object created
- **Audit Log**: `corpus.create` action logged

**PUT** `/api/admin/corpus/[id]`
- **Descripción**: Actualizar corpus global
- **Autenticación**: `requireApiRole(request, 'admin')`
- **Body**: Same as POST (partial update)
- **Audit Log**: `corpus.update` action logged

**POST** `/api/admin/corpus/[id]/assign`
- **Descripción**: Asignar corpus global a agentes
- **Autenticación**: `requireApiRole(request, 'admin')`
- **Body**:
  ```typescript
  {
    agent_ids: string[] // array of agent UUIDs
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "corpus_id": "uuid",
      "assignments_created": 3
    },
    "message": "Corpus asignado a 3 agentes"
  }
  ```
- **Audit Log**: `corpus.assign` action logged

**POST** `/api/admin/corpus/[id]/documents`
- **Descripción**: Upload documento a corpus global
- **Autenticación**: `requireApiRole(request, 'admin')`
- **Content-Type**: `multipart/form-data`
- **Body**:
  - `file`: File (PDF, TXT, MD, DOCX)
  - `corpus_id`: UUID
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "document_id": "uuid",
      "filename": "manual-estilo.pdf",
      "file_url": "https://supabase.storage/...",
      "status": "pending" // will be 'processing' → 'indexed'
    },
    "message": "Documento subido exitosamente. Procesamiento iniciado."
  }
  ```
- **Trigger**: Document processing pipeline (chunking → embeddings → Qdrant)

---

### User API Routes (`/api/*`)

#### 3. Agents (Read-Only for Users)

**GET** `/api/agents`
- **Descripción**: Listar agentes activos disponibles para usuarios
- **Autenticación**: `requireAuth()`
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid",
        "name": "Escritor de Libros",
        "description": "Agente especializado en escritura creativa",
        "model_provider": "anthropic",
        "model_name": "claude-3-5-sonnet-20241022",
        "allows_personal_corpus": true,
        "project_type": "Libro",
        "assigned_corpus_count": 2 // corpus globales asignados
      }
    ]
  }
  ```
- **Nota**: Solo agentes con `is_active = true`

**GET** `/api/agents/[id]`
- **Descripción**: Detalles de un agente (public info)
- **Autenticación**: `requireAuth()`
- **Response**: Single agent object (sin `system_prompt` completo)

---

#### 4. Projects Management

**GET** `/api/projects`
- **Descripción**: Listar proyectos del usuario autenticado
- **Autenticación**: `requireAuth()`
- **Query Params**:
  - `status` (optional): `active` | `archived` | `completed`
  - `agent_id` (optional): UUID (filtrar por agente)
- **RLS**: User solo ve SUS proyectos (`user_id = auth.uid()`)
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid",
        "user_id": "current_user_id",
        "agent_id": "agent_uuid",
        "agent_name": "Escritor de Libros",
        "name": "Mi Novela de Ciencia Ficción",
        "description": "Proyecto de libro sobre viajes espaciales",
        "project_type": "Libro",
        "status": "active",
        "metadata": {},
        "created_at": "2025-11-21T00:00:00Z",
        "updated_at": "2025-11-21T00:00:00Z",
        "conversation_count": 15
      }
    ]
  }
  ```

**POST** `/api/projects`
- **Descripción**: Crear nuevo proyecto personal
- **Autenticación**: `requireAuth()`
- **Body**:
  ```typescript
  {
    agent_id: string, // UUID del agente
    name: string, // max 200
    description?: string,
    status?: 'active' | 'archived' | 'completed', // default 'active'
    metadata?: object // JSONB custom data
  }
  ```
- **Lógica**:
  - `user_id = auth.uid()` (auto-inject)
  - `project_type` heredado de `agents.project_type`
- **Response**: Project object created

**GET** `/api/projects/[id]`
- **Descripción**: Detalles de un proyecto
- **Autenticación**: `requireAuth()` + ownership check
- **Authorization**: User must own project (`project.user_id = auth.uid()`)
- **Response**: Single project object with related data

**PUT** `/api/projects/[id]`
- **Descripción**: Actualizar proyecto
- **Autenticación**: `requireAuth()` + ownership
- **Body**: Same as POST (partial update)
- **Response**: Updated project object

**DELETE** `/api/projects/[id]`
- **Descripción**: Archivar proyecto (status = 'archived')
- **Autenticación**: `requireAuth()` + ownership
- **Response**:
  ```json
  {
    "success": true,
    "message": "Proyecto archivado exitosamente"
  }
  ```

---

#### 5. Personal Corpus Management

**GET** `/api/corpus`
- **Descripción**: Listar corpus personales del usuario
- **Autenticación**: `requireAuth()`
- **RLS**: User solo ve SUS corpus (`corpus_type = 'personal' AND owner_user_id = auth.uid()`)
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid",
        "name": "Mis Notas de Proyecto X",
        "description": "Investigación personal sobre X",
        "corpus_type": "personal",
        "owner_user_id": "current_user_id",
        "is_active": true,
        "created_at": "2025-11-21T00:00:00Z",
        "updated_at": "2025-11-21T00:00:00Z",
        "assigned_agents": [
          {
            "agent_id": "uuid",
            "agent_name": "Analista de Datos"
          }
        ],
        "document_count": 3
      }
    ]
  }
  ```

**POST** `/api/corpus`
- **Descripción**: Crear corpus personal
- **Autenticación**: `requireAuth()`
- **Body**:
  ```typescript
  {
    name: string, // max 200
    description?: string,
    corpus_type: 'personal', // fixed
    is_active?: boolean // default true
  }
  ```
- **Lógica**:
  - `owner_user_id = auth.uid()` (auto-inject)
  - `created_by = auth.uid()`
- **Response**: Corpus object created

**PUT** `/api/corpus/[id]`
- **Descripción**: Actualizar corpus personal
- **Autenticación**: `requireAuth()` + ownership
- **Authorization**: User must own corpus (`corpus.owner_user_id = auth.uid()`)
- **Body**: Same as POST (partial update)

**POST** `/api/corpus/[id]/assign`
- **Descripción**: Asignar corpus personal a agentes
- **Autenticación**: `requireAuth()` + ownership
- **Body**:
  ```typescript
  {
    agent_ids: string[] // array of agent UUIDs
  }
  ```
- **Validación Crítica**:
  - Verificar que TODOS los agentes tengan `allows_personal_corpus = true`
  - Si algún agente NO permite corpus personal → Error 400
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "corpus_id": "uuid",
      "assignments_created": 2
    },
    "message": "Corpus asignado a 2 agentes"
  }
  ```

**POST** `/api/corpus/[id]/documents`
- **Descripción**: Upload documento a corpus personal
- **Autenticación**: `requireAuth()` + ownership
- **Content-Type**: `multipart/form-data`
- **Body**:
  - `file`: File (PDF, TXT, MD, DOCX)
  - `corpus_id`: UUID
- **Response**: Same as admin version
- **Trigger**: Document processing pipeline

---

#### 6. Chat with Agents (RAG-Enabled)

**POST** `/api/agents/[id]/chat`
- **Descripción**: Chat con agente usando RAG retrieval
- **Autenticación**: `requireAuth()`
- **Body**:
  ```typescript
  {
    project_id: string, // UUID del proyecto
    messages: [
      {
        role: 'user' | 'assistant',
        content: string
      }
    ],
    stream?: boolean // default true
  }
  ```
- **Lógica de RAG**:
  1. Identificar corpus asignados al agente:
     - Corpus global del agente (todos)
     - Corpus personal del usuario asignados al agente (si permite)
  2. User query → Semantic search en Qdrant
     - Top-k chunks (k=5-10)
     - Filters: `agent_id`, `user_id` (para corpus personal)
  3. Chunks relevantes → Inyectados en prompt del agente
  4. LLM genera respuesta con contexto enriquecido
  5. Streaming response al usuario
- **Response** (Streaming - SSE):
  ```
  data: {"type": "text", "content": "Hola"}
  data: {"type": "text", "content": ", ¿en qué"}
  data: {"type": "text", "content": " puedo ayudarte?"}
  data: {"type": "done"}
  ```
- **Response** (Non-Streaming):
  ```json
  {
    "success": true,
    "data": {
      "message": {
        "role": "assistant",
        "content": "Hola, ¿en qué puedo ayudarte?"
      },
      "context_used": {
        "global_corpus_chunks": 3,
        "personal_corpus_chunks": 2,
        "total_chunks": 5
      }
    }
  }
  ```
- **Storage**: Guardar conversación en tabla `conversations`

---

### Server Actions (`lib/actions/*`)

Server Actions proveen CSRF protection built-in y son usados para form mutations.

#### Admin Actions (`lib/actions/admin/agents.ts`)

**`createAgent(formData: FormData)`**
- **Descripción**: Server Action para crear agente (admin)
- **Validación**: Zod schema `agentSchema`
- **Authorization**: `requireAdmin()` en layout padre
- **Audit**: Logged via `createAuditLog()`
- **Return**: `{ success: boolean, data?: Agent, error?: string }`

**`updateAgent(id: string, formData: FormData)`**
- **Descripción**: Server Action para actualizar agente
- **Similar a createAgent**

**`deleteAgent(id: string)`**
- **Descripción**: Soft delete agente (is_active = false)
- **Return**: `{ success: boolean, message?: string, error?: string }`

#### Admin Actions (`lib/actions/admin/corpus.ts`)

**`createGlobalCorpus(formData: FormData)`**
- **Descripción**: Server Action para crear corpus global
- **Validación**: Zod schema `corpusSchema`
- **Authorization**: `requireAdmin()`
- **Return**: `{ success: boolean, data?: Corpus, error?: string }`

**`assignCorpusToAgents(corpusId: string, agentIds: string[])`**
- **Descripción**: Asignar corpus a múltiples agentes
- **Return**: `{ success: boolean, assignmentsCreated?: number, error?: string }`

#### User Actions (`lib/actions/projects.ts`)

**`createProject(formData: FormData)`**
- **Descripción**: Server Action para crear proyecto personal
- **Validación**: Zod schema `projectSchema`
- **Authorization**: User autenticado (layout /dashboard/*)
- **Lógica**: `user_id = auth.uid()`, `project_type` heredado de agente
- **Return**: `{ success: boolean, data?: Project, error?: string }`

**`updateProject(id: string, formData: FormData)`**
- **Descripción**: Actualizar proyecto
- **Authorization**: User must own project
- **Return**: Similar a createProject

**`archiveProject(id: string)`**
- **Descripción**: Archivar proyecto (status = 'archived')
- **Return**: `{ success: boolean, message?: string, error?: string }`

#### User Actions (`lib/actions/corpus.ts`)

**`createPersonalCorpus(formData: FormData)`**
- **Descripción**: Server Action para crear corpus personal
- **Validación**: Zod schema `corpusSchema`
- **Lógica**: `owner_user_id = auth.uid()`, `corpus_type = 'personal'`
- **Return**: `{ success: boolean, data?: Corpus, error?: string }`

**`assignPersonalCorpusToAgents(corpusId: string, agentIds: string[])`**
- **Descripción**: Asignar corpus personal a agentes
- **Validación Crítica**: Verificar `allows_personal_corpus = true`
- **Return**: `{ success: boolean, assignmentsCreated?: number, error?: string }`

---

## API Response Format

### Success Response

```typescript
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

// Helper
export function apiSuccess<T>(data: T, message?: string): ApiSuccessResponse<T> {
  return { success: true, data, message };
}
```

### Error Response

```typescript
interface ApiErrorResponse {
  success: false;
  error: {
    code: string; // ej: 'VALIDATION_ERROR', 'UNAUTHORIZED', 'NOT_FOUND'
    message: string;
    details?: any;
  };
}

// Helper
export function apiError(code: string, message: string, details?: any): ApiErrorResponse {
  return {
    success: false,
    error: { code, message, details }
  };
}
```

### HTTP Status Codes

| Status | Uso |
|--------|-----|
| 200 | Success (GET, PUT) |
| 201 | Created (POST) |
| 204 | No Content (DELETE) |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (no auth token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## Authentication & Authorization Helpers

### API Routes (`lib/api/auth.ts`)

```typescript
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiError } from '@/lib/api/response';

/**
 * Require authentication in API route
 */
export async function requireAuth(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.getClaims();

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Response(
      JSON.stringify(apiError('UNAUTHORIZED', 'Authentication required')),
      { status: 401 }
    );
  }

  return { user, supabase };
}

/**
 * Require specific role in API route
 */
export async function requireApiRole(
  request: NextRequest,
  role: 'admin' | 'moderator'
) {
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

/**
 * Verify resource ownership (for projects, corpus)
 */
export async function requireOwnership(
  supabase: SupabaseClient,
  table: string,
  resourceId: string,
  userId: string
) {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', resourceId)
    .single();

  if (error || !data) {
    throw new Response(
      JSON.stringify(apiError('NOT_FOUND', 'Resource not found')),
      { status: 404 }
    );
  }

  // Check ownership based on table
  const ownerField = table === 'projects' ? 'user_id' : 'owner_user_id';
  if (data[ownerField] !== userId) {
    throw new Response(
      JSON.stringify(apiError('FORBIDDEN', 'You do not own this resource')),
      { status: 403 }
    );
  }

  return data;
}
```

### Server Actions (`lib/actions/auth.ts`)

```typescript
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * Require admin role in Server Action
 */
export async function requireAdmin() {
  const supabase = await createClient();
  await supabase.auth.getClaims();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

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

---

## Validation Schemas (Zod)

### Agents (`lib/validation/agents.ts`)

```typescript
import { z } from 'zod';

export const agentSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  system_prompt: z.string().min(10),
  model_provider: z.enum(['openai', 'anthropic', 'google']),
  model_name: z.string().min(1).max(100),
  temperature: z.number().min(0).max(2).default(0.7),
  max_tokens: z.number().int().positive().optional(),
  allows_personal_corpus: z.boolean().default(false),
  project_type: z.string().max(50).optional(),
  is_active: z.boolean().default(true)
});

export type AgentInput = z.infer<typeof agentSchema>;
```

### Projects (`lib/validation/projects.ts`)

```typescript
import { z } from 'zod';

export const projectSchema = z.object({
  agent_id: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  status: z.enum(['active', 'archived', 'completed']).default('active'),
  metadata: z.record(z.any()).default({})
});

export type ProjectInput = z.infer<typeof projectSchema>;
```

### Corpus (`lib/validation/corpus.ts`)

```typescript
import { z } from 'zod';

export const corpusSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  corpus_type: z.enum(['global', 'personal']),
  is_active: z.boolean().default(true)
});

export const assignCorpusSchema = z.object({
  agent_ids: z.array(z.string().uuid()).min(1)
});

export type CorpusInput = z.infer<typeof corpusSchema>;
export type AssignCorpusInput = z.infer<typeof assignCorpusSchema>;
```

### Chat (`lib/validation/chat.ts`)

```typescript
import { z } from 'zod';

export const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1)
});

export const chatRequestSchema = z.object({
  project_id: z.string().uuid(),
  messages: z.array(chatMessageSchema).min(1),
  stream: z.boolean().default(true)
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
```

---

## API Handler Pattern (Reutilizado de ADR-003)

```typescript
// lib/api/handler.ts (EXISTING from v1.0)
import { NextRequest, NextResponse } from 'next/server';
import { apiError } from './response';

type ApiHandler = (request: NextRequest) => Promise<Response>;

export function apiHandler(handler: ApiHandler): ApiHandler {
  return async (request: NextRequest) => {
    try {
      return await handler(request);
    } catch (error) {
      if (error instanceof Response) {
        // Already formatted error response
        return error;
      }

      console.error('API Error:', error);

      return NextResponse.json(
        apiError(
          'INTERNAL_ERROR',
          'An unexpected error occurred',
          process.env.NODE_ENV === 'development' ? error : undefined
        ),
        { status: 500 }
      );
    }
  };
}
```

**Uso**:
```typescript
// app/api/admin/agents/route.ts
import { apiHandler } from '@/lib/api/handler';
import { requireApiRole } from '@/lib/api/auth';
import { apiSuccess } from '@/lib/api/response';

export const GET = apiHandler(async (request) => {
  const { supabase } = await requireApiRole(request, 'admin');

  const { data: agents } = await supabase
    .from('agents')
    .select('*')
    .order('created_at', { ascending: false });

  return NextResponse.json(apiSuccess(agents));
});
```

---

## Documentos Generados Durante Implementación

| Documento | Ubicación | Descripción |
|-----------|-----------|-------------|
| API Routes | `app/api/admin/agents/route.ts` | CRUD de agentes (admin) |
| API Routes | `app/api/admin/corpus/route.ts` | CRUD de corpus global (admin) |
| API Routes | `app/api/agents/route.ts` | Listar agentes (user) |
| API Routes | `app/api/projects/route.ts` | CRUD de proyectos (user) |
| API Routes | `app/api/corpus/route.ts` | CRUD de corpus personal (user) |
| API Routes | `app/api/agents/[id]/chat/route.ts` | Chat con agente (RAG) |
| Server Actions | `lib/actions/admin/agents.ts` | Form mutations agentes |
| Server Actions | `lib/actions/admin/corpus.ts` | Form mutations corpus global |
| Server Actions | `lib/actions/projects.ts` | Form mutations proyectos |
| Server Actions | `lib/actions/corpus.ts` | Form mutations corpus personal |
| Validation | `lib/validation/agents.ts` | Zod schema agentes |
| Validation | `lib/validation/projects.ts` | Zod schema proyectos |
| Validation | `lib/validation/corpus.ts` | Zod schema corpus |
| Validation | `lib/validation/chat.ts` | Zod schema chat |
| Auth Helpers | `lib/api/auth.ts` | Auth/authz para API routes |
| Auth Helpers | `lib/actions/auth.ts` | Auth/authz para Server Actions |
| Response Helpers | `lib/api/response.ts` | `apiSuccess()`, `apiError()` |

---

## Integración con Documentos Existentes

### ADR-003: API Route Structure (pre-v0.1)

**Reusado**:
- `apiHandler()` pattern
- Response format (`apiSuccess`, `apiError`)
- HTTP status codes

**Extendido**:
- Nuevos endpoints para agents, projects, corpus
- RAG-enabled chat endpoint
- Server Actions para form mutations

### ADR-004: Security Layers (pre-v0.1)

**Aplicado**:
- Middleware: Session validation (reutilizado)
- API Routes: `requireAuth()`, `requireApiRole()` (nuevos)
- Server Actions: CSRF protection (built-in NextJS)
- Database Queries: Parameterized queries (Prisma)
- RLS Policies: Row Level Security (nuevas policies para agents, projects, corpus)

---

**Fecha de Diseño**: 2025-11-21
**Responsable**: architect (fase-2-arquitectura-leader)
**Estado**: COMPLETO
**Próximo Paso**: Diseñar UI/UX Design System
