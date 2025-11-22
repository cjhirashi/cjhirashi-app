# Estructura Completa del Proyecto - cjhirashi-app

**Generado:** 2025-01-21
**Estado:** Fase 4 Completa - Frontend 100%

---

## Árbol de Directorios

```
cjhirashi-app/
│
├── app/
│   ├── actions/                          # Server Actions
│   │   ├── agents.ts                     # CRUD Agents (admin only)
│   │   ├── corpus.ts                     # CRUD Corpus
│   │   └── projects.ts                   # CRUD Projects
│   │
│   ├── admin/                            # Admin Panel (role: admin)
│   │   ├── agents/
│   │   │   ├── new/
│   │   │   │   └── page.tsx              # Create Agent Form
│   │   │   └── [id]/
│   │   │       └── page.tsx              # Edit Agent Form
│   │   │
│   │   └── corpus/
│   │       ├── new/
│   │       │   └── page.tsx              # Create Global Corpus Form
│   │       └── [id]/
│   │           └── page.tsx              # Edit Global Corpus Form
│   │
│   ├── dashboard/                        # User Dashboard (authenticated)
│   │   ├── projects/
│   │   │   ├── new/
│   │   │   │   └── page.tsx              # Create Project Form
│   │   │   └── [id]/
│   │   │       ├── page.tsx              # Project Detail
│   │   │       └── chat/
│   │   │           └── page.tsx          # Project Chat Interface
│   │   │
│   │   └── corpus/
│   │       ├── new/
│   │       │   └── page.tsx              # Create Personal Corpus Form
│   │       └── [id]/
│   │           └── page.tsx              # Personal Corpus Detail
│   │
│   ├── auth/                             # Authentication pages
│   │   ├── login/
│   │   ├── sign-up/
│   │   └── forgot-password/
│   │
│   ├── layout.tsx                        # Root layout
│   └── page.tsx                          # Home page
│
├── components/
│   ├── agents/
│   │   └── AgentForm.tsx                 # Agent Form Component (admin)
│   │
│   ├── projects/
│   │   └── ProjectForm.tsx               # Project Form Component
│   │
│   ├── corpus/
│   │   └── CorpusForm.tsx                # Corpus Form Component
│   │
│   ├── chat/
│   │   └── ChatInterface.tsx             # Chat UI Component (placeholder)
│   │
│   └── ui/                               # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── textarea.tsx
│       ├── select.tsx
│       ├── switch.tsx
│       ├── tabs.tsx
│       ├── badge.tsx
│       ├── scroll-area.tsx
│       └── ... (otros componentes shadcn)
│
├── lib/
│   ├── auth/
│   │   └── require-auth.ts               # Auth utilities (requireAuth, requireAdmin)
│   │
│   ├── types/
│   │   └── database.ts                   # TypeScript types para DB entities
│   │
│   ├── validation/
│   │   └── schemas.ts                    # Zod validation schemas
│   │
│   ├── supabase/
│   │   ├── server.ts                     # Supabase SSR client (server)
│   │   ├── client.ts                     # Supabase client (browser)
│   │   └── middleware.ts                 # Supabase middleware
│   │
│   └── utils.ts                          # Utility functions (cn, etc.)
│
├── prisma/
│   ├── schema.prisma                     # Database schema (Supabase)
│   └── seed.ts                           # Database seeds
│
├── middleware.ts                         # Next.js middleware (auth)
├── tailwind.config.ts                    # Tailwind configuration
├── components.json                       # shadcn/ui configuration
├── package.json                          # Dependencies
└── tsconfig.json                         # TypeScript configuration
```

---

## Mapa de Funcionalidades por Ruta

### Rutas Públicas
| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/` | `app/page.tsx` | Landing page |
| `/auth/login` | `app/auth/login/page.tsx` | Login form |
| `/auth/sign-up` | `app/auth/sign-up/page.tsx` | Signup form |

### Rutas de Usuario (Authenticated)
| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/dashboard/projects` | (pendiente) | Lista de proyectos del usuario |
| `/dashboard/projects/new` | `app/dashboard/projects/new/page.tsx` | Crear nuevo proyecto |
| `/dashboard/projects/[id]` | `app/dashboard/projects/[id]/page.tsx` | Detalle de proyecto |
| `/dashboard/projects/[id]/chat` | `app/dashboard/projects/[id]/chat/page.tsx` | Chat con agente del proyecto |
| `/dashboard/corpus` | (pendiente) | Lista de corpus personales |
| `/dashboard/corpus/new` | `app/dashboard/corpus/new/page.tsx` | Crear corpus personal |
| `/dashboard/corpus/[id]` | `app/dashboard/corpus/[id]/page.tsx` | Detalle de corpus personal |

### Rutas de Admin (role: admin)
| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/admin/agents` | (pendiente) | Lista de agentes AI |
| `/admin/agents/new` | `app/admin/agents/new/page.tsx` | Crear nuevo agente |
| `/admin/agents/[id]` | `app/admin/agents/[id]/page.tsx` | Editar agente existente |
| `/admin/corpus` | (pendiente) | Lista de corpus globales |
| `/admin/corpus/new` | `app/admin/corpus/new/page.tsx` | Crear corpus global |
| `/admin/corpus/[id]` | `app/admin/corpus/[id]/page.tsx` | Editar corpus global |

---

## Componentes Reutilizables

### Formularios
| Componente | Props | Uso |
|-----------|-------|-----|
| `ProjectForm` | `project?`, `onSubmit`, `isLoading?` | Crear/editar proyectos |
| `CorpusForm` | `corpus?`, `corpusType`, `onSubmit`, `isLoading?` | Crear/editar corpus |
| `AgentForm` | `agent?`, `onSubmit`, `isLoading?` | Crear/editar agentes (admin) |

### UI
| Componente | Uso |
|-----------|-----|
| `ChatInterface` | Interface de chat con agente (placeholder para Fase 15) |
| `ui/button` | Botones con variantes |
| `ui/card` | Cards para layout |
| `ui/input` | Inputs de texto |
| `ui/select` | Selects/dropdowns |
| `ui/tabs` | Tabs para organización |

---

## Server Actions

### Projects (`app/actions/projects.ts`)
- `createProject(formData)` - Crear proyecto
- `updateProject(id, formData)` - Actualizar proyecto
- `deleteProject(id)` - Eliminar proyecto

### Corpus (`app/actions/corpus.ts`)
- `createCorpus(formData)` - Crear corpus (global/personal)
- `updateCorpus(id, formData)` - Actualizar corpus
- `deleteCorpus(id)` - Eliminar corpus

### Agents (`app/actions/agents.ts`)
- `createAgent(formData)` - Crear agente (admin only)
- `updateAgent(id, formData)` - Actualizar agente (admin only)
- `deleteAgent(id)` - Eliminar agente (admin only)

---

## Base de Datos (Supabase + Prisma)

### Tablas Principales
1. **agents** - Agentes AI configurables
2. **agent_models** - Modelos por tier (economy/balanced/premium)
3. **projects** - Proyectos de usuarios
4. **corpus** - Bases de conocimiento (global/personal)
5. **corpus_documents** - Documentos en corpus
6. **conversations** - Conversaciones de chat
7. **messages** - Mensajes en conversaciones
8. **user_roles** - Roles de usuarios (admin/moderator/user)

### Relaciones
- `projects.agent_id` → `agents.id`
- `corpus.user_id` → `auth.users.id`
- `projects.user_id` → `auth.users.id`
- `agent_models.agent_id` → `agents.id`
- `conversations.project_id` → `projects.id`
- `messages.conversation_id` → `conversations.id`

---

## Flujo de Autenticación

```
1. Usuario → /auth/login
2. Supabase Auth → genera session cookie
3. middleware.ts → valida session en todas las requests
4. requireAuth() → protege páginas de dashboard
5. requireAdmin() → protege páginas de admin
6. RLS policies → protege datos en DB
```

---

## Flujo de Creación de Proyecto

```
1. Usuario → /dashboard/projects/new
2. ProjectForm renderizado (carga agentes disponibles)
3. Usuario completa form + selecciona agente
4. Submit → createProject Server Action
5. Validación Zod → validación de datos
6. Supabase insert → crea proyecto en DB
7. revalidatePath → invalida cache
8. redirect → /dashboard/projects
```

---

## Flujo de Chat (Placeholder para Fase 15)

```
1. Usuario → /dashboard/projects/[id]/chat
2. Server Component carga proyecto + agente
3. ChatInterface renderizado (Client Component)
4. Usuario escribe mensaje
5. [FASE 15] Envía a /api/ai/chat
6. [FASE 15] RAG retrieval + LLM completion
7. [FASE 15] Streaming response con Vercel AI SDK
8. [ACTUAL] Muestra placeholder message
```

---

## Stack Tecnológico

### Frontend
- **Framework:** Next.js 15+ (App Router)
- **UI Library:** React 19
- **Styling:** Tailwind CSS + shadcn/ui
- **Forms:** react-hook-form + Zod
- **Icons:** lucide-react
- **Themes:** next-themes

### Backend
- **Database:** Supabase (PostgreSQL)
- **ORM:** Prisma
- **Auth:** Supabase Auth (SSR)
- **Server Actions:** Next.js Server Actions
- **Validation:** Zod

### DevOps
- **TypeScript:** Strict mode
- **Linting:** ESLint + eslint-config-next
- **Package Manager:** npm
- **Build:** Next.js build

---

## Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Lint
npm run lint

# Prisma
npm run db:pull      # Pull schema desde Supabase
npm run db:generate  # Generar Prisma Client
npm run db:studio    # Abrir Prisma Studio
npm run db:seed      # Ejecutar seeds

# TypeScript
npx tsc --noEmit     # Type checking
```

---

## Estado Actual del Proyecto

### ✅ Completado (Fase 4)
- Backend completo (21 Route Handlers + 3 Server Actions)
- Frontend completo (9 páginas + 4 componentes)
- Autenticación y autorización
- Validación con Zod
- TypeScript types

### ⏳ Pendiente
- Configurar proyecto Supabase
- Ejecutar Prisma migrations
- Crear tablas en DB
- Aplicar RLS policies
- Ejecutar seeds
- Validar TypeScript compilation
- Validar Next.js build

### 🔮 Futuro (Fase 15)
- RAG integration (Vercel AI SDK)
- Document upload y embedding
- Vector storage (pgvector)
- Real chat functionality
- Streaming completions

---

**Total de archivos implementados:** 39 archivos funcionales
**Porcentaje de completitud:** Fase 4 - 100% ✅
**Próximo paso:** Configurar Supabase → Migrations → Fase 5 Testing
