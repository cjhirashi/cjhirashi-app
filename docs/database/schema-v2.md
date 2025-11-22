# Database Schema v0.1 - CJHIRASHI APP

**Versión**: v0.1
**Fecha**: 2025-11-21
**Responsable**: architect (fase-2-arquitectura-leader)
**ADR Relacionado**: ADR-007, ADR-008

---

## Visión General

CJHIRASHI APP v0.1 agrega **6 tablas nuevas** al schema existente:

**Base pre-v0.1 (Existente)**:
- `user_roles` (RBAC)
- `user_profiles` (Metadata)
- `audit_logs` (Auditoría)
- `system_settings` (Configuración)

**v0.1 (Nuevo)**:
- `agents` (Agentes inteligentes)
- `agent_models` (Modelos por agente: economy, balanced, premium)
- `projects` (Proyectos personales por usuario)
- `conversations` (Historial de chat con agentes)
- `corpora` (Corpus de conocimiento: Global + Personal)
- `agent_corpus_assignments` (Asignación de corpus a agentes)
- `corpus_documents` (Documentos dentro de corpus)
- `embeddings` (Embeddings de chunks, referencia a Qdrant)

**Total**: 12 tablas (6 base + 6 v0.1)

---

## 1. Tabla `agents`

**Descripción**: Agentes inteligentes configurables por admin.

**Schema SQL**:
```sql
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Metadata
  name VARCHAR(100) NOT NULL,
  description TEXT,
  specialization VARCHAR(100), -- 'Escritor', 'Analista', 'Investigador', etc.

  -- Configuración de modelos (DEPRECADA en favor de agent_models)
  -- Se mantiene por compatibilidad, pero usar agent_models
  default_model_provider VARCHAR(50), -- 'openai', 'anthropic', 'google'
  default_model_name VARCHAR(100), -- 'gpt-4o', 'claude-3.5-sonnet'

  -- Capacidades
  has_project_capability BOOLEAN DEFAULT false, -- Si puede gestionar proyectos
  project_type VARCHAR(50), -- 'Libro', 'Análisis', 'Investigación', etc.
  allows_global_corpus BOOLEAN DEFAULT false, -- Si usa corpus global
  allows_personal_corpus BOOLEAN DEFAULT false, -- Si acepta corpus personal

  -- Configuración adicional
  capabilities JSONB DEFAULT '{}', -- Capacidades extendidas (futuro)

  -- Ownership
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Estado
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_agents_active ON agents(is_active);
CREATE INDEX idx_agents_created_by ON agents(created_by);
CREATE INDEX idx_agents_project_type ON agents(project_type) WHERE project_type IS NOT NULL;

-- RLS Policies
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admin full access on agents" ON agents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Users read active agents
CREATE POLICY "Users read active agents" ON agents
  FOR SELECT USING (is_active = true);
```

**Campos Clave**:
- `has_project_capability`: Si el agente puede gestionar proyectos específicos
- `project_type`: Tipo de proyecto que gestiona (ej: "Libro" para Escritor)
- `allows_personal_corpus`: Si acepta corpus personales del usuario
- `allows_global_corpus`: Si usa corpus global asignado por admin

---

## 2. Tabla `agent_models`

**Descripción**: Modelos de LLM por agente (3 tiers: economy, balanced, premium).

**Schema SQL**:
```sql
CREATE TABLE agent_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relación con agente
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,

  -- Tier
  tier VARCHAR(20) NOT NULL CHECK (tier IN ('economy', 'balanced', 'premium')),

  -- Configuración del modelo
  model_provider VARCHAR(50) NOT NULL, -- 'openai', 'anthropic', 'google'
  model_name VARCHAR(100) NOT NULL, -- 'gpt-4o', 'claude-3.5-sonnet'

  -- Configuración de generación
  system_prompt TEXT NOT NULL,
  temperature DECIMAL(2,1) DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
  max_tokens INTEGER CHECK (max_tokens > 0),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint: Solo un modelo por tier por agente
  UNIQUE(agent_id, tier)
);

-- Indexes
CREATE INDEX idx_agent_models_agent ON agent_models(agent_id);
CREATE INDEX idx_agent_models_tier ON agent_models(tier);

-- RLS Policies
ALTER TABLE agent_models ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admin full access on agent_models" ON agent_models
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Users read models of active agents
CREATE POLICY "Users read active agent models" ON agent_models
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_models.agent_id
      AND agents.is_active = true
    )
  );
```

**Modelo de Tiers**:
- **Economy**: Modelo más económico (ej: GPT-4o Mini)
- **Balanced**: Modelo balanceado (ej: GPT-4o)
- **Premium**: Modelo premium (ej: Claude 3.5 Sonnet)

**Routing de Modelos** (según tier de usuario):
```typescript
// Ejemplo de routing
const modelsByUserTier = {
  free: ['economy'],
  pro: ['economy', 'balanced'],
  elite: ['economy', 'balanced', 'premium']
};
```

---

## 3. Tabla `projects`

**Descripción**: Proyectos personales por usuario.

**Schema SQL**:
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership (PERSONAL por usuario)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Relación con agente
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE RESTRICT,

  -- Metadata
  name VARCHAR(200) NOT NULL,
  description TEXT,

  -- Tipo heredado de agente
  project_type VARCHAR(50), -- Heredado de agents.project_type

  -- Estructura (JSON flexible)
  structure JSONB DEFAULT '{}', -- Estructura del proyecto (ej: capítulos de libro)
  metadata JSONB DEFAULT '{}', -- Metadata adicional

  -- Estado
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_projects_user ON projects(user_id);
CREATE INDEX idx_projects_agent ON projects(agent_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_user_status ON projects(user_id, status);

-- RLS Policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Users manage own projects
CREATE POLICY "Users manage own projects" ON projects
  FOR ALL USING (user_id = auth.uid());

-- Admin read all projects
CREATE POLICY "Admin read all projects" ON projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
```

**Modelo de Proyectos**:
- **Personal**: Cada proyecto pertenece a UN usuario (`user_id`)
- **NO compartidos**: Sin colaboración multi-usuario en v0.1
- **Tipo heredado**: `project_type` se copia de `agents.project_type`

---

## 4. Tabla `conversations`

**Descripción**: Historial de conversaciones con agentes.

**Schema SQL**:
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Relación con agente
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE RESTRICT,

  -- Relación opcional con proyecto
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,

  -- Metadata
  title VARCHAR(200), -- Título de conversación (generado o manual)

  -- Mensajes (JSONB array)
  messages JSONB[] DEFAULT '{}', -- Array de mensajes

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_conversations_user ON conversations(user_id);
CREATE INDEX idx_conversations_agent ON conversations(agent_id);
CREATE INDEX idx_conversations_project ON conversations(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX idx_conversations_updated ON conversations(updated_at DESC);

-- RLS Policies
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Users manage own conversations
CREATE POLICY "Users manage own conversations" ON conversations
  FOR ALL USING (user_id = auth.uid());

-- Admin read all conversations
CREATE POLICY "Admin read all conversations" ON conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
```

**Estructura de Mensaje** (JSONB):
```json
{
  "role": "user" | "assistant",
  "content": "texto del mensaje",
  "timestamp": "2025-11-21T10:30:00Z",
  "model_used": "gpt-4o",
  "tokens": 150,
  "context_used": ["chunk_id_1", "chunk_id_2"]
}
```

---

## 5. Tabla `corpora`

**Descripción**: Corpus de conocimiento (Global + Personal).

**Schema SQL**:
```sql
CREATE TABLE corpora (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Metadata
  name VARCHAR(200) NOT NULL,
  description TEXT,

  -- Tipo de corpus (2 niveles)
  corpus_type VARCHAR(20) NOT NULL CHECK (corpus_type IN ('global', 'personal')),

  -- Ownership
  created_by UUID NOT NULL REFERENCES auth.users(id),
  owner_user_id UUID REFERENCES auth.users(id), -- NULL si global, user_id si personal

  -- Relación opcional con proyecto
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,

  -- Tags (búsqueda y categorización)
  tags TEXT[] DEFAULT '{}',

  -- Estado
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint: Personal corpus DEBE tener owner_user_id
  CONSTRAINT check_personal_has_owner CHECK (
    (corpus_type = 'global' AND owner_user_id IS NULL) OR
    (corpus_type = 'personal' AND owner_user_id IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX idx_corpora_type ON corpora(corpus_type);
CREATE INDEX idx_corpora_owner ON corpora(owner_user_id) WHERE owner_user_id IS NOT NULL;
CREATE INDEX idx_corpora_project ON corpora(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX idx_corpora_active ON corpora(is_active);

-- RLS Policies
ALTER TABLE corpora ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admin full access on corpora" ON corpora
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Users read global corpora
CREATE POLICY "Users read global corpora" ON corpora
  FOR SELECT USING (corpus_type = 'global' AND is_active = true);

-- Users manage own personal corpora
CREATE POLICY "Users manage own personal corpora" ON corpora
  FOR ALL USING (
    corpus_type = 'personal' AND owner_user_id = auth.uid()
  );
```

**Modelo de 2 Niveles**:

**Corpus Global**:
- `corpus_type = 'global'`
- `owner_user_id = NULL`
- Admin crea y asigna a agentes
- Todos los usuarios que usan ese agente acceden al corpus

**Corpus Personal**:
- `corpus_type = 'personal'`
- `owner_user_id = UUID` (dueño del corpus)
- Usuario crea y asigna solo a agentes con `allows_personal_corpus = true`
- Solo el usuario dueño accede al corpus

---

## 6. Tabla `agent_corpus_assignments`

**Descripción**: Asignación de corpus a agentes.

**Schema SQL**:
```sql
CREATE TABLE agent_corpus_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relaciones
  corpus_id UUID NOT NULL REFERENCES corpora(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,

  -- Quién asignó
  assigned_by UUID NOT NULL REFERENCES auth.users(id),

  -- Tipo de asignación
  assignment_type VARCHAR(20) NOT NULL CHECK (assignment_type IN ('global', 'personal')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint: Solo una asignación de corpus por agente
  UNIQUE(agent_id, corpus_id)
);

-- Indexes
CREATE INDEX idx_assignments_corpus ON agent_corpus_assignments(corpus_id);
CREATE INDEX idx_assignments_agent ON agent_corpus_assignments(agent_id);
CREATE INDEX idx_assignments_type ON agent_corpus_assignments(assignment_type);

-- RLS Policies
ALTER TABLE agent_corpus_assignments ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admin full access on assignments" ON agent_corpus_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Users read assignments of accessible corpora
CREATE POLICY "Users read accessible assignments" ON agent_corpus_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM corpora
      WHERE corpora.id = agent_corpus_assignments.corpus_id
      AND (
        corpora.corpus_type = 'global' OR
        corpora.owner_user_id = auth.uid()
      )
    )
  );

-- Users create assignments for own personal corpora
CREATE POLICY "Users create own personal assignments" ON agent_corpus_assignments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM corpora
      WHERE corpora.id = agent_corpus_assignments.corpus_id
      AND corpora.corpus_type = 'personal'
      AND corpora.owner_user_id = auth.uid()
    )
    AND assigned_by = auth.uid()
  );
```

**Validación Crítica**:
```sql
-- Function para validar asignación personal a agente permitido
CREATE OR REPLACE FUNCTION validate_personal_corpus_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- Si es asignación personal, validar que agente permite corpus personal
  IF NEW.assignment_type = 'personal' THEN
    IF NOT EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = NEW.agent_id
      AND agents.allows_personal_corpus = true
    ) THEN
      RAISE EXCEPTION 'Agent does not allow personal corpus assignments';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_personal_assignment
BEFORE INSERT OR UPDATE ON agent_corpus_assignments
FOR EACH ROW
EXECUTE FUNCTION validate_personal_corpus_assignment();
```

---

## 7. Tabla `corpus_documents`

**Descripción**: Documentos dentro de un corpus.

**Schema SQL**:
```sql
CREATE TABLE corpus_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relación con corpus
  corpus_id UUID NOT NULL REFERENCES corpora(id) ON DELETE CASCADE,

  -- Metadata del archivo
  filename VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL, -- Supabase Storage URL
  file_size INTEGER, -- Bytes
  mime_type VARCHAR(100),

  -- Estado de procesamiento
  status VARCHAR(20) DEFAULT 'pending' CHECK (
    status IN ('pending', 'processing', 'indexed', 'failed')
  ),
  error_message TEXT, -- Si status = 'failed'

  -- Estadísticas
  total_chunks INTEGER, -- Total de chunks generados
  total_embeddings INTEGER, -- Total de embeddings generados

  -- Ownership
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_corpus_docs_corpus ON corpus_documents(corpus_id);
CREATE INDEX idx_corpus_docs_status ON corpus_documents(status);
CREATE INDEX idx_corpus_docs_uploaded_by ON corpus_documents(uploaded_by);

-- RLS Policies
ALTER TABLE corpus_documents ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admin full access on documents" ON corpus_documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Users read documents of accessible corpora
CREATE POLICY "Users read accessible documents" ON corpus_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM corpora
      WHERE corpora.id = corpus_documents.corpus_id
      AND (
        corpora.corpus_type = 'global' OR
        corpora.owner_user_id = auth.uid()
      )
    )
  );

-- Users manage documents of own corpora
CREATE POLICY "Users manage own corpus documents" ON corpus_documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM corpora
      WHERE corpora.id = corpus_documents.corpus_id
      AND corpora.owner_user_id = auth.uid()
    )
  );
```

---

## 8. Tabla `embeddings`

**Descripción**: Embeddings de chunks (referencia a Qdrant).

**Schema SQL**:
```sql
CREATE TABLE embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relaciones
  corpus_id UUID NOT NULL REFERENCES corpora(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES corpus_documents(id) ON DELETE CASCADE,

  -- Chunk data
  chunk_text TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,

  -- Referencia a Qdrant
  qdrant_point_id UUID NOT NULL UNIQUE, -- ID del vector en Qdrant
  qdrant_collection VARCHAR(100) DEFAULT 'cjhirashi-embeddings-production',

  -- Metadata adicional
  metadata JSONB DEFAULT '{}', -- Tags, context, etc.

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_embeddings_corpus ON embeddings(corpus_id);
CREATE INDEX idx_embeddings_document ON embeddings(document_id);
CREATE INDEX idx_embeddings_qdrant ON embeddings(qdrant_point_id);
CREATE INDEX idx_embeddings_collection ON embeddings(qdrant_collection);

-- RLS Policies
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admin full access on embeddings" ON embeddings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Users read embeddings of accessible corpora
CREATE POLICY "Users read accessible embeddings" ON embeddings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM corpora
      WHERE corpora.id = embeddings.corpus_id
      AND (
        corpora.corpus_type = 'global' OR
        corpora.owner_user_id = auth.uid()
      )
    )
  );
```

**Qdrant Collection Structure**:
```json
{
  "collection_name": "cjhirashi-embeddings-production",
  "vectors": {
    "size": 1536,
    "distance": "Cosine"
  },
  "payload_schema": {
    "corpus_id": "uuid",
    "document_id": "uuid",
    "user_id": "uuid | null",
    "corpus_type": "global | personal",
    "chunk_text": "string",
    "chunk_index": "integer",
    "metadata": "json"
  }
}
```

---

## Diagrama de Relaciones

```
auth.users (Supabase Auth)
  ├── 1:N → user_roles (v1.0)
  ├── 1:N → user_profiles (v1.0)
  ├── 1:N → agents (created_by)
  ├── 1:N → projects (owner)
  ├── 1:N → conversations (owner)
  ├── 1:N → corpora (owner para personal)
  └── 1:N → corpus_documents (uploader)

agents
  ├── 1:N → agent_models (3 tiers)
  ├── 1:N → projects (agente asignado)
  ├── 1:N → conversations (agente usado)
  └── N:M → corpora (via agent_corpus_assignments)

projects
  ├── N:1 → agents
  ├── N:1 → auth.users (owner)
  ├── 1:N → conversations
  └── 1:N → corpora (opcional)

corpora
  ├── N:M → agents (via agent_corpus_assignments)
  ├── 1:N → corpus_documents
  └── 1:N → embeddings

corpus_documents
  ├── N:1 → corpora
  └── 1:N → embeddings

embeddings
  ├── N:1 → corpora
  ├── N:1 → corpus_documents
  └── 1:1 → Qdrant Point (external)
```

---

## Migraciones Prisma

**Orden de Creación**:
1. `agents`
2. `agent_models`
3. `projects`
4. `conversations`
5. `corpora`
6. `agent_corpus_assignments`
7. `corpus_documents`
8. `embeddings`

**Comando**:
```bash
npx prisma migrate dev --name add-v2-schema
```

---

## Seed Data (Agentes Pre-configurados)

```sql
-- Seed: 3 agentes pre-configurados

-- Agente 1: Escritor de Libros
INSERT INTO agents (
  id,
  name,
  description,
  specialization,
  has_project_capability,
  project_type,
  allows_global_corpus,
  allows_personal_corpus,
  is_active
) VALUES (
  gen_random_uuid(),
  'Escritor de Libros',
  'Agente especializado en escritura creativa de libros, novelas y narrativa.',
  'Escritor Creativo',
  true,
  'Libro',
  true,
  true,
  true
) RETURNING id AS agent_id_1;

-- Modelos para Escritor de Libros
INSERT INTO agent_models (agent_id, tier, model_provider, model_name, system_prompt, temperature, max_tokens)
VALUES
  -- Economy
  ((SELECT id FROM agents WHERE name = 'Escritor de Libros'), 'economy', 'openai', 'gpt-4o-mini',
   'Eres un escritor creativo experto. Ayudas a usuarios a crear historias, novelas y narrativa de alta calidad.',
   0.8, 2000),
  -- Balanced
  ((SELECT id FROM agents WHERE name = 'Escritor de Libros'), 'balanced', 'openai', 'gpt-4o',
   'Eres un escritor creativo experto. Ayudas a usuarios a crear historias, novelas y narrativa de alta calidad.',
   0.8, 4000),
  -- Premium
  ((SELECT id FROM agents WHERE name = 'Escritor de Libros'), 'premium', 'anthropic', 'claude-3.5-sonnet-20241022',
   'Eres un escritor creativo experto. Ayudas a usuarios a crear historias, novelas y narrativa de alta calidad.',
   0.8, 8000);

-- Agente 2: Analista de Datos
INSERT INTO agents (
  id,
  name,
  description,
  specialization,
  has_project_capability,
  project_type,
  allows_global_corpus,
  allows_personal_corpus,
  is_active
) VALUES (
  gen_random_uuid(),
  'Analista de Datos',
  'Agente especializado en análisis cuantitativo, visualización y reportes.',
  'Análisis de Datos',
  true,
  'Análisis',
  true,
  true,
  true
);

-- Modelos para Analista de Datos
INSERT INTO agent_models (agent_id, tier, model_provider, model_name, system_prompt, temperature, max_tokens)
VALUES
  -- Economy
  ((SELECT id FROM agents WHERE name = 'Analista de Datos'), 'economy', 'openai', 'gpt-4o-mini',
   'Eres un analista de datos experto. Ayudas a interpretar datos, generar insights y crear reportes.',
   0.3, 2000),
  -- Balanced
  ((SELECT id FROM agents WHERE name = 'Analista de Datos'), 'balanced', 'openai', 'gpt-4o',
   'Eres un analista de datos experto. Ayudas a interpretar datos, generar insights y crear reportes.',
   0.3, 3000),
  -- Premium
  ((SELECT id FROM agents WHERE name = 'Analista de Datos'), 'premium', 'anthropic', 'claude-3.5-sonnet-20241022',
   'Eres un analista de datos experto. Ayudas a interpretar datos, generar insights y crear reportes.',
   0.3, 4000);

-- Agente 3: Investigador Técnico
INSERT INTO agents (
  id,
  name,
  description,
  specialization,
  has_project_capability,
  project_type,
  allows_global_corpus,
  allows_personal_corpus,
  is_active
) VALUES (
  gen_random_uuid(),
  'Investigador Técnico',
  'Agente especializado en investigación técnica, documentación y síntesis.',
  'Investigación Técnica',
  true,
  'Investigación',
  true,
  false, -- NO permite corpus personal
  true
);

-- Modelos para Investigador Técnico
INSERT INTO agent_models (agent_id, tier, model_provider, model_name, system_prompt, temperature, max_tokens)
VALUES
  -- Economy
  ((SELECT id FROM agents WHERE name = 'Investigador Técnico'), 'economy', 'openai', 'gpt-4o-mini',
   'Eres un investigador técnico riguroso. Ayudas a investigar temas complejos, sintetizar información y documentar hallazgos.',
   0.5, 2000),
  -- Balanced
  ((SELECT id FROM agents WHERE name = 'Investigador Técnico'), 'balanced', 'openai', 'gpt-4o',
   'Eres un investigador técnico riguroso. Ayudas a investigar temas complejos, sintetizar información y documentar hallazgos.',
   0.5, 3000),
  -- Premium
  ((SELECT id FROM agents WHERE name = 'Investigador Técnico'), 'premium', 'anthropic', 'claude-3.5-sonnet-20241022',
   'Eres un investigador técnico riguroso. Ayudas a investigar temas complejos, sintetizar información y documentar hallazgos.',
   0.5, 4000);
```

---

## Resumen de GAPs Cubiertos

| GAP ID | Descripción | Tabla/Componente |
|--------|-------------|------------------|
| GAP-002 | Tabla agents | `agents` + RLS |
| GAP-003 | Tabla agent_models | `agent_models` + RLS |
| GAP-004 | Tabla projects | `projects` + RLS |
| GAP-005 | Tabla conversations | `conversations` + RLS |
| GAP-006 | Tabla corpora | `corpora` + RLS + constraint |
| GAP-007 | Tabla agent_corpus_assignments | `agent_corpus_assignments` + RLS + trigger |
| GAP-008 | Tabla corpus_documents | `corpus_documents` + RLS |
| GAP-009 | Tabla embeddings | `embeddings` + RLS |
| GAP-010 | Seed data agentes | 3 agentes + 9 modelos |

**Cobertura**: 9 GAPs cubiertos (Database Schema completo)

---

**Fecha de Diseño**: 2025-11-21
**Responsable**: architect (fase-2-arquitectura-leader)
**Estado**: COMPLETO
**Próximo Paso**: Diseñar API Structure
