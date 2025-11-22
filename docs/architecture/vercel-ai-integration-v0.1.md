# Vercel AI SDK Integration - CJHIRASHI APP v0.1

**Versión**: v0.1
**Fecha**: 2025-11-21
**Responsable**: ai-integration-specialist (via architect, fase-2-arquitectura-leader)
**ADR Relacionado**: ADR-009

---

## Visión General

CJHIRASHI APP v0.1 utiliza **Vercel AI SDK** como capa de abstracción unificada para interactuar con múltiples providers de modelos LLM (OpenAI, Anthropic, Google).

**Decisión Arquitectónica**: NO usar LangChain. Vercel AI SDK provee:
- Unified API para múltiples providers
- Streaming built-in (Server-Sent Events)
- React hooks (`useChat`, `useCompletion`)
- Type safety con TypeScript
- Edge Runtime compatible

---

## 1. Arquitectura de Alto Nivel

### 1.1 Componentes del Sistema

```
┌──────────────────────────────────────────────────────────────┐
│                    Frontend (React)                          │
│  - useChat hook (Vercel AI SDK)                              │
│  - ChatInterface component                                   │
└───────────────────────────┬──────────────────────────────────┘
                            │ (HTTP POST + SSE)
                            ↓
┌──────────────────────────────────────────────────────────────┐
│              Chat Endpoint (/api/agents/[id]/chat)           │
│  - Next.js API Route Handler                                 │
│  - RAG retrieval + context builder                           │
│  - Model selection based on agent config                     │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ↓
┌──────────────────────────────────────────────────────────────┐
│                  Vercel AI SDK (streamText)                  │
│  - Unified interface for LLM providers                       │
│  - Streaming response handling                               │
│  - Model-agnostic API                                        │
└───────────────────────────┬──────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                ↓                       ↓
┌──────────────────────────┐  ┌──────────────────────────┐
│   OpenAI Provider        │  │  Anthropic Provider      │
│  - gpt-4o                │  │  - claude-3-5-sonnet     │
│  - gpt-4o-mini           │  │  - claude-3-opus         │
│  - gpt-3.5-turbo         │  │  - claude-3-haiku        │
└──────────────────────────┘  └──────────────────────────┘
```

---

## 2. Vercel AI SDK Setup

### 2.1 Installation

```bash
npm install ai @ai-sdk/openai @ai-sdk/anthropic
```

### 2.2 Environment Variables

```env
# .env.local
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### 2.3 Provider Configuration

```typescript
// lib/ai/providers.ts
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';

export const providers = {
  openai: {
    'gpt-4o': openai('gpt-4o'),
    'gpt-4o-mini': openai('gpt-4o-mini'),
    'gpt-3.5-turbo': openai('gpt-3.5-turbo')
  },
  anthropic: {
    'claude-3-5-sonnet-20241022': anthropic('claude-3-5-sonnet-20241022'),
    'claude-3-opus-20240229': anthropic('claude-3-opus-20240229'),
    'claude-3-haiku-20240307': anthropic('claude-3-haiku-20240307')
  }
};

export function getModel(provider: string, modelName: string) {
  const providerModels = providers[provider as keyof typeof providers];
  if (!providerModels) {
    throw new Error(`Invalid provider: ${provider}`);
  }

  const model = providerModels[modelName as keyof typeof providerModels];
  if (!model) {
    throw new Error(`Invalid model: ${modelName} for provider: ${provider}`);
  }

  return model;
}
```

---

## 3. Streaming Chat Implementation

### 3.1 Backend: API Route Handler

```typescript
// app/api/agents/[id]/chat/route.ts
import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { requireAuth } from '@/lib/api/auth';
import { getAgent } from '@/lib/queries/agents';
import { retrieveContext } from '@/lib/rag/retrieval';
import { buildContextPrompt } from '@/lib/rag/context-builder';
import { getModel } from '@/lib/ai/providers';
import { chatRequestSchema } from '@/lib/validation/chat';

export const runtime = 'edge'; // Edge Runtime for optimal streaming

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authentication
    const { user } = await requireAuth(request);

    // 2. Parse and validate request
    const body = await request.json();
    const { project_id, messages } = chatRequestSchema.parse(body);

    // 3. Get agent config
    const agent = await getAgent(params.id);

    if (!agent || !agent.is_active) {
      return new Response(
        JSON.stringify({ error: 'Agent not available' }),
        { status: 400 }
      );
    }

    // 4. RAG Retrieval
    const lastUserMessage = messages[messages.length - 1].content;
    const relevantChunks = await retrieveContext({
      query: lastUserMessage,
      agentId: params.id,
      userId: user.id
    });

    // 5. Build context prompt
    const systemPromptWithContext = buildContextPrompt(
      agent.system_prompt,
      relevantChunks,
      lastUserMessage
    );

    // 6. Select model
    const model = getModel(agent.model_provider, agent.model_name);

    // 7. Stream response
    const result = await streamText({
      model,
      system: systemPromptWithContext,
      messages: messages.slice(0, -1), // Exclude last message (already in system)
      temperature: agent.temperature || 0.7,
      maxTokens: agent.max_tokens || 2000,
      onFinish: async ({ text, usage }) => {
        // 8. Save conversation after streaming completes
        await saveConversation({
          projectId: project_id,
          agentId: params.id,
          userId: user.id,
          userMessage: lastUserMessage,
          assistantMessage: text,
          tokensUsed: usage.totalTokens
        });
      }
    });

    return result.toAIStreamResponse();
  } catch (error) {
    console.error('[Chat API] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}
```

### 3.2 Frontend: useChat Hook

```tsx
// app/dashboard/projects/[id]/chat/page.tsx
'use client';

import { useChat } from 'ai/react';
import { ChatInterface } from '@/components/chat/ChatInterface';

export default function ChatPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    // Fetch project details
    fetchProject(params.id).then(setProject);
  }, [params.id]);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error
  } = useChat({
    api: `/api/agents/${project?.agent_id}/chat`,
    body: {
      project_id: params.id
    },
    onError: (error) => {
      console.error('[Chat] Error:', error);
      toast({
        title: 'Error',
        description: 'No se pudo enviar el mensaje',
        variant: 'destructive'
      });
    }
  });

  if (!project) {
    return <Skeleton className="h-screen" />;
  }

  return (
    <div className="h-screen flex flex-col">
      <ChatInterface
        messages={messages}
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
        projectName={project.name}
        agentName={project.agent_name}
      />
    </div>
  );
}
```

### 3.3 Chat Interface Component

```tsx
// components/chat/ChatInterface.tsx
'use client';

import { FormEvent } from 'react';
import { Message } from 'ai';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChatInterfaceProps {
  messages: Message[];
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: FormEvent) => void;
  isLoading: boolean;
  projectName: string;
  agentName: string;
}

export function ChatInterface({
  messages,
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  projectName,
  agentName
}: ChatInterfaceProps) {
  return (
    <>
      {/* Header */}
      <header className="glass-card p-4 border-b border-glass-border">
        <h2 className="text-xl font-bold">{projectName}</h2>
        <p className="text-sm text-text-secondary">
          Chateando con <span className="text-glass-accent">{agentName}</span>
        </p>
      </header>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="text-center text-text-muted mt-20">
            <p>Inicia la conversación con {agentName}</p>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))
        )}

        {isLoading && (
          <div className="flex items-center gap-2 text-text-secondary">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Escribiendo...</span>
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <ChatInput
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </>
  );
}
```

### 3.4 Chat Message Component

```tsx
// components/chat/ChatMessage.tsx
'use client';

import { Message } from 'ai';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Bot } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn(
      'flex gap-3 mb-4',
      isUser ? 'flex-row-reverse' : 'flex-row'
    )}>
      {/* Avatar */}
      <Avatar>
        <AvatarFallback className={cn(
          isUser ? 'bg-blue-500' : 'bg-cyan-500'
        )}>
          {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
        </AvatarFallback>
      </Avatar>

      {/* Message Bubble */}
      <div className={cn(
        'glass-card max-w-[70%] p-3',
        isUser ? 'bg-blue-500/20 border-blue-400/30' : ''
      )}>
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}
```

### 3.5 Chat Input Component

```tsx
// components/chat/ChatInput.tsx
'use client';

import { FormEvent } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

interface ChatInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: FormEvent) => void;
  isLoading: boolean;
}

export function ChatInput({
  input,
  handleInputChange,
  handleSubmit,
  isLoading
}: ChatInputProps) {
  return (
    <form onSubmit={handleSubmit} className="glass-card p-4 border-t border-glass-border">
      <div className="flex gap-2">
        <Textarea
          value={input}
          onChange={handleInputChange}
          placeholder="Escribe tu mensaje..."
          className="glass-textarea resize-none"
          rows={3}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          disabled={isLoading}
        />
        <Button
          type="submit"
          className="glass-button-primary"
          disabled={isLoading || !input.trim()}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
      <p className="text-xs text-text-muted mt-2">
        Presiona Enter para enviar, Shift+Enter para nueva línea
      </p>
    </form>
  );
}
```

---

## 4. Model Selection Strategy

### 4.1 Agent-Based Model Configuration

**Database**:
```sql
-- agents table
agents {
  id UUID,
  model_provider VARCHAR(50), -- 'openai' | 'anthropic'
  model_name VARCHAR(100),    -- 'gpt-4o' | 'claude-3-5-sonnet-20241022'
  temperature DECIMAL(2,1),   -- 0.0-2.0
  max_tokens INTEGER          -- Max tokens per response
}
```

**Example Agents**:
```typescript
const exampleAgents = [
  {
    name: "Escritor de Libros",
    model_provider: "anthropic",
    model_name: "claude-3-5-sonnet-20241022",
    temperature: 0.8,
    max_tokens: 4000
  },
  {
    name: "Analista de Datos",
    model_provider: "openai",
    model_name: "gpt-4o",
    temperature: 0.3,
    max_tokens: 2000
  }
];
```

### 4.2 Dynamic Model Switching

```typescript
// lib/ai/model-selector.ts
export function selectModel(agent: Agent) {
  const { model_provider, model_name } = agent;

  switch (model_provider) {
    case 'openai':
      return openai(model_name);
    case 'anthropic':
      return anthropic(model_name);
    default:
      throw new Error(`Unsupported provider: ${model_provider}`);
  }
}
```

### 4.3 Model Validation

```typescript
// lib/validation/agents.ts
const VALID_MODELS = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
  anthropic: [
    'claude-3-5-sonnet-20241022',
    'claude-3-opus-20240229',
    'claude-3-haiku-20240307'
  ]
};

export const agentSchema = z.object({
  model_provider: z.enum(['openai', 'anthropic']),
  model_name: z.string().refine((name) => {
    // Validate model name exists for provider
    return true; // Implement validation logic
  })
});
```

---

## 5. Embeddings Generation

### 5.1 Embedding API

```typescript
// lib/ai/embeddings.ts
import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const { embedding } = await embed({
      model: openai.embedding('text-embedding-3-small'),
      value: text
    });

    return embedding;
  } catch (error) {
    console.error('[Embeddings] Error:', error);
    throw new Error('Failed to generate embedding');
  }
}

export async function generateEmbeddings(
  texts: string[]
): Promise<number[][]> {
  try {
    const embeddings = await Promise.all(
      texts.map((text) => generateEmbedding(text))
    );

    return embeddings;
  } catch (error) {
    console.error('[Embeddings] Batch error:', error);
    throw new Error('Failed to generate embeddings');
  }
}
```

### 5.2 Batch Processing

```typescript
// lib/rag/embedding-processor.ts
const BATCH_SIZE = 10; // Process 10 chunks at a time

export async function processDocumentEmbeddings(
  chunks: Chunk[]
): Promise<EmbeddingResult[]> {
  const results: EmbeddingResult[] = [];

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const embeddings = await generateEmbeddings(batch.map(c => c.chunk_text));

    embeddings.forEach((embedding, index) => {
      results.push({
        chunk: batch[index],
        embedding
      });
    });

    // Rate limiting (avoid API throttling)
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
}
```

---

## 6. Error Handling & Retries

### 6.1 API Error Handling

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
      console.warn(`[Retry ${i + 1}/${options.maxRetries}] Error:`, error);

      if (i < options.maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, options.delay * (i + 1)));
      }
    }
  }

  throw lastError!;
}

// Usage
const embedding = await withRetry(() => generateEmbedding(text));
```

### 6.2 Rate Limiting

```typescript
// lib/ai/rate-limiter.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
  analytics: true
});

export async function checkRateLimit(userId: string) {
  const { success, limit, remaining, reset } = await ratelimit.limit(userId);

  if (!success) {
    throw new Error(`Rate limit exceeded. Reset in ${reset}ms`);
  }

  return { limit, remaining };
}
```

### 6.3 Streaming Error Handling

```typescript
// Frontend error handling
const { messages, error } = useChat({
  api: '/api/chat',
  onError: (error) => {
    console.error('[Chat Error]:', error);

    // Show user-friendly error
    toast({
      title: 'Error en el chat',
      description: 'Hubo un problema al procesar tu mensaje. Intenta nuevamente.',
      variant: 'destructive'
    });
  }
});

{error && (
  <div className="glass-card bg-red-500/20 border-red-400/30 p-3">
    <p className="text-sm text-red-200">
      Error: {error.message}
    </p>
  </div>
)}
```

---

## 7. Token Usage Tracking

### 7.1 Tracking Implementation

```typescript
// lib/ai/token-tracker.ts
export async function saveTokenUsage(data: {
  userId: string;
  agentId: string;
  projectId: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  modelName: string;
}) {
  await supabase.from('token_usage').insert({
    user_id: data.userId,
    agent_id: data.agentId,
    project_id: data.projectId,
    prompt_tokens: data.promptTokens,
    completion_tokens: data.completionTokens,
    total_tokens: data.totalTokens,
    model_name: data.modelName,
    timestamp: new Date().toISOString()
  });
}
```

### 7.2 Database Schema

```sql
-- token_usage table (NEW v0.1)
CREATE TABLE token_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  agent_id UUID NOT NULL REFERENCES agents(id),
  project_id UUID NOT NULL REFERENCES projects(id),
  prompt_tokens INTEGER NOT NULL,
  completion_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  model_name VARCHAR(100) NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_token_usage_user ON token_usage(user_id);
CREATE INDEX idx_token_usage_timestamp ON token_usage(timestamp);
```

### 7.3 Usage in streamText

```typescript
const result = await streamText({
  model,
  messages,
  onFinish: async ({ text, usage }) => {
    // Track token usage
    await saveTokenUsage({
      userId: user.id,
      agentId: agent.id,
      projectId: project_id,
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      totalTokens: usage.totalTokens,
      modelName: agent.model_name
    });
  }
});
```

---

## 8. Cost Estimation

### 8.1 Model Pricing (Approximate)

| Provider | Model | Input (per 1M tokens) | Output (per 1M tokens) |
|----------|-------|---------------------|----------------------|
| OpenAI | gpt-4o | $2.50 | $10.00 |
| OpenAI | gpt-4o-mini | $0.15 | $0.60 |
| OpenAI | gpt-3.5-turbo | $0.50 | $1.50 |
| Anthropic | claude-3-5-sonnet | $3.00 | $15.00 |
| Anthropic | claude-3-opus | $15.00 | $75.00 |
| Anthropic | claude-3-haiku | $0.25 | $1.25 |

### 8.2 Cost Calculator

```typescript
// lib/ai/cost-calculator.ts
const MODEL_PRICING = {
  'gpt-4o': { input: 2.50, output: 10.00 },
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00 }
};

export function calculateCost(
  modelName: string,
  promptTokens: number,
  completionTokens: number
): number {
  const pricing = MODEL_PRICING[modelName];
  if (!pricing) return 0;

  const inputCost = (promptTokens / 1_000_000) * pricing.input;
  const outputCost = (completionTokens / 1_000_000) * pricing.output;

  return inputCost + outputCost;
}

// Example usage
const cost = calculateCost('gpt-4o', 1000, 500);
// Cost: (1000/1M * $2.50) + (500/1M * $10.00) = $0.0025 + $0.005 = $0.0075
```

---

## 9. Testing

### 9.1 Unit Tests

```typescript
// __tests__/lib/ai/model-selector.test.ts
import { describe, it, expect } from 'vitest';
import { selectModel } from '@/lib/ai/model-selector';

describe('Model Selector', () => {
  it('selects OpenAI model correctly', () => {
    const agent = {
      model_provider: 'openai',
      model_name: 'gpt-4o'
    };

    const model = selectModel(agent);
    expect(model).toBeDefined();
  });

  it('throws error for invalid provider', () => {
    const agent = {
      model_provider: 'invalid',
      model_name: 'model'
    };

    expect(() => selectModel(agent)).toThrow('Unsupported provider');
  });
});
```

### 9.2 Integration Tests

```typescript
// __tests__/api/chat.integration.test.ts
import { describe, it, expect } from 'vitest';
import { POST } from '@/app/api/agents/[id]/chat/route';

describe('Chat API', () => {
  it('streams response successfully', async () => {
    const request = new Request('http://localhost/api/agents/123/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: 'project-123',
        messages: [
          { role: 'user', content: 'Hello' }
        ]
      })
    });

    const response = await POST(request, { params: { id: '123' } });
    expect(response.status).toBe(200);
  });
});
```

---

## 10. Monitoring & Observability

### 10.1 Metrics to Track

| Métrica | Descripción | Threshold |
|---------|-------------|-----------|
| **Response Latency** | Tiempo hasta primer token | < 1s |
| **Stream Duration** | Tiempo total de streaming | < 10s |
| **Token Usage** | Tokens consumidos por request | - |
| **Error Rate** | % de requests fallidos | < 1% |
| **Model Usage** | Distribución de uso por modelo | - |

### 10.2 Logging

```typescript
// lib/observability/ai-logger.ts
export async function logAIRequest(data: {
  userId: string;
  agentId: string;
  modelName: string;
  tokensUsed: number;
  latency: number;
  success: boolean;
}) {
  console.log('[AI Request]', {
    timestamp: new Date().toISOString(),
    ...data
  });

  // Send to external service (Datadog, Sentry, etc.)
}
```

---

## 11. Future Enhancements (v0.2+)

### 11.1 Multi-Turn Conversations

**Current**: Each request is stateless (messages array passed by client)

**Enhancement**: Server-side conversation history management

### 11.2 Function Calling / Tool Use

**Objective**: Allow agents to call external tools

```typescript
const result = await streamText({
  model,
  tools: {
    searchDatabase: {
      description: 'Search in project database',
      parameters: z.object({ query: z.string() }),
      execute: async ({ query }) => {
        // Search logic
      }
    }
  }
});
```

### 11.3 Vision Models

**Objective**: Support multimodal inputs (images + text)

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

---

**Fecha de Diseño**: 2025-11-21
**Responsable**: ai-integration-specialist (via architect, fase-2-arquitectura-leader)
**Estado**: COMPLETO
**Próximo Paso**: Generar 5 ADRs (ADR-006 a ADR-010)
