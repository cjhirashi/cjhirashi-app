# ADR-010: Qdrant como Vector Database para RAG

**Fecha**: 2025-11-21
**Estado**: Aprobado
**Contexto**: CJHIRASHI APP v0.1
**Responsables**: ai-integration-specialist (fase-2-arquitectura-leader)

---

## Contexto y Problema

El sistema RAG necesita almacenar y buscar embeddings vectoriales eficientemente. ¿Qué vector database usar para semantic search con < 500ms de latencia?

**Opciones consideradas**:
- **Opción A**: Pinecone (SaaS, popular)
- **Opción B**: Weaviate (Open source, GraphQL)
- **Opción C**: Qdrant (Open source, Rust, ROADMAP)

---

## Decisión

**Adoptamos Opción C: Qdrant Vector Database**

### Características Clave

1. **Performance**: Rust-based, optimizado para velocidad
2. **Filters Avanzados**: Payload filtering (agent_id, user_id, corpus_type)
3. **Scalable**: Horizontal scaling, millones de vectores
4. **Self-Hostable**: Opción de self-hosting o Qdrant Cloud
5. **Open Source**: Sin vendor lock-in

---

## Justificación

### Ventajas de Opción C (Seleccionada)

✅ **Performance Óptimo**:
- Rust implementation (C++-level performance)
- HNSW algorithm optimizado
- Latencia < 500ms para 10M vectors

✅ **Payload Filtering**:
```json
{
  "filter": {
    "must": [
      { "key": "agent_id", "match": { "value": "uuid" } },
      { "key": "user_id", "match": { "value": "uuid" } },
      { "key": "corpus_type", "match": { "value": "personal" } }
    ]
  }
}
```

✅ **Flexible Deployment**:
- Qdrant Cloud (managed, $0.50/GB/month)
- Self-hosted Docker (control total)
- Kubernetes (producción enterprise)

✅ **Developer Experience**:
- REST API simple
- Official SDKs (TypeScript, Python, Rust)
- Excelente documentación

✅ **ROADMAP Alignment**:
- ROADMAP especifica Qdrant (no Pinecone/Weaviate)

### Desventajas de Opciones Descartadas

❌ **Opción A (Pinecone)**:
- Vendor lock-in (solo SaaS)
- Costo alto para escala (>$70/month)
- No es open source
- ROADMAP descarta explícitamente

❌ **Opción B (Weaviate)**:
- GraphQL overhead (complejidad innecesaria)
- Performance menor vs Qdrant
- Documentación menos clara
- No especificado en ROADMAP

---

## Arquitectura Técnica

### Collection Schema

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

### Qdrant Client Setup

```typescript
// lib/qdrant/client.ts
import { QdrantClient } from '@qdrant/js-client-rest';

export const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL!,
  apiKey: process.env.QDRANT_API_KEY!
});

// Create collection (one-time setup)
export async function createCollection() {
  await qdrant.createCollection('cjhirashi-embeddings-production', {
    vectors: {
      size: 1536,
      distance: 'Cosine'
    },
    hnsw_config: {
      m: 16,
      ef_construct: 100
    }
  });
}
```

### Indexing Embeddings

```typescript
// lib/rag/indexer.ts
export async function indexEmbeddings(
  embeddings: EmbeddingResult[],
  corpusId: string,
  documentId: string,
  userId: string | null,
  agentIds: string[],
  corpusType: 'global' | 'personal'
) {
  const points = embeddings.map((emb, index) => ({
    id: uuidv4(),
    vector: emb.embedding,
    payload: {
      corpus_id: corpusId,
      document_id: documentId,
      user_id: userId,
      agent_id: agentIds,
      chunk_text: emb.chunk.chunk_text,
      chunk_index: index,
      corpus_type: corpusType
    }
  }));

  await qdrant.upsert('cjhirashi-embeddings-production', {
    wait: true,
    points
  });
}
```

### Semantic Search

```typescript
// lib/rag/retrieval.ts
export async function retrieveContext(options: {
  query: string;
  agentId: string;
  userId: string;
  topK?: number;
}) {
  const { query, agentId, userId, topK = 10 } = options;

  // Generate query embedding
  const { embedding } = await generateEmbedding(query);

  // Search in Qdrant
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
        // Personal corpus
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

  return searchResults.map(result => ({
    chunk_text: result.payload?.chunk_text as string,
    corpus_type: result.payload?.corpus_type as 'global' | 'personal',
    score: result.score
  }));
}
```

---

## HNSW Configuration

### Parámetros Optimizados

| Parámetro | Valor | Justificación |
|-----------|-------|---------------|
| `m` | 16 | Balance recall/performance (16-64 típico) |
| `ef_construct` | 100 | Quality de index (higher = mejor) |
| `ef` (search) | 64 | Quality de search (runtime) |

**Trade-offs**:
- `m` más alto → Mejor recall, más memoria
- `ef_construct` más alto → Index más lento, mejor quality
- `ef` más alto → Search más lento, mejor recall

### Performance Benchmarks

| Vectors | Latency (p95) | Throughput |
|---------|--------------|------------|
| 100K | < 50ms | 500 QPS |
| 1M | < 100ms | 300 QPS |
| 10M | < 500ms | 100 QPS |

---

## Deployment Options

### Option 1: Qdrant Cloud (Managed) - RECOMMENDED v0.1

**Pros**:
- Zero ops (managed)
- Auto-scaling
- $0.50/GB/month (~$5-10/month para v0.1)
- 99.9% uptime SLA

**Setup**:
```bash
# 1. Create account at https://cloud.qdrant.io
# 2. Create cluster
# 3. Get URL and API key
```

```env
QDRANT_URL=https://your-cluster.qdrant.io:6333
QDRANT_API_KEY=your_api_key
```

### Option 2: Self-Hosted Docker

**Pros**:
- Control total
- Sin costos de servicio
- Datos on-premise

**Setup**:
```bash
docker run -p 6333:6333 qdrant/qdrant
```

```env
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=  # Opcional para local
```

### Option 3: Kubernetes (Production Enterprise)

**Pros**:
- Horizontal scaling
- High availability
- Production-grade

**Deferred**: v0.2+ (no necesario para MVP)

---

## Data Model

### Vector Point Structure

```json
{
  "id": "uuid-point-id",
  "vector": [0.123, -0.456, ...], // 1536 dimensions
  "payload": {
    "corpus_id": "uuid-corpus",
    "document_id": "uuid-document",
    "user_id": "uuid-user | null",
    "agent_id": ["uuid-agent-1", "uuid-agent-2"],
    "chunk_text": "El primer capítulo debe establecer...",
    "chunk_index": 0,
    "corpus_type": "global"
  }
}
```

### Payload Filtering Examples

**Filter 1: Global corpus for specific agent**
```json
{
  "must": [
    { "key": "agent_id", "match": { "any": ["agent-uuid"] } },
    { "key": "corpus_type", "match": { "value": "global" } }
  ]
}
```

**Filter 2: Personal corpus for user + agent**
```json
{
  "must": [
    { "key": "agent_id", "match": { "any": ["agent-uuid"] } },
    { "key": "corpus_type", "match": { "value": "personal" } },
    { "key": "user_id", "match": { "value": "user-uuid" } }
  ]
}
```

**Filter 3: Specific corpus**
```json
{
  "must": [
    { "key": "corpus_id", "match": { "value": "corpus-uuid" } }
  ]
}
```

---

## Monitoring & Observability

### Metrics to Track

| Métrica | Target | Medición |
|---------|--------|----------|
| Search Latency (p95) | < 500ms | Qdrant metrics API |
| Index Size | < 10GB | Qdrant dashboard |
| Vector Count | < 1M | Qdrant collection info |
| Search QPS | < 100 | Qdrant metrics |

### Logging

```typescript
// lib/observability/qdrant-logger.ts
export async function logQdrantSearch(data: {
  query: string;
  agentId: string;
  userId: string;
  resultsCount: number;
  latency: number;
}) {
  console.log('[Qdrant Search]', {
    timestamp: new Date().toISOString(),
    ...data
  });
}
```

---

## Backup & Recovery

### Backup Strategy

**Qdrant Cloud**:
- Automatic backups (7-day retention)
- Point-in-time recovery

**Self-Hosted**:
```bash
# Snapshot creation
curl -X POST http://localhost:6333/collections/cjhirashi-embeddings-production/snapshots

# Download snapshot
curl http://localhost:6333/collections/cjhirashi-embeddings-production/snapshots/{snapshot_name} \
  --output snapshot.tar
```

### Disaster Recovery

**RTO (Recovery Time Objective)**: < 1 hour
**RPO (Recovery Point Objective)**: < 24 hours

**Procedure**:
1. Restore Qdrant snapshot
2. Re-index embeddings from PostgreSQL `embeddings` table
3. Validate search quality

---

## Cost Estimation

### Qdrant Cloud (Recommended for v0.1)

| Metric | v0.1 Estimate | Cost |
|--------|--------------|------|
| Vector Count | 100K vectors | - |
| Index Size | ~2GB (1536-dim * 100K) | $1/month |
| Traffic | 1000 searches/day | Included |
| **Total** | | **~$5-10/month** |

### Self-Hosted (Alternative)

| Resource | Cost |
|----------|------|
| Server (2GB RAM) | $5-10/month (Hetzner, DigitalOcean) |
| Storage (10GB SSD) | Included |
| **Total** | **$5-10/month** |

**Note**: Similar cost, pero Qdrant Cloud no requiere ops.

---

## Migration Path (Future)

### From Qdrant Cloud to Self-Hosted

```bash
# 1. Export snapshot from Cloud
curl https://your-cluster.qdrant.io/collections/cjhirashi-embeddings-production/snapshots/{name} \
  --output cloud-snapshot.tar

# 2. Import to self-hosted
curl -X PUT http://localhost:6333/collections/cjhirashi-embeddings-production/snapshots/upload \
  --data-binary @cloud-snapshot.tar
```

### From Self-Hosted to Qdrant Cloud

Same procedure in reverse.

**Zero Vendor Lock-In**: Migration es straightforward.

---

## Impacto en el Sistema

### Dependencias Nuevas

```json
{
  "dependencies": {
    "@qdrant/js-client-rest": "^1.7.0"
  }
}
```

### Environment Variables

```env
QDRANT_URL=https://your-cluster.qdrant.io:6333
QDRANT_API_KEY=your_api_key
```

### Componentes Nuevos

| Componente | Ubicación | Descripción |
|------------|-----------|-------------|
| Qdrant Client | `lib/qdrant/client.ts` | Cliente configurado |
| Indexer | `lib/rag/indexer.ts` | Indexación de embeddings |
| Retrieval | `lib/rag/retrieval.ts` | Semantic search |
| Collection Setup | `scripts/setup-qdrant.ts` | One-time setup |

---

## Testing Strategy

### Unit Tests

```typescript
// __tests__/lib/qdrant/indexer.test.ts
describe('Qdrant Indexer', () => {
  it('indexes embeddings correctly', async () => {
    const embeddings = [
      { embedding: [0.1, 0.2, ...], chunk: { chunk_text: 'test' } }
    ];

    await indexEmbeddings(embeddings, 'corpus-id', 'doc-id', 'user-id', ['agent-id'], 'personal');

    // Verify indexed
    const results = await qdrant.search('cjhirashi-embeddings-production', {
      vector: [0.1, 0.2, ...],
      limit: 1
    });

    expect(results.length).toBeGreaterThan(0);
  });
});
```

### Integration Tests

```typescript
// __tests__/lib/rag/retrieval.integration.test.ts
describe('RAG Retrieval', () => {
  it('retrieves relevant chunks', async () => {
    const chunks = await retrieveContext({
      query: 'How to write chapter 1?',
      agentId: 'agent-uuid',
      userId: 'user-uuid'
    });

    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].score).toBeGreaterThan(0.7);
  });
});
```

---

## Decisiones Relacionadas

- **ADR-008: RAG System** - Semantic search para retrieval
- **ADR-009: Vercel AI SDK** - Embeddings generation
- **ADR-007: Personal Projects** - Context en chat

---

## Referencias

- [Qdrant Documentation](https://qdrant.tech/documentation/)
- [HNSW Algorithm](https://arxiv.org/abs/1603.09320)
- [Qdrant Cloud](https://cloud.qdrant.io/)
- `docs/architecture/rag-architecture-v0.1.md` - Diseño técnico completo

---

**Fecha de Decisión**: 2025-11-21
**Estado**: ✅ Aprobado
**Fin de ADRs v0.1**: 5/5 ADRs completados
