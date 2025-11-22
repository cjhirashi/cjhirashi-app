# Prisma Schema v0.1 - Tablas Nuevas

**Versión**: v0.1
**Fecha**: 2025-11-21
**Responsable**: database-designer (Fase 3)
**Tipo**: Diseño Detallado (Implementable)

---

## Visión General

Este documento define el Prisma schema COMPLETO para las 8 tablas nuevas de CJHIRASHI APP v0.1.

**IMPORTANTE**: Estas tablas se AGREGAN al schema existente (NO reemplazan). El schema actual (`prisma/schema.prisma`) contiene 4 tablas de `public` schema:
- `user_roles`
- `user_profiles`
- `audit_logs`
- `system_settings`

**Stack Confirmado**:
- PostgreSQL 15+ (Supabase)
- Prisma ORM 5.x
- NextJS 15+ App Router

---

## Schema Completo para v0.1

```prisma
// ============================================
// CJHIRASHI APP v0.1 - NUEVAS TABLAS
// Agregar al schema.prisma existente
// ============================================

// -------------------
// Tabla: agents
// -------------------
/// Agentes inteligentes configurables por admin
/// RLS: Admin full access, users read active agents
model agents {
  id   String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid

  // Metadata
  name           String  @db.VarChar(100)
  description    String?
  specialization String? @db.VarChar(100)

  // Configuración de modelos (DEPRECADA - usar agent_models)
  default_model_provider String? @db.VarChar(50)
  default_model_name     String? @db.VarChar(100)

  // Capacidades
  has_project_capability Boolean @default(false)
  project_type           String? @db.VarChar(50)
  allows_global_corpus   Boolean @default(false)
  allows_personal_corpus Boolean @default(false)

  // Configuración adicional
  capabilities Json? @default("{}")

  // Ownership
  created_by String? @db.Uuid
  created_by_user users? @relation("agents_created_by", fields: [created_by], references: [id], onDelete: SetNull, onUpdate: NoAction, map: "fk_agents_created_by")

  // Estado
  is_active Boolean @default(true)

  // Timestamps
  created_at DateTime @default(now()) @db.Timestamptz(6)
  updated_at DateTime @default(now()) @db.Timestamptz(6)

  // Relaciones
  agent_models              agent_models[]
  projects                  projects[]
  conversations             conversations[]
  agent_corpus_assignments  agent_corpus_assignments[]

  // Índices
  @@index([is_active], map: "idx_agents_active")
  @@index([created_by], map: "idx_agents_created_by")
  @@index([project_type], map: "idx_agents_project_type")

  @@schema("public")
}

// -------------------
// Tabla: agent_models
// -------------------
/// Modelos de LLM por agente (3 tiers: economy, balanced, premium)
/// RLS: Admin full access, users read models of active agents
model agent_models {
  id String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid

  // Relación con agente
  agent_id String  @db.Uuid
  agent    agents  @relation(fields: [agent_id], references: [id], onDelete: Cascade, onUpdate: NoAction, map: "fk_agent_models_agent_id")

  // Tier
  tier agent_model_tier

  // Configuración del modelo
  model_provider String @db.VarChar(50)
  model_name     String @db.VarChar(100)

  // Configuración de generación
  system_prompt String
  temperature   Decimal? @default(0.7) @db.Decimal(2, 1)
  max_tokens    Int?

  // Timestamps
  created_at DateTime @default(now()) @db.Timestamptz(6)

  // Constraint: Solo un modelo por tier por agente
  @@unique([agent_id, tier], map: "unique_agent_tier")

  // Índices
  @@index([agent_id], map: "idx_agent_models_agent")
  @@index([tier], map: "idx_agent_models_tier")

  @@schema("public")
}

// -------------------
// Tabla: projects
// -------------------
/// Proyectos personales por usuario
/// RLS: Users manage own projects, admin read all
model projects {
  id String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid

  // Ownership (PERSONAL por usuario)
  user_id String @db.Uuid
  user    users  @relation("projects_user", fields: [user_id], references: [id], onDelete: Cascade, onUpdate: NoAction, map: "fk_projects_user_id")

  // Relación con agente
  agent_id String @db.Uuid
  agent    agents @relation(fields: [agent_id], references: [id], onDelete: Restrict, onUpdate: NoAction, map: "fk_projects_agent_id")

  // Metadata
  name        String  @db.VarChar(200)
  description String?

  // Tipo heredado de agente
  project_type String? @db.VarChar(50)

  // Estructura (JSON flexible)
  structure Json? @default("{}")
  metadata  Json? @default("{}")

  // Estado
  status project_status @default(active)

  // Timestamps
  created_at DateTime @default(now()) @db.Timestamptz(6)
  updated_at DateTime @default(now()) @db.Timestamptz(6)

  // Relaciones
  conversations conversations[]
  corpora       corpora[]

  // Índices
  @@index([user_id], map: "idx_projects_user")
  @@index([agent_id], map: "idx_projects_agent")
  @@index([status], map: "idx_projects_status")
  @@index([user_id, status], map: "idx_projects_user_status")

  @@schema("public")
}

// -------------------
// Tabla: conversations
// -------------------
/// Historial de conversaciones con agentes
/// RLS: Users manage own conversations, admin read all
model conversations {
  id String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid

  // Ownership
  user_id String @db.Uuid
  user    users  @relation("conversations_user", fields: [user_id], references: [id], onDelete: Cascade, onUpdate: NoAction, map: "fk_conversations_user_id")

  // Relación con agente
  agent_id String @db.Uuid
  agent    agents @relation(fields: [agent_id], references: [id], onDelete: Restrict, onUpdate: NoAction, map: "fk_conversations_agent_id")

  // Relación opcional con proyecto
  project_id String?   @db.Uuid
  project    projects? @relation(fields: [project_id], references: [id], onDelete: SetNull, onUpdate: NoAction, map: "fk_conversations_project_id")

  // Metadata
  title String? @db.VarChar(200)

  // Mensajes (JSONB array)
  messages Json[] @default([])

  // Timestamps
  created_at DateTime @default(now()) @db.Timestamptz(6)
  updated_at DateTime @default(now()) @db.Timestamptz(6)

  // Índices
  @@index([user_id], map: "idx_conversations_user")
  @@index([agent_id], map: "idx_conversations_agent")
  @@index([project_id], map: "idx_conversations_project")
  @@index([updated_at(sort: Desc)], map: "idx_conversations_updated")

  @@schema("public")
}

// -------------------
// Tabla: corpora
// -------------------
/// Corpus de conocimiento (Global + Personal)
/// RLS: Complex policies for global vs personal corpus
model corpora {
  id String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid

  // Metadata
  name        String  @db.VarChar(200)
  description String?

  // Tipo de corpus (2 niveles)
  corpus_type corpus_type

  // Ownership
  created_by     String  @db.Uuid
  created_by_user users  @relation("corpora_created_by", fields: [created_by], references: [id], onDelete: NoAction, onUpdate: NoAction, map: "fk_corpora_created_by")

  owner_user_id  String? @db.Uuid
  owner_user     users?  @relation("corpora_owner", fields: [owner_user_id], references: [id], onDelete: NoAction, onUpdate: NoAction, map: "fk_corpora_owner_user_id")

  // Relación opcional con proyecto
  project_id String?   @db.Uuid
  project    projects? @relation(fields: [project_id], references: [id], onDelete: SetNull, onUpdate: NoAction, map: "fk_corpora_project_id")

  // Tags (búsqueda y categorización)
  tags String[] @default([])

  // Estado
  is_active Boolean @default(true)

  // Timestamps
  created_at DateTime @default(now()) @db.Timestamptz(6)
  updated_at DateTime @default(now()) @db.Timestamptz(6)

  // Relaciones
  agent_corpus_assignments agent_corpus_assignments[]
  corpus_documents         corpus_documents[]
  embeddings               embeddings[]

  // Índices
  @@index([corpus_type], map: "idx_corpora_type")
  @@index([owner_user_id], map: "idx_corpora_owner")
  @@index([project_id], map: "idx_corpora_project")
  @@index([is_active], map: "idx_corpora_active")

  @@schema("public")
}

// -------------------
// Tabla: agent_corpus_assignments
// -------------------
/// Asignación de corpus a agentes
/// RLS: Admin full access, users read accessible assignments
model agent_corpus_assignments {
  id String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid

  // Relaciones
  corpus_id String  @db.Uuid
  corpus    corpora @relation(fields: [corpus_id], references: [id], onDelete: Cascade, onUpdate: NoAction, map: "fk_assignments_corpus_id")

  agent_id String @db.Uuid
  agent    agents @relation(fields: [agent_id], references: [id], onDelete: Cascade, onUpdate: NoAction, map: "fk_assignments_agent_id")

  // Quién asignó
  assigned_by      String @db.Uuid
  assigned_by_user users  @relation("assignments_assigned_by", fields: [assigned_by], references: [id], onDelete: NoAction, onUpdate: NoAction, map: "fk_assignments_assigned_by")

  // Tipo de asignación
  assignment_type assignment_type

  // Timestamps
  created_at DateTime @default(now()) @db.Timestamptz(6)

  // Constraint: Solo una asignación de corpus por agente
  @@unique([agent_id, corpus_id], map: "unique_agent_corpus")

  // Índices
  @@index([corpus_id], map: "idx_assignments_corpus")
  @@index([agent_id], map: "idx_assignments_agent")
  @@index([assignment_type], map: "idx_assignments_type")

  @@schema("public")
}

// -------------------
// Tabla: corpus_documents
// -------------------
/// Documentos dentro de un corpus
/// RLS: Users manage documents of own corpora, admin full access
model corpus_documents {
  id String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid

  // Relación con corpus
  corpus_id String  @db.Uuid
  corpus    corpora @relation(fields: [corpus_id], references: [id], onDelete: Cascade, onUpdate: NoAction, map: "fk_corpus_docs_corpus_id")

  // Metadata del archivo
  filename  String  @db.VarChar(255)
  file_url  String
  file_size Int?
  mime_type String? @db.VarChar(100)

  // Estado de procesamiento
  status        document_status @default(pending)
  error_message String?

  // Estadísticas
  total_chunks     Int?
  total_embeddings Int?

  // Ownership
  uploaded_by      String @db.Uuid
  uploaded_by_user users  @relation("corpus_docs_uploaded_by", fields: [uploaded_by], references: [id], onDelete: NoAction, onUpdate: NoAction, map: "fk_corpus_docs_uploaded_by")

  // Timestamps
  created_at DateTime @default(now()) @db.Timestamptz(6)
  updated_at DateTime @default(now()) @db.Timestamptz(6)

  // Relaciones
  embeddings embeddings[]

  // Índices
  @@index([corpus_id], map: "idx_corpus_docs_corpus")
  @@index([status], map: "idx_corpus_docs_status")
  @@index([uploaded_by], map: "idx_corpus_docs_uploaded_by")

  @@schema("public")
}

// -------------------
// Tabla: embeddings
// -------------------
/// Embeddings de chunks (referencia a Qdrant)
/// RLS: Users read embeddings of accessible corpora, admin full access
model embeddings {
  id String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid

  // Relaciones
  corpus_id String  @db.Uuid
  corpus    corpora @relation(fields: [corpus_id], references: [id], onDelete: Cascade, onUpdate: NoAction, map: "fk_embeddings_corpus_id")

  document_id       String           @db.Uuid
  document          corpus_documents @relation(fields: [document_id], references: [id], onDelete: Cascade, onUpdate: NoAction, map: "fk_embeddings_document_id")

  // Chunk data
  chunk_text  String
  chunk_index Int

  // Referencia a Qdrant
  qdrant_point_id  String @unique @db.Uuid
  qdrant_collection String @default("cjhirashi-embeddings-production") @db.VarChar(100)

  // Metadata adicional
  metadata Json? @default("{}")

  // Timestamps
  created_at DateTime @default(now()) @db.Timestamptz(6)

  // Índices
  @@index([corpus_id], map: "idx_embeddings_corpus")
  @@index([document_id], map: "idx_embeddings_document")
  @@index([qdrant_point_id], map: "idx_embeddings_qdrant")
  @@index([qdrant_collection], map: "idx_embeddings_collection")

  @@schema("public")
}

// ============================================
// ENUMS NUEVOS
// ============================================

enum agent_model_tier {
  economy
  balanced
  premium

  @@schema("public")
}

enum project_status {
  active
  archived
  completed

  @@schema("public")
}

enum corpus_type {
  global
  personal

  @@schema("public")
}

enum assignment_type {
  global
  personal

  @@schema("public")
}

enum document_status {
  pending
  processing
  indexed
  failed

  @@schema("public")
}
```

---

## Relaciones Clave

### Relaciones de Ownership

**`agents.created_by` → `auth.users.id`**:
- Quién creó el agente (admin)
- ON DELETE SET NULL (si admin se elimina, agente persiste)

**`projects.user_id` → `auth.users.id`**:
- Dueño del proyecto (usuario regular)
- ON DELETE CASCADE (si usuario se elimina, proyecto se elimina)

**`conversations.user_id` → `auth.users.id`**:
- Dueño de la conversación
- ON DELETE CASCADE

**`corpora.owner_user_id` → `auth.users.id`**:
- Dueño del corpus personal (NULL si global)
- ON DELETE NO ACTION (protegido)

### Relaciones de Asignación

**`projects.agent_id` → `agents.id`**:
- Agente asignado al proyecto
- ON DELETE RESTRICT (no se puede eliminar agente si tiene proyectos)

**`conversations.agent_id` → `agents.id`**:
- Agente usado en conversación
- ON DELETE RESTRICT

**`agent_corpus_assignments.corpus_id` → `corpora.id`**:
- Corpus asignado a agente
- ON DELETE CASCADE

**`agent_corpus_assignments.agent_id` → `agents.id`**:
- Agente al que se asigna corpus
- ON DELETE CASCADE

### Relaciones de Contenido

**`agent_models.agent_id` → `agents.id`**:
- Modelos configurados para agente (3 tiers)
- ON DELETE CASCADE

**`corpus_documents.corpus_id` → `corpora.id`**:
- Documentos dentro de un corpus
- ON DELETE CASCADE

**`embeddings.corpus_id` → `corpora.id`**:
- Embeddings pertenecen a un corpus
- ON DELETE CASCADE

**`embeddings.document_id` → `corpus_documents.id`**:
- Embeddings generados de un documento
- ON DELETE CASCADE

---

## Índices Optimizados

### Índices para Queries Frecuentes

**Agentes Activos** (user query):
```sql
-- idx_agents_active
SELECT * FROM agents WHERE is_active = true;
```

**Proyectos del Usuario** (dashboard query):
```sql
-- idx_projects_user_status
SELECT * FROM projects WHERE user_id = ? AND status = 'active';
```

**Conversaciones Recientes** (chat query):
```sql
-- idx_conversations_updated
SELECT * FROM conversations WHERE user_id = ? ORDER BY updated_at DESC LIMIT 10;
```

**Corpus Asignados a Agente** (RAG query):
```sql
-- idx_assignments_agent
SELECT corpus_id FROM agent_corpus_assignments WHERE agent_id = ?;
```

**Embeddings de Corpus** (RAG retrieval):
```sql
-- idx_embeddings_corpus
SELECT * FROM embeddings WHERE corpus_id IN (...);
```

### Índices Compuestos

**`idx_projects_user_status`**: Optimiza dashboard query
```sql
CREATE INDEX idx_projects_user_status ON projects(user_id, status);
```

**`idx_user_id_created_at_idx`**: Optimiza listados ordenados
```sql
-- Reutilizado de tabla existente users (Supabase Auth)
```

---

## Constraints Críticos

### Constraints de Negocio

**`unique_agent_tier`**:
- Solo UN modelo por tier por agente
- Garantiza que cada agente tenga máximo 1 modelo economy, 1 balanced, 1 premium

**`unique_agent_corpus`**:
- Solo UNA asignación de corpus por agente
- Previene duplicados

### Constraints de Validación (Implementados en RLS)

**Corpus Personal DEBE tener owner_user_id**:
```sql
-- Constraint implementado en RLS policy
CHECK (
  (corpus_type = 'global' AND owner_user_id IS NULL) OR
  (corpus_type = 'personal' AND owner_user_id IS NOT NULL)
)
```

**Corpus Personal solo asignable a agentes permitidos**:
```sql
-- Constraint implementado en trigger (ver SQL migrations)
-- Valida que agent.allows_personal_corpus = true
```

---

## Extensión del Schema Existente

El schema actual (`prisma/schema.prisma`) ya contiene:

1. **auth schema completo** (Supabase Auth - NO modificar)
2. **public schema** con 4 tablas:
   - `audit_logs` (RLS enabled)
   - `system_settings` (RLS enabled)
   - `user_profiles` (RLS enabled)
   - `user_roles` (RLS enabled)

**Las 8 tablas nuevas se AGREGAN al `public` schema**:
- `agents`
- `agent_models`
- `projects`
- `conversations`
- `corpora`
- `agent_corpus_assignments`
- `corpus_documents`
- `embeddings`

**Total de tablas en `public` después de v0.1**: 12 tablas (4 existentes + 8 nuevas)

---

## Migración Estrategia

### Orden de Creación de Tablas

```sql
-- Paso 1: Crear enums nuevos
CREATE TYPE agent_model_tier AS ENUM ('economy', 'balanced', 'premium');
CREATE TYPE project_status AS ENUM ('active', 'archived', 'completed');
CREATE TYPE corpus_type AS ENUM ('global', 'personal');
CREATE TYPE assignment_type AS ENUM ('global', 'personal');
CREATE TYPE document_status AS ENUM ('pending', 'processing', 'indexed', 'failed');

-- Paso 2: Crear tabla base (sin dependencias)
CREATE TABLE agents (...);

-- Paso 3: Crear tablas dependientes
CREATE TABLE agent_models (...); -- depende de agents
CREATE TABLE projects (...); -- depende de agents, auth.users
CREATE TABLE conversations (...); -- depende de agents, projects, auth.users
CREATE TABLE corpora (...); -- depende de projects, auth.users
CREATE TABLE agent_corpus_assignments (...); -- depende de agents, corpora
CREATE TABLE corpus_documents (...); -- depende de corpora
CREATE TABLE embeddings (...); -- depende de corpora, corpus_documents
```

### Comando Prisma

```bash
# Generar migration
npx prisma migrate dev --name add-v0.1-schema

# Aplicar migration
npx prisma migrate deploy

# Generar Prisma Client
npx prisma generate
```

---

## Próximos Pasos

1. **SQL migrations para RLS policies** → Ver `database-rls-policies-v0.1.sql`
2. **Seed data para agentes** → Ver `database-seed-v0.1.sql`
3. **Validación con design-validator** → Verificar coherencia del schema

---

**Fecha de Diseño**: 2025-11-21
**Responsable**: database-designer (Fase 3)
**Estado**: COMPLETO
**Próximo Paso**: Generar SQL migrations para RLS policies
