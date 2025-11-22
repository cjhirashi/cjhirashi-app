# ADR-009: Vercel AI SDK como Capa de Abstracción LLM

**Fecha**: 2025-11-21
**Estado**: Aprobado
**Contexto**: CJHIRASHI APP v0.1
**Responsables**: ai-integration-specialist (fase-2-arquitectura-leader)

---

## Contexto y Problema

La aplicación necesita interactuar con múltiples providers de LLM (OpenAI, Anthropic, Google). ¿Cómo abstraer la complejidad de múltiples APIs manteniendo flexibilidad y streaming?

**Opciones consideradas**:
- **Opción A**: APIs nativas de cada provider (OpenAI SDK, Anthropic SDK)
- **Opción B**: LangChain (abstracción popular)
- **Opción C**: Vercel AI SDK (abstracción moderna)

---

## Decisión

**Adoptamos Opción C: Vercel AI SDK**

### Características Clave

1. **Unified API**: Misma interfaz para OpenAI, Anthropic, Google
2. **Streaming Built-In**: Server-Sent Events (SSE) nativo
3. **React Hooks**: `useChat()`, `useCompletion()` out-of-the-box
4. **Type Safety**: TypeScript first-class support
5. **Edge Runtime Compatible**: Optimizado para Vercel Edge Functions

---

## Justificación

### Ventajas de Opción C (Seleccionada)

✅ **Simplicidad de API**:
```typescript
// Mismo código para todos los providers
const result = await streamText({
  model: openai('gpt-4o'),  // o anthropic('claude-3-5-sonnet')
  messages,
  temperature: 0.7
});
```

✅ **Streaming Nativo**:
- Server-Sent Events (SSE) built-in
- No requiere WebSockets
- Compatible con Edge Runtime

✅ **React Integration**:
```tsx
const { messages, input, handleSubmit } = useChat({
  api: '/api/chat'
});
```

✅ **Future-Proof**:
- Nuevos providers agregados por Vercel (Google Gemini, etc.)
- Actualizaciones automáticas de modelos
- Mantenimiento activo

✅ **Edge-Optimized**:
- Latencia baja (Edge Functions)
- Costo optimizado vs Serverless

### Desventajas de Opciones Descartadas

❌ **Opción A (APIs Nativas)**:
- Código duplicado por provider
- Lógica de streaming manual
- Mantenimiento de múltiples SDKs
- No hay abstracción unificada

❌ **Opción B (LangChain)**:
- Complejidad innecesaria (chains, agents, tools)
- Overhead de abstracción
- Documentación fragmentada
- ROADMAP especifica NO usar LangChain

---

## Arquitectura Técnica

### Model Selection Strategy

```typescript
// lib/ai/providers.ts
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';

export function getModel(provider: string, modelName: string) {
  switch (provider) {
    case 'openai':
      return openai(modelName); // 'gpt-4o', 'gpt-4o-mini', etc.
    case 'anthropic':
      return anthropic(modelName); // 'claude-3-5-sonnet-20241022', etc.
    default:
      throw new Error(`Invalid provider: ${provider}`);
  }
}
```

### Streaming Chat Implementation

**Backend (API Route)**:
```typescript
// app/api/agents/[id]/chat/route.ts
import { streamText } from 'ai';

export const runtime = 'edge'; // Edge Runtime

export async function POST(request: NextRequest, { params }) {
  const { user } = await requireAuth(request);
  const { messages, project_id } = await request.json();

  // Get agent config
  const agent = await getAgent(params.id);

  // RAG retrieval
  const relevantChunks = await retrieveContext({
    query: messages[messages.length - 1].content,
    agentId: params.id,
    userId: user.id
  });

  // Build context prompt
  const systemPrompt = buildContextPrompt(
    agent.system_prompt,
    relevantChunks,
    messages[messages.length - 1].content
  );

  // Select model
  const model = getModel(agent.model_provider, agent.model_name);

  // Stream response
  const result = await streamText({
    model,
    system: systemPrompt,
    messages: messages.slice(0, -1),
    temperature: agent.temperature || 0.7,
    maxTokens: agent.max_tokens || 2000,
    onFinish: async ({ text, usage }) => {
      // Save conversation
      await saveConversation({
        projectId: project_id,
        agentId: params.id,
        userId: user.id,
        userMessage: messages[messages.length - 1].content,
        assistantMessage: text,
        tokensUsed: usage.totalTokens
      });
    }
  });

  return result.toAIStreamResponse();
}
```

**Frontend (React Hook)**:
```tsx
'use client';

import { useChat } from 'ai/react';

export default function ChatPage({ params }) {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading
  } = useChat({
    api: `/api/agents/${params.agentId}/chat`,
    body: { project_id: params.id }
  });

  return (
    <div>
      {/* Messages */}
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}

      {/* Input */}
      <form onSubmit={handleSubmit}>
        <textarea value={input} onChange={handleInputChange} />
        <button type="submit" disabled={isLoading}>Send</button>
      </form>
    </div>
  );
}
```

---

## Embeddings Generation

```typescript
// lib/ai/embeddings.ts
import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: text
  });

  return embedding; // 1536-dimensional vector
}

// Batch processing
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  return Promise.all(texts.map(generateEmbedding));
}
```

---

## Supported Models (v0.1)

### OpenAI

| Model | Use Case | Cost (per 1M tokens) |
|-------|----------|---------------------|
| `gpt-4o` | General purpose, high quality | $2.50 input, $10.00 output |
| `gpt-4o-mini` | Cost-effective, fast | $0.15 input, $0.60 output |
| `gpt-3.5-turbo` | Legacy, budget | $0.50 input, $1.50 output |

### Anthropic

| Model | Use Case | Cost (per 1M tokens) |
|-------|----------|---------------------|
| `claude-3-5-sonnet-20241022` | Balanced, recommended | $3.00 input, $15.00 output |
| `claude-3-opus-20240229` | Highest quality | $15.00 input, $75.00 output |
| `claude-3-haiku-20240307` | Fastest, cheapest | $0.25 input, $1.25 output |

---

## Error Handling & Retries

### Retry Logic

```typescript
// lib/ai/error-handler.ts
export async function withRetry<T>(
  fn: () => Promise<T>,
  options = { maxRetries: 3, delay: 1000 }
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < options.maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < options.maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, options.delay * (i + 1)));
      }
    }
  }

  throw lastError!;
}

// Usage
const result = await withRetry(() => streamText({ model, messages }));
```

### Streaming Error Handling

```tsx
// Frontend
const { messages, error } = useChat({
  api: '/api/chat',
  onError: (error) => {
    toast({
      title: 'Error',
      description: error.message,
      variant: 'destructive'
    });
  }
});

{error && (
  <div className="error-message">
    Error: {error.message}
  </div>
)}
```

---

## Token Usage Tracking

```typescript
// onFinish callback
onFinish: async ({ text, usage }) => {
  // Save token usage
  await supabase.from('token_usage').insert({
    user_id: user.id,
    agent_id: agent.id,
    project_id: project_id,
    prompt_tokens: usage.promptTokens,
    completion_tokens: usage.completionTokens,
    total_tokens: usage.totalTokens,
    model_name: agent.model_name,
    timestamp: new Date().toISOString()
  });
}
```

---

## Impacto en el Sistema

### Dependencias Nuevas

```json
{
  "dependencies": {
    "ai": "latest",
    "@ai-sdk/openai": "latest",
    "@ai-sdk/anthropic": "latest"
  }
}
```

### Environment Variables

```env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### Componentes Nuevos

| Componente | Ubicación | Descripción |
|------------|-----------|-------------|
| Model Providers | `lib/ai/providers.ts` | Provider configuration |
| Chat API Route | `app/api/agents/[id]/chat/route.ts` | Streaming endpoint |
| Embeddings Generator | `lib/ai/embeddings.ts` | Embedding generation |
| Error Handler | `lib/ai/error-handler.ts` | Retry logic |
| ChatInterface | `components/chat/ChatInterface.tsx` | UI component |

---

## Testing Strategy

### Unit Tests

```typescript
// __tests__/lib/ai/providers.test.ts
describe('Model Providers', () => {
  it('selects OpenAI model correctly', () => {
    const model = getModel('openai', 'gpt-4o');
    expect(model).toBeDefined();
  });

  it('throws error for invalid provider', () => {
    expect(() => getModel('invalid', 'model')).toThrow();
  });
});
```

### Integration Tests

```typescript
// __tests__/api/chat.integration.test.ts
describe('Chat API', () => {
  it('streams response successfully', async () => {
    const response = await fetch('/api/agents/123/chat', {
      method: 'POST',
      body: JSON.stringify({
        project_id: 'proj-123',
        messages: [{ role: 'user', content: 'Hello' }]
      })
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/event-stream');
  });
});
```

---

## Future Enhancements (v0.2+)

### 1. Function Calling / Tool Use

```typescript
const result = await streamText({
  model,
  tools: {
    searchDatabase: {
      description: 'Search in project database',
      parameters: z.object({ query: z.string() }),
      execute: async ({ query }) => {
        return await searchDB(query);
      }
    }
  }
});
```

### 2. Vision Models (Multimodal)

```typescript
const result = await streamText({
  model: openai('gpt-4-vision-preview'),
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'What is in this image?' },
        { type: 'image', image: imageUrl }
      ]
    }
  ]
});
```

### 3. Google Gemini Support

```typescript
import { google } from '@ai-sdk/google';

const model = google('gemini-pro');
```

---

## Decisiones Relacionadas

- **ADR-008: RAG System** - Context injection en prompt
- **ADR-010: Qdrant** - Vector DB para semantic search
- **ADR-007: Personal Projects** - Chat en contexto de proyecto

---

## Referencias

- [Vercel AI SDK Documentation](https://sdk.vercel.ai/docs)
- [OpenAI API](https://platform.openai.com/docs/api-reference)
- [Anthropic Claude API](https://docs.anthropic.com/claude/reference)
- `docs/architecture/vercel-ai-integration-v0.1.md` - Diseño técnico completo

---

**Fecha de Decisión**: 2025-11-21
**Estado**: ✅ Aprobado
**Próximo ADR**: ADR-010 (Qdrant Vector Database)
