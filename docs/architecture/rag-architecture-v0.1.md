# RAG Architecture - CJHIRASHI APP v0.1

**Versión**: v0.1
**Fecha**: 2025-11-21
**Responsable**: ai-integration-specialist (via architect, fase-2-arquitectura-leader)
**ADR Relacionado**: ADR-008, ADR-010

---

## Visión General

CJHIRASHI APP v0.1 implementa un sistema de **Retrieval-Augmented Generation (RAG)** de 2 niveles que permite enriquecer respuestas de agentes con contexto personalizado.

**Modelo Confirmado**:
- **Corpus Global**: Conocimiento organizacional compartido (admin-managed)
- **Corpus Personal**: Conocimiento privado del usuario (user-managed)

**Objetivo**: Proveer contexto relevante a agentes LLM para respuestas más precisas y especializadas.

---

## 1. Arquitectura de Alto Nivel

### 1.1 Componentes del Sistema RAG

```
┌──────────────────────────────────────────────────────────────┐
│                      Usuario (Chat)                          │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ↓
┌──────────────────────────────────────────────────────────────┐
│              Chat Endpoint (/api/agents/[id]/chat)           │
│  - Recibe query del usuario                                  │
│  - Identifica proyecto y agente                              │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ↓
┌──────────────────────────────────────────────────────────────┐
│                  RAG Retrieval Layer                         │
│  1. Identifica corpus asignados al agente                    │
│  2. Semantic search en Qdrant (query embedding)              │
│  3. Top-k chunks relevantes (global + personal)              │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ↓
┌──────────────────────────────────────────────────────────────┐
│                  Context Builder                             │
│  - Inyecta chunks en system prompt                           │
│  - Estructura: [Contexto Global] + [Contexto Personal]       │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ↓
┌──────────────────────────────────────────────────────────────┐
│                  LLM (Vercel AI SDK)                         │
│  - Genera respuesta con contexto enriquecido                 │
│  - Streaming response (SSE)                                  │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ↓
┌──────────────────────────────────────────────────────────────┐
│              Response (Streaming al Usuario)                 │
└──────────────────────────────────────────────────────────────┘
```

### 1.2 Data Stores

| Store | Tecnología | Propósito | Datos Almacenados |
|-------|------------|-----------|-------------------|
| **PostgreSQL** (Supabase) | Relational DB | Metadata de corpus, documentos, asignaciones | Tablas: `corpora`, `corpus_documents`, `embeddings`, `corpus_agent_assignments` |
| **Qdrant Cloud** | Vector DB | Búsqueda semántica de chunks | Vectores embeddings (1536-dim) |
| **Supabase Storage** | Object Storage | Archivos originales | PDFs, TXTs, MDs, DOCXs |

---

## 2. Modelo de Corpus de 2 Niveles

### 2.1 Corpus Global (Admin-Managed)

**Propósito**: Conocimiento organizacional compartido entre todos los usuarios de un agente.

**Casos de Uso**:
- Manual de estilo corporativo (para agente "Escritor")
- Base de datos de conocimiento técnico (para agente "Investigador")
- Políticas y procedimientos (para agente "Asistente Corporativo")

**Lifecycle**:
1. **Creación**: Admin crea corpus en `/admin/corpus/new`
   - Nombre: "Manual de Estilo Corporativo"
   - Tipo: `global`
   - `owner_user_id`: NULL
2. **Asignación**: Admin asigna corpus a agentes específicos
   - Tabla: `corpus_agent_assignments`
   - Ej: Asignar a "Escritor de Libros" y "Editor Técnico"
3. **Upload**: Admin sube documentos (PDFs, TXTs)
   - Tabla: `corpus_documents`
   - File storage: Supabase Storage
4. **Procesamiento**: Pipeline automático
   - Chunking → Embeddings → Indexación en Qdrant
   - Status: `pending` → `processing` → `indexed`
5. **Retrieval**: TODOS los usuarios que usen esos agentes acceden al corpus

**RLS Policy**:
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

---

### 2.2 Corpus Personal (User-Managed)

**Propósito**: Conocimiento privado del usuario para proyectos específicos.

**Casos de Uso**:
- Notas personales de investigación
- Datos sensibles del proyecto
- Documentación interna del usuario
- Borradores de trabajo

**Lifecycle**:
1. **Creación**: User crea corpus en `/dashboard/corpus/new`
   - Nombre: "Mis Notas de Proyecto X"
   - Tipo: `personal`
   - `owner_user_id`: `auth.uid()`
2. **Asignación**: User asigna corpus SOLO a agentes con `allows_personal_corpus = true`
   - Validación frontend: Dropdown solo muestra agentes permitidos
   - Validación backend: Doble check antes de asignar
3. **Upload**: User sube documentos
   - Solo él puede ver sus documentos
4. **Procesamiento**: Pipeline automático (mismo que global)
5. **Retrieval**: Solo ese usuario accede al corpus en sus chats

**RLS Policy**:
```sql
-- User gestiona SUS corpus personales
CREATE POLICY "Users manage own personal corpora" ON corpora
  FOR ALL USING (
    corpus_type = 'personal' AND owner_user_id = auth.uid()
  );
```

---

### 2.3 Restricción de Agentes

**Campo crítico**: `agents.allows_personal_corpus` (BOOLEAN)

**Lógica**:
- Si `allows_personal_corpus = true`:
  - User puede asignar corpus personal al agente
  - Retrieval incluye corpus global + personal
- Si `allows_personal_corpus = false`:
  - User NO puede asignar corpus personal
  - Retrieval SOLO incluye corpus global

**Ejemplo**:
```sql
-- Agente "Escritor de Libros"
allows_personal_corpus = true
→ User puede asignar "Mis Notas de Novela"

-- Agente "Investigador Técnico"
allows_personal_corpus = false
→ User NO puede asignar corpus personal (solo usa corpus global)
```

**Razón**: Algunos agentes deben tener conocimiento estrictamente controlado (ej: agentes de compliance).

---

## 3. Document Processing Pipeline

### 3.1 Upload Flow

```
User uploads document
        ↓
POST /api/corpus/{id}/documents
        ↓
1. Validación de archivo
   - Tipo: PDF, TXT, MD, DOCX
   - Tamaño: < 10MB
        ↓
2. Upload a Supabase Storage
   - Bucket: `corpus-documents`
   - Path: `{corpus_id}/{document_id}/{filename}`
        ↓
3. Crear registro en DB
   - Tabla: `corpus_documents`
   - Status: `pending`
   - File URL: Supabase Storage URL
        ↓
4. Trigger background job
   - Queue: Document Processor Worker
```

### 3.2 Processing Pipeline (Background)

```
Document Processor Worker
        ↓
1. Download documento de Supabase Storage
        ↓
2. CHUNKING
   - Estrategia: Sliding window
   - Tamaño: 500-1000 tokens/chunk
   - Overlap: 100 tokens (para contexto)
   - Algoritmo: TextSplitter (LangChain o custom)
        ↓
   Output: Array de chunks
   Ejemplo: [chunk_0, chunk_1, chunk_2, ...]
        ↓
3. EMBEDDING GENERATION
   - Modelo: OpenAI `text-embedding-3-small` (1536 dims)
   - API: Vercel AI SDK
   - Batch: Procesar chunks en lotes de 10
        ↓
   Output: Array de embeddings
   [embedding_0, embedding_1, ...]
        ↓
4. INDEXACIÓN EN QDRANT
   - Colección: `cjhirashi-embeddings-production`
   - Punto (point) por chunk:
     {
       id: UUID (qdrant_point_id),
       vector: embedding (1536-dim array),
       payload: {
         corpus_id: UUID,
         document_id: UUID,
         user_id: UUID (NULL si global, user_id si personal),
         agent_id: UUID[] (agentes asignados),
         chunk_text: string,
         chunk_index: int,
         corpus_type: 'global' | 'personal'
       }
     }
        ↓
5. GUARDAR METADATA EN DB
   - Tabla: `embeddings`
   - Campos:
     - corpus_id
     - document_id
     - chunk_text
     - chunk_index
     - qdrant_point_id (link a Qdrant)
        ↓
6. ACTUALIZAR STATUS
   - `corpus_documents.status = 'indexed'`
   - Update timestamp
        ↓
Done ✅
```

### 3.3 Chunking Strategy

**Objetivo**: Balance entre contexto y precisión.

**Configuración**:
```typescript
const CHUNK_SIZE = 800; // tokens (~3000 chars)
const CHUNK_OVERLAP = 100; // tokens (~400 chars)
```

**Algoritmo**:
```typescript
// lib/rag/chunking.ts
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

export async function chunkDocument(
  documentText: string,
  options?: ChunkOptions
): Promise<Chunk[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: options?.chunkSize || 800,
    chunkOverlap: options?.chunkOverlap || 100,
    separators: ['\n\n', '\n', '. ', ' ', '']
  });

  const chunks = await splitter.splitText(documentText);

  return chunks.map((text, index) => ({
    chunk_text: text,
    chunk_index: index
  }));
}
```

**Ejemplo de Chunking**:
```
Documento Original (5000 chars):
"Capítulo 1: Introducción al espacio exterior...
[3000 chars más]
...las estrellas brillan intensamente."

↓ Chunking ↓

Chunk 0 (800 tokens):
"Capítulo 1: Introducción al espacio exterior...
...primeras exploraciones fueron difíciles."

Chunk 1 (800 tokens, overlap 100):
"...primeras exploraciones fueron difíciles.   <-- OVERLAP
Las naves espaciales modernas...
...la tecnología avanzó rápidamente."

Chunk 2 (800 tokens, overlap 100):
"...la tecnología avanzó rápidamente.         <-- OVERLAP
Hoy en día...
...las estrellas brillan intensamente."
```

**Beneficio del Overlap**: Preserva contexto entre chunks contiguos.

---

## 4. Semantic Search (Retrieval)

### 4.1 Qdrant Collection Schema

**Collection**: `cjhirashi-embeddings-production`

**Configuración**:
```json
{
  "name": "cjhirashi-embeddings-production",
  "vector_size": 1536,
  "distance": "Cosine",
  "payload_schema": {
    "corpus_id": "uuid",
    "document_id": "uuid",
    "user_id": "uuid | null",
    "agent_id": "keyword[]",
    "chunk_text": "text",
    "chunk_index": "integer",
    "corpus_type": "keyword"
  },
  "hnsw_config": {
    "m": 16,
    "ef_construct": 100
  }
}
```

**Índices**:
- `corpus_id`: Para filtrar por corpus
- `user_id`: Para filtrar corpus personales
- `agent_id`: Para filtrar por agente
- `corpus_type`: Para filtrar global vs personal

---

### 4.2 Retrieval Logic

**Input**:
- User query: "¿Cómo estructuro el primer capítulo?"
- Agent ID: `uuid-agent-escritor`
- User ID: `uuid-current-user`

**Steps**:

**1. Identificar Corpus Asignados al Agente**:
```sql
-- Corpus Global asignados al agente
SELECT c.id, c.name, c.corpus_type
FROM corpora c
JOIN corpus_agent_assignments caa ON c.id = caa.corpus_id
WHERE caa.agent_id = {agentId}
  AND c.corpus_type = 'global'
  AND c.is_active = true;

-- Corpus Personal del usuario asignados al agente (si permite)
SELECT c.id, c.name, c.corpus_type
FROM corpora c
JOIN corpus_agent_assignments caa ON c.id = caa.corpus_id
WHERE caa.agent_id = {agentId}
  AND c.corpus_type = 'personal'
  AND c.owner_user_id = {userId}
  AND c.is_active = true
  AND EXISTS (
    SELECT 1 FROM agents
    WHERE id = {agentId} AND allows_personal_corpus = true
  );
```

**2. Generar Embedding del Query**:
```typescript
import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';

const { embedding: queryEmbedding } = await embed({
  model: openai.embedding('text-embedding-3-small'),
  value: userQuery
});
```

**3. Semantic Search en Qdrant**:
```typescript
import { QdrantClient } from '@qdrant/js-client-rest';

const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY
});

const searchResults = await qdrant.search('cjhirashi-embeddings-production', {
  vector: queryEmbedding,
  limit: 10, // Top-10 chunks
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

**4. Extraer Top-K Chunks**:
```typescript
const relevantChunks = searchResults.map(result => ({
  chunk_text: result.payload.chunk_text,
  corpus_type: result.payload.corpus_type,
  score: result.score // Similarity score (0-1)
}));

// Filtrar por threshold (ej: score > 0.7)
const filteredChunks = relevantChunks.filter(c => c.score > 0.7);
```

**Output**:
```json
[
  {
    "chunk_text": "El primer capítulo debe establecer el tono...",
    "corpus_type": "global",
    "score": 0.89
  },
  {
    "chunk_text": "Mi protagonista es un científico en una estación espacial...",
    "corpus_type": "personal",
    "score": 0.85
  }
]
```

---

### 4.3 Context Builder

**Objetivo**: Inyectar chunks relevantes en system prompt del agente.

**Estructura del Prompt**:
```
{SYSTEM_PROMPT del agente}

---

CONTEXTO RELEVANTE:

[CORPUS GLOBAL]
Manual de Estilo Corporativo:
"El primer capítulo debe establecer el tono y presentar el protagonista de manera memorable. Evita info-dumps y comienza con acción."

[CORPUS PERSONAL]
Mis Notas de Novela:
"Mi protagonista es el Dr. Alex Chen, un científico en la Estación Orbital Kepler. La historia comienza con un fallo en el sistema de soporte vital."

---

INSTRUCCIONES:
Responde la pregunta del usuario usando el contexto relevante provisto. Si el contexto no es suficiente, usa tu conocimiento general pero menciona la limitación.

---

USER QUERY:
¿Cómo estructuro el primer capítulo?
```

**Implementación**:
```typescript
// lib/rag/context-builder.ts
export function buildContextPrompt(
  systemPrompt: string,
  chunks: RelevantChunk[],
  userQuery: string
): string {
  const globalChunks = chunks.filter(c => c.corpus_type === 'global');
  const personalChunks = chunks.filter(c => c.corpus_type === 'personal');

  let contextSection = '\n---\n\nCONTEXTO RELEVANTE:\n\n';

  if (globalChunks.length > 0) {
    contextSection += '[CORPUS GLOBAL]\n';
    globalChunks.forEach(chunk => {
      contextSection += `${chunk.chunk_text}\n\n`;
    });
  }

  if (personalChunks.length > 0) {
    contextSection += '[CORPUS PERSONAL]\n';
    personalChunks.forEach(chunk => {
      contextSection += `${chunk.chunk_text}\n\n`;
    });
  }

  contextSection += '---\n\nINSTRUCCIONES:\n';
  contextSection += 'Responde la pregunta del usuario usando el contexto relevante provisto. Si el contexto no es suficiente, usa tu conocimiento general pero menciona la limitación.\n\n';
  contextSection += `---\n\nUSER QUERY:\n${userQuery}`;

  return systemPrompt + contextSection;
}
```

---

## 5. RAG-Enabled Chat Flow

### 5.1 Complete Flow

```typescript
// app/api/agents/[id]/chat/route.ts
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { retrieveContext } from '@/lib/rag/retrieval';
import { buildContextPrompt } from '@/lib/rag/context-builder';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { user } = await requireAuth(request);
  const body = await request.json();
  const { project_id, messages, stream = true } = body;

  // 1. Obtener agente
  const agent = await getAgent(params.id);

  // 2. RAG Retrieval
  const lastUserMessage = messages[messages.length - 1].content;
  const relevantChunks = await retrieveContext({
    query: lastUserMessage,
    agentId: params.id,
    userId: user.id
  });

  // 3. Build context prompt
  const systemPromptWithContext = buildContextPrompt(
    agent.system_prompt,
    relevantChunks,
    lastUserMessage
  );

  // 4. Select model based on agent config
  const model = agent.model_provider === 'openai'
    ? openai(agent.model_name)
    : anthropic(agent.model_name);

  // 5. Generate response with streaming
  const result = await streamText({
    model,
    system: systemPromptWithContext,
    messages: messages.slice(0, -1), // Exclude last message (already in system prompt)
    temperature: agent.temperature,
    maxTokens: agent.max_tokens
  });

  // 6. Save conversation (after streaming)
  // (handled by client-side or separate endpoint)

  return result.toAIStreamResponse();
}
```

### 5.2 Retrieval Function

```typescript
// lib/rag/retrieval.ts
import { QdrantClient } from '@qdrant/js-client-rest';
import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';

export interface RetrievalOptions {
  query: string;
  agentId: string;
  userId: string;
  topK?: number;
  scoreThreshold?: number;
}

export async function retrieveContext(options: RetrievalOptions) {
  const { query, agentId, userId, topK = 10, scoreThreshold = 0.7 } = options;

  // 1. Generate query embedding
  const { embedding } = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: query
  });

  // 2. Search in Qdrant
  const qdrant = new QdrantClient({
    url: process.env.QDRANT_URL!,
    apiKey: process.env.QDRANT_API_KEY!
  });

  const searchResults = await qdrant.search('cjhirashi-embeddings-production', {
    vector: embedding,
    limit: topK,
    filter: {
      should: [
        // Global corpus
        {
          must: [
            { key: 'agent_id', match: { any: [agentId] } },
            { key: 'corpus_type', match: { value: 'global' } }
          ]
        },
        // Personal corpus (if allowed)
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

  // 3. Filter by score threshold
  const relevantChunks = searchResults
    .filter(result => result.score >= scoreThreshold)
    .map(result => ({
      chunk_text: result.payload?.chunk_text as string,
      corpus_type: result.payload?.corpus_type as 'global' | 'personal',
      score: result.score
    }));

  return relevantChunks;
}
```

---

## 6. Monitoring & Observability

### 6.1 Metrics to Track

| Métrica | Descripción | Threshold |
|---------|-------------|-----------|
| **Retrieval Latency** | Tiempo de semantic search | < 500ms |
| **Embedding Latency** | Tiempo de generar embedding | < 200ms |
| **Context Size** | Tokens usados para contexto | < 2000 tokens |
| **Chunk Relevance** | Score promedio de chunks | > 0.7 |
| **RAG Usage Rate** | % de queries con RAG vs sin RAG | - |

### 6.2 Logging

```typescript
// lib/observability/rag-logger.ts
export async function logRAGRetrieval(data: {
  userId: string;
  agentId: string;
  query: string;
  chunksRetrieved: number;
  averageScore: number;
  latency: number;
}) {
  // Log to database or external service (ej: Datadog, Sentry)
  console.log('[RAG Retrieval]', {
    timestamp: new Date().toISOString(),
    ...data
  });
}
```

---

## 7. Error Handling

### 7.1 Qdrant Unavailable

```typescript
try {
  const chunks = await retrieveContext({ query, agentId, userId });
} catch (error) {
  console.error('[RAG] Qdrant error:', error);

  // Fallback: Respond without RAG
  const result = await streamText({
    model,
    system: agent.system_prompt, // Sin contexto adicional
    messages
  });

  return result.toAIStreamResponse();
}
```

### 7.2 No Relevant Chunks Found

```typescript
const chunks = await retrieveContext({ query, agentId, userId });

if (chunks.length === 0) {
  console.warn('[RAG] No relevant chunks found for query:', query);

  // Continuar sin contexto adicional
  // O agregar mensaje al sistema: "No se encontró contexto relevante en tus corpus."
}
```

### 7.3 Embedding API Failure

```typescript
try {
  const { embedding } = await embed({ model, value: query });
} catch (error) {
  console.error('[Embedding] API failure:', error);

  // Fallback: Responder sin RAG
  return apiError('EMBEDDING_ERROR', 'No se pudo procesar el query');
}
```

---

## 8. Future Enhancements (v0.2+)

### 8.1 Hybrid Search (Semantic + Keyword)

**Objetivo**: Combinar búsqueda semántica con búsqueda por palabras clave.

**Implementación**:
- Qdrant soporta hybrid search (vector + payload filter)
- BM25 scoring para keyword matching

### 8.2 Re-Ranking

**Objetivo**: Re-ordenar chunks usando un modelo de re-ranking (ej: Cohere Rerank).

**Flujo**:
1. Semantic search → Top-50 chunks
2. Re-ranking model → Re-ordena por relevancia
3. Top-10 chunks finales → Contexto

### 8.3 Query Expansion

**Objetivo**: Expandir query del usuario con sinónimos o reformulaciones.

**Ejemplo**:
```
User query: "¿Cómo empiezo el capítulo?"
Expanded query: "¿Cómo empiezo el capítulo? ¿Cómo estructuro la introducción? ¿Cómo inicio la narrativa?"
```

### 8.4 Conversation History in Context

**Objetivo**: Incluir mensajes previos de la conversación en el contexto.

**Implementación**:
- Últimos 5 mensajes de la conversación
- Combinar con chunks de RAG
- Límite total: 4000 tokens de contexto

---

**Fecha de Diseño**: 2025-11-21
**Responsable**: ai-integration-specialist (via architect, fase-2-arquitectura-leader)
**Estado**: COMPLETO
**Próximo Paso**: Diseñar Integration Architecture (Vercel AI SDK)
