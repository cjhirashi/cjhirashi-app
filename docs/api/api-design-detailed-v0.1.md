# API Design - CJHIRASHI APP v0.1 (Diseño Detallado Implementable)

**Versión**: v0.1
**Fecha**: 2025-11-21
**Responsable**: api-designer (Fase 3)
**Tipo**: Diseño Detallado con Código Scaffold TypeScript

---

## Visión General

Este documento proporciona el diseño DETALLADO e IMPLEMENTABLE de la API para CJHIRASHI APP v0.1, con código scaffold TypeScript listo para implementar en Fase 4.

**Base Arquitectónica**: `api-structure-v0.1.md` (Fase 2)
**Schema de DB**: `prisma-schema-v0.1.md` (Fase 3 - validado)

---

## Tabla de Contenidos

1. [Route Handlers](#route-handlers) (21 endpoints)
2. [Server Actions](#server-actions) (10 actions)
3. [Validation Schemas](#validation-schemas) (Zod)
4. [Auth/Authz Helpers](#auth-authz-helpers)
5. [Response Helpers](#response-helpers)
6. [TypeScript Types](#typescript-types)

---

## Route Handlers

### 1. Admin - Agents Management

#### GET `/api/admin/agents/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { requireApiRole } from '@/lib/api/auth';
import { apiSuccess } from '@/lib/api/response';

/**
 * GET /api/admin/agents
 * Listar todos los agentes (activos e inactivos)
 *
 * Query Params:
 *   - is_active?: 'true' | 'false'
 *   - model_provider?: 'openai' | 'anthropic' | 'google'
 *
 * Authorization: Admin only
 */
export const GET = apiHandler(async (request: NextRequest) => {
  const { supabase } = await requireApiRole(request, 'admin');

  // Extract query params
  const { searchParams } = new URL(request.url);
  const isActiveParam = searchParams.get('is_active');
  const modelProvider = searchParams.get('model_provider');

  // Build query
  let query = supabase
    .from('agents')
    .select(`
      id,
      name,
      description,
      specialization,
      default_model_provider,
      default_model_name,
      has_project_capability,
      project_type,
      allows_global_corpus,
      allows_personal_corpus,
      capabilities,
      is_active,
      created_at,
      updated_at,
      agent_models (
        id,
        tier,
        model_provider,
        model_name,
        temperature,
        max_tokens
      )
    `)
    .order('created_at', { ascending: false });

  // Apply filters
  if (isActiveParam !== null) {
    query = query.eq('is_active', isActiveParam === 'true');
  }

  if (modelProvider) {
    query = query.eq('default_model_provider', modelProvider);
  }

  const { data: agents, error } = await query;

  if (error) {
    throw new Response(
      JSON.stringify(apiError('DATABASE_ERROR', error.message)),
      { status: 500 }
    );
  }

  return NextResponse.json(apiSuccess(agents));
});
```

#### POST `/api/admin/agents/route.ts`

```typescript
import { agentSchema } from '@/lib/validation/agents';
import { createAuditLog } from '@/lib/admin/audit';

/**
 * POST /api/admin/agents
 * Crear nuevo agente
 *
 * Body: AgentInput (Zod validated)
 * Authorization: Admin only
 * Audit: agent.create logged
 */
export const POST = apiHandler(async (request: NextRequest) => {
  const { user, supabase } = await requireApiRole(request, 'admin');

  // Parse and validate body
  const body = await request.json();
  const validatedData = agentSchema.parse(body);

  // Create agent
  const { data: agent, error } = await supabase
    .from('agents')
    .insert({
      ...validatedData,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    throw new Response(
      JSON.stringify(apiError('DATABASE_ERROR', error.message)),
      { status: 500 }
    );
  }

  // Audit log
  await createAuditLog({
    userId: user.id,
    action: 'agent.create',
    actionCategory: 'agent',
    resourceType: 'agent',
    resourceId: agent.id,
    changes: { created: validatedData },
  });

  return NextResponse.json(
    apiSuccess(agent, 'Agente creado exitosamente'),
    { status: 201 }
  );
});
```

#### GET `/api/admin/agents/[id]/route.ts`

```typescript
/**
 * GET /api/admin/agents/[id]
 * Obtener detalles de un agente
 *
 * Authorization: Admin only
 */
export const GET = apiHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const { supabase } = await requireApiRole(request, 'admin');

  const { data: agent, error } = await supabase
    .from('agents')
    .select(`
      *,
      agent_models (*),
      created_by_user:users!agents_created_by (
        id,
        email
      ),
      agent_corpus_assignments (
        id,
        corpus:corpora (
          id,
          name,
          corpus_type
        )
      )
    `)
    .eq('id', params.id)
    .single();

  if (error || !agent) {
    throw new Response(
      JSON.stringify(apiError('NOT_FOUND', 'Agente no encontrado')),
      { status: 404 }
    );
  }

  return NextResponse.json(apiSuccess(agent));
});
```

#### PUT `/api/admin/agents/[id]/route.ts`

```typescript
/**
 * PUT /api/admin/agents/[id]
 * Actualizar agente existente
 *
 * Body: Partial<AgentInput> (Zod validated)
 * Authorization: Admin only
 * Audit: agent.update logged
 */
export const PUT = apiHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const { user, supabase } = await requireApiRole(request, 'admin');

  // Get current agent (for audit log)
  const { data: currentAgent } = await supabase
    .from('agents')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!currentAgent) {
    throw new Response(
      JSON.stringify(apiError('NOT_FOUND', 'Agente no encontrado')),
      { status: 404 }
    );
  }

  // Parse and validate body (partial update)
  const body = await request.json();
  const validatedData = agentSchema.partial().parse(body);

  // Update agent
  const { data: agent, error } = await supabase
    .from('agents')
    .update({
      ...validatedData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    throw new Response(
      JSON.stringify(apiError('DATABASE_ERROR', error.message)),
      { status: 500 }
    );
  }

  // Audit log with changes
  await createAuditLog({
    userId: user.id,
    action: 'agent.update',
    actionCategory: 'agent',
    resourceType: 'agent',
    resourceId: params.id,
    changes: {
      from: currentAgent,
      to: validatedData,
    },
  });

  return NextResponse.json(apiSuccess(agent, 'Agente actualizado exitosamente'));
});
```

#### DELETE `/api/admin/agents/[id]/route.ts`

```typescript
/**
 * DELETE /api/admin/agents/[id]
 * Soft delete (is_active = false)
 *
 * Authorization: Admin only
 * Audit: agent.delete logged
 */
export const DELETE = apiHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const { user, supabase } = await requireApiRole(request, 'admin');

  // Soft delete
  const { error } = await supabase
    .from('agents')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id);

  if (error) {
    throw new Response(
      JSON.stringify(apiError('DATABASE_ERROR', error.message)),
      { status: 500 }
    );
  }

  // Audit log
  await createAuditLog({
    userId: user.id,
    action: 'agent.delete',
    actionCategory: 'agent',
    resourceType: 'agent',
    resourceId: params.id,
    changes: { is_active: { from: true, to: false } },
  });

  return NextResponse.json(
    apiSuccess(null, 'Agente desactivado exitosamente'),
    { status: 200 }
  );
});
```

---

### 2. Admin - Global Corpus Management

#### GET `/api/admin/corpus/route.ts`

```typescript
/**
 * GET /api/admin/corpus
 * Listar corpus globales
 *
 * Query Params:
 *   - is_active?: 'true' | 'false'
 *
 * Authorization: Admin only
 */
export const GET = apiHandler(async (request: NextRequest) => {
  const { supabase } = await requireApiRole(request, 'admin');

  const { searchParams } = new URL(request.url);
  const isActiveParam = searchParams.get('is_active');

  let query = supabase
    .from('corpora')
    .select(`
      id,
      name,
      description,
      corpus_type,
      created_by,
      owner_user_id,
      tags,
      is_active,
      created_at,
      updated_at,
      created_by_user:users!corpora_created_by (
        id,
        email
      ),
      agent_corpus_assignments (
        id,
        agent:agents (
          id,
          name
        )
      ),
      corpus_documents (id)
    `)
    .eq('corpus_type', 'global')
    .order('created_at', { ascending: false });

  if (isActiveParam !== null) {
    query = query.eq('is_active', isActiveParam === 'true');
  }

  const { data: corpora, error } = await query;

  if (error) {
    throw new Response(
      JSON.stringify(apiError('DATABASE_ERROR', error.message)),
      { status: 500 }
    );
  }

  // Transform response with document count
  const transformedCorpora = corpora.map(corpus => ({
    ...corpus,
    document_count: corpus.corpus_documents?.length || 0,
    assigned_agents: corpus.agent_corpus_assignments?.map(a => ({
      agent_id: a.agent.id,
      agent_name: a.agent.name,
    })) || [],
  }));

  return NextResponse.json(apiSuccess(transformedCorpora));
});
```

#### POST `/api/admin/corpus/route.ts`

```typescript
import { corpusSchema } from '@/lib/validation/corpus';

/**
 * POST /api/admin/corpus
 * Crear corpus global
 *
 * Body: CorpusInput (Zod validated)
 * Authorization: Admin only
 * Audit: corpus.create logged
 */
export const POST = apiHandler(async (request: NextRequest) => {
  const { user, supabase } = await requireApiRole(request, 'admin');

  const body = await request.json();
  const validatedData = corpusSchema.parse(body);

  // Force corpus_type = 'global' for admin corpus
  if (validatedData.corpus_type !== 'global') {
    throw new Response(
      JSON.stringify(apiError('VALIDATION_ERROR', 'Solo se puede crear corpus global desde admin')),
      { status: 400 }
    );
  }

  // Create corpus
  const { data: corpus, error } = await supabase
    .from('corpora')
    .insert({
      ...validatedData,
      created_by: user.id,
      owner_user_id: null, // Global corpus has no owner
    })
    .select()
    .single();

  if (error) {
    throw new Response(
      JSON.stringify(apiError('DATABASE_ERROR', error.message)),
      { status: 500 }
    );
  }

  // Audit log
  await createAuditLog({
    userId: user.id,
    action: 'corpus.create',
    actionCategory: 'corpus',
    resourceType: 'corpus',
    resourceId: corpus.id,
    changes: { created: validatedData },
  });

  return NextResponse.json(
    apiSuccess(corpus, 'Corpus global creado exitosamente'),
    { status: 201 }
  );
});
```

#### PUT `/api/admin/corpus/[id]/route.ts`

```typescript
/**
 * PUT /api/admin/corpus/[id]
 * Actualizar corpus global
 *
 * Body: Partial<CorpusInput> (Zod validated)
 * Authorization: Admin only
 * Audit: corpus.update logged
 */
export const PUT = apiHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const { user, supabase } = await requireApiRole(request, 'admin');

  const { data: currentCorpus } = await supabase
    .from('corpora')
    .select('*')
    .eq('id', params.id)
    .eq('corpus_type', 'global')
    .single();

  if (!currentCorpus) {
    throw new Response(
      JSON.stringify(apiError('NOT_FOUND', 'Corpus global no encontrado')),
      { status: 404 }
    );
  }

  const body = await request.json();
  const validatedData = corpusSchema.partial().parse(body);

  const { data: corpus, error } = await supabase
    .from('corpora')
    .update({
      ...validatedData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    throw new Response(
      JSON.stringify(apiError('DATABASE_ERROR', error.message)),
      { status: 500 }
    );
  }

  await createAuditLog({
    userId: user.id,
    action: 'corpus.update',
    actionCategory: 'corpus',
    resourceType: 'corpus',
    resourceId: params.id,
    changes: {
      from: currentCorpus,
      to: validatedData,
    },
  });

  return NextResponse.json(apiSuccess(corpus, 'Corpus actualizado exitosamente'));
});
```

#### POST `/api/admin/corpus/[id]/assign/route.ts`

```typescript
import { assignCorpusSchema } from '@/lib/validation/corpus';

/**
 * POST /api/admin/corpus/[id]/assign
 * Asignar corpus global a agentes
 *
 * Body: { agent_ids: string[] }
 * Authorization: Admin only
 * Audit: corpus.assign logged
 */
export const POST = apiHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const { user, supabase } = await requireApiRole(request, 'admin');

  const body = await request.json();
  const { agent_ids } = assignCorpusSchema.parse(body);

  // Verify corpus exists and is global
  const { data: corpus } = await supabase
    .from('corpora')
    .select('*')
    .eq('id', params.id)
    .eq('corpus_type', 'global')
    .single();

  if (!corpus) {
    throw new Response(
      JSON.stringify(apiError('NOT_FOUND', 'Corpus global no encontrado')),
      { status: 404 }
    );
  }

  // Verify all agents exist and allow global corpus
  const { data: agents } = await supabase
    .from('agents')
    .select('id, name, allows_global_corpus')
    .in('id', agent_ids);

  if (agents.length !== agent_ids.length) {
    throw new Response(
      JSON.stringify(apiError('VALIDATION_ERROR', 'Algunos agentes no existen')),
      { status: 400 }
    );
  }

  const agentsNotAllowingGlobal = agents.filter(a => !a.allows_global_corpus);
  if (agentsNotAllowingGlobal.length > 0) {
    throw new Response(
      JSON.stringify(apiError(
        'VALIDATION_ERROR',
        `Los siguientes agentes no permiten corpus global: ${agentsNotAllowingGlobal.map(a => a.name).join(', ')}`
      )),
      { status: 400 }
    );
  }

  // Create assignments (using upsert to avoid duplicates)
  const assignments = agent_ids.map(agentId => ({
    corpus_id: params.id,
    agent_id: agentId,
    assigned_by: user.id,
    assignment_type: 'global' as const,
  }));

  const { data: createdAssignments, error } = await supabase
    .from('agent_corpus_assignments')
    .upsert(assignments, {
      onConflict: 'agent_id,corpus_id',
      ignoreDuplicates: true,
    })
    .select();

  if (error) {
    throw new Response(
      JSON.stringify(apiError('DATABASE_ERROR', error.message)),
      { status: 500 }
    );
  }

  // Audit log
  await createAuditLog({
    userId: user.id,
    action: 'corpus.assign',
    actionCategory: 'corpus',
    resourceType: 'corpus',
    resourceId: params.id,
    changes: {
      agent_ids,
      assignments_created: createdAssignments?.length || 0,
    },
  });

  return NextResponse.json(
    apiSuccess(
      {
        corpus_id: params.id,
        assignments_created: createdAssignments?.length || 0,
      },
      `Corpus asignado a ${createdAssignments?.length || 0} agentes`
    ),
    { status: 201 }
  );
});
```

#### POST `/api/admin/corpus/[id]/documents/route.ts`

```typescript
/**
 * POST /api/admin/corpus/[id]/documents
 * Upload documento a corpus global
 *
 * Content-Type: multipart/form-data
 * Body: FormData with 'file' field
 * Authorization: Admin only
 *
 * NOTE: File upload requires Supabase Storage integration
 * This is a scaffold - actual implementation in Fase 4
 */
export const POST = apiHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const { user, supabase } = await requireApiRole(request, 'admin');

  // Verify corpus exists
  const { data: corpus } = await supabase
    .from('corpora')
    .select('*')
    .eq('id', params.id)
    .eq('corpus_type', 'global')
    .single();

  if (!corpus) {
    throw new Response(
      JSON.stringify(apiError('NOT_FOUND', 'Corpus global no encontrado')),
      { status: 404 }
    );
  }

  // Parse FormData
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    throw new Response(
      JSON.stringify(apiError('VALIDATION_ERROR', 'Archivo requerido')),
      { status: 400 }
    );
  }

  // Validate file type
  const allowedTypes = ['application/pdf', 'text/plain', 'text/markdown', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (!allowedTypes.includes(file.type)) {
    throw new Response(
      JSON.stringify(apiError('VALIDATION_ERROR', 'Tipo de archivo no soportado. Usa PDF, TXT, MD o DOCX')),
      { status: 400 }
    );
  }

  // TODO (Fase 4): Upload to Supabase Storage
  // const { data: uploadData, error: uploadError } = await supabase.storage
  //   .from('corpus-documents')
  //   .upload(`${params.id}/${file.name}`, file);

  // For now, create document record with placeholder URL
  const { data: document, error } = await supabase
    .from('corpus_documents')
    .insert({
      corpus_id: params.id,
      filename: file.name,
      file_url: `https://placeholder.com/${params.id}/${file.name}`, // TODO: Replace with actual URL
      file_size: file.size,
      mime_type: file.type,
      status: 'pending',
      uploaded_by: user.id,
    })
    .select()
    .single();

  if (error) {
    throw new Response(
      JSON.stringify(apiError('DATABASE_ERROR', error.message)),
      { status: 500 }
    );
  }

  // TODO (Fase 4): Trigger document processing pipeline
  // - Chunking
  // - Embeddings generation
  // - Upload to Qdrant

  return NextResponse.json(
    apiSuccess(
      {
        document_id: document.id,
        filename: document.filename,
        file_url: document.file_url,
        status: document.status,
      },
      'Documento subido exitosamente. Procesamiento iniciado.'
    ),
    { status: 201 }
  );
});
```

---

### 3. User - Agents (Read-Only)

#### GET `/api/agents/route.ts`

```typescript
import { requireAuth } from '@/lib/api/auth';

/**
 * GET /api/agents
 * Listar agentes activos disponibles para usuarios
 *
 * Authorization: Authenticated user
 */
export const GET = apiHandler(async (request: NextRequest) => {
  const { supabase } = await requireAuth(request);

  const { data: agents, error } = await supabase
    .from('agents')
    .select(`
      id,
      name,
      description,
      specialization,
      default_model_provider,
      default_model_name,
      allows_personal_corpus,
      project_type,
      agent_corpus_assignments!inner (
        corpus:corpora (
          corpus_type
        )
      )
    `)
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    throw new Response(
      JSON.stringify(apiError('DATABASE_ERROR', error.message)),
      { status: 500 }
    );
  }

  // Transform response with corpus count
  const transformedAgents = agents.map(agent => ({
    id: agent.id,
    name: agent.name,
    description: agent.description,
    specialization: agent.specialization,
    model_provider: agent.default_model_provider,
    model_name: agent.default_model_name,
    allows_personal_corpus: agent.allows_personal_corpus,
    project_type: agent.project_type,
    assigned_corpus_count: agent.agent_corpus_assignments?.filter(
      a => a.corpus?.corpus_type === 'global'
    ).length || 0,
  }));

  return NextResponse.json(apiSuccess(transformedAgents));
});
```

#### GET `/api/agents/[id]/route.ts`

```typescript
/**
 * GET /api/agents/[id]
 * Detalles de un agente (public info, sin system_prompt completo)
 *
 * Authorization: Authenticated user
 */
export const GET = apiHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const { supabase } = await requireAuth(request);

  const { data: agent, error } = await supabase
    .from('agents')
    .select(`
      id,
      name,
      description,
      specialization,
      default_model_provider,
      default_model_name,
      allows_personal_corpus,
      project_type,
      agent_corpus_assignments (
        corpus:corpora (
          id,
          name,
          corpus_type
        )
      )
    `)
    .eq('id', params.id)
    .eq('is_active', true)
    .single();

  if (error || !agent) {
    throw new Response(
      JSON.stringify(apiError('NOT_FOUND', 'Agente no encontrado')),
      { status: 404 }
    );
  }

  return NextResponse.json(apiSuccess(agent));
});
```

---

### 4. User - Projects Management

#### GET `/api/projects/route.ts`

```typescript
/**
 * GET /api/projects
 * Listar proyectos del usuario autenticado
 *
 * Query Params:
 *   - status?: 'active' | 'archived' | 'completed'
 *   - agent_id?: UUID
 *
 * Authorization: Authenticated user
 * RLS: User solo ve SUS proyectos (user_id = auth.uid())
 */
export const GET = apiHandler(async (request: NextRequest) => {
  const { user, supabase } = await requireAuth(request);

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const agentId = searchParams.get('agent_id');

  let query = supabase
    .from('projects')
    .select(`
      id,
      user_id,
      agent_id,
      name,
      description,
      project_type,
      status,
      metadata,
      created_at,
      updated_at,
      agent:agents (
        id,
        name
      ),
      conversations (id)
    `)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  if (agentId) {
    query = query.eq('agent_id', agentId);
  }

  const { data: projects, error } = await query;

  if (error) {
    throw new Response(
      JSON.stringify(apiError('DATABASE_ERROR', error.message)),
      { status: 500 }
    );
  }

  // Transform response
  const transformedProjects = projects.map(project => ({
    ...project,
    agent_name: project.agent?.name,
    conversation_count: project.conversations?.length || 0,
  }));

  return NextResponse.json(apiSuccess(transformedProjects));
});
```

#### POST `/api/projects/route.ts`

```typescript
import { projectSchema } from '@/lib/validation/projects';

/**
 * POST /api/projects
 * Crear nuevo proyecto personal
 *
 * Body: ProjectInput (Zod validated)
 * Authorization: Authenticated user
 */
export const POST = apiHandler(async (request: NextRequest) => {
  const { user, supabase } = await requireAuth(request);

  const body = await request.json();
  const validatedData = projectSchema.parse(body);

  // Verify agent exists and get project_type
  const { data: agent } = await supabase
    .from('agents')
    .select('id, project_type, is_active')
    .eq('id', validatedData.agent_id)
    .single();

  if (!agent || !agent.is_active) {
    throw new Response(
      JSON.stringify(apiError('NOT_FOUND', 'Agente no encontrado o inactivo')),
      { status: 404 }
    );
  }

  // Create project
  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      ...validatedData,
      user_id: user.id,
      project_type: agent.project_type, // Inherit from agent
    })
    .select()
    .single();

  if (error) {
    throw new Response(
      JSON.stringify(apiError('DATABASE_ERROR', error.message)),
      { status: 500 }
    );
  }

  return NextResponse.json(
    apiSuccess(project, 'Proyecto creado exitosamente'),
    { status: 201 }
  );
});
```

#### GET `/api/projects/[id]/route.ts`

```typescript
import { requireOwnership } from '@/lib/api/auth';

/**
 * GET /api/projects/[id]
 * Detalles de un proyecto
 *
 * Authorization: Authenticated user + ownership check
 */
export const GET = apiHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const { user, supabase } = await requireAuth(request);

  // Verify ownership
  const project = await requireOwnership(supabase, 'projects', params.id, user.id);

  // Fetch full project with relations
  const { data: fullProject } = await supabase
    .from('projects')
    .select(`
      *,
      agent:agents (*),
      conversations (*),
      corpora (*)
    `)
    .eq('id', params.id)
    .single();

  return NextResponse.json(apiSuccess(fullProject));
});
```

#### PUT `/api/projects/[id]/route.ts`

```typescript
/**
 * PUT /api/projects/[id]
 * Actualizar proyecto
 *
 * Body: Partial<ProjectInput> (Zod validated)
 * Authorization: Authenticated user + ownership
 */
export const PUT = apiHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const { user, supabase } = await requireAuth(request);

  // Verify ownership
  await requireOwnership(supabase, 'projects', params.id, user.id);

  const body = await request.json();
  const validatedData = projectSchema.partial().parse(body);

  const { data: project, error } = await supabase
    .from('projects')
    .update({
      ...validatedData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    throw new Response(
      JSON.stringify(apiError('DATABASE_ERROR', error.message)),
      { status: 500 }
    );
  }

  return NextResponse.json(apiSuccess(project, 'Proyecto actualizado exitosamente'));
});
```

#### DELETE `/api/projects/[id]/route.ts`

```typescript
/**
 * DELETE /api/projects/[id]
 * Archivar proyecto (status = 'archived')
 *
 * Authorization: Authenticated user + ownership
 */
export const DELETE = apiHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const { user, supabase } = await requireAuth(request);

  await requireOwnership(supabase, 'projects', params.id, user.id);

  const { error } = await supabase
    .from('projects')
    .update({
      status: 'archived',
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id);

  if (error) {
    throw new Response(
      JSON.stringify(apiError('DATABASE_ERROR', error.message)),
      { status: 500 }
    );
  }

  return NextResponse.json(
    apiSuccess(null, 'Proyecto archivado exitosamente'),
    { status: 200 }
  );
});
```

---

### 5. User - Personal Corpus Management

#### GET `/api/corpus/route.ts`

```typescript
/**
 * GET /api/corpus
 * Listar corpus personales del usuario
 *
 * Authorization: Authenticated user
 * RLS: User solo ve SUS corpus (corpus_type = 'personal' AND owner_user_id = auth.uid())
 */
export const GET = apiHandler(async (request: NextRequest) => {
  const { user, supabase } = await requireAuth(request);

  const { data: corpora, error } = await supabase
    .from('corpora')
    .select(`
      id,
      name,
      description,
      corpus_type,
      owner_user_id,
      tags,
      is_active,
      created_at,
      updated_at,
      agent_corpus_assignments (
        id,
        agent:agents (
          id,
          name
        )
      ),
      corpus_documents (id)
    `)
    .eq('corpus_type', 'personal')
    .eq('owner_user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Response(
      JSON.stringify(apiError('DATABASE_ERROR', error.message)),
      { status: 500 }
    );
  }

  // Transform response
  const transformedCorpora = corpora.map(corpus => ({
    ...corpus,
    document_count: corpus.corpus_documents?.length || 0,
    assigned_agents: corpus.agent_corpus_assignments?.map(a => ({
      agent_id: a.agent.id,
      agent_name: a.agent.name,
    })) || [],
  }));

  return NextResponse.json(apiSuccess(transformedCorpora));
});
```

#### POST `/api/corpus/route.ts`

```typescript
/**
 * POST /api/corpus
 * Crear corpus personal
 *
 * Body: CorpusInput (Zod validated)
 * Authorization: Authenticated user
 */
export const POST = apiHandler(async (request: NextRequest) => {
  const { user, supabase } = await requireAuth(request);

  const body = await request.json();
  const validatedData = corpusSchema.parse(body);

  // Force corpus_type = 'personal'
  if (validatedData.corpus_type !== 'personal') {
    throw new Response(
      JSON.stringify(apiError('VALIDATION_ERROR', 'Solo se puede crear corpus personal desde esta API')),
      { status: 400 }
    );
  }

  const { data: corpus, error } = await supabase
    .from('corpora')
    .insert({
      ...validatedData,
      created_by: user.id,
      owner_user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    throw new Response(
      JSON.stringify(apiError('DATABASE_ERROR', error.message)),
      { status: 500 }
    );
  }

  return NextResponse.json(
    apiSuccess(corpus, 'Corpus personal creado exitosamente'),
    { status: 201 }
  );
});
```

#### PUT `/api/corpus/[id]/route.ts`

```typescript
/**
 * PUT /api/corpus/[id]
 * Actualizar corpus personal
 *
 * Body: Partial<CorpusInput> (Zod validated)
 * Authorization: Authenticated user + ownership
 */
export const PUT = apiHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const { user, supabase } = await requireAuth(request);

  await requireOwnership(supabase, 'corpora', params.id, user.id);

  const body = await request.json();
  const validatedData = corpusSchema.partial().parse(body);

  const { data: corpus, error } = await supabase
    .from('corpora')
    .update({
      ...validatedData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    throw new Response(
      JSON.stringify(apiError('DATABASE_ERROR', error.message)),
      { status: 500 }
    );
  }

  return NextResponse.json(apiSuccess(corpus, 'Corpus actualizado exitosamente'));
});
```

#### POST `/api/corpus/[id]/assign/route.ts`

```typescript
/**
 * POST /api/corpus/[id]/assign
 * Asignar corpus personal a agentes
 *
 * Body: { agent_ids: string[] }
 * Authorization: Authenticated user + ownership
 *
 * CRITICAL: Validate that agents allow personal corpus
 */
export const POST = apiHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const { user, supabase } = await requireAuth(request);

  await requireOwnership(supabase, 'corpora', params.id, user.id);

  const body = await request.json();
  const { agent_ids } = assignCorpusSchema.parse(body);

  // Verify all agents exist and ALLOW personal corpus
  const { data: agents } = await supabase
    .from('agents')
    .select('id, name, allows_personal_corpus')
    .in('id', agent_ids)
    .eq('is_active', true);

  if (agents.length !== agent_ids.length) {
    throw new Response(
      JSON.stringify(apiError('VALIDATION_ERROR', 'Algunos agentes no existen o están inactivos')),
      { status: 400 }
    );
  }

  const agentsNotAllowingPersonal = agents.filter(a => !a.allows_personal_corpus);
  if (agentsNotAllowingPersonal.length > 0) {
    throw new Response(
      JSON.stringify(apiError(
        'VALIDATION_ERROR',
        `Los siguientes agentes no permiten corpus personal: ${agentsNotAllowingPersonal.map(a => a.name).join(', ')}`
      )),
      { status: 400 }
    );
  }

  // Create assignments
  const assignments = agent_ids.map(agentId => ({
    corpus_id: params.id,
    agent_id: agentId,
    assigned_by: user.id,
    assignment_type: 'personal' as const,
  }));

  const { data: createdAssignments, error } = await supabase
    .from('agent_corpus_assignments')
    .upsert(assignments, {
      onConflict: 'agent_id,corpus_id',
      ignoreDuplicates: true,
    })
    .select();

  if (error) {
    throw new Response(
      JSON.stringify(apiError('DATABASE_ERROR', error.message)),
      { status: 500 }
    );
  }

  return NextResponse.json(
    apiSuccess(
      {
        corpus_id: params.id,
        assignments_created: createdAssignments?.length || 0,
      },
      `Corpus asignado a ${createdAssignments?.length || 0} agentes`
    ),
    { status: 201 }
  );
});
```

#### POST `/api/corpus/[id]/documents/route.ts`

```typescript
/**
 * POST /api/corpus/[id]/documents
 * Upload documento a corpus personal
 *
 * Content-Type: multipart/form-data
 * Body: FormData with 'file' field
 * Authorization: Authenticated user + ownership
 *
 * NOTE: Same implementation as admin version, but with ownership check
 */
export const POST = apiHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const { user, supabase } = await requireAuth(request);

  await requireOwnership(supabase, 'corpora', params.id, user.id);

  // Same implementation as admin version
  // (see /api/admin/corpus/[id]/documents/route.ts)

  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    throw new Response(
      JSON.stringify(apiError('VALIDATION_ERROR', 'Archivo requerido')),
      { status: 400 }
    );
  }

  const allowedTypes = ['application/pdf', 'text/plain', 'text/markdown', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (!allowedTypes.includes(file.type)) {
    throw new Response(
      JSON.stringify(apiError('VALIDATION_ERROR', 'Tipo de archivo no soportado')),
      { status: 400 }
    );
  }

  const { data: document, error } = await supabase
    .from('corpus_documents')
    .insert({
      corpus_id: params.id,
      filename: file.name,
      file_url: `https://placeholder.com/${params.id}/${file.name}`,
      file_size: file.size,
      mime_type: file.type,
      status: 'pending',
      uploaded_by: user.id,
    })
    .select()
    .single();

  if (error) {
    throw new Response(
      JSON.stringify(apiError('DATABASE_ERROR', error.message)),
      { status: 500 }
    );
  }

  return NextResponse.json(
    apiSuccess(
      {
        document_id: document.id,
        filename: document.filename,
        file_url: document.file_url,
        status: document.status,
      },
      'Documento subido exitosamente. Procesamiento iniciado.'
    ),
    { status: 201 }
  );
});
```

---

### 6. User - Chat with Agents (RAG-Enabled)

#### POST `/api/agents/[id]/chat/route.ts`

```typescript
import { chatRequestSchema } from '@/lib/validation/chat';

/**
 * POST /api/agents/[id]/chat
 * Chat con agente usando RAG retrieval
 *
 * Body: ChatRequest (Zod validated)
 * Authorization: Authenticated user
 *
 * RAG Logic:
 *   1. Identify assigned corpus (global + personal)
 *   2. Semantic search in Qdrant
 *   3. Inject top-k chunks into prompt
 *   4. Stream LLM response
 *   5. Save conversation
 *
 * NOTE: This is a scaffold - full RAG implementation in Fase 4
 */
export const POST = apiHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const { user, supabase } = await requireAuth(request);

  const body = await request.json();
  const { project_id, messages, stream } = chatRequestSchema.parse(body);

  // Verify agent exists and is active
  const { data: agent } = await supabase
    .from('agents')
    .select('*')
    .eq('id', params.id)
    .eq('is_active', true)
    .single();

  if (!agent) {
    throw new Response(
      JSON.stringify(apiError('NOT_FOUND', 'Agente no encontrado')),
      { status: 404 }
    );
  }

  // Verify project ownership
  await requireOwnership(supabase, 'projects', project_id, user.id);

  // TODO (Fase 4): RAG Retrieval Logic
  // 1. Get assigned corpus IDs
  const { data: assignments } = await supabase
    .from('agent_corpus_assignments')
    .select(`
      corpus_id,
      corpus:corpora (
        id,
        corpus_type,
        owner_user_id
      )
    `)
    .eq('agent_id', params.id);

  // Filter: global corpus + personal corpus owned by user
  const accessibleCorpusIds = assignments
    ?.filter(a =>
      a.corpus.corpus_type === 'global' ||
      (a.corpus.corpus_type === 'personal' && a.corpus.owner_user_id === user.id)
    )
    .map(a => a.corpus_id) || [];

  // 2. TODO: Semantic search in Qdrant
  // const query = messages[messages.length - 1].content;
  // const chunks = await qdrantSemanticSearch(query, accessibleCorpusIds, topK = 5);

  // 3. TODO: Inject chunks into system prompt
  // const enrichedPrompt = buildEnrichedPrompt(agent.system_prompt, chunks);

  // 4. TODO: Call LLM with enriched prompt (Vercel AI SDK)
  // const response = await callLLM(agent, messages, enrichedPrompt, stream);

  // For now, return placeholder response
  const placeholderResponse = {
    message: {
      role: 'assistant' as const,
      content: 'Hola, soy el agente ' + agent.name + '. ¿En qué puedo ayudarte? (RAG implementation pending)',
    },
    context_used: {
      global_corpus_chunks: 0,
      personal_corpus_chunks: 0,
      total_chunks: 0,
    },
  };

  // 5. Save conversation
  const { data: conversation } = await supabase
    .from('conversations')
    .insert({
      user_id: user.id,
      agent_id: params.id,
      project_id,
      title: messages[0].content.substring(0, 200),
      messages: [...messages, placeholderResponse.message],
    })
    .select()
    .single();

  return NextResponse.json(apiSuccess(placeholderResponse));
});
```

---

## Server Actions

### Admin Actions - Agents

#### `lib/actions/admin/agents.ts`

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/actions/auth';
import { agentSchema } from '@/lib/validation/agents';
import { createAuditLog } from '@/lib/admin/audit';

/**
 * Create Agent Server Action
 */
export async function createAgent(formData: FormData) {
  const admin = await requireAdmin();
  const supabase = await createClient();

  try {
    // Parse and validate form data
    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      specialization: formData.get('specialization') as string,
      default_model_provider: formData.get('default_model_provider') as string,
      default_model_name: formData.get('default_model_name') as string,
      temperature: parseFloat(formData.get('temperature') as string),
      max_tokens: formData.get('max_tokens') ? parseInt(formData.get('max_tokens') as string) : undefined,
      allows_personal_corpus: formData.get('allows_personal_corpus') === 'true',
      allows_global_corpus: formData.get('allows_global_corpus') === 'true',
      project_type: formData.get('project_type') as string,
      is_active: formData.get('is_active') !== 'false',
    };

    const validatedData = agentSchema.parse(data);

    // Create agent
    const { data: agent, error } = await supabase
      .from('agents')
      .insert({
        ...validatedData,
        created_by: admin.user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Audit log
    await createAuditLog({
      userId: admin.user.id,
      action: 'agent.create',
      actionCategory: 'agent',
      resourceType: 'agent',
      resourceId: agent.id,
      changes: { created: validatedData },
    });

    revalidatePath('/admin/agents');

    return {
      success: true,
      data: agent,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al crear agente',
    };
  }
}

/**
 * Update Agent Server Action
 */
export async function updateAgent(id: string, formData: FormData) {
  const admin = await requireAdmin();
  const supabase = await createClient();

  try {
    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      // ... same as createAgent
    };

    const validatedData = agentSchema.partial().parse(data);

    const { data: agent, error } = await supabase
      .from('agents')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await createAuditLog({
      userId: admin.user.id,
      action: 'agent.update',
      actionCategory: 'agent',
      resourceType: 'agent',
      resourceId: id,
      changes: { updated: validatedData },
    });

    revalidatePath('/admin/agents');
    revalidatePath(`/admin/agents/${id}`);

    return {
      success: true,
      data: agent,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al actualizar agente',
    };
  }
}

/**
 * Delete Agent Server Action (Soft Delete)
 */
export async function deleteAgent(id: string) {
  const admin = await requireAdmin();
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from('agents')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;

    await createAuditLog({
      userId: admin.user.id,
      action: 'agent.delete',
      actionCategory: 'agent',
      resourceType: 'agent',
      resourceId: id,
      changes: { is_active: { from: true, to: false } },
    });

    revalidatePath('/admin/agents');

    return {
      success: true,
      message: 'Agente desactivado exitosamente',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al desactivar agente',
    };
  }
}
```

---

### Admin Actions - Global Corpus

#### `lib/actions/admin/corpus.ts`

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/actions/auth';
import { corpusSchema, assignCorpusSchema } from '@/lib/validation/corpus';
import { createAuditLog } from '@/lib/admin/audit';

/**
 * Create Global Corpus Server Action
 */
export async function createGlobalCorpus(formData: FormData) {
  const admin = await requireAdmin();
  const supabase = await createClient();

  try {
    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      corpus_type: 'global' as const,
      is_active: formData.get('is_active') !== 'false',
    };

    const validatedData = corpusSchema.parse(data);

    const { data: corpus, error } = await supabase
      .from('corpora')
      .insert({
        ...validatedData,
        created_by: admin.user.id,
        owner_user_id: null,
      })
      .select()
      .single();

    if (error) throw error;

    await createAuditLog({
      userId: admin.user.id,
      action: 'corpus.create',
      actionCategory: 'corpus',
      resourceType: 'corpus',
      resourceId: corpus.id,
      changes: { created: validatedData },
    });

    revalidatePath('/admin/corpus');

    return {
      success: true,
      data: corpus,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al crear corpus',
    };
  }
}

/**
 * Assign Corpus to Agents Server Action
 */
export async function assignCorpusToAgents(corpusId: string, agentIds: string[]) {
  const admin = await requireAdmin();
  const supabase = await createClient();

  try {
    const validatedData = assignCorpusSchema.parse({ agent_ids: agentIds });

    // Verify agents exist and allow global corpus
    const { data: agents } = await supabase
      .from('agents')
      .select('id, name, allows_global_corpus')
      .in('id', validatedData.agent_ids);

    if (agents.length !== validatedData.agent_ids.length) {
      throw new Error('Algunos agentes no existen');
    }

    const agentsNotAllowing = agents.filter(a => !a.allows_global_corpus);
    if (agentsNotAllowing.length > 0) {
      throw new Error(`Agentes sin permiso: ${agentsNotAllowing.map(a => a.name).join(', ')}`);
    }

    const assignments = validatedData.agent_ids.map(agentId => ({
      corpus_id: corpusId,
      agent_id: agentId,
      assigned_by: admin.user.id,
      assignment_type: 'global' as const,
    }));

    const { data: created, error } = await supabase
      .from('agent_corpus_assignments')
      .upsert(assignments, {
        onConflict: 'agent_id,corpus_id',
        ignoreDuplicates: true,
      })
      .select();

    if (error) throw error;

    await createAuditLog({
      userId: admin.user.id,
      action: 'corpus.assign',
      actionCategory: 'corpus',
      resourceType: 'corpus',
      resourceId: corpusId,
      changes: {
        agent_ids: validatedData.agent_ids,
        assignments_created: created?.length || 0,
      },
    });

    revalidatePath('/admin/corpus');
    revalidatePath(`/admin/corpus/${corpusId}`);

    return {
      success: true,
      assignmentsCreated: created?.length || 0,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al asignar corpus',
    };
  }
}
```

---

### User Actions - Projects

#### `lib/actions/projects.ts`

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { projectSchema } from '@/lib/validation/projects';

/**
 * Create Project Server Action
 */
export async function createProject(formData: FormData) {
  const supabase = await createClient();
  await supabase.auth.getClaims();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  try {
    const data = {
      agent_id: formData.get('agent_id') as string,
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      status: (formData.get('status') as string) || 'active',
      metadata: {},
    };

    const validatedData = projectSchema.parse(data);

    // Get agent to inherit project_type
    const { data: agent } = await supabase
      .from('agents')
      .select('id, project_type, is_active')
      .eq('id', validatedData.agent_id)
      .single();

    if (!agent || !agent.is_active) {
      throw new Error('Agente no encontrado o inactivo');
    }

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        ...validatedData,
        user_id: user.id,
        project_type: agent.project_type,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/dashboard/projects');

    return {
      success: true,
      data: project,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al crear proyecto',
    };
  }
}

/**
 * Update Project Server Action
 */
export async function updateProject(id: string, formData: FormData) {
  const supabase = await createClient();
  await supabase.auth.getClaims();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  try {
    // Verify ownership
    const { data: project } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!project || project.user_id !== user.id) {
      throw new Error('No tienes permiso para editar este proyecto');
    }

    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      status: formData.get('status') as string,
    };

    const validatedData = projectSchema.partial().parse(data);

    const { data: updated, error } = await supabase
      .from('projects')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/dashboard/projects');
    revalidatePath(`/dashboard/projects/${id}`);

    return {
      success: true,
      data: updated,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al actualizar proyecto',
    };
  }
}

/**
 * Archive Project Server Action
 */
export async function archiveProject(id: string) {
  const supabase = await createClient();
  await supabase.auth.getClaims();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  try {
    const { data: project } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!project || project.user_id !== user.id) {
      throw new Error('No tienes permiso');
    }

    const { error } = await supabase
      .from('projects')
      .update({
        status: 'archived',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/dashboard/projects');

    return {
      success: true,
      message: 'Proyecto archivado exitosamente',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al archivar proyecto',
    };
  }
}
```

---

### User Actions - Personal Corpus

#### `lib/actions/corpus.ts`

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { corpusSchema, assignCorpusSchema } from '@/lib/validation/corpus';

/**
 * Create Personal Corpus Server Action
 */
export async function createPersonalCorpus(formData: FormData) {
  const supabase = await createClient();
  await supabase.auth.getClaims();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  try {
    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      corpus_type: 'personal' as const,
      is_active: formData.get('is_active') !== 'false',
    };

    const validatedData = corpusSchema.parse(data);

    const { data: corpus, error } = await supabase
      .from('corpora')
      .insert({
        ...validatedData,
        created_by: user.id,
        owner_user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/dashboard/corpus');

    return {
      success: true,
      data: corpus,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al crear corpus',
    };
  }
}

/**
 * Assign Personal Corpus to Agents Server Action
 */
export async function assignPersonalCorpusToAgents(corpusId: string, agentIds: string[]) {
  const supabase = await createClient();
  await supabase.auth.getClaims();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  try {
    // Verify ownership
    const { data: corpus } = await supabase
      .from('corpora')
      .select('owner_user_id')
      .eq('id', corpusId)
      .single();

    if (!corpus || corpus.owner_user_id !== user.id) {
      throw new Error('No tienes permiso');
    }

    const validatedData = assignCorpusSchema.parse({ agent_ids: agentIds });

    // Verify agents allow personal corpus
    const { data: agents } = await supabase
      .from('agents')
      .select('id, name, allows_personal_corpus')
      .in('id', validatedData.agent_ids)
      .eq('is_active', true);

    if (agents.length !== validatedData.agent_ids.length) {
      throw new Error('Algunos agentes no existen');
    }

    const agentsNotAllowing = agents.filter(a => !a.allows_personal_corpus);
    if (agentsNotAllowing.length > 0) {
      throw new Error(`Agentes sin permiso: ${agentsNotAllowing.map(a => a.name).join(', ')}`);
    }

    const assignments = validatedData.agent_ids.map(agentId => ({
      corpus_id: corpusId,
      agent_id: agentId,
      assigned_by: user.id,
      assignment_type: 'personal' as const,
    }));

    const { data: created, error } = await supabase
      .from('agent_corpus_assignments')
      .upsert(assignments, {
        onConflict: 'agent_id,corpus_id',
        ignoreDuplicates: true,
      })
      .select();

    if (error) throw error;

    revalidatePath('/dashboard/corpus');
    revalidatePath(`/dashboard/corpus/${corpusId}`);

    return {
      success: true,
      assignmentsCreated: created?.length || 0,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al asignar corpus',
    };
  }
}
```

---

## Validation Schemas (Zod)

### `lib/validation/agents.ts`

```typescript
import { z } from 'zod';

export const agentSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(100, 'Nombre muy largo'),
  description: z.string().optional(),
  specialization: z.string().max(100).optional(),
  default_model_provider: z.enum(['openai', 'anthropic', 'google'], {
    errorMap: () => ({ message: 'Proveedor de modelo inválido' }),
  }),
  default_model_name: z.string().min(1, 'Nombre de modelo requerido').max(100),
  temperature: z.number().min(0).max(2).default(0.7),
  max_tokens: z.number().int().positive().optional(),
  allows_personal_corpus: z.boolean().default(false),
  allows_global_corpus: z.boolean().default(true),
  has_project_capability: z.boolean().default(false),
  project_type: z.string().max(50).optional(),
  is_active: z.boolean().default(true),
});

export type AgentInput = z.infer<typeof agentSchema>;
```

### `lib/validation/projects.ts`

```typescript
import { z } from 'zod';

export const projectSchema = z.object({
  agent_id: z.string().uuid('ID de agente inválido'),
  name: z.string().min(1, 'Nombre requerido').max(200, 'Nombre muy largo'),
  description: z.string().optional(),
  status: z.enum(['active', 'archived', 'completed']).default('active'),
  metadata: z.record(z.any()).default({}),
});

export type ProjectInput = z.infer<typeof projectSchema>;
```

### `lib/validation/corpus.ts`

```typescript
import { z } from 'zod';

export const corpusSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(200, 'Nombre muy largo'),
  description: z.string().optional(),
  corpus_type: z.enum(['global', 'personal'], {
    errorMap: () => ({ message: 'Tipo de corpus inválido' }),
  }),
  is_active: z.boolean().default(true),
});

export const assignCorpusSchema = z.object({
  agent_ids: z.array(z.string().uuid()).min(1, 'Debes seleccionar al menos un agente'),
});

export type CorpusInput = z.infer<typeof corpusSchema>;
export type AssignCorpusInput = z.infer<typeof assignCorpusSchema>;
```

### `lib/validation/chat.ts`

```typescript
import { z } from 'zod';

export const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1, 'Mensaje vacío'),
});

export const chatRequestSchema = z.object({
  project_id: z.string().uuid('ID de proyecto inválido'),
  messages: z.array(chatMessageSchema).min(1, 'Debes enviar al menos un mensaje'),
  stream: z.boolean().default(true),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;
```

---

## Auth/Authz Helpers

### API Routes - `lib/api/auth.ts`

```typescript
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiError } from '@/lib/api/response';
import type { SupabaseClient } from '@supabase/supabase-js';

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

### Server Actions - `lib/actions/auth.ts`

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

## Response Helpers

### `lib/api/response.ts`

```typescript
/**
 * API Response Types
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Success Response Helper
 */
export function apiSuccess<T>(data: T, message?: string): ApiSuccessResponse<T> {
  return { success: true, data, message };
}

/**
 * Error Response Helper
 */
export function apiError(code: string, message: string, details?: any): ApiErrorResponse {
  return {
    success: false,
    error: { code, message, details },
  };
}
```

---

## TypeScript Types

### `lib/types/api.ts`

```typescript
import type { Database } from '@/lib/types/database.types';

// Database Types (generated by Supabase)
export type Agent = Database['public']['Tables']['agents']['Row'];
export type AgentInsert = Database['public']['Tables']['agents']['Insert'];
export type AgentUpdate = Database['public']['Tables']['agents']['Update'];

export type Project = Database['public']['Tables']['projects']['Row'];
export type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
export type ProjectUpdate = Database['public']['Tables']['projects']['Update'];

export type Corpus = Database['public']['Tables']['corpora']['Row'];
export type CorpusInsert = Database['public']['Tables']['corpora']['Insert'];
export type CorpusUpdate = Database['public']['Tables']['corpora']['Update'];

export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type ConversationInsert = Database['public']['Tables']['conversations']['Insert'];

// Extended Types with Relations
export type AgentWithModels = Agent & {
  agent_models: AgentModel[];
};

export type ProjectWithAgent = Project & {
  agent: Agent;
  conversations: Conversation[];
};

export type CorpusWithAssignments = Corpus & {
  agent_corpus_assignments: {
    agent: Agent;
  }[];
  document_count: number;
};
```

---

## Resumen de Endpoints

### Admin API (6 recursos)

| Method | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/admin/agents` | Listar agentes |
| POST | `/api/admin/agents` | Crear agente |
| GET | `/api/admin/agents/[id]` | Detalles agente |
| PUT | `/api/admin/agents/[id]` | Actualizar agente |
| DELETE | `/api/admin/agents/[id]` | Desactivar agente |
| GET | `/api/admin/corpus` | Listar corpus global |
| POST | `/api/admin/corpus` | Crear corpus global |
| PUT | `/api/admin/corpus/[id]` | Actualizar corpus |
| POST | `/api/admin/corpus/[id]/assign` | Asignar a agentes |
| POST | `/api/admin/corpus/[id]/documents` | Upload documento |

### User API (5 recursos)

| Method | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/agents` | Listar agentes activos |
| GET | `/api/agents/[id]` | Detalles agente |
| POST | `/api/agents/[id]/chat` | Chat con agente (RAG) |
| GET | `/api/projects` | Listar proyectos |
| POST | `/api/projects` | Crear proyecto |
| GET | `/api/projects/[id]` | Detalles proyecto |
| PUT | `/api/projects/[id]` | Actualizar proyecto |
| DELETE | `/api/projects/[id]` | Archivar proyecto |
| GET | `/api/corpus` | Listar corpus personal |
| POST | `/api/corpus` | Crear corpus personal |
| PUT | `/api/corpus/[id]` | Actualizar corpus |
| POST | `/api/corpus/[id]/assign` | Asignar a agentes |
| POST | `/api/corpus/[id]/documents` | Upload documento |

**Total**: 21 Route Handlers

### Server Actions (4 módulos)

| Module | Actions | Descripción |
|--------|---------|-------------|
| `lib/actions/admin/agents.ts` | 3 | createAgent, updateAgent, deleteAgent |
| `lib/actions/admin/corpus.ts` | 2 | createGlobalCorpus, assignCorpusToAgents |
| `lib/actions/projects.ts` | 3 | createProject, updateProject, archiveProject |
| `lib/actions/corpus.ts` | 2 | createPersonalCorpus, assignPersonalCorpusToAgents |

**Total**: 10 Server Actions

---

## Próximos Pasos (Fase 4 - Desarrollo)

1. Implementar Route Handlers en `app/api/`
2. Implementar Server Actions en `lib/actions/`
3. Implementar Validation Schemas en `lib/validation/`
4. Implementar Auth Helpers en `lib/api/auth.ts` y `lib/actions/auth.ts`
5. Implementar Response Helpers en `lib/api/response.ts`
6. Integrar Supabase Storage para file uploads
7. Implementar RAG pipeline (semantic search + Qdrant)
8. Implementar LLM streaming con Vercel AI SDK
9. Testing de endpoints (Fase 5)

---

**Fecha de Diseño**: 2025-11-21
**Responsable**: api-designer (Fase 3)
**Estado**: COMPLETO
**Próximo Paso**: Validar coherencia DB ↔ API con design-validator
