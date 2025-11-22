# Project Scope - CJHIRASHI APP v0.1
## Alcances Confirmados de la Iteración

**Versión del Proyecto**: v0.1 (Primera implementación - En desarrollo)
**Fecha de Creación**: 2025-11-21
**Estado**: APROBADO POR USUARIO
**Responsable**: planner (fase-1-conceptualizacion-leader)

---

## 1. INFORMACIÓN DEL PROYECTO

### 1.1 Nombre del Proyecto
**CJHIRASHI APP** - Plataforma Modular de Agentes Inteligentes con RAG, Artifacts y MCP

### 1.2 Versión
**v0.1** - Primera Implementación Core (En desarrollo - No funcional)

### 1.3 Descripción General
CJHIRASHI APP es una plataforma full-stack que permite a usuarios interactuar con agentes inteligentes especializados, organizados en proyectos, con capacidades de RAG (Retrieval-Augmented Generation) mediante corpus de conocimiento personalizados.

**v0.1** es la primera implementación sobre la fundación base (Admin Panel + RBAC) agregando:
- Dashboard glassmorphic para usuarios regulares
- Sistema de agentes inteligentes
- Gestión de proyectos personales
- Sistema RAG con corpus de 2 niveles (Global + Personal)

### 1.4 Contexto del Proyecto

#### Sistema Existente (Base pre-v0.1)
- ✅ NextJS 15+ con App Router + React Server Components
- ✅ Supabase Auth (cookie-based) + PostgreSQL
- ✅ Admin Panel completo en `/admin/*` con RBAC (admin, moderator, user)
- ✅ User Management (CRUD completo)
- ✅ Audit Logging System (inmutable)
- ✅ Analytics Dashboard (con errores TypeScript pendientes)
- ✅ System Settings
- ✅ shadcn/ui components (new-york style)
- ✅ Documentación técnica completa (ADRs, arquitectura, seguridad)

#### Roadmap Completo (7 Módulos)
El ROADMAP define 7 módulos pendientes:
1. Dashboard Principal (Glassmorphic)
2. Agents & Projects (Core del sistema)
3. MCP Integrations (Drive, Notion, Gmail, etc.)
4. RAG System (Vector search con Qdrant)
5. Artifacts System (Versionado de artefactos)
6. Tier & Billing (Free, Pro, Elite)
7. Customization (Branding, themes)

#### Priorización para v0.1 (Confirmada por Usuario)
**Opción A: Core Funcional** (11 semanas)
- **Fase 11**: Corrección de errores TypeScript (1-2 días)
- **Fase 12**: Dashboard Glassmorphic en `/dashboard/*` (2 semanas)
- **Fase 13**: Agents & Projects con modelo de proyectos personales (4 semanas)
- **Fase 15**: RAG System con corpus personales (4 semanas)

**CRÍTICO**: Implementación secuencial, cada fase depende de la anterior.

---

## 2. OBJETIVOS DEL NEGOCIO

### 2.1 Objetivos Principales de v0.1

#### OBJ-1: Habilitar Interacción con Agentes Inteligentes
**Descripción**: Permitir a usuarios crear y usar agentes especializados (Escritor, Analista, Investigador, etc.)
**KPI**: Mínimo 3 agentes pre-configurados disponibles al finalizar v0.1
**Impacto**: Fundamental - Core del valor de la plataforma

#### OBJ-2: Gestión de Proyectos Personales por Usuario
**Descripción**: Cada usuario puede crear proyectos privados, asignados a agentes específicos
**Modelo Confirmado**:
- Proyectos son personales (no compartidos entre usuarios)
- Capacidad de proyectos configurable por agente (ej: "Escritor de Libros" → tipo "Libro")
- Ejemplos de tipos: Libro, Análisis, Investigación, Campaña

**KPI**: Sistema permite crear/editar/eliminar proyectos con asignación de agentes
**Impacto**: Alto - Organización del trabajo del usuario

#### OBJ-3: Sistema RAG con Corpus de 2 Niveles
**Descripción**: Proveer contexto enriquecido a agentes mediante corpus de conocimiento

**Modelo Confirmado**:

**Corpus Global** (Admin-managed):
- Admin crea corpus global (ej: "Manual de Estilo Corporativo")
- Admin asigna corpus a agentes específicos
- Todos los usuarios que usen ese agente acceden al corpus global
- Uso: Conocimiento organizacional compartido

**Corpus Personal** (User-managed):
- Usuario crea corpus personal (ej: "Mis Notas de Proyecto X")
- Usuario asigna corpus solo a agentes que permiten corpus personal (flag en agente)
- Corpus es privado del usuario
- Uso: Conocimiento personal, proyectos específicos, datos sensibles

**KPI**:
- Sistema permite crear ambos tipos de corpus
- Agentes consumen corpus según configuración (Global + Personal si permitido)
**Impacto**: Alto - Diferenciador clave vs. ChatGPT genérico

#### OBJ-4: Dashboard Glassmorphic para Usuarios Regulares
**Descripción**: Interfaz moderna separada del admin panel
**KPI**: Dashboard funcional en `/dashboard/*` con métricas de uso
**Impacto**: Alto - Experiencia de usuario moderna

### 2.2 Objetivos Secundarios

#### OBJ-5: Corregir Errores TypeScript Existentes
**Descripción**: Resolver errores conocidos en Analytics module (Date | undefined)
**KPI**: Build sin errores TypeScript
**Impacto**: Medio - Calidad del código

### 2.3 Métricas de Éxito de v0.1

| Métrica | Objetivo | Método de Medición |
|---------|----------|-------------------|
| Build sin errores TypeScript | 0 errores | `npm run build` exitoso |
| Agentes disponibles | Mínimo 3 | Conteo en tabla `agents` |
| Proyectos creables por usuario | Ilimitados (v0.1) | CRUD funcional sin límites |
| Corpus Global funcionales | Mínimo 1 demo | Admin puede crear y asignar |
| Corpus Personal funcionales | Sistema implementado | Usuario puede crear si agente permite |
| Dashboard glassmorphic | Página `/dashboard/*` funcional | Navegación exitosa |
| Tests pasando | 100% de tests nuevos | Suite de tests completa |

---

## 3. USUARIOS Y STAKEHOLDERS

### 3.1 Perfiles de Usuario

#### P1: Administrador del Sistema
**Descripción**: Gestiona usuarios, agentes, corpus global, configuración
**Necesidades**:
- Crear agentes pre-configurados (nombre, modelo, capacidades)
- Crear corpus global y asignarlos a agentes
- Monitorear uso del sistema
**Prioridad**: Alta
**Acceso**: `/admin/*` + `/dashboard/*` (pueden navegar entre ambas áreas)

#### P2: Usuario Regular (Free/Pro/Elite)
**Descripción**: Interactúa con agentes, crea proyectos, gestiona corpus personal
**Necesidades**:
- Crear proyectos personales
- Asignar agentes a proyectos
- Crear corpus personal para agentes que lo permitan
- Ver métricas de uso en dashboard
**Prioridad**: Alta
**Acceso**: `/dashboard/*` únicamente

#### P3: Moderador (Opcional en v2.0)
**Descripción**: Rol intermedio con permisos limitados
**Necesidades**: Por definir en arquitectura
**Prioridad**: Baja (puede diferirse a futuras versiones)
**Acceso**: `/admin/*` con permisos restringidos

### 3.2 Stakeholders Técnicos

| Stakeholder | Interés | Influencia |
|-------------|---------|------------|
| CEO (orchestrator-main) | Éxito del proyecto completo | Alta |
| Product Owner (usuario real) | Funcionalidad core operativa | Alta |
| QA Team (fase-6-qa-leader) | Calidad del software | Media |
| DevOps (fase-8-deployment-leader) | Deployment exitoso | Media |

---

## 4. FUNCIONALIDADES PRINCIPALES

### 4.1 Fase 11: Corrección de Errores TypeScript

**Categoría**: Mantenimiento
**Prioridad**: Crítica (Bloqueante)
**Estimación**: 1-2 días

#### F11-01: Resolver Errores en Analytics Module
**Descripción**: Corregir errores de tipo `Date | undefined` en componentes de analytics
**User Story**: Como desarrollador, necesito que el build pase sin errores para poder desplegar
**Criterios de Aceptación**:
- [ ] `npm run build` exitoso sin errores TypeScript
- [ ] Analytics module funcional sin warnings
- [ ] Tests pasando para componentes corregidos

#### F11-02: Validar Build Completo
**Descripción**: Asegurar que todo el proyecto compila correctamente
**User Story**: Como DevOps, necesito un build limpio para deployment
**Criterios de Aceptación**:
- [ ] Build completo sin errores
- [ ] Todos los componentes existentes funcionan
- [ ] Sin regresiones en funcionalidades existentes

---

### 4.2 Fase 12: Dashboard Glassmorphic

**Categoría**: UI/UX
**Prioridad**: Alta
**Estimación**: 2 semanas

#### F12-01: Layout Base del Dashboard
**Descripción**: Estructura base de `/dashboard/*` con navegación
**User Story**: Como usuario regular, necesito acceder a un dashboard moderno separado del admin
**Criterios de Aceptación**:
- [ ] Ruta `/dashboard` protegida (requiere autenticación)
- [ ] Layout con sidebar glassmorphic
- [ ] Navegación funcional entre secciones
- [ ] Header con user profile y logout

#### F12-02: Dashboard Home con Métricas
**Descripción**: Página principal con métricas de uso
**User Story**: Como usuario, quiero ver un resumen de mi actividad
**Métricas a Mostrar**:
- Proyectos activos (conteo)
- Agentes usados (conteo)
- Corpus personales (conteo)
- Última actividad (timestamp)
**Criterios de Aceptación**:
- [ ] Cards glassmorphic con métricas
- [ ] Datos reales desde Supabase
- [ ] Responsive design

#### F12-03: Arquitectura de Paneles Separados
**Decisión Confirmada por Usuario**:
- **Admin Panel**: `/admin/*` (solo admin + moderator)
- **User Dashboard**: `/dashboard/*` (todos los usuarios autenticados)
- **Branding**: ÚNICO para toda la aplicación (mismo logo, colores)
- **Navegación**: Admins pueden navegar entre `/admin/*` y `/dashboard/*`

**Criterios de Aceptación**:
- [ ] Middleware redirige según rol:
  - Admin → puede acceder a ambas áreas
  - Moderator → puede acceder a ambas áreas
  - User → solo `/dashboard/*`
- [ ] Branding consistente en ambas áreas
- [ ] Admins tienen botón "Ver Dashboard" y "Ver Admin"

---

### 4.3 Fase 13: Agents & Projects

**Categoría**: Core Functionality
**Prioridad**: Crítica
**Estimación**: 4 semanas

#### F13-01: Database Schema para Agents

**Tabla `agents`**:
```sql
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  model_provider VARCHAR(50) NOT NULL, -- 'openai', 'anthropic', 'google'
  model_name VARCHAR(100) NOT NULL, -- 'gpt-4o', 'claude-3.5-sonnet', etc.
  temperature DECIMAL(2,1) DEFAULT 0.7,
  max_tokens INTEGER,
  allows_personal_corpus BOOLEAN DEFAULT false,
  project_type VARCHAR(50), -- 'Libro', 'Análisis', 'Investigación', etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Criterios de Aceptación**:
- [ ] Tabla creada con migración Prisma
- [ ] RLS policies configuradas
- [ ] Seed data con 3 agentes demo

#### F13-02: CRUD de Agents (Admin)
**Descripción**: Admin puede crear, editar, eliminar agentes
**User Story**: Como admin, necesito configurar agentes especializados para mis usuarios
**Criterios de Aceptación**:
- [ ] Formulario de creación en `/admin/agents/new`
- [ ] Listado de agentes en `/admin/agents`
- [ ] Edición de agentes existentes
- [ ] Soft delete (is_active = false)
- [ ] Validación con Zod
- [ ] Audit logging de operaciones

#### F13-03: Database Schema para Projects

**Modelo Confirmado**:
- Proyectos son personales (pertenecen a un usuario)
- Capacidad de proyectos configurable por agente
- Tipo de proyecto depende del agente (ej: "Libro" para agente Escritor)

**Tabla `projects`**:
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE RESTRICT,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  project_type VARCHAR(50), -- Heredado de agent.project_type
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'archived', 'completed'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Criterios de Aceptación**:
- [ ] Tabla creada con migración Prisma
- [ ] RLS policies: Usuario solo ve SUS proyectos
- [ ] Index en user_id para performance
- [ ] FK constraints configurados

#### F13-04: CRUD de Projects (User Dashboard)
**Descripción**: Usuario gestiona sus proyectos personales
**User Story**: Como usuario, quiero organizar mi trabajo en proyectos asignados a agentes
**Criterios de Aceptación**:
- [ ] Listado de proyectos en `/dashboard/projects`
- [ ] Crear proyecto en `/dashboard/projects/new`
- [ ] Selector de agente (dropdown)
- [ ] project_type se hereda del agente seleccionado
- [ ] Editar/archivar proyectos
- [ ] Validación: Usuario solo puede gestionar SUS proyectos
- [ ] Tests de autorización

#### F13-05: Agentes Pre-configurados (Seed Data)
**Descripción**: Agentes demo listos para usar
**Agentes Mínimos**:

1. **Escritor de Libros**
   - Modelo: Claude 3.5 Sonnet
   - project_type: "Libro"
   - allows_personal_corpus: true
   - System prompt: Especializado en escritura creativa

2. **Analista de Datos**
   - Modelo: GPT-4o
   - project_type: "Análisis"
   - allows_personal_corpus: true
   - System prompt: Especializado en análisis cuantitativo

3. **Investigador Técnico**
   - Modelo: Claude 3.5 Sonnet
   - project_type: "Investigación"
   - allows_personal_corpus: false
   - System prompt: Especializado en investigación técnica

**Criterios de Aceptación**:
- [ ] Seed script crea 3 agentes
- [ ] Visible en `/dashboard` para usuarios
- [ ] Funcionales para crear proyectos

---

### 4.4 Fase 15: RAG System

**Categoría**: AI/ML
**Prioridad**: Alta
**Estimación**: 4 semanas

#### F15-01: Database Schema para Corpus (2 Niveles)

**Modelo Confirmado**:
- **Corpus Global**: Admin crea, asigna a agentes, visible para todos
- **Corpus Personal**: Usuario crea, asigna solo a agentes con `allows_personal_corpus = true`

**Tabla `corpora`**:
```sql
CREATE TABLE corpora (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  corpus_type VARCHAR(20) NOT NULL, -- 'global' | 'personal'
  created_by UUID NOT NULL REFERENCES auth.users(id),
  owner_user_id UUID REFERENCES auth.users(id), -- NULL si global, user_id si personal
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Tabla `corpus_agent_assignments`**:
```sql
CREATE TABLE corpus_agent_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corpus_id UUID NOT NULL REFERENCES corpora(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(corpus_id, agent_id)
);
```

**Criterios de Aceptación**:
- [ ] Tablas creadas con migraciones Prisma
- [ ] RLS policies:
  - Global corpus: Admin crea, todos leen
  - Personal corpus: Usuario solo ve SUS corpus
- [ ] Validación: Corpus personal solo asignable a agentes con `allows_personal_corpus = true`

#### F15-02: CRUD de Corpus Global (Admin)
**Descripción**: Admin gestiona corpus organizacional
**User Story**: Como admin, quiero crear corpus compartidos para todos los usuarios de un agente
**Criterios de Aceptación**:
- [ ] Formulario en `/admin/corpus/new`
- [ ] Listado en `/admin/corpus`
- [ ] Asignación a múltiples agentes
- [ ] Upload de documentos (interfaz básica)
- [ ] Validación con Zod
- [ ] Audit logging

#### F15-03: CRUD de Corpus Personal (User Dashboard)
**Descripción**: Usuario gestiona sus corpus privados
**User Story**: Como usuario, quiero crear corpus personales para mis proyectos específicos
**Criterios de Aceptación**:
- [ ] Formulario en `/dashboard/corpus/new`
- [ ] Listado de corpus personales
- [ ] Asignación SOLO a agentes con `allows_personal_corpus = true`
- [ ] Validación: UI muestra solo agentes permitidos
- [ ] Upload de documentos
- [ ] Tests de autorización

#### F15-04: Integración con Qdrant (Vector Database)

**Tabla `embeddings`**:
```sql
CREATE TABLE embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corpus_id UUID NOT NULL REFERENCES corpora(id) ON DELETE CASCADE,
  document_id UUID NOT NULL, -- referencia a documento fuente
  chunk_text TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  qdrant_point_id UUID NOT NULL, -- ID del vector en Qdrant
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Criterios de Aceptación**:
- [ ] Conexión a Qdrant Cloud configurada
- [ ] Colección creada en Qdrant
- [ ] Pipeline de embeddings:
  - Upload documento → Chunking → Embedding → Store en Qdrant + PostgreSQL
- [ ] Endpoint de búsqueda semántica funcional
- [ ] Tests de integración con Qdrant

#### F15-05: Retrieval en Agents
**Descripción**: Agentes consumen corpus global + personal en contexto
**User Story**: Como usuario, cuando chateé con un agente, este debe usar corpus relevante
**Lógica de Retrieval**:
1. Usuario inicia chat con agente
2. Sistema identifica corpus asignados al agente:
   - Corpus global asignados al agente (todos ven)
   - Corpus personal del usuario asignados al agente (solo si `allows_personal_corpus = true`)
3. Query → Semantic search en Qdrant
4. Top-k chunks relevantes → Inyectados en prompt del agente

**Criterios de Aceptación**:
- [ ] Endpoint `/api/agents/{id}/chat` implementado
- [ ] Retrieval combina corpus global + personal
- [ ] Contexto inyectado correctamente en prompt
- [ ] Tests de retrieval con corpus mixtos

---

## 5. ESTILO VISUAL Y DISEÑO

### 5.1 Paleta de Colores

**Tema Base**: Glassmorphic Dark Cyan (customizable en futuro)

```css
:root {
  /* Primary Colors (Cyan Glassmorphic) */
  --primary-cyan: #06b6d4; /* Cyan-500 */
  --primary-cyan-dark: #0891b2; /* Cyan-600 */
  --primary-cyan-light: #22d3ee; /* Cyan-400 */

  /* Background (Dark) */
  --bg-primary: #0f172a; /* Slate-900 */
  --bg-secondary: #1e293b; /* Slate-800 */
  --bg-tertiary: #334155; /* Slate-700 */

  /* Glassmorphism */
  --glass-bg: rgba(15, 23, 42, 0.7); /* bg-primary con alpha */
  --glass-border: rgba(34, 211, 238, 0.2); /* Cyan con alpha */
  --glass-backdrop: blur(12px);

  /* Text */
  --text-primary: #f8fafc; /* Slate-50 */
  --text-secondary: #cbd5e1; /* Slate-300 */
  --text-muted: #64748b; /* Slate-500 */

  /* Status Colors */
  --success: #10b981; /* Green-500 */
  --warning: #f59e0b; /* Amber-500 */
  --error: #ef4444; /* Red-500 */
}
```

### 5.2 Tipografía

**Primaria**: Inter (sans-serif)
**Secundaria**: Poppins (para headings)

```css
/* Headings */
h1 { font-family: 'Poppins', sans-serif; font-weight: 700; }
h2, h3 { font-family: 'Poppins', sans-serif; font-weight: 600; }

/* Body */
body { font-family: 'Inter', sans-serif; font-weight: 400; }
```

### 5.3 Estilo Glassmorphic

**Componentes con Efecto de Vidrio**:
- Cards
- Modals
- Sidebar
- Dropdowns

**Propiedades CSS**:
```css
.glass-card {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-backdrop);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  box-shadow: 0 8px 32px 0 rgba(6, 182, 212, 0.1);
}
```

### 5.4 Referencias de Diseño

**Inspiración**:
- [Tailwind UI Glassmorphism](https://tailwindui.com/)
- [shadcn/ui Dark Theme](https://ui.shadcn.com/)
- [Vercel Dashboard](https://vercel.com/dashboard)

**Mockups**: Por crear en Fase 3 (Diseño Detallado)

### 5.5 Branding

**Decisión Confirmada**:
- Branding ÚNICO para toda la aplicación
- Mismo logo en `/admin/*` y `/dashboard/*`
- Misma paleta de colores
- Admin panel puede tener variación de tono (más oscuro/profesional)
- Dashboard puede ser más vibrante (efecto glassmorphic más pronunciado)

**Logo**: TBD (puede usar placeholder inicial)

---

## 6. REQUISITOS TÉCNICOS

### 6.1 Stack Tecnológico (NextJS + Supabase + Vercel AI SDK)

**CRÍTICO**: Este proyecto usa stack ESPECÍFICO confirmado en Bootstrap.

#### Frontend
| Tecnología | Versión | Uso |
|------------|---------|-----|
| Next.js | 15+ | Framework principal (App Router) |
| React | 19 | UI library |
| TypeScript | 5+ | Lenguaje |
| Tailwind CSS | 3+ | Styling |
| shadcn/ui | Latest | Componentes (new-york style) |
| Lucide React | Latest | Iconos |
| React Hook Form | Latest | Formularios |
| Zod | Latest | Validación |
| Framer Motion | Latest | Animaciones |

#### Backend
| Tecnología | Versión | Uso |
|------------|---------|-----|
| Next.js API Routes | 15+ | RESTful endpoints |
| Server Actions | 15+ | Form mutations |
| Supabase Auth | Latest | Autenticación |
| PostgreSQL | 15+ | Base de datos (vía Supabase) |
| Prisma Client | 5+ | ORM |
| Zod | Latest | Validación de schemas |

#### AI & RAG
| Tecnología | Versión | Uso |
|------------|---------|-----|
| Vercel AI SDK | Latest | Unified AI interface |
| OpenAI | GPT-4o | Modelo LLM principal |
| Anthropic | Claude 3.5 Sonnet | Modelo LLM alternativo |
| Qdrant | Cloud/Self-hosted | Vector database |
| Vercel AI Embeddings | Latest | Generación de embeddings |

#### Infrastructure
| Tecnología | Versión | Uso |
|------------|---------|-----|
| Vercel | Latest | Hosting + Edge Functions |
| Supabase | Latest | Auth + PostgreSQL + Storage |
| Qdrant Cloud | Latest | Vector database |

### 6.2 Integraciones Externas

#### Integración 1: Vercel AI SDK
**Tipo**: AI/ML
**Propósito**: Interface unificada para múltiples providers de LLM
**Endpoints**:
- `/api/chat` - Streaming chat con agentes
- `/api/embeddings` - Generación de embeddings

#### Integración 2: Qdrant Cloud
**Tipo**: Vector Database
**Propósito**: Almacenamiento y búsqueda de embeddings
**Configuración**:
- URL: Environment variable `QDRANT_URL`
- API Key: Environment variable `QDRANT_API_KEY`
- Colección: `cjhirashi_corpus_vectors`

#### Integración 3: OpenAI API
**Tipo**: LLM Provider
**Propósito**: GPT-4o para agentes
**Configuración**:
- API Key: Environment variable `OPENAI_API_KEY`

#### Integración 4: Anthropic API
**Tipo**: LLM Provider
**Propósito**: Claude 3.5 Sonnet para agentes
**Configuración**:
- API Key: Environment variable `ANTHROPIC_API_KEY`

### 6.3 Variables de Entorno (v0.1)

```env
# Existing (pre-v0.1)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=

# New (v2.0)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
QDRANT_URL=
QDRANT_API_KEY=
VERCEL_AI_SDK_KEY= # Si usa Vercel AI Provider
```

---

## 7. REQUISITOS NO FUNCIONALES

### 7.1 Performance

| Métrica | Objetivo | Método de Medición |
|---------|----------|-------------------|
| Time to First Byte (TTFB) | < 200ms | Vercel Analytics |
| Largest Contentful Paint (LCP) | < 2.5s | Lighthouse |
| First Input Delay (FID) | < 100ms | Lighthouse |
| Cumulative Layout Shift (CLS) | < 0.1 | Lighthouse |
| Chat Response Time | < 3s (streaming) | Custom metrics |
| RAG Query Time | < 500ms | Custom metrics |

### 7.2 Seguridad

**Modelo de Seguridad**: Defense in Depth (5 capas)

| Capa | Implementación | Estado |
|------|---------------|--------|
| Middleware | Session validation | ✅ Implementado (v1.0) |
| Layout/Page | `requireAdmin()`, `requireModerator()` | ✅ Implementado (v1.0) |
| API/Server Actions | Zod validation + Re-authorization | ✅ Implementado (v1.0) |
| Database Queries | Parameterized queries | ✅ Implementado (v1.0) |
| RLS Policies | PostgreSQL Row Level Security | 🔄 Expandir para agents, projects, corpora |

**Requisitos Adicionales para v2.0**:
- [ ] RLS policies para `agents` (admin full, users read)
- [ ] RLS policies para `projects` (user solo SUS proyectos)
- [ ] RLS policies para `corpora`:
  - Global: Admin crea, todos leen
  - Personal: User solo SUS corpus
- [ ] API keys de LLM encriptadas en entorno (Vercel)
- [ ] Rate limiting en endpoints de chat (evitar abuso)

### 7.3 Escalabilidad

**Objetivos para v2.0**:
- [ ] Soportar 100 usuarios concurrentes en chat
- [ ] Soportar 1000 proyectos totales
- [ ] Soportar 10,000 documentos en corpus combinados
- [ ] Vector database (Qdrant) escalable hasta 1M embeddings

**Estrategia**:
- Vercel Edge Functions para chat streaming
- Qdrant Cloud con auto-scaling
- PostgreSQL connection pooling (Supabase)
- Caching de agentes en memoria (Next.js cache)

### 7.4 Usabilidad

| Aspecto | Requisito | Validación |
|---------|-----------|------------|
| Tiempo de aprendizaje | Usuario nuevo puede crear proyecto en < 5 min | User testing |
| Accesibilidad | WCAG 2.1 AA | Lighthouse audit |
| Responsive | Funcional en mobile (320px+) | Manual testing |
| Error messages | Mensajes claros y accionables | QA review |

### 7.5 Mantenibilidad

- [ ] Código TypeScript strict mode
- [ ] Tests coverage > 80% para código nuevo
- [ ] Documentación de ADRs para decisiones arquitectónicas
- [ ] Changelog actualizado por fase

---

## 8. RESTRICCIONES

### 8.1 Restricciones de Tiempo

**Timeline Total de v2.0**: ~11 semanas

| Fase | Duración | Fecha Inicio | Fecha Fin (Estimada) |
|------|----------|--------------|---------------------|
| Fase 11: Fix TypeScript | 1-2 días | Inmediato | +2 días |
| Fase 12: Dashboard | 2 semanas | Después Fase 11 | +2 semanas |
| Fase 13: Agents & Projects | 4 semanas | Después Fase 12 | +4 semanas |
| Fase 15: RAG System | 4 semanas | Después Fase 13 | +4 semanas |

**Hitos Críticos**:
- Día 2: Build sin errores TypeScript
- Semana 2: Dashboard funcional
- Semana 6: Proyectos y agentes operativos
- Semana 10: Sistema RAG completo

### 8.2 Restricciones Presupuestarias

**IMPORTANTE**: v2.0 NO incluye Tier & Billing system.

**Limitaciones**:
- No hay límites de uso por usuario en v2.0
- Proyectos ilimitados por usuario
- Corpus ilimitados por usuario
- Tokens de LLM sin restricción (riesgo de costos)

**Mitigación**:
- Monitoreo manual de costos de API (OpenAI, Anthropic)
- Considerar implementar rate limiting básico
- Diferir sistema de tiers a v3.0

### 8.3 Restricciones Tecnológicas

**Obligatorias**:
- ✅ NextJS 15+ (App Router)
- ✅ Supabase (Auth + PostgreSQL)
- ✅ Vercel AI SDK (NO usar LangChain u otros)
- ✅ Qdrant (Vector DB específico del ROADMAP)
- ✅ Prisma (ORM)
- ✅ shadcn/ui (Componentes)

**Prohibidas**:
- ❌ NO usar LangChain (ROADMAP especifica Vercel AI SDK)
- ❌ NO usar Pinecone, Weaviate, u otro vector DB (ROADMAP especifica Qdrant)
- ❌ NO usar Firebase, AWS Cognito (auth es Supabase)
- ❌ NO cambiar de NextJS a otros frameworks

### 8.4 Restricciones de Compliance

**v2.0 NO implementa compliance formal**, pero debe considerar:

- [ ] GDPR básico: Usuario puede eliminar sus proyectos y corpus
- [ ] Datos sensibles: Corpus personal NO compartido entre usuarios
- [ ] API keys: Almacenadas en environment variables (no en DB)

**Diferido a v3.0+**:
- Data residency (región de servidores)
- Encriptación avanzada
- Compliance formal (SOC2, HIPAA)

---

## 9. CRITERIOS DE ÉXITO

### 9.1 Criterios Técnicos

| Criterio | Definición de "Éxito" | Validación |
|----------|----------------------|------------|
| Build sin errores | `npm run build` exitoso | CI/CD check |
| Tests pasando | 100% de tests nuevos pasan | Jest + Playwright |
| TypeScript strict | No errores en modo strict | `tsc --noEmit` |
| Lighthouse Score | Performance > 90 | Lighthouse CI |
| Security audit | No vulnerabilidades críticas | `npm audit` |

### 9.2 Criterios Funcionales

| Funcionalidad | Criterio de Aceptación | Owner |
|---------------|----------------------|-------|
| Dashboard glassmorphic | Página `/dashboard` renderiza correctamente | Product Owner |
| Crear proyecto | Usuario puede crear proyecto y asignarlo a agente | Product Owner |
| Corpus global | Admin puede crear corpus y asignarlo a agentes | Product Owner |
| Corpus personal | Usuario puede crear corpus personal para agentes permitidos | Product Owner |
| Chat con agente | Usuario puede chatear con agente usando proyecto | Product Owner |
| RAG retrieval | Agente usa corpus global + personal en respuestas | Product Owner |

### 9.3 Criterios de Calidad

| Aspecto | Objetivo | Medición |
|---------|----------|----------|
| Code coverage | > 80% para código nuevo | Jest coverage report |
| Code review | 100% de PRs revisados | GitHub PR process |
| Documentation | Todos los ADRs documentados | Manual review |
| Performance | Chat streaming < 3s | Load testing |

### 9.4 Criterios de Usuario

**Validación con Product Owner**:
- [ ] Dashboard es visualmente atractivo (glassmorphic)
- [ ] Flujo de crear proyecto es intuitivo
- [ ] Sistema de corpus tiene sentido (Global vs Personal)
- [ ] Chat con agente es fluido y rápido

---

## 10. FUERA DE ALCANCE (v2.0)

**IMPORTANTE**: Estos elementos están en el ROADMAP pero NO se implementan en v2.0.

### 10.1 Funcionalidades Diferidas

| Funcionalidad | Roadmap Phase | Razón de Diferimiento |
|---------------|--------------|----------------------|
| MCP Integrations | Fase 14 | Requiere Agents operativo primero |
| Artifacts System | Fase 16 | Requiere Projects + RAG primero |
| Tier & Billing | Fase 17 | No crítico para MVP |
| Customization (Branding avanzado) | Fase 18 | No crítico para MVP |
| Command Palette | Fase 12 (parcial) | Puede ser simple en v2.0 |
| Colaboración en Proyectos | No planificado | Proyectos son personales en v2.0 |

### 10.2 Características No Incluidas

- ❌ **NO** hay sistema de roles granular (solo admin/moderator/user)
- ❌ **NO** hay límites de proyectos por usuario (ilimitados en v2.0)
- ❌ **NO** hay límites de tokens por usuario (riesgo de costos)
- ❌ **NO** hay billing/subscripciones
- ❌ **NO** hay colaboración multi-usuario en proyectos
- ❌ **NO** hay versionado de artefactos (artifacts system diferido)
- ❌ **NO** hay integraciones MCP (Drive, Notion, Gmail diferidas)
- ❌ **NO** hay customization avanzada (branding fijo en v2.0)
- ❌ **NO** hay analytics avanzado (solo métricas básicas en dashboard)
- ❌ **NO** hay notificaciones (diferido a v3.0+)
- ❌ **NO** hay búsqueda global (puede ser simple search por nombre)

### 10.3 Integraciones No Incluidas

- ❌ Google Drive (MCP)
- ❌ Notion (MCP)
- ❌ Gmail (MCP)
- ❌ Stripe (Billing)
- ❌ Webhooks externos
- ❌ Zapier/n8n

### 10.4 Optimizaciones No Prioritarias

- ❌ Caching avanzado de embeddings
- ❌ Pre-fetching de respuestas de agentes
- ❌ Optimización de bundle size (puede ser básico)
- ❌ Server-side rendering de chat (puede ser client-side)
- ❌ Offline mode (requiere conexión)

---

## Resumen Ejecutivo

### Alcances Confirmados de v2.0

**Objetivo Principal**: Transformar CJHIRASHI APP de fundación (admin panel) a plataforma funcional de agentes inteligentes con RAG.

**Componentes Críticos**:
1. ✅ Dashboard glassmorphic en `/dashboard/*`
2. ✅ Sistema de agentes configurables por admin
3. ✅ Gestión de proyectos personales por usuario
4. ✅ Sistema RAG de 2 niveles (Global + Personal)
5. ✅ Corrección de errores TypeScript existentes

**Duración**: ~11 semanas
**Riesgo**: Medio (depende de integración Qdrant + Vercel AI SDK)
**Valor**: Alto (core del producto)

**Aprobación**: ✅ CONFIRMADO POR USUARIO

---

**Última Actualización**: 2025-11-21
**Próximo Paso**: system-analyzer generará gap-analysis.md comparando v1.0 vs v2.0
