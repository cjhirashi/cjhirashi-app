# ADR-008: Sistema de Corpus RAG de 2 Niveles

**Fecha**: 2025-11-21
**Estado**: Aprobado
**Contexto**: CJHIRASHI APP v0.1
**Responsables**: ai-integration-specialist, architect (fase-2-arquitectura-leader)

---

## Contexto y Problema

Los agentes LLM necesitan contexto adicional más allá de su conocimiento pre-entrenado. ¿Cómo proveer contexto personalizado sin comprometer privacidad ni complejidad?

**Opciones consideradas**:
- **Opción A**: Corpus único (solo global, admin-managed)
- **Opción B**: Corpus de 2 niveles (Global + Personal)
- **Opción C**: Corpus de 3 niveles (Global + Org + Personal)

---

## Decisión

**Adoptamos Opción B: Sistema RAG de 2 Niveles**

### Modelo Confirmado

**Nivel 1: Corpus Global** (Admin-Managed)
- Admin crea corpus organizacional
- Admin asigna corpus a agentes específicos
- TODOS los usuarios de ese agente acceden al corpus global
- Uso: Conocimiento compartido (manuales, políticas, docs técnicos)

**Nivel 2: Corpus Personal** (User-Managed)
- Usuario crea corpus privado
- Usuario asigna corpus SOLO a agentes con `allows_personal_corpus = true`
- Solo ese usuario accede a su corpus personal
- Uso: Notas personales, datos sensibles, proyectos específicos

### Database Schema

```sql
-- Corpus (Global + Personal)
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

-- Asignación Corpus → Agentes
CREATE TABLE corpus_agent_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corpus_id UUID NOT NULL REFERENCES corpora(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(corpus_id, agent_id)
);

-- Documentos en Corpus
CREATE TABLE corpus_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corpus_id UUID NOT NULL REFERENCES corpora(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL, -- Supabase Storage
  file_size INTEGER,
  mime_type VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'indexed', 'failed'
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Embeddings (Metadata, vectores en Qdrant)
CREATE TABLE embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corpus_id UUID NOT NULL REFERENCES corpora(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES corpus_documents(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  qdrant_point_id UUID NOT NULL, -- ID del vector en Qdrant
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Justificación

### Ventajas de Opción B (Seleccionada)

✅ **Balance Conocimiento Compartido vs Privacidad**:
- Global: Conocimiento organizacional accesible a todos
- Personal: Privacidad garantizada para datos sensibles

✅ **Flexibilidad por Agente**:
- Flag `allows_personal_corpus` permite control granular
- Admin decide qué agentes permiten corpus personal

✅ **Simplicidad de Implementación**:
- Schema simple (1 tabla `corpora`, 2 tipos)
- RLS policies directas (tipo + owner)
- Sin complejidad organizacional

✅ **Escalabilidad**:
- Soporta crecimiento de usuarios sin cambios de schema
- Qdrant maneja millones de embeddings eficientemente

### Desventajas de Opciones Descartadas

❌ **Opción A (Solo Global)**:
- No soporta casos de uso personales
- Usuarios no pueden agregar su propio contexto
- Limita flexibilidad

❌ **Opción C (3 Niveles con Organizacional)**:
- Requiere concepto de "Organizaciones" (no existe en v0.1)
- Complejidad adicional (3 tipos de corpus)
- Overkill para MVP

---

## Flujo de RAG Retrieval

### Contexto de Chat con Agente

```
1. Usuario inicia chat en proyecto
   ↓
2. Sistema identifica corpus asignados al agente:
   - Corpus Global: Todos los corpus globales del agente
   - Corpus Personal: Corpus personales del usuario (si permite)
   ↓
3. User query → Embedding (OpenAI text-embedding-3-small)
   ↓
4. Semantic search en Qdrant:
   - Filters: agent_id, user_id (personal), corpus_type
   - Top-k chunks (k=10)
   - Score threshold (0.7)
   ↓
5. Context builder:
   [CORPUS GLOBAL]
   Manual de Estilo: "El primer capítulo debe..."

   [CORPUS PERSONAL]
   Mis Notas: "Mi protagonista es un científico..."
   ↓
6. Inject en system prompt del agente
   ↓
7. LLM genera respuesta con contexto enriquecido
   ↓
8. Streaming response al usuario
```

### Semantic Search Query (Qdrant)

```typescript
const searchResults = await qdrant.search('cjhirashi-embeddings-production', {
  vector: queryEmbedding,
  limit: 10,
  filter: {
    should: [
      // Corpus Global del agente
      {
        must: [
          { key: 'agent_id', match: { any: [agentId] } },
          { key: 'corpus_type', match: { value: 'global' } }
        ]
      },
      // Corpus Personal del usuario (si permite)
      {
        must: [
          { key: 'agent_id', match: { any: [agentId] } },
          { key: 'corpus_type', match: { value: 'personal' } },
          { key: 'user_id', match: { value: userId } }
        ]
      }
    ]
  },
  with_payload: true
});
```

---

## Document Processing Pipeline

```
Upload documento
   ↓
1. Validación (tipo, tamaño)
   ↓
2. Upload a Supabase Storage
   Bucket: corpus-documents
   ↓
3. Crear registro en DB
   Status: pending
   ↓
4. Background Worker (Document Processor)
   ↓
   4a. CHUNKING
       - Sliding window (800 tokens, overlap 100)
       - Output: Array de chunks
   ↓
   4b. EMBEDDING GENERATION
       - Modelo: text-embedding-3-small (1536 dims)
       - Batch processing (10 chunks/batch)
   ↓
   4c. INDEXACIÓN EN QDRANT
       - Colección: cjhirashi-embeddings-production
       - Payload: corpus_id, user_id, agent_id[], chunk_text
   ↓
   4d. GUARDAR METADATA EN DB
       - Tabla: embeddings
       - Link: qdrant_point_id
   ↓
5. Actualizar status: indexed
   ↓
Done ✅
```

---

## Restricción de Agentes (allows_personal_corpus)

### Campo Crítico

```sql
-- agents.allows_personal_corpus (BOOLEAN)
agents {
  allows_personal_corpus BOOLEAN DEFAULT false
}
```

### Lógica

**Si `true`**:
- User puede asignar corpus personal al agente
- Retrieval incluye: Global + Personal

**Si `false`**:
- User NO puede asignar corpus personal
- Retrieval SOLO incluye: Global

### Validación

**Frontend**:
```typescript
// Modal de asignación
const allowedAgents = agents.filter(a => a.allows_personal_corpus === true);

<Select>
  {allowedAgents.map(agent => (
    <SelectItem value={agent.id}>{agent.name}</SelectItem>
  ))}
</Select>
```

**Backend**:
```typescript
export async function assignPersonalCorpusToAgents(corpusId: string, agentIds: string[]) {
  // Validar que TODOS los agentes permiten corpus personal
  const { data: agents } = await supabase
    .from('agents')
    .select('id, allows_personal_corpus')
    .in('id', agentIds);

  const invalidAgents = agents.filter(a => !a.allows_personal_corpus);
  if (invalidAgents.length > 0) {
    throw new Error(`Agentes no permiten corpus personal: ${invalidAgents.map(a => a.id).join(', ')}`);
  }

  // Asignar
  await supabase.from('corpus_agent_assignments').insert(
    agentIds.map(agentId => ({ corpus_id: corpusId, agent_id: agentId }))
  );
}
```

---

## RLS Policies

### Corpus Global

```sql
-- Admin crea y gestiona
CREATE POLICY "Admin full access on global corpora" ON corpora
  FOR ALL USING (
    corpus_type = 'global' AND
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Users leen corpus global
CREATE POLICY "Users read global corpora" ON corpora
  FOR SELECT USING (corpus_type = 'global' AND is_active = true);
```

### Corpus Personal

```sql
-- User gestiona SUS corpus personales
CREATE POLICY "Users manage own personal corpora" ON corpora
  FOR ALL USING (
    corpus_type = 'personal' AND owner_user_id = auth.uid()
  );
```

---

## Impacto en el Sistema

### Componentes Nuevos

| Componente | Ubicación | Descripción |
|------------|-----------|-------------|
| Admin Corpus Pages | `app/admin/corpus/*` | CRUD corpus global |
| User Corpus Pages | `app/dashboard/corpus/*` | CRUD corpus personal |
| DocumentUploader | `components/corpus/DocumentUploader.tsx` | Upload de documentos |
| DocumentList | `components/corpus/DocumentList.tsx` | Listado de documentos |
| RAG Retrieval | `lib/rag/retrieval.ts` | Semantic search |
| Context Builder | `lib/rag/context-builder.ts` | Inyección de chunks |
| Chunking | `lib/rag/chunking.ts` | Document chunking |
| Embeddings | `lib/ai/embeddings.ts` | Generación de embeddings |
| Qdrant Client | `lib/qdrant/client.ts` | Cliente de Qdrant |

### Infraestructura Nueva

| Servicio | Propósito | Configuración |
|----------|-----------|---------------|
| Qdrant Cloud | Vector database | Collection: `cjhirashi-embeddings-production` |
| Supabase Storage | File storage | Bucket: `corpus-documents` |
| Background Workers | Document processing | Trigger: Upload documento |

### Environment Variables

```env
QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your_api_key
OPENAI_API_KEY=sk-... # Para embeddings
```

---

## Consideraciones de Performance

### Latency Targets

| Métrica | Target | Medición |
|---------|--------|----------|
| Retrieval Latency | < 500ms | Qdrant search time |
| Embedding Latency | < 200ms | OpenAI API time |
| Context Size | < 2000 tokens | Sum of chunks |
| Chunk Relevance | > 0.7 | Similarity score |

### Optimizaciones

1. **Caching de Embeddings**: Evitar regenerar para mismo documento
2. **Batch Processing**: Procesar chunks en lotes de 10
3. **Index en Qdrant**: HNSW config optimizado (`m=16`, `ef_construct=100`)

---

## Decisiones Relacionadas

- **ADR-009: Vercel AI SDK** - Integration con LLM para chat
- **ADR-010: Qdrant Strategy** - Vector database específico
- **ADR-007: Personal Projects** - Corpus personal en contexto de proyecto

---

## Referencias

- [Qdrant Documentation](https://qdrant.tech/documentation/)
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)
- [RAG Pattern (LangChain)](https://python.langchain.com/docs/use_cases/question_answering/)
- `docs/architecture/rag-architecture-v0.1.md` - Diseño técnico completo

---

**Fecha de Decisión**: 2025-11-21
**Estado**: ✅ Aprobado
**Próximo ADR**: ADR-009 (Vercel AI SDK Integration)
