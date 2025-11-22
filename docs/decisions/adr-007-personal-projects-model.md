# ADR-007: Modelo de Proyectos Personales

**Fecha**: 2025-11-21
**Estado**: Aprobado
**Contexto**: CJHIRASHI APP v0.1
**Responsables**: architect (fase-2-arquitectura-leader)

---

## Contexto y Problema

Los usuarios necesitan organizar su trabajo con agentes inteligentes. ¿Cómo estructurar proyectos para balance entre funcionalidad, privacidad y simplicidad?

**Opciones consideradas**:
- **Opción A**: Proyectos privados por usuario (no compartidos)
- **Opción B**: Proyectos compartidos entre usuarios (colaboración)
- **Opción C**: Proyectos organizacionales (admin-managed) + personales

---

## Decisión

**Adoptamos Opción A: Proyectos Privados por Usuario**

### Modelo Confirmado

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE RESTRICT,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  project_type VARCHAR(50), -- Heredado de agents.project_type
  status VARCHAR(20) DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_agent_id ON projects(agent_id);

-- RLS Policy: Usuario solo ve SUS proyectos
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own projects" ON projects
  FOR ALL USING (user_id = auth.uid());
```

### Características Clave

1. **Privacidad Absoluta**: `user_id = auth.uid()` garantiza aislamiento
2. **Tipo de Proyecto Heredado**: `project_type` se copia de `agents.project_type`
3. **Sin Límites**: Usuario puede crear proyectos ilimitados (en v0.1)
4. **Status Management**: `active`, `archived`, `completed`

---

## Justificación

### Ventajas de Opción A (Seleccionada)

✅ **Simplicidad de Implementación**:
- Schema simple (1 tabla, FK directo)
- RLS policy directo (`user_id = auth.uid()`)
- Sin complicaciones de permisos compartidos

✅ **Privacidad Garantizada**:
- Usuario tiene control total sobre sus proyectos
- No hay riesgo de acceso no autorizado
- GDPR-friendly (delete cascades)

✅ **Performance**:
- Queries simples con index en `user_id`
- Sin joins complejos para permisos
- Caching efectivo (por usuario)

✅ **MVP-Ready**:
- Funcionalidad core sin complejidad adicional
- Facilita testing (aislamiento por usuario)
- Permite iterar rápido en v0.1

### Desventajas de Opciones Descartadas

❌ **Opción B (Compartidos)**:
- Requiere tabla adicional `project_collaborators`
- RLS policies complejas (owner + collaborators)
- UI compleja (invitar usuarios, permisos)
- Overkill para v0.1 (puede diferirse a v0.2+)

❌ **Opción C (Organizacionales + Personales)**:
- Requiere 2 tablas (`org_projects`, `user_projects`)
- Lógica bifurcada en API
- No alineado con modelo de usuario actual (sin organizaciones)

---

## Flujo de Creación de Proyecto

```typescript
// Frontend: /dashboard/projects/new
<form onSubmit={handleSubmit}>
  <Input name="name" placeholder="Nombre del proyecto" required />
  <Textarea name="description" placeholder="Descripción" />

  {/* Selector de agente */}
  <Select name="agent_id">
    {agents.map(agent => (
      <SelectItem value={agent.id} key={agent.id}>
        {agent.name} - {agent.project_type}
      </SelectItem>
    ))}
  </Select>

  {/* project_type heredado (readonly, hidden) */}
  <input type="hidden" name="project_type" value={selectedAgent?.project_type} />

  <Button type="submit">Crear Proyecto</Button>
</form>

// Backend: Server Action
export async function createProject(formData: FormData) {
  const supabase = await createClient();
  await supabase.auth.getClaims();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const agentId = formData.get('agent_id') as string;

  // Fetch agent to get project_type
  const { data: agent } = await supabase
    .from('agents')
    .select('project_type')
    .eq('id', agentId)
    .single();

  // Create project (user_id auto-injected by RLS)
  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: user.id, // Explicit
      agent_id: agentId,
      name: formData.get('name'),
      description: formData.get('description'),
      project_type: agent.project_type, // Heredado
      status: 'active'
    })
    .select()
    .single();

  if (error) throw error;

  return { success: true, data };
}
```

---

## Relación con Agentes

### Tipo de Proyecto (project_type)

**Concepto**: Cada agente tiene un `project_type` que define qué tipo de proyectos puede manejar.

**Ejemplos**:
- **Escritor de Libros** → `project_type: "Libro"`
- **Analista de Datos** → `project_type: "Análisis"`
- **Investigador Técnico** → `project_type: "Investigación"`

**Flujo**:
1. Admin configura `agents.project_type` al crear agente
2. Usuario selecciona agente en formulario de proyecto
3. `projects.project_type` se copia de `agents.project_type`
4. Frontend puede mostrar UI específica por tipo (future)

**Beneficio**: Permite customización futura de UI/lógica por tipo de proyecto sin cambiar schema.

---

## Conversaciones (Multi-Turn Chat)

**Relacionado**: Cada proyecto puede tener múltiples conversaciones.

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  agent_id UUID NOT NULL REFERENCES agents(id),
  user_message TEXT NOT NULL,
  assistant_message TEXT NOT NULL,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para performance
CREATE INDEX idx_conversations_project ON conversations(project_id);
CREATE INDEX idx_conversations_user ON conversations(user_id);

-- RLS Policy
CREATE POLICY "Users manage own conversations" ON conversations
  FOR ALL USING (user_id = auth.uid());
```

**Flujo**:
- Chat en `/dashboard/projects/{id}/chat`
- Cada mensaje guardado en `conversations`
- Historial recuperable por `project_id`

---

## Límites y Escalabilidad (v0.1)

### Límites Actuales

- ❌ **Sin límite de proyectos por usuario** (ilimitados en v0.1)
- ❌ **Sin sistema de tiers** (Free/Pro/Elite diferido a v0.2+)
- ❌ **Sin cuotas de storage** (documentos ilimitados en corpus personal)

**Riesgo**: Usuario puede crear proyectos ilimitados, potencial abuso.

**Mitigación**:
- Monitoreo manual de uso en v0.1
- Implementar límites en v0.2+ con tier system

### Escalabilidad Futura (v0.2+)

**Opción de Colaboración**:
```sql
-- Tabla para compartir proyectos (futuro)
CREATE TABLE project_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role VARCHAR(20) NOT NULL, -- 'owner', 'editor', 'viewer'
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);
```

**Diferimiento**: NO implementado en v0.1 (puede agregarse sin breaking changes).

---

## Impacto en el Sistema

### Componentes Nuevos

| Componente | Ubicación | Descripción |
|------------|-----------|-------------|
| Projects Page | `app/dashboard/projects/page.tsx` | Listado de proyectos |
| Create Project Page | `app/dashboard/projects/new/page.tsx` | Formulario creación |
| Project Details Page | `app/dashboard/projects/[id]/page.tsx` | Detalles + edición |
| Chat Page | `app/dashboard/projects/[id]/chat/page.tsx` | Chat con agente |
| ProjectForm | `components/dashboard/ProjectForm.tsx` | Form component |
| ProjectCard | `components/dashboard/ProjectCard.tsx` | Card glassmorphic |
| AgentSelector | `components/dashboard/AgentSelector.tsx` | Dropdown agentes |

### API Endpoints Nuevos

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/projects` | GET | Listar proyectos del usuario |
| `/api/projects` | POST | Crear proyecto |
| `/api/projects/[id]` | GET | Detalles de proyecto |
| `/api/projects/[id]` | PUT | Actualizar proyecto |
| `/api/projects/[id]` | DELETE | Archivar proyecto (status = 'archived') |

### Server Actions Nuevos

| Action | Descripción |
|--------|-------------|
| `createProject(formData)` | Form mutation crear |
| `updateProject(id, formData)` | Form mutation actualizar |
| `archiveProject(id)` | Archivar proyecto |

---

## Consideraciones de Seguridad

### RLS Policy (Last Defense)

```sql
CREATE POLICY "Users manage own projects" ON projects
  FOR ALL USING (user_id = auth.uid());
```

**Garantía**: Usuario solo puede SELECT/INSERT/UPDATE/DELETE SUS proyectos.

### API Layer Protection

```typescript
// API Route: GET /api/projects/[id]
export const GET = apiHandler(async (request, { params }) => {
  const { user, supabase } = await requireAuth(request);

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id) // Explicit ownership check
    .single();

  if (!project) {
    return apiError('NOT_FOUND', 'Project not found', 404);
  }

  return apiSuccess(project);
});
```

**Defense in Depth**: Middleware → API → RLS.

---

## Decisiones Relacionadas

- **ADR-006: Panel Separation** - Proyectos en `/dashboard/*` (user area)
- **ADR-008: Sistema de Corpus RAG** - Corpus personal asignable a proyectos
- **ADR-009: Vercel AI SDK** - Chat con agente en contexto de proyecto
- **ADR-002: Database Schema** - RLS policies base

---

## Referencias

- [Supabase RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Row Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- `docs/architecture/user-flows-navigation-v0.1.md` - Flujo de creación de proyecto
- `docs/database/schema-v2.md` - Schema completo

---

**Fecha de Decisión**: 2025-11-21
**Estado**: ✅ Aprobado
**Próximo ADR**: ADR-008 (Sistema de Corpus RAG)
