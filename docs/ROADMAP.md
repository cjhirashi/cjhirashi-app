# ROADMAP - CJHIRASHI APP
## Plataforma Modular de Agentes Inteligentes con RAG, Artifacts y MCP

**Versión:** 1.0
**Fecha de Creación:** 2025-11-11
**Última Actualización:** 2025-11-11
**Responsable:** Project Planner & Coordinator

---

## 📋 Índice

1. [Visión General del Proyecto](#1-visión-general-del-proyecto)
2. [Fundamentos Técnicos](#2-fundamentos-técnicos)
3. [Estado Actual](#3-estado-actual)
4. [Módulos del Sistema](#4-módulos-del-sistema)
5. [Fases de Implementación](#5-fases-de-implementación)
6. [Coordinación de Especialistas](#6-coordinación-de-especialistas)
7. [Flujo de Trabajo](#7-flujo-de-trabajo)
8. [Puertas de Validación](#8-puertas-de-validación)
9. [Gestión del Roadmap](#9-gestión-del-roadmap)
10. [Métricas de Éxito](#10-métricas-de-éxito)

---

## 1. Visión General del Proyecto

### 1.1 Descripción

**CJHIRASHI APP** es una plataforma modular y escalable que integra agentes inteligentes especializados con capacidades avanzadas de RAG (Retrieval-Augmented Generation), gestión de artefactos versionados, y conexiones personales a servicios externos mediante MCP (Model Context Protocol).

La plataforma está diseñada para ser:
- **Multimodal**: Soporte para texto, imágenes, datasets, y más
- **Multiusuario**: Sistema robusto de roles y permisos (RBAC)
- **Segura**: Múltiples capas de seguridad (defense-in-depth)
- **Customizable**: Temas personalizables, branding configurable
- **Escalable**: Arquitectura modular que crece con las necesidades

### 1.2 Objetivos Core

1. **Democratizar el acceso a IA**: Permitir a usuarios de diferentes niveles técnicos aprovechar agentes inteligentes
2. **Contexto Enriquecido**: Proveer a los agentes de contexto relevante mediante RAG personal y organizacional
3. **Memoria del Sistema**: Mantener artefactos versionados que sirvan como memoria estructurada
4. **Integración Personal**: Conectar servicios personales (Drive, Notion, Gmail, etc.) de forma segura
5. **Control Administrativo**: Panel completo para gestionar usuarios, costos, seguridad y branding

### 1.3 Usuarios Objetivo

#### Roles de Usuario

| Rol | Descripción | Capacidades |
|-----|-------------|-------------|
| **Admin** | Administrador del sistema | Crear agentes, gestionar usuarios, configurar integraciones globales, branding, billing |
| **User (Elite)** | Usuario premium | Acceso a todos los modelos (Economy, Balanced, Premium), proyectos ilimitados |
| **User (Pro)** | Usuario profesional | Acceso a modelos Economy y Balanced, proyectos limitados |
| **User (Free)** | Usuario gratuito | Solo modelos Economy, proyectos muy limitados, retención 7 días |
| **Guest Collaborator** | Colaborador invitado | Participación en proyectos específicos, puede conectar MCP personal |
| **Guest Demo** | Usuario de demostración | Acceso limitado temporal, sin persistencia |

### 1.4 Casos de Uso Principales

1. **Creación de Contenido**: Escritores que generan libros con agentes especializados usando su corpus personal
2. **Análisis de Datos**: Analistas que procesan datasets con contexto de proyectos anteriores
3. **Investigación**: Investigadores que consultan corpus técnicos con agentes especializados
4. **Gestión de Proyectos**: Teams que colaboran en proyectos con artefactos compartidos
5. **Automatización Personal**: Usuarios que conectan sus servicios (Gmail, Drive, Calendar) para automatizar workflows

---

## 2. Fundamentos Técnicos

### 2.1 Stack Tecnológico

#### Frontend
- **Framework**: Next.js 15+ (App Router, React Server Components)
- **UI Library**: React 19
- **Styling**: Tailwind CSS + shadcn/ui (new-york style)
- **Theme**: Glassmorphic dark cyan (customizable)
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod
- **Animations**: Framer Motion
- **Typography**: Inter / Poppins

#### Backend
- **API**: Next.js API Routes + Server Actions
- **Auth**: Supabase Auth (cookie-based)
- **Database**: PostgreSQL 15+ (Supabase)
- **ORM**: Prisma Client (hybrid approach) + Supabase Client
- **Validation**: Zod schemas
- **RAG**: Qdrant (vector database)
- **Embeddings**: Vercel AI SDK (configurable provider)

#### IA & Agents
- **SDK**: Vercel AI SDK (unified interface)
- **LLMs**: Multi-provider (OpenAI, Anthropic, Google, etc.)
- **Embeddings**: Configurable (OpenAI, Cohere, etc.)
- **Image Gen**: Configurable (DALL-E, Midjourney, etc.)
- **MCP**: Personal integrations per user

#### Infrastructure
- **Hosting**: Vercel (Edge Functions + Serverless)
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **Vector DB**: Qdrant Cloud (o self-hosted)
- **File Storage**: Supabase Storage + MCP integrations
- **Monitoring**: Vercel Analytics + Custom metrics

### 2.2 Decisiones Arquitectónicas

Todas las decisiones arquitectónicas clave están documentadas como ADRs (Architecture Decision Records) en `docs/decisions/`:

| ADR | Decisión | Justificación |
|-----|----------|---------------|
| [ADR-001](./decisions/adr-001-rbac-implementation.md) | RBAC híbrido (tabla DB + verificación en múltiples capas) | Seguridad robusta, actualización instantánea, sin infraestructura adicional |
| [ADR-002](./decisions/adr-002-database-schema.md) | Schema modular iterativo | Balance entre completitud y simplicidad, escalable |
| [ADR-003](./decisions/adr-003-api-route-structure.md) | Híbrido API Routes + Server Actions | RESTful para CRUD, Server Actions para formularios |
| [ADR-004](./decisions/adr-004-security-layers.md) | Defensa en profundidad (5 capas) | Máxima seguridad, capas independientes |
| [ADR-005](./decisions/adr-005-orm-vs-raw-sql.md) | SQL para migraciones + Prisma para queries | RLS completo + TypeSafety |

### 2.3 Modelo de Seguridad

Implementación de **defensa en profundidad** con 5 capas:

```
┌─────────────────────────────────────────┐
│ Capa 1: Middleware                      │
│ - Validación de sesión                  │
│ - Redirección de no autenticados        │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ Capa 2: Layout/Page                     │
│ - requireAdmin() / requireModerator()   │
│ - Verificación de roles                 │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ Capa 3: API/Server Actions              │
│ - Validación de input (Zod)             │
│ - Re-verificación de autorización       │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ Capa 4: Database Queries                │
│ - Queries parametrizadas                │
│ - Prevención de SQL injection           │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ Capa 5: RLS Policies                    │
│ - Row Level Security en PostgreSQL      │
│ - Última línea de defensa               │
└─────────────────────────────────────────┘
```

**Ver**: [Security Assessment Report](./security/SECURITY_ASSESSMENT_REPORT.md) para detalles completos.

### 2.4 Modelo de Datos

#### Tablas Core (Implementadas)

```
auth.users (Supabase Auth)
    ↓
user_roles (RBAC)
user_profiles (Metadata extendida)
audit_logs (Auditoría inmutable)
system_settings (Configuración)
rate_limits (Rate limiting en DB)
failed_login_attempts (Seguridad)
```

#### Tablas Futuras (Por implementar)

```
agents (Configuración de agentes)
agent_models (Modelos por tier)
projects (Gestión de proyectos)
project_members (Colaboradores)
corpora (Corpus RAG)
corpus_documents (Documentos indexados)
embeddings (Vectores)
artifacts (Artefactos generados)
artifact_versions (Control de versiones)
mcp_integrations (Integraciones MCP)
mcp_tokens (Tokens encriptados)
user_tiers (Free/Pro/Elite)
billing_subscriptions (Subscripciones)
usage_metrics (Métricas de uso)
```

**Ver**: [Database Schema](./architecture/database-schema.md) para el esquema completo.

---

## 3. Estado Actual

### 3.1 Fases Completadas (0-9)

✅ **Fase 0: Inicialización**
- Next.js 15 + React 19 + TypeScript configurado
- Supabase Auth integrado
- Tailwind CSS + shadcn/ui configurado

✅ **Fase 1-2: Autenticación**
- Sistema de login/signup funcional
- Cookie-based authentication con Supabase
- Middleware para protección de rutas

✅ **Fase 3-4: Base de Datos**
- Prisma ORM configurado (enfoque híbrido)
- Schema inicial con tablas core
- Migraciones SQL para RLS y triggers

✅ **Fase 5: RBAC**
- Sistema de roles (admin, moderator, user)
- Helpers de autorización (requireAdmin, requireModerator)
- RLS policies implementadas

✅ **Fase 6-7: Admin Panel Básico**
- Estructura de rutas `/admin/*`
- Layout con sidebar y header
- Dashboard principal con métricas básicas

✅ **Fase 8: Gestión de Usuarios**
- CRUD completo de usuarios
- Asignación de roles
- Lista paginada con búsqueda

✅ **Fase 9: Audit Logs y Settings**
- Sistema de auditoría inmutable
- Panel de configuración
- Logs de todas las operaciones críticas

✅ **Fase 10: Analytics Module (con errores)**
- Estructura de componentes creada
- Integración con Recharts
- **⚠️ PROBLEMA**: Errores de TypeScript (Date | undefined)

### 3.2 Problemas Conocidos

#### 🔴 Critical

**TypeScript Errors en Analytics**
- **Archivo**: `app/admin/analytics/analytics-page-client.tsx:103`
- **Error**: `Argument of type 'Date | undefined' is not assignable to parameter of type 'Date'`
- **Impacto**: Build falla, no se puede desplegar
- **Causa**: Tipo de dato `dateRange.from` y `dateRange.to` puede ser `undefined`
- **Solución requerida**: Validación de tipos antes de pasar a `dateToISOString()`

#### 🟡 Medium

Ninguno identificado actualmente.

#### 🟢 Low

Ninguno identificado actualmente.

### 3.3 Capacidades Actuales

#### ✅ Funcional
- Autenticación completa (login, signup, password reset)
- RBAC con 3 roles (admin, moderator, user)
- Admin panel con sidebar y navegación
- Gestión de usuarios (crear, editar, eliminar, cambiar rol)
- Gestión de roles
- Audit logs (visualización, filtrado)
- Settings panel (configuración del sistema)
- Security layers (5 capas de defensa)
- Rate limiting en DB
- Failed login tracking

#### ⚠️ Parcialmente Funcional
- Analytics module (estructura creada, errores de tipos)

#### ❌ No Implementado
- Agentes inteligentes (core del sistema)
- RAG (corpus, embeddings, semantic search)
- Artifacts (versionado, exportación)
- MCP integrations
- Proyectos (gestión, colaboración)
- User tiers (Free/Pro/Elite)
- Billing y subscripciones
- Dashboard glassmorphic (diseño actual es básico)
- Modo oscuro/claro (tema configurable)
- Branding customizable
- Métricas de costos

### 3.4 Limitaciones Actuales

1. **Sin Agentes**: El core del sistema (agentes) no está implementado
2. **Sin RAG**: No hay corpus ni búsqueda semántica
3. **Sin Artifacts**: No hay gestión de resultados generados
4. **Sin MCP**: No hay integraciones personales
5. **Sin Tiers**: Todos los usuarios tienen acceso igual (no hay Free/Pro/Elite)
6. **Sin Billing**: No hay gestión de subscripciones ni costos
7. **Diseño Básico**: UI actual no refleja el estilo glassmorphic cyan objetivo
8. **Sin Proyectos**: No hay manera de organizar trabajo en proyectos

---

## 4. Módulos del Sistema

### 4.1 Módulo 1: Dashboard Principal

#### Descripción
Punto de entrada unificado que muestra métricas clave, acciones rápidas, y actividad reciente. Sirve como "launcher" para acceder a todos los módulos.

#### Características Clave

**Tiles de Métricas**:
- Tokens usados (mes actual vs mes anterior)
- Agentes activos
- Artefactos generados
- Costos acumulados
- Performance promedio (latencia)

**Acciones Rápidas**:
- Crear nuevo agente (solo Admin)
- Subir corpus
- Nuevo proyecto
- Exportar artefacto
- Conectar MCP

**Feed de Actividad**:
- Eventos recientes con tags de módulo
- Filtrado por tipo de evento
- Link directo al recurso

**Command Palette (⌘K)**:
- Búsqueda global
- Ejecución rápida de acciones
- Navegación por teclado

**Temas**:
- Dark/Light/System mode
- Glassmorphic cyan (default)
- Transiciones suaves

#### Requisitos Técnicos
- Server Component para métricas (cache: 5 minutos)
- Client Component para Command Palette
- Framer Motion para animaciones
- Recharts para gráficos
- Responsive (desktop-first, mobile-adaptive)

#### Dependencias
- Módulo 2 (Agents): Datos de agentes activos
- Módulo 4 (RAG): Datos de corpus
- Módulo 5 (Artifacts): Datos de artefactos
- Módulo 6 (Admin): Métricas de costos

#### Asignación de Especialistas
- **ui-ux-designer**: Diseño de interfaz glassmorphic, user flows
- **product-design-architect**: Sistema de componentes, design tokens
- **fullstack-implementer**: Implementación de Server Components, data fetching
- **prompt-architect**: Command Palette con IA (sugerencias inteligentes)

---

### 4.2 Módulo 2: Agents (con Gestión de Proyectos)

#### Descripción
Sistema de agentes inteligentes especializados que pueden ejecutar tareas y gestionar proyectos. Solo Admins crean agentes; usuarios los utilizan según su tier.

#### Características Clave

**Gestión de Agentes (Admin)**:
- CRUD completo de agentes
- Configuración de 3 modelos por agente:
  - Economy (rápido, barato)
  - Balanced (equilibrado)
  - Premium (máxima calidad)
- Definición de especialización (dominio del agente)
- System prompts personalizados
- Capacidades (RAG, Code Execution, Image Gen, etc.)

**Uso de Agentes (User)**:
- Lista de agentes disponibles
- Filtrado por especialización
- Chat interface con streaming
- Selector de modelo según tier:
  - Free → Solo Economy
  - Pro → Economy y Balanced
  - Elite → Todos los modelos
- Historial de conversaciones
- Uso de MCP personal del usuario

**Proyectos**:
- Algunos agentes pueden gestionar proyectos
- Cada proyecto tiene:
  - Estructura de archivos
  - Estilo y configuración
  - Assets (imágenes, datos, etc.)
  - RAG específico del proyecto
  - Artifacts generados
- Colaboración (invitar Guest Collaborators)
- Versionado de estado del proyecto

**Personalización**:
- Agentes adaptan tono según perfil de usuario:
  - Nombre del usuario
  - Idioma preferido
  - Nivel de expertise
  - Tono de comunicación (formal/casual)

#### Requisitos Técnicos
- Vercel AI SDK para routing de modelos
- Streaming SSE para respuestas en tiempo real
- Storage para project files (Supabase Storage)
- MCP SDK para conectar servicios del usuario
- WebSocket para colaboración en tiempo real (opcional)

#### Dependencias
- Módulo 4 (RAG): Contexto para agentes
- Módulo 5 (Artifacts): Almacenar outputs
- Módulo 3 (MCP): Conectar servicios del usuario
- Módulo 6 (Admin): Gestión de modelos y costos

#### Asignación de Especialistas
- **prompt-architect**: System prompts, personalización de agentes
- **cloud-ai-ops-engineer**: Vercel AI SDK, routing de modelos, streaming
- **fullstack-implementer**: API routes, Server Actions, gestión de proyectos
- **ui-ux-designer**: Chat interface, project management UI
- **security-auditor**: Validación de inputs, isolation entre usuarios

---

### 4.3 Módulo 3: Multitool / MCP Integrations

#### Descripción
Sistema de integraciones personales mediante MCP (Model Context Protocol). Cada usuario conecta sus propios servicios; Admin gestiona integraciones globales.

#### Características Clave

**Integraciones Personales (User)**:
- Google Drive (lectura/escritura de archivos)
- Notion (páginas, databases)
- GitHub (repos, issues, PRs)
- Trello (boards, cards)
- Slack (mensajes, canales)
- Gmail (lectura, envío)
- Google Calendar (eventos)
- iCloud Calendar
- Microsoft Calendar
- Outlook (email)

**Integraciones Globales (Admin)**:
- Proveedores de LLM (OpenAI, Anthropic, Google, etc.)
- Embeddings (OpenAI, Cohere, etc.)
- Vector DB (Qdrant config)
- Image Generation (DALL-E, Midjourney, etc.)
- Storage providers

**Seguridad y Aislamiento**:
- Tokens MCP encriptados por usuario
- Storage aislado: `vault/users/{user_id}/mcp/`
- Políticas RLS en tabla `mcp_integrations`
- Auditoría de uso de MCP
- Rate limiting por integración

**Sync Bidireccional**:
- Enviar Artifact a Notion
- Enviar Artifact a Google Drive
- Sincronizar project con GitHub repo
- Exportar análisis a Google Sheets

**Configuración de Routing**:
- Vercel AI SDK como capa de abstracción
- Admin configura providers globales
- User selecciona modelo específico si tiene múltiples opciones

#### Requisitos Técnicos
- MCP SDK (o implementación custom)
- OAuth2 flows para cada servicio
- Encrypted storage para tokens
- Vercel AI SDK para model routing
- Background jobs para sync (opcional)

#### Dependencias
- Módulo 5 (Artifacts): Exportar artefactos
- Módulo 4 (RAG): Ingerir desde MCP sources
- Módulo 2 (Agents): Usar MCP en contexto
- Módulo 6 (Admin): Configuración global

#### Asignación de Especialistas
- **cloud-ai-ops-engineer**: Vercel AI SDK, MCP integrations, OAuth flows
- **security-auditor**: Encriptación de tokens, isolation, audit
- **fullstack-implementer**: API routes para cada integración
- **data-engineer**: Sync jobs, data transformation

---

### 4.4 Módulo 4: RAG (Retrieval-Augmented Generation)

#### Descripción
Sistema completo de RAG para enriquecer el contexto de agentes mediante corpus personales, organizacionales y de proyectos.

#### Características Clave

**Gestión de Corpora**:
- Corpora globales (Admin, acceso compartido)
- Corpora personales (User, privados)
- Corpora de proyecto (compartidos con collaborators)
- CRUD completo de corpora
- Metadata (descripción, tags, visibilidad)

**Ingestion Pipeline**:
1. **Extracción**: Desde archivos (PDF, DOCX, TXT, MD, CSV) o MCP sources
2. **Chunking**: Estrategias configurables (fixed-size, semantic, recursive)
3. **Embeddings**: Generación con provider configurable
4. **Vector DB**: Storage en Qdrant con metadata
5. **Indexing**: Optimización para búsqueda rápida

**Semantic Search**:
- Query natural language
- Ranking por similitud
- Filtrado por metadata (corpus, proyecto, fechas)
- Hybrid search (vector + keyword)
- Resultados con score de relevancia

**Context Builder**:
- Construcción automática de contexto para agentes
- Selección de top-k chunks relevantes
- Reranking opcional
- Formato de contexto optimizado para LLM

**Privacidad y Seguridad**:
- Corpus privados completamente aislados
- RLS en tablas de corpus y embeddings
- Encriptación de documentos sensibles
- Auditoría de acceso a corpus

**Transparencia Contextual**:
- Mostrar fuentes usadas en respuesta
- Link a documento original
- Score de relevancia
- Highlight de fragmento exacto

#### Requisitos Técnicos
- Qdrant (vector database)
- Embeddings API (OpenAI, Cohere, etc.)
- Document parsers (PDF.js, Mammoth, etc.)
- Chunking strategies (LangChain o custom)
- Background jobs para ingestion
- Cache para búsquedas frecuentes

#### Dependencias
- Módulo 3 (MCP): Ingerir desde sources externas
- Módulo 2 (Agents): Proveer contexto
- Módulo 6 (Admin): Configuración de embeddings

#### Asignación de Especialistas
- **data-engineer**: Pipeline de ingestion, Qdrant integration, embeddings
- **cloud-ai-ops-engineer**: Embeddings API, optimization
- **fullstack-implementer**: CRUD de corpora, API routes
- **security-auditor**: Isolation, encryption, RLS
- **ui-ux-designer**: Interface para gestión de corpora

---

### 4.5 Módulo 5: Artifacts

#### Descripción
Repositorio estructurado de todos los resultados generados por el sistema, con versionado automático, diff, rollback y exportación.

#### Características Clave

**Tipos de Artifacts**:
- **Text**: Documentos, artículos, código
- **Image**: Imágenes generadas
- **Dataset**: Tablas, CSVs, análisis
- **Prompt**: Templates de prompts reutilizables
- **RAG Context**: Contexto usado (para debugging)
- **Code**: Scripts, notebooks
- **Custom**: Tipos extensibles

**Versionado Automático**:
- Cada modificación crea nueva versión
- Metadata por versión (user, timestamp, changes)
- Diff visual entre versiones
- Rollback a versión anterior
- Comentarios por versión

**Comparador Visual**:
- Side-by-side diff
- Highlight de cambios
- Merge manual (si es necesario)
- Timeline de versiones

**Exportación**:
- PDF (con formatting)
- Markdown (preservando estructura)
- JSON (para datos estructurados)
- HTML (para web)
- Exportar a MCP (Drive, Notion, GitHub)

**Políticas por Tier**:
- **Free**: Retención 7 días, eliminar versiones antiguas automáticamente
- **Pro**: Retención 90 días
- **Elite**: Retención ilimitada

**Seguridad**:
- Cada artifact pertenece a un user o project
- RLS estricto
- Auditoría de acceso y modificación
- Encriptación de artifacts sensibles (opcional)

**Organización**:
- Tags
- Carpetas/Colecciones
- Búsqueda full-text
- Filtrado por tipo, proyecto, fecha

#### Requisitos Técnicos
- Storage eficiente (Supabase Storage o S3)
- Diff algorithm (diff-match-patch)
- PDF generation (Puppeteer o React-PDF)
- Markdown parser (marked o remark)
- Background jobs para cleanup (Free tier)
- Compression para versiones antiguas

#### Dependencias
- Módulo 2 (Agents): Generar artifacts
- Módulo 3 (MCP): Exportar artifacts
- Módulo 6 (Admin): Políticas de retención

#### Asignación de Especialistas
- **fullstack-implementer**: CRUD de artifacts, versionado, storage
- **ui-ux-designer**: Comparador visual, timeline UI
- **data-engineer**: Compression, cleanup jobs, optimization
- **security-auditor**: Isolation, encryption

---

### 4.6 Módulo 6: Admin Panel (Extendido)

#### Descripción
Panel administrativo completo para gestionar todos los aspectos del sistema: usuarios, agentes, integraciones, branding, billing, y seguridad.

#### Características Clave

**Secciones**:

**6.1 Users & Roles** (Ya implementado, por mejorar):
- CRUD de usuarios
- Asignación de roles
- Cambio de tier (Free/Pro/Elite)
- Suspension/Activación de cuentas
- Métricas por usuario (tokens, costs, projects)

**6.2 Agents & Models** (Por implementar):
- CRUD de agentes
- Configuración de modelos (Economy/Balanced/Premium)
- Políticas por tier
- Límites de uso
- Performance metrics por agente

**6.3 Global Integrations** (Por implementar):
- Configuración de LLM providers
- Embeddings providers
- Vector DB connection
- Image generation providers
- API keys management (encriptadas)

**6.4 Branding & Appearance** (Por implementar):
- Logo upload
- Color scheme (primary, secondary, accent)
- Custom CSS (avanzado)
- Email templates branding
- Landing page customization

**6.5 Subscriptions & Billing** (Por implementar):
- Gestión de planes (Free/Pro/Elite)
- Pricing configuration
- Límites por tier (tokens, projects, storage)
- Stripe integration (payments)
- Invoice management
- Usage-based billing

**6.6 Audit & Security** (Parcialmente implementado):
- Audit logs (ya existe)
- Security dashboard
- Failed login attempts
- Suspicious activity alerts
- RLS policy management
- Backup & recovery

**6.7 Cost Monitoring** (Por implementar):
- Tokens usados por modelo
- Costs por provider
- Costs por usuario/proyecto
- Proyecciones de gastos
- Alertas de presupuesto
- Cost optimization recommendations

**6.8 Analytics** (Parcialmente implementado, con errores):
- Usuarios activos por tier
- Agents más usados
- Tokens consumidos (trends)
- Revenue metrics
- Performance metrics (latency, errors)
- Geographical distribution

#### Visual
Panel glassmorphic con tabs para cada sección:
```
┌─────────────────────────────────────────────────┐
│  Users  Agents  Integrations  Branding  Billing │
│  Security  Logs  Analytics                      │
└─────────────────────────────────────────────────┘
```

#### Requisitos Técnicos
- Server Components para data fetching
- Client Components para interactividad
- Recharts para visualizaciones
- Stripe SDK para billing
- Encrypted storage para API keys
- Background jobs para metrics calculation

#### Dependencias
- Módulo 2 (Agents): Gestionar agentes
- Módulo 3 (MCP): Configurar integraciones globales
- Módulo 4 (RAG): Monitorear corpora
- Módulo 5 (Artifacts): Políticas de retención

#### Asignación de Especialistas
- **fullstack-implementer**: Backend completo, API routes
- **ui-ux-designer**: Diseño de todas las secciones
- **cloud-ai-ops-engineer**: Integración con providers, metrics
- **security-auditor**: Encryption, audit, security dashboard
- **data-engineer**: Analytics, cost monitoring, jobs

---

## 5. Fases de Implementación

### Fase 11: Corrección de Errores Actuales

**Objetivo**: Resolver problemas existentes para tener una base estable.

**Duración Estimada**: 1-2 días

#### Diseño
- **Responsable**: fullstack-implementer
- **Tareas**:
  - Analizar error de TypeScript en analytics
  - Identificar todos los casos donde `dateRange.from` o `dateRange.to` puedan ser `undefined`
  - Diseñar solución (validación de tipos)

#### Validación
- **Gate**: Diseño revisado y aprobado
- **Aprobador**: project-planner-coordinator

#### Implementación
- **Responsable**: fullstack-implementer
- **Tareas**:
  - Agregar validación de tipos en `analytics-page-client.tsx`
  - Implementar valores por defecto si dates son undefined
  - Agregar tests de tipos con TypeScript
  - Verificar que build pasa sin errores

```typescript
// Solución propuesta
const from = filtersToFetch.dateRange?.from ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
const to = filtersToFetch.dateRange?.to ?? new Date()
const fromISO = dateToISOString(from)
const toISO = dateToISOString(to)
```

#### Pruebas
- **Responsable**: qa-tester
- **Tareas**:
  - Verificar que no hay errores de TypeScript
  - Testing manual del analytics module
  - Verificar que gráficos renderizan correctamente
  - Testing con diferentes rangos de fechas

#### Entregables
- [x] Build sin errores de TypeScript
- [x] Analytics module funcional
- [x] Tests pasando

---

### Fase 12: Dashboard Principal (Módulo 1)

**Objetivo**: Crear el dashboard glassmorphic como punto de entrada unificado.

**Duración Estimada**: 2 semanas

#### Diseño (Semana 1, días 1-3)

**12.1 Diseño de UI/UX**
- **Responsable**: ui-ux-designer
- **Tareas**:
  - Diseño de wireframes del dashboard
  - Definir métricas a mostrar
  - Diseñar acciones rápidas
  - Diseñar feed de actividad
  - Diseñar Command Palette (⌘K)
  - Crear mockups en Figma

**12.2 Diseño de Sistema de Componentes**
- **Responsable**: product-design-architect
- **Tareas**:
  - Definir design tokens (colores, espaciado, tipografía)
  - Crear componentes glassmorphic base:
    - `GlassCard` (tarjeta con efecto glassmorphic)
    - `GlassButton` (botón con efecto)
    - `StatTile` (tile de métrica)
    - `ActivityFeed` (lista de eventos)
  - Documentar sistema de componentes

**12.3 Diseño de Arquitectura de Datos**
- **Responsable**: software-architect
- **Tareas**:
  - Definir estructura de métricas
  - Diseñar queries para dashboard stats
  - Diseñar cache strategy (5 minutos)
  - Documentar en ADR si es necesario

#### Validación (Día 4)
- **Gate**: Diseños aprobados
- **Checklist**:
  - [ ] Mockups revisados y aprobados
  - [ ] Sistema de componentes documentado
  - [ ] Arquitectura de datos validada
  - [ ] Equipo técnico alineado con diseño
- **Aprobador**: project-planner-coordinator
- **Acción**: Documentar aprobación en este ROADMAP (actualizar checkbox)

#### Implementación (Semana 2, días 1-4)

**12.4 Implementación de Sistema de Componentes**
- **Responsable**: product-design-architect
- **Tareas**:
  - Implementar componentes glassmorphic base
  - Configurar Tailwind con theme glassmorphic cyan
  - Implementar animaciones con Framer Motion
  - Testing de componentes en isolation (Storybook opcional)

**12.5 Implementación de Backend**
- **Responsable**: fullstack-implementer
- **Tareas**:
  - Crear API route `/api/dashboard/stats` para métricas
  - Implementar queries para:
    - Tokens usados (mes actual)
    - Agentes activos (placeholder hasta Fase 13)
    - Artifacts generados (placeholder hasta Fase 16)
    - Costos acumulados (placeholder hasta Fase 18)
  - Implementar cache (5 minutos con Next.js cache)
  - Crear mock data para métricas no implementadas

**12.6 Implementación de Frontend**
- **Responsable**: fullstack-implementer
- **Tareas**:
  - Crear `app/dashboard/page.tsx` (Server Component)
  - Implementar grid de métricas con `StatTile`
  - Implementar acciones rápidas
  - Implementar feed de actividad (desde audit_logs)
  - Responsive design (desktop-first)

**12.7 Implementación de Command Palette**
- **Responsable**: prompt-architect + fullstack-implementer
- **Tareas**:
  - Implementar Command Palette (⌘K) con cmdk o similar
  - Integrar búsqueda global
  - Implementar navegación rápida
  - Opcional: Sugerencias inteligentes con IA

#### Pruebas (Semana 2, día 5)
- **Responsable**: qa-tester
- **Tareas**:
  - Testing funcional de dashboard
  - Testing de métricas (con mock data)
  - Testing de Command Palette
  - Testing responsive (desktop, tablet, mobile)
  - Performance testing (Lighthouse)
  - Accessibility testing (WCAG 2.1)

#### Entregables
- [ ] Sistema de componentes glassmorphic documentado
- [ ] Dashboard funcional con métricas
- [ ] Command Palette implementado (⌘K)
- [ ] Feed de actividad funcionando
- [ ] Tests pasando
- [ ] Lighthouse score > 90

---

### Fase 13: Agents & Projects (Módulo 2)

**Objetivo**: Implementar el core del sistema: agentes inteligentes con gestión de proyectos.

**Duración Estimada**: 4 semanas

#### Diseño (Semana 1)

**13.1 Diseño de Base de Datos**
- **Responsable**: data-engineer + software-architect
- **Tareas**:
  - Diseñar schema para tablas:
    - `agents` (id, name, description, specialization, capabilities, created_by, etc.)
    - `agent_models` (agent_id, tier, model_provider, model_name, system_prompt, temperature, etc.)
    - `projects` (id, name, type, agent_id, owner_id, structure, style, status, etc.)
    - `project_members` (project_id, user_id, role, permissions, invited_by, etc.)
    - `conversations` (id, user_id, agent_id, project_id, messages, etc.)
  - Diseñar RLS policies para isolation
  - Diseñar índices para performance
  - Crear migración SQL
  - Documentar en `docs/architecture/database-schema.md`

**13.2 Diseño de API y Routing**
- **Responsable**: software-architect
- **Tareas**:
  - Diseñar API routes:
    - `/api/agents` (GET, POST - admin only)
    - `/api/agents/[id]` (GET, PUT, DELETE - admin only)
    - `/api/agents/[id]/chat` (POST - streaming)
    - `/api/projects` (GET, POST)
    - `/api/projects/[id]` (GET, PUT, DELETE)
    - `/api/projects/[id]/members` (GET, POST, DELETE)
  - Diseñar Server Actions para formularios
  - Diseñar streaming SSE para chat
  - Documentar en ADR-006 (API Routes for Agents)

**13.3 Diseño de Integración con Vercel AI SDK**
- **Responsable**: cloud-ai-ops-engineer
- **Tareas**:
  - Diseñar model routing strategy
  - Configurar providers (OpenAI, Anthropic, etc.)
  - Diseñar tier-based model selection
  - Diseñar prompt templates con personalization
  - Diseñar streaming architecture
  - Documentar en `docs/architecture/ai-integration.md`

**13.4 Diseño de UI/UX**
- **Responsable**: ui-ux-designer
- **Tareas**:
  - Diseñar Admin UI para crear/editar agentes
  - Diseñar User UI para seleccionar y usar agentes
  - Diseñar chat interface (streaming, markdown rendering)
  - Diseñar project management interface
  - Diseñar member management
  - Crear mockups en Figma

#### Validación (Semana 1, día 5)
- **Gate**: Diseños aprobados
- **Checklist**:
  - [ ] Schema de DB revisado y aprobado
  - [ ] API routes documentadas
  - [ ] Vercel AI SDK strategy validada
  - [ ] UI mockups aprobados
  - [ ] Security review completado
- **Aprobador**: project-planner-coordinator + security-auditor

#### Implementación (Semanas 2-3)

**13.5 Implementación de Database**
- **Responsable**: data-engineer
- **Tareas**:
  - Crear migración SQL con tablas
  - Implementar RLS policies
  - Crear triggers necesarios
  - Seed con agentes de ejemplo
  - Testing de queries

**13.6 Implementación de Backend - Agents**
- **Responsable**: fullstack-implementer
- **Tareas**:
  - Implementar CRUD de agentes (admin only)
  - Implementar authorization helpers
  - Implementar queries con Prisma
  - Implementar audit logging
  - Testing de API routes

**13.7 Implementación de Backend - Chat**
- **Responsable**: cloud-ai-ops-engineer
- **Tareas**:
  - Configurar Vercel AI SDK
  - Implementar model routing
  - Implementar tier-based selection
  - Implementar streaming endpoint
  - Implementar prompt personalization
  - Implementar tracking de tokens/costos
  - Testing de streaming

**13.8 Implementación de Backend - Projects**
- **Responsable**: fullstack-implementer
- **Tareas**:
  - Implementar CRUD de proyectos
  - Implementar member management
  - Implementar permissions system
  - Implementar Supabase Storage para project files
  - Testing de API routes

**13.9 Implementación de Frontend - Admin**
- **Responsable**: fullstack-implementer
- **Tareas**:
  - Crear `/admin/agents` con lista de agentes
  - Crear formulario crear/editar agente
  - Crear configuración de modelos (Economy/Balanced/Premium)
  - Implementar validaciones con Zod
  - Testing

**13.10 Implementación de Frontend - User**
- **Responsable**: fullstack-implementer + ui-ux-designer
- **Tareas**:
  - Crear `/agents` con lista de agentes disponibles
  - Crear `/agents/[id]/chat` con interface de chat
  - Implementar streaming de respuestas (SSE)
  - Implementar markdown rendering (react-markdown)
  - Implementar selector de modelo (según tier)
  - Crear `/projects` con lista de proyectos
  - Crear `/projects/[id]` con gestión de proyecto
  - Testing

#### Pruebas (Semana 4)
- **Responsable**: qa-tester + security-auditor
- **Tareas**:
  - Testing funcional de CRUD de agentes
  - Testing de chat con streaming
  - Testing de tier restrictions
  - Testing de proyectos y colaboración
  - Security testing (isolation, permissions)
  - Performance testing (latency de streaming)
  - Load testing (múltiples chats simultáneos)
  - Testing de costos y tracking de tokens

#### Entregables
- [ ] Tablas de DB creadas con RLS
- [ ] Admin puede crear/editar agentes
- [ ] Users pueden usar agentes (chat funcional)
- [ ] Streaming funcionando
- [ ] Tier-based model selection funcionando
- [ ] Proyectos creados y gestionados
- [ ] Member management funcionando
- [ ] Tests pasando
- [ ] Security review aprobado

---

### Fase 14: MCP Integrations (Módulo 3)

**Objetivo**: Implementar integraciones personales mediante MCP.

**Duración Estimada**: 3 semanas

#### Diseño (Semana 1, días 1-3)

**14.1 Diseño de Arquitectura MCP**
- **Responsable**: cloud-ai-ops-engineer + software-architect
- **Tareas**:
  - Investigar MCP SDK o definir implementación custom
  - Diseñar OAuth2 flows para cada servicio
  - Diseñar storage de tokens encriptados
  - Diseñar isolation por usuario (`vault/users/{id}/mcp/`)
  - Diseñar rate limiting por integración
  - Documentar en ADR-007 (MCP Integration Strategy)

**14.2 Diseño de Base de Datos**
- **Responsable**: data-engineer
- **Tareas**:
  - Diseñar tablas:
    - `mcp_integrations` (id, user_id, service_type, encrypted_token, config, status, etc.)
    - `mcp_audit_logs` (id, user_id, integration_id, action, resource, timestamp, etc.)
  - Diseñar RLS policies (strict isolation)
  - Diseñar encryption strategy para tokens
  - Crear migración SQL

**14.3 Priorización de Integraciones**
- **Responsable**: project-planner-coordinator
- **Tareas**:
  - Definir orden de implementación (comenzar con más demandadas):
    1. Google Drive (alta prioridad)
    2. Notion (alta prioridad)
    3. GitHub (media prioridad)
    4. Gmail (media prioridad)
    5. Google Calendar (media prioridad)
    6. Slack, Trello, Outlook (baja prioridad)

**14.4 Diseño de UI/UX**
- **Responsable**: ui-ux-designer
- **Tareas**:
  - Diseñar página de integraciones (`/integrations`)
  - Diseñar OAuth flow UI
  - Diseñar configuración por integración
  - Diseñar sync status y logs
  - Diseñar export de artifacts a MCP
  - Mockups en Figma

#### Validación (Semana 1, día 4)
- **Gate**: Diseños aprobados
- **Checklist**:
  - [ ] Arquitectura MCP validada
  - [ ] Schema de DB aprobado
  - [ ] Priorización de integraciones confirmada
  - [ ] Security review completado (encryption strategy)
  - [ ] UI mockups aprobados
- **Aprobador**: project-planner-coordinator + security-auditor

#### Implementación (Semanas 1-2)

**14.5 Implementación de Infraestructura**
- **Responsable**: cloud-ai-ops-engineer
- **Tareas**:
  - Configurar OAuth2 apps para cada servicio
  - Implementar encryption/decryption de tokens
  - Crear tabla `mcp_integrations` con RLS
  - Implementar base de MCP SDK (o custom)
  - Testing de OAuth flows

**14.6 Implementación de Google Drive**
- **Responsable**: fullstack-implementer
- **Tareas**:
  - Implementar OAuth flow
  - Implementar API wrapper para Drive API
  - Implementar lectura de archivos
  - Implementar escritura de archivos
  - Implementar listado de carpetas/archivos
  - Testing

**14.7 Implementación de Notion**
- **Responsable**: fullstack-implementer
- **Tareas**:
  - Implementar OAuth flow
  - Implementar API wrapper para Notion API
  - Implementar lectura de páginas/databases
  - Implementar creación/actualización de páginas
  - Testing

**14.8 Implementación de GitHub**
- **Responsable**: fullstack-implementer
- **Tareas**:
  - Implementar OAuth flow
  - Implementar API wrapper para GitHub API
  - Implementar lectura de repos/issues
  - Implementar creación de issues/commits
  - Testing

**14.9 Implementación de Gmail & Calendar**
- **Responsable**: fullstack-implementer
- **Tareas**:
  - Implementar OAuth flow (Google)
  - Implementar wrapper para Gmail API
  - Implementar wrapper para Calendar API
  - Testing

**14.10 Implementación de UI**
- **Responsable**: fullstack-implementer
- **Tareas**:
  - Crear `/integrations` con lista de integraciones
  - Implementar OAuth flows en UI
  - Implementar configuración de integraciones
  - Implementar sync status
  - Implementar export de artifacts
  - Testing

**14.11 Implementación en Agents**
- **Responsable**: cloud-ai-ops-engineer + prompt-architect
- **Tareas**:
  - Integrar MCP context en agent prompts
  - Implementar tools para que agents usen MCP
  - Testing de agents con MCP enabled

#### Pruebas (Semana 3)
- **Responsable**: qa-tester + security-auditor
- **Tareas**:
  - Testing de OAuth flows para cada servicio
  - Testing de lectura/escritura de datos
  - Testing de isolation entre usuarios
  - Security testing (token encryption, RLS)
  - Testing de export de artifacts
  - Testing de agents usando MCP
  - Performance testing
  - Rate limiting testing

#### Entregables
- [ ] Infraestructura MCP implementada
- [ ] Google Drive integración funcional
- [ ] Notion integración funcional
- [ ] GitHub integración funcional
- [ ] Gmail integración funcional
- [ ] Calendar integración funcional
- [ ] UI de integrations funcionando
- [ ] Agents pueden usar MCP del usuario
- [ ] Export de artifacts a MCP
- [ ] Tests pasando
- [ ] Security review aprobado

---

### Fase 15: RAG System (Módulo 4)

**Objetivo**: Implementar sistema completo de RAG para contexto enriquecido.

**Duración Estimada**: 4 semanas

#### Diseño (Semana 1)

**15.1 Diseño de Arquitectura RAG**
- **Responsable**: data-engineer + software-architect
- **Tareas**:
  - Diseñar pipeline de ingestion
  - Diseñar chunking strategies
  - Diseñar embedding generation
  - Diseñar storage en Qdrant
  - Diseñar semantic search
  - Diseñar context builder
  - Documentar en ADR-008 (RAG Architecture)

**15.2 Diseño de Base de Datos**
- **Responsable**: data-engineer
- **Tareas**:
  - Diseñar tablas:
    - `corpora` (id, name, description, owner_id, visibility, type, metadata, etc.)
    - `corpus_documents` (id, corpus_id, filename, content, status, etc.)
    - `corpus_access` (corpus_id, user_id, project_id, permissions, etc.)
  - Diseñar RLS policies (private/shared/global)
  - Crear migración SQL
  - Diseñar schema en Qdrant (collections, points)

**15.3 Diseño de Ingestion Pipeline**
- **Responsable**: data-engineer
- **Tareas**:
  - Diseñar extractors para cada tipo (PDF, DOCX, TXT, MD, CSV)
  - Diseñar chunking strategies (fixed-size, semantic, recursive)
  - Diseñar metadata extraction
  - Diseñar background job architecture
  - Diseñar error handling y retry logic

**15.4 Diseño de UI/UX**
- **Responsable**: ui-ux-designer
- **Tareas**:
  - Diseñar gestión de corpora (`/corpora`)
  - Diseñar upload de documentos (drag & drop)
  - Diseñar progreso de ingestion
  - Diseñar búsqueda semántica
  - Diseñar visualización de resultados con highlighting
  - Mockups en Figma

#### Validación (Semana 1, día 5)
- **Gate**: Diseños aprobados
- **Checklist**:
  - [ ] Arquitectura RAG validada
  - [ ] Schema de DB aprobado
  - [ ] Qdrant setup documentado
  - [ ] Pipeline de ingestion diseñado
  - [ ] UI mockups aprobados
- **Aprobador**: project-planner-coordinator + data-engineer

#### Implementación (Semanas 2-3)

**15.5 Setup de Qdrant**
- **Responsable**: data-engineer + cloud-ai-ops-engineer
- **Tareas**:
  - Configurar Qdrant Cloud o self-hosted
  - Crear collections para cada tipo de corpus
  - Configurar índices y optimizaciones
  - Implementar Qdrant client
  - Testing de conexión

**15.6 Implementación de Database**
- **Responsable**: data-engineer
- **Tareas**:
  - Crear migración SQL con tablas
  - Implementar RLS policies
  - Seed con corpus de ejemplo
  - Testing de queries

**15.7 Implementación de Extractors**
- **Responsable**: data-engineer
- **Tareas**:
  - Implementar PDF extractor (PDF.js)
  - Implementar DOCX extractor (Mammoth)
  - Implementar TXT/MD extractor
  - Implementar CSV parser
  - Implementar extractor desde MCP sources
  - Testing de cada extractor

**15.8 Implementación de Chunking**
- **Responsable**: data-engineer
- **Tareas**:
  - Implementar fixed-size chunking
  - Implementar semantic chunking (LangChain o custom)
  - Implementar recursive chunking
  - Implementar overlap strategy
  - Testing de chunking

**15.9 Implementación de Embeddings**
- **Responsable**: cloud-ai-ops-engineer
- **Tareas**:
  - Configurar embeddings provider (OpenAI, Cohere, etc.)
  - Implementar batch embedding generation
  - Implementar rate limiting
  - Implementar caching
  - Testing

**15.10 Implementación de Ingestion Pipeline**
- **Responsable**: data-engineer
- **Tareas**:
  - Implementar background job system (queue)
  - Implementar pipeline: Extract → Chunk → Embed → Store
  - Implementar progress tracking
  - Implementar error handling
  - Testing de pipeline end-to-end

**15.11 Implementación de Semantic Search**
- **Responsable**: data-engineer
- **Tareas**:
  - Implementar query embedding
  - Implementar vector search en Qdrant
  - Implementar filtering por metadata
  - Implementar ranking y scoring
  - Implementar hybrid search (opcional)
  - Testing

**15.12 Implementación de Context Builder**
- **Responsable**: prompt-architect + data-engineer
- **Tareas**:
  - Implementar construcción de contexto para agents
  - Implementar top-k selection
  - Implementar reranking (opcional)
  - Implementar formatting para LLM
  - Testing

**15.13 Implementación de UI**
- **Responsable**: fullstack-implementer
- **Tareas**:
  - Crear `/corpora` con lista de corpora
  - Implementar upload de documentos (drag & drop)
  - Implementar progreso de ingestion
  - Implementar búsqueda semántica
  - Implementar visualización de resultados
  - Implementar highlighting de fragmentos
  - Testing

**15.14 Integración con Agents**
- **Responsable**: cloud-ai-ops-engineer + prompt-architect
- **Tareas**:
  - Modificar agents para usar RAG context
  - Implementar contextual transparency (mostrar fuentes)
  - Testing de agents con RAG

#### Pruebas (Semana 4)
- **Responsable**: qa-tester + data-engineer
- **Tareas**:
  - Testing de extractors con diferentes formatos
  - Testing de chunking strategies
  - Testing de embeddings generation
  - Testing de ingestion pipeline
  - Testing de semantic search (relevancia)
  - Testing de context builder
  - Testing de isolation (RLS)
  - Performance testing (latency de búsqueda)
  - Testing de agents con RAG

#### Entregables
- [ ] Qdrant configurado y funcionando
- [ ] Tablas de DB creadas con RLS
- [ ] Extractors para todos los formatos
- [ ] Chunking strategies implementadas
- [ ] Embeddings generation funcionando
- [ ] Ingestion pipeline completo
- [ ] Semantic search funcional
- [ ] Context builder integrado con agents
- [ ] UI de corpora funcionando
- [ ] Tests pasando
- [ ] Performance benchmarks documentados

---

### Fase 16: Artifacts System (Módulo 5)

**Objetivo**: Implementar sistema de gestión de artefactos con versionado.

**Duración Estimada**: 3 semanas

#### Diseño (Semana 1, días 1-3)

**16.1 Diseño de Base de Datos**
- **Responsable**: data-engineer + software-architect
- **Tareas**:
  - Diseñar tablas:
    - `artifacts` (id, name, type, owner_id, project_id, current_version, metadata, etc.)
    - `artifact_versions` (id, artifact_id, version_number, content, changes, user_id, timestamp, etc.)
    - `artifact_tags` (artifact_id, tag_name)
  - Diseñar RLS policies
  - Diseñar storage strategy (Supabase Storage vs DB)
  - Crear migración SQL

**16.2 Diseño de Versionado y Diff**
- **Responsable**: software-architect
- **Tareas**:
  - Diseñar algoritmo de diff (diff-match-patch)
  - Diseñar estructura de versiones
  - Diseñar rollback mechanism
  - Diseñar merge strategy (si necesario)
  - Documentar en ADR-009 (Artifact Versioning)

**16.3 Diseño de Exportación**
- **Responsable**: software-architect
- **Tareas**:
  - Diseñar PDF generation (Puppeteer o React-PDF)
  - Diseñar Markdown export
  - Diseñar JSON export
  - Diseñar HTML export
  - Diseñar export a MCP (Drive, Notion, GitHub)

**16.4 Diseño de Tier Policies**
- **Responsable**: project-planner-coordinator
- **Tareas**:
  - Definir retención por tier:
    - Free: 7 días
    - Pro: 90 días
    - Elite: ilimitado
  - Diseñar cleanup jobs
  - Diseñar notificaciones antes de eliminar

**16.5 Diseño de UI/UX**
- **Responsable**: ui-ux-designer
- **Tareas**:
  - Diseñar gestión de artifacts (`/artifacts`)
  - Diseñar timeline de versiones
  - Diseñar comparador visual (side-by-side diff)
  - Diseñar opciones de exportación
  - Mockups en Figma

#### Validación (Semana 1, día 4)
- **Gate**: Diseños aprobados
- **Checklist**:
  - [ ] Schema de DB aprobado
  - [ ] Estrategia de versionado validada
  - [ ] Exportación diseñada
  - [ ] Tier policies confirmadas
  - [ ] UI mockups aprobados
- **Aprobador**: project-planner-coordinator

#### Implementación (Semanas 1-2)

**16.6 Implementación de Database**
- **Responsable**: data-engineer
- **Tareas**:
  - Crear migración SQL con tablas
  - Implementar RLS policies
  - Implementar triggers para versionado automático
  - Seed con artifacts de ejemplo
  - Testing

**16.7 Implementación de Versionado**
- **Responsable**: fullstack-implementer
- **Tareas**:
  - Implementar creación de versiones automática
  - Implementar diff algorithm
  - Implementar rollback
  - Implementar metadata por versión
  - Testing

**16.8 Implementación de Storage**
- **Responsable**: fullstack-implementer
- **Tareas**:
  - Configurar Supabase Storage
  - Implementar upload de artifacts grandes
  - Implementar compression de versiones antiguas
  - Implementar cleanup jobs
  - Testing

**16.9 Implementación de Exportación**
- **Responsable**: fullstack-implementer
- **Tareas**:
  - Implementar PDF export (React-PDF)
  - Implementar Markdown export
  - Implementar JSON export
  - Implementar HTML export
  - Testing

**16.10 Implementación de Export a MCP**
- **Responsable**: fullstack-implementer
- **Tareas**:
  - Implementar export a Google Drive
  - Implementar export a Notion
  - Implementar export a GitHub
  - Testing

**16.11 Implementación de UI**
- **Responsable**: fullstack-implementer
- **Tareas**:
  - Crear `/artifacts` con lista de artifacts
  - Implementar filtrado y búsqueda
  - Crear `/artifacts/[id]` con detalles
  - Implementar timeline de versiones
  - Implementar comparador visual (side-by-side diff)
  - Implementar opciones de exportación
  - Testing

**16.12 Integración con Agents**
- **Responsable**: cloud-ai-ops-engineer
- **Tareas**:
  - Modificar agents para crear artifacts automáticamente
  - Implementar auto-versionado en modificaciones
  - Testing

#### Pruebas (Semana 3)
- **Responsable**: qa-tester
- **Tareas**:
  - Testing de CRUD de artifacts
  - Testing de versionado automático
  - Testing de diff y rollback
  - Testing de exportación (todos los formatos)
  - Testing de cleanup jobs
  - Testing de isolation (RLS)
  - Testing de integración con agents
  - Performance testing

#### Entregables
- [ ] Tablas de DB creadas con RLS
- [ ] Versionado automático funcionando
- [ ] Diff y rollback funcional
- [ ] Exportación a todos los formatos
- [ ] Export a MCP funcionando
- [ ] Cleanup jobs configurados
- [ ] UI de artifacts funcionando
- [ ] Comparador visual implementado
- [ ] Tests pasando

---

### Fase 17: Admin Panel Extendido (Módulo 6)

**Objetivo**: Completar admin panel con secciones faltantes.

**Duración Estimada**: 4 semanas

#### Diseño (Semana 1)

**17.1 Diseño de Secciones Faltantes**
- **Responsable**: ui-ux-designer + software-architect
- **Tareas**:
  - Diseñar sección Agents & Models
  - Diseñar sección Global Integrations
  - Diseñar sección Branding & Appearance
  - Diseñar sección Subscriptions & Billing
  - Diseñar sección Cost Monitoring
  - Mejorar sección Analytics (corregir errores existentes)
  - Mockups en Figma

**17.2 Diseño de Billing Integration**
- **Responsable**: software-architect + cloud-ai-ops-engineer
- **Tareas**:
  - Diseñar integración con Stripe
  - Diseñar webhook handling
  - Diseñar tier management
  - Diseñar usage-based billing
  - Documentar en ADR-010 (Billing Strategy)

**17.3 Diseño de Cost Monitoring**
- **Responsable**: data-engineer
- **Tareas**:
  - Diseñar tracking de tokens por modelo
  - Diseñar cálculo de costos
  - Diseñar proyecciones
  - Diseñar alertas de presupuesto
  - Diseñar materialized views para performance

#### Validación (Semana 1, día 5)
- **Gate**: Diseños aprobados
- **Checklist**:
  - [ ] UI mockups de todas las secciones aprobados
  - [ ] Billing strategy validada
  - [ ] Cost monitoring diseñado
  - [ ] Security review (billing)
- **Aprobador**: project-planner-coordinator

#### Implementación (Semanas 2-3)

**17.4 Implementación de Agents & Models Section**
- **Responsable**: fullstack-implementer
- **Tareas**:
  - Crear `/admin/agents` (mejorar existente)
  - Implementar configuración de modelos
  - Implementar tier policies
  - Implementar límites de uso
  - Implementar métricas de performance
  - Testing

**17.5 Implementación de Global Integrations**
- **Responsable**: cloud-ai-ops-engineer
- **Tareas**:
  - Crear `/admin/integrations`
  - Implementar configuración de LLM providers
  - Implementar configuración de embeddings
  - Implementar configuración de Qdrant
  - Implementar encrypted storage de API keys
  - Testing

**17.6 Implementación de Branding & Appearance**
- **Responsable**: fullstack-implementer + ui-ux-designer
- **Tareas**:
  - Crear `/admin/branding`
  - Implementar logo upload
  - Implementar color scheme editor
  - Implementar preview en tiempo real
  - Implementar custom CSS (avanzado)
  - Testing

**17.7 Implementación de Billing**
- **Responsable**: cloud-ai-ops-engineer + fullstack-implementer
- **Tareas**:
  - Configurar Stripe account
  - Implementar Stripe integration
  - Crear `/admin/billing`
  - Implementar gestión de planes
  - Implementar webhooks (subscription events)
  - Implementar upgrade/downgrade flows
  - Testing

**17.8 Implementación de Cost Monitoring**
- **Responsable**: data-engineer + fullstack-implementer
- **Tareas**:
  - Crear `/admin/costs`
  - Implementar tracking de tokens
  - Implementar cálculo de costos por provider
  - Implementar proyecciones
  - Implementar alertas de presupuesto
  - Implementar gráficos con Recharts
  - Testing

**17.9 Mejora de Analytics**
- **Responsable**: fullstack-implementer
- **Tareas**:
  - Corregir errores de TypeScript existentes
  - Agregar métricas faltantes
  - Implementar filtros avanzados
  - Implementar export de reportes
  - Testing

#### Pruebas (Semana 4)
- **Responsable**: qa-tester + security-auditor
- **Tareas**:
  - Testing de todas las secciones nuevas
  - Testing de Stripe integration (sandbox)
  - Testing de cost monitoring accuracy
  - Testing de branding (preview)
  - Security testing (API keys encryption)
  - Testing de analytics corregido
  - Performance testing

#### Entregables
- [ ] Sección Agents & Models completa
- [ ] Sección Global Integrations completa
- [ ] Sección Branding & Appearance completa
- [ ] Sección Billing con Stripe funcional
- [ ] Sección Cost Monitoring completa
- [ ] Analytics corregido y mejorado
- [ ] Tests pasando
- [ ] Security review aprobado

---

### Fase 18: Integration & E2E Testing

**Objetivo**: Integración completa de todos los módulos y testing end-to-end.

**Duración Estimada**: 2 semanas

#### Tareas (Semana 1-2)

**18.1 Integration Testing**
- **Responsable**: qa-tester + todos los especialistas
- **Tareas**:
  - Testing de flujo completo:
    1. Admin crea agente
    2. User conecta MCP (Drive)
    3. User crea corpus desde Drive
    4. User inicia chat con agente usando RAG
    5. Agente genera artifact
    6. User exporta artifact a Notion
    7. User revisa versiones de artifact
  - Testing de colaboración en proyectos
  - Testing de tier restrictions
  - Testing de billing flow completo
  - Testing de cost tracking accuracy

**18.2 Security Audit**
- **Responsable**: security-auditor
- **Tareas**:
  - Review de todas las RLS policies
  - Penetration testing
  - Testing de isolation entre usuarios
  - Testing de encryption (MCP tokens, API keys)
  - Review de audit logs completeness
  - Testing de rate limiting

**18.3 Performance Testing**
- **Responsable**: cloud-ai-ops-engineer + qa-tester
- **Tareas**:
  - Load testing de chat (múltiples usuarios)
  - Performance de RAG search
  - Performance de dashboard
  - Database query optimization
  - Caching strategy validation
  - Lighthouse audits

**18.4 Accessibility Testing**
- **Responsable**: ui-ux-designer + qa-tester
- **Tareas**:
  - WCAG 2.1 compliance testing
  - Screen reader testing
  - Keyboard navigation testing
  - Color contrast validation
  - Focus management

**18.5 Documentation Update**
- **Responsable**: technical-documentation-writer
- **Tareas**:
  - Actualizar todos los docs en `docs/`
  - Crear user guides
  - Crear admin guides
  - Crear API documentation (si se expone API pública)
  - Actualizar ROADMAP con estado final

#### Entregables
- [ ] Integration tests pasando
- [ ] Security audit aprobado
- [ ] Performance benchmarks documentados
- [ ] Accessibility compliance validado
- [ ] Documentación completa actualizada
- [ ] Bugs críticos resueltos

---

### Fase 19: Performance Optimization

**Objetivo**: Optimizar performance para producción.

**Duración Estimada**: 1 semana

#### Tareas

**19.1 Database Optimization**
- **Responsable**: data-engineer
- **Tareas**:
  - Optimizar índices
  - Implementar materialized views adicionales
  - Optimizar queries lentas
  - Configurar connection pooling

**19.2 Caching Strategy**
- **Responsable**: fullstack-implementer + cloud-ai-ops-engineer
- **Tareas**:
  - Implementar caching en API routes
  - Optimizar Next.js cache
  - Implementar CDN para assets
  - Configurar stale-while-revalidate

**19.3 Frontend Optimization**
- **Responsable**: fullstack-implementer + ui-ux-designer
- **Tareas**:
  - Code splitting optimization
  - Image optimization (next/image)
  - Font optimization
  - Bundle size reduction
  - Lazy loading de componentes

**19.4 AI/RAG Optimization**
- **Responsable**: cloud-ai-ops-engineer + data-engineer
- **Tareas**:
  - Optimizar embeddings generation (batching)
  - Optimizar Qdrant queries
  - Implementar caching de búsquedas frecuentes
  - Optimizar context builder

#### Entregables
- [ ] Lighthouse score > 95
- [ ] Database queries < 100ms (p95)
- [ ] Chat latency < 2s (first token)
- [ ] RAG search < 500ms
- [ ] Bundle size < 500KB (initial load)

---

### Fase 20: Production Deployment

**Objetivo**: Desplegar a producción con monitoreo completo.

**Duración Estimada**: 1 semana

#### Pre-Deployment Checklist

- [ ] Todos los tests pasando
- [ ] Security audit aprobado
- [ ] Performance benchmarks cumplidos
- [ ] Documentación completa
- [ ] Backup strategy configurada
- [ ] Monitoring configurado
- [ ] Alertas configuradas
- [ ] Rollback plan documentado

#### Tareas

**20.1 Deployment Setup**
- **Responsable**: cloud-ai-ops-engineer
- **Tareas**:
  - Configurar Vercel production environment
  - Configurar variables de entorno
  - Configurar Supabase production
  - Configurar Qdrant production
  - Configurar dominios y SSL

**20.2 Database Migration**
- **Responsable**: data-engineer
- **Tareas**:
  - Backup de DB
  - Aplicar todas las migraciones en orden
  - Verificar RLS policies
  - Seed production data
  - Crear primer usuario admin

**20.3 Monitoring Setup**
- **Responsable**: cloud-ai-ops-engineer
- **Tareas**:
  - Configurar Vercel Analytics
  - Configurar error tracking (Sentry o similar)
  - Configurar uptime monitoring
  - Configurar cost monitoring
  - Configurar security alerts

**20.4 Deployment**
- **Responsable**: cloud-ai-ops-engineer + project-planner-coordinator
- **Tareas**:
  - Deploy a staging
  - Smoke testing en staging
  - Deploy a production
  - Smoke testing en production
  - Monitorear primeras horas

**20.5 Post-Deployment**
- **Responsable**: project-planner-coordinator
- **Tareas**:
  - Retrospectiva del proyecto
  - Documentar lessons learned
  - Actualizar ROADMAP con fecha de completion
  - Planificar mejoras futuras

#### Entregables
- [ ] Sistema en producción
- [ ] Monitoring activo
- [ ] Alertas configuradas
- [ ] Documentación de deployment
- [ ] Retrospectiva documentada

---

## 6. Coordinación de Especialistas

### 6.1 Roles y Responsabilidades

| Especialista | Responsabilidades Principales | Fases Clave |
|--------------|-------------------------------|-------------|
| **software-architect** | Decisiones arquitectónicas, ADRs, diseño de sistemas | Todas las fases (diseño) |
| **fullstack-implementer** | Desarrollo de features, API routes, Server Actions, integración DB | Todas las fases (implementación) |
| **ui-ux-designer** | Diseño de interfaces, user flows, tema glassmorphic | Fases 12, 13, 14, 15, 16, 17 |
| **product-design-architect** | Sistema de componentes, design tokens, arquitectura UI | Fase 12 |
| **nextjs-routing-architect** | Estructura de rutas, layouts, optimización de RSC | Fases 12, 13 |
| **prompt-architect** | System prompts, personalización de agentes, RAG integration | Fases 13, 15 |
| **data-engineer** | Pipeline RAG, Qdrant, embeddings, database optimization | Fases 15, 17, 19 |
| **security-auditor** | Security reviews, RLS, encryption, audit | Todas las fases (validación) |
| **qa-tester** | Testing, validación, QA | Todas las fases (pruebas) |
| **cloud-ai-ops-engineer** | Vercel AI SDK, model routing, MCP, cost optimization | Fases 13, 14, 15, 17, 19, 20 |
| **technical-documentation-writer** | Documentación técnica, user guides, API docs | Fase 18 |

### 6.2 Matriz de Asignación

```
┌────────────────────┬──────────────────────────────────┐
│ Fase               │ Especialistas Principales        │
├────────────────────┼──────────────────────────────────┤
│ 11: Fixes          │ fullstack-implementer            │
│                    │ qa-tester                        │
├────────────────────┼──────────────────────────────────┤
│ 12: Dashboard      │ ui-ux-designer                   │
│                    │ product-design-architect         │
│                    │ fullstack-implementer            │
│                    │ prompt-architect                 │
├────────────────────┼──────────────────────────────────┤
│ 13: Agents         │ cloud-ai-ops-engineer            │
│                    │ fullstack-implementer            │
│                    │ prompt-architect                 │
│                    │ data-engineer                    │
│                    │ ui-ux-designer                   │
│                    │ security-auditor                 │
├────────────────────┼──────────────────────────────────┤
│ 14: MCP            │ cloud-ai-ops-engineer            │
│                    │ fullstack-implementer            │
│                    │ security-auditor                 │
├────────────────────┼──────────────────────────────────┤
│ 15: RAG            │ data-engineer                    │
│                    │ cloud-ai-ops-engineer            │
│                    │ fullstack-implementer            │
│                    │ prompt-architect                 │
├────────────────────┼──────────────────────────────────┤
│ 16: Artifacts      │ fullstack-implementer            │
│                    │ data-engineer                    │
├────────────────────┼──────────────────────────────────┤
│ 17: Admin Extended │ fullstack-implementer            │
│                    │ cloud-ai-ops-engineer            │
│                    │ data-engineer                    │
│                    │ ui-ux-designer                   │
│                    │ security-auditor                 │
├────────────────────┼──────────────────────────────────┤
│ 18: Integration    │ qa-tester                        │
│                    │ security-auditor                 │
│                    │ technical-documentation-writer   │
├────────────────────┼──────────────────────────────────┤
│ 19: Optimization   │ cloud-ai-ops-engineer            │
│                    │ data-engineer                    │
│                    │ fullstack-implementer            │
├────────────────────┼──────────────────────────────────┤
│ 20: Deployment     │ cloud-ai-ops-engineer            │
│                    │ data-engineer                    │
│                    │ project-planner-coordinator      │
└────────────────────┴──────────────────────────────────┘
```

### 6.3 Protocolo de Coordinación

**Inicio de Fase**:
1. Project-planner-coordinator asigna fase a especialistas
2. Kick-off meeting (virtual o asíncrono)
3. Especialistas revisan diseños previos
4. Questions & clarifications

**Durante la Fase**:
1. Daily async updates en este ROADMAP
2. Blockers escalados a project-planner-coordinator
3. Design changes documentados en ADRs
4. Code reviews entre especialistas

**Fin de Fase**:
1. Testing completo (qa-tester)
2. Security review (security-auditor si aplica)
3. Documentation update
4. Sign-off de project-planner-coordinator
5. Retrospectiva (lessons learned)

---

## 7. Flujo de Trabajo

### 7.1 Workflow Estándar

Cada fase sigue este flujo de 5 pasos:

```
┌──────────────────────────────────────────────────┐
│ 1. DISEÑO                                        │
│ - Arquitectura                                   │
│ - Database schema                                │
│ - API contracts                                  │
│ - UI mockups                                     │
│ - Documentación (ADR si aplica)                  │
│                                                  │
│ Responsables:                                    │
│ - software-architect                             │
│ - ui-ux-designer                                 │
│ - data-engineer                                  │
│ - Especialistas relevantes                       │
└──────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────┐
│ 2. VALIDACIÓN (GATE)                             │
│ - Review de diseños                              │
│ - Approval checklist                             │
│ - Security review (si aplica)                    │
│ - Aprobación formal                              │
│                                                  │
│ Responsable:                                     │
│ - project-planner-coordinator                    │
│ - security-auditor (si aplica)                   │
│                                                  │
│ ⚠️ NO SE PROCEDE SIN APROBACIÓN                  │
└──────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────┐
│ 3. IMPLEMENTACIÓN                                │
│ - Database migrations                            │
│ - Backend (API routes, Server Actions)           │
│ - Frontend (components, pages)                   │
│ - Integration (conectar módulos)                 │
│                                                  │
│ Responsables:                                    │
│ - fullstack-implementer                          │
│ - Especialistas asignados                        │
└──────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────┐
│ 4. PRUEBAS                                       │
│ - Unit tests                                     │
│ - Integration tests                              │
│ - E2E tests                                      │
│ - Security testing                               │
│ - Performance testing                            │
│                                                  │
│ Responsables:                                    │
│ - qa-tester                                      │
│ - security-auditor                               │
└──────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────┐
│ 5. DOCUMENTACIÓN                                 │
│ - Actualizar ROADMAP (marcar checkboxes)         │
│ - Actualizar docs técnicos                       │
│ - Crear/actualizar ADRs                          │
│ - User-facing documentation (si aplica)          │
│                                                  │
│ Responsables:                                    │
│ - project-planner-coordinator                    │
│ - technical-documentation-writer                 │
│ - Especialistas (para docs técnicos)             │
└──────────────────────────────────────────────────┘
```

### 7.2 Gestión de Cambios

**Cambios Menores** (no afectan arquitectura):
- Implementador decide
- Documenta en commit message
- Notifica en daily update

**Cambios Moderados** (afectan una fase):
- Consultar con software-architect
- Documentar decisión
- Actualizar ROADMAP si es necesario

**Cambios Mayores** (afectan múltiples fases o arquitectura):
1. Crear ADR (Architecture Decision Record)
2. Presentar a project-planner-coordinator
3. Review con especialistas afectados
4. Aprobación formal
5. Actualizar ROADMAP
6. Comunicar a todo el equipo

### 7.3 Gestión de Blockers

**Identificación**:
- Cualquier impedimento que detiene progreso
- Dependencias no resueltas
- Decisiones pendientes
- Recursos faltantes

**Escalación**:
1. Especialista identifica blocker
2. Intenta resolver (1 hora)
3. Si no se resuelve, escala a project-planner-coordinator
4. Project-planner-coordinator:
   - Evalúa impacto
   - Convoca a especialistas necesarios
   - Toma decisión o facilita resolución
   - Documenta en ROADMAP

**Tracking**:
- Todos los blockers se documentan en sección "Blockers Activos" (ver abajo)
- Se actualizan diariamente
- Se cierran cuando se resuelven

---

## 8. Puertas de Validación

### 8.1 Gates por Fase

Cada fase tiene **gates obligatorios** que deben pasar antes de continuar:

#### Gate 1: Diseño Aprobado (antes de implementación)

**Checklist**:
- [ ] Mockups de UI aprobados (si aplica)
- [ ] Schema de DB diseñado y documentado (si aplica)
- [ ] API contracts definidos (si aplica)
- [ ] ADR creado (si decisión arquitectónica mayor)
- [ ] Security implications evaluadas
- [ ] Dependencias identificadas
- [ ] Estimación de tiempo confirmada

**Aprobador**: project-planner-coordinator

**Resultado**: Go/No-Go para implementación

---

#### Gate 2: Security Review (antes de deployment a staging/prod)

**Checklist**:
- [ ] RLS policies implementadas y testeadas
- [ ] Input validation implementada (Zod)
- [ ] Authentication/Authorization verificada
- [ ] Encryption implementada (tokens, API keys)
- [ ] Audit logging implementado
- [ ] Rate limiting implementado
- [ ] Penetration testing ejecutado (para fases críticas)

**Aprobador**: security-auditor

**Resultado**: Aprobado/Rechazado/Aprobado con condiciones

---

#### Gate 3: QA Sign-Off (antes de marcar fase como completa)

**Checklist**:
- [ ] Unit tests pasando
- [ ] Integration tests pasando
- [ ] E2E tests pasando (si aplica)
- [ ] Manual testing completado
- [ ] Performance benchmarks cumplidos
- [ ] Accessibility testing pasado
- [ ] Bugs críticos resueltos (P0)
- [ ] Bugs altos resueltos o documentados (P1)

**Aprobador**: qa-tester

**Resultado**: Aprobado/Rechazado

---

### 8.2 Criterios de Aceptación Global

**Para TODAS las fases**:

**Funcionalidad**:
- Feature funciona según spec
- Happy path funciona
- Edge cases manejados
- Error handling implementado

**Calidad de Código**:
- TypeScript strict mode (no `any`)
- ESLint pasando sin warnings
- Código documentado (JSDoc para funciones complejas)
- Naming conventions seguidas

**Performance**:
- Lighthouse score > 90 (para páginas)
- API response time < 500ms (p95)
- Database queries < 100ms (p95)

**Seguridad**:
- RLS policies implementadas
- Input validation con Zod
- No secrets en código
- Audit logs para operaciones críticas

**Testing**:
- Coverage > 70% (aspiracional)
- Tests pasando en CI

**Documentación**:
- ROADMAP actualizado
- Código documentado
- ADR creado (si aplica)

---

## 9. Gestión del Roadmap

### 9.1 Este Documento es VIVO

Este ROADMAP es un **documento vivo** que evoluciona con el proyecto:

**Actualizaciones Frecuentes**:
- Después de cada fase completada
- Cuando se aprueban cambios mayores
- Cuando se identifican nuevos riesgos
- Cuando cambian estimaciones

**Quién Actualiza**:
- **project-planner-coordinator**: Responsable principal
- **Especialistas**: Actualizan secciones técnicas específicas
- **security-auditor**: Actualiza secciones de seguridad
- **qa-tester**: Actualiza estado de testing

**Qué se Actualiza**:
- Checkboxes de entregables (marcar como completo)
- Fechas de completion
- Blockers activos
- Lessons learned
- Estimaciones (si cambian)
- Nuevas fases (si se identifican)

### 9.2 Control de Versiones

**Versionado del ROADMAP**:
- **v1.0**: Versión inicial (2025-11-11)
- **v1.1**: Después de Fase 11 (corrección de errores)
- **v1.2**: Después de Fase 12 (Dashboard)
- **v2.0**: Después de completar Módulo 2 (Agents)
- **v3.0**: Cuando todos los 6 módulos estén completos
- **v4.0**: Post-deployment (incluye lessons learned)

**Historial de Cambios**:
Mantener sección al final del documento con:
- Fecha de cambio
- Versión
- Descripción de cambios
- Autor del cambio

### 9.3 Comunicación de Cambios

**Cambios Menores** (checkboxes, fechas):
- Update en documento
- No requiere notificación

**Cambios Moderados** (estimaciones, scope de fase):
- Update en documento
- Notificar a especialistas afectados
- Comentar en daily update

**Cambios Mayores** (nuevas fases, cambio de arquitectura):
- Update en documento
- Crear ADR
- Meeting/comunicación formal con equipo
- Documentar reasoning

---

## 10. Métricas de Éxito

### 10.1 Métricas del Sistema (Tracking en Tiempo Real)

**Usuarios y Actividad**:
- **Total Users**: Desglosado por tier (Free/Pro/Elite)
- **Active Users** (últimos 30 días)
- **New Users** (por mes)
- **User Retention** (cohorts mensuales)
- **Geographical Distribution** (por país)

**Agentes**:
- **Total Agents** creados
- **Active Agents** (usados en últimos 30 días)
- **Conversations** por día/mes
- **Average Conversation Length** (mensajes)
- **Agent Ratings** (user feedback)

**Tokens y Costos**:
- **Total Tokens Consumed** (por mes)
- **Tokens por Model** (Economy/Balanced/Premium)
- **Tokens por Provider** (OpenAI, Anthropic, etc.)
- **Total Cost** (acumulado)
- **Cost per User**
- **Cost per Conversation**
- **Monthly Cost Trend**

**RAG y Corpus**:
- **Total Corpora**
- **Active Corpora** (consultados en últimos 30 días)
- **Total Documents** indexados
- **Total Embeddings** generados
- **Average RAG Query Latency**
- **RAG Search Accuracy** (user feedback)

**Artifacts**:
- **Total Artifacts** creados
- **Artifacts por Type** (text, image, dataset, etc.)
- **Total Versions** (promedio por artifact)
- **Exports** (por formato y destino)
- **Storage Used** (GB)

**MCP Integrations**:
- **Connected Integrations** (por servicio)
- **Active Integrations** (usadas en últimos 30 días)
- **MCP Operations** (read/write por servicio)
- **MCP Error Rate**

**Projects**:
- **Total Projects**
- **Active Projects**
- **Projects por Type**
- **Average Team Size** (collaborators)

### 10.2 Métricas de Calidad (Gates)

**Performance**:
- **Lighthouse Score**: > 90 (todas las páginas)
- **API Response Time**: < 500ms (p95)
- **Database Query Time**: < 100ms (p95)
- **Chat First Token Latency**: < 2s
- **RAG Search Latency**: < 500ms
- **Bundle Size**: < 500KB (initial load)

**Seguridad**:
- **Security Incidents**: 0 (críticos)
- **Failed Login Attempts**: Tracked y alertado
- **RLS Bypass Attempts**: 0 (detectados en pentesting)
- **Data Breaches**: 0
- **Uptime**: > 99.5%

**Testing**:
- **Test Coverage**: > 70%
- **CI/CD Success Rate**: > 95%
- **Critical Bugs in Production**: < 5 (por mes)
- **Bug Resolution Time**: < 48h (P0), < 7 días (P1)

**User Satisfaction**:
- **NPS (Net Promoter Score)**: > 50
- **User Satisfaction** (survey): > 4.0/5.0
- **Support Tickets**: < 10/semana
- **Feature Requests**: Tracked (no hay goal, solo tracking)

### 10.3 Métricas de Proyecto (Este Roadmap)

**Timeline**:
- **On-Time Delivery**: % de fases completadas en tiempo estimado
- **Total Duration**: Fecha inicio → Fecha completion
- **Blockers**: Cantidad y duración promedio

**Calidad de Ejecución**:
- **Gates Pasados en Primera Iteración**: %
- **Rework Required**: % de fases con rework significativo
- **Technical Debt**: Identificado y tracked

**Team Performance**:
- **Velocity**: Fases completadas por semana
- **Specialist Utilization**: Horas trabajadas vs estimadas
- **Cross-Functional Collaboration**: Efectividad (subjetiva)

### 10.4 Reporting

**Daily Updates** (especialistas):
- ¿Qué hice ayer?
- ¿Qué haré hoy?
- ¿Blocker(s)?

**Weekly Reports** (project-planner-coordinator):
- Estado de fase actual
- Progreso vs timeline
- Blockers activos y resoluciones
- Decisiones tomadas
- Próximos pasos

**Monthly Reports** (project-planner-coordinator):
- Resumen de fases completadas
- Métricas de sistema (si ya en prod)
- Métricas de proyecto
- Risks y mitigaciones
- Budget status (si aplica)

**Post-Deployment Reports**:
- Retrospectiva completa
- Lessons learned
- Métricas de éxito vs objetivos
- Recomendaciones para siguientes proyectos

---

## 11. Blockers Activos

**Esta sección se mantiene actualizada durante la ejecución del proyecto.**

| ID | Fecha | Fase | Descripción | Impacto | Owner | Estado |
|----|-------|------|-------------|---------|-------|--------|
| B-001 | 2025-11-11 | 11 | TypeScript errors en analytics | Crítico (build falla) | fullstack-implementer | ACTIVO |
| - | - | - | - | - | - | RESUELTO |

**Formato para nuevos blockers**:
```
| B-XXX | YYYY-MM-DD | Fase | Descripción detallada | Crítico/Alto/Medio/Bajo | especialista-responsable | ACTIVO/RESUELTO |
```

**Cuando se resuelve un blocker**:
1. Cambiar estado a RESUELTO
2. Agregar comentario con solución (opcional)
3. Mover a sección "Blockers Resueltos" (al final del doc)

---

## 12. Risks y Mitigaciones

| Risk | Probabilidad | Impacto | Mitigación |
|------|--------------|---------|------------|
| **Complejidad de RAG** | Media | Alto | Comenzar con MVP simple, iterar; usar LangChain para acelerar |
| **Integración MCP difícil** | Media | Medio | Priorizar integraciones críticas (Drive, Notion); implementar en fases |
| **Costos de IA altos** | Alta | Alto | Tier system estricto; monitoring de costos en tiempo real; alertas de presupuesto |
| **Performance de Qdrant** | Media | Medio | Testing temprano; considerar self-hosted si cloud es lento; optimizar chunking |
| **Scope creep** | Alta | Alto | Gates estrictos; cambios mayores requieren ADR; priorizar MVP |
| **Dependency en Vercel AI SDK** | Baja | Medio | Abstraer en capa propia; fácil cambiar provider si es necesario |
| **Security vulnerabilities** | Media | Crítico | Security reviews en cada fase; pentesting antes de prod; bug bounty (futuro) |
| **Timeline slippage** | Media | Medio | Estimaciones conservadoras; track velocity; ajustar roadmap si es necesario |
| **Team availability** | Media | Medio | Especialistas pueden trabajar en paralelo; documentación clara para handoffs |
| **Third-party API changes** | Baja | Medio | Versionar APIs; monitorear deprecations; abstraer en wrappers |

---

## 13. Assumptions y Dependencies

### Assumptions (Suposiciones)

1. **Supabase estable**: Supabase Auth y Database funcionarán sin cambios breaking
2. **Vercel AI SDK maduro**: SDK es production-ready y soporta multi-provider
3. **Qdrant disponible**: Qdrant Cloud o self-hosted es viable para nuestro scale
4. **Team availability**: Especialistas disponibles cuando se asignan tareas
5. **Budget suficiente**: Presupuesto para LLM/embeddings APIs, Qdrant, hosting
6. **User demand**: Hay demanda para este tipo de plataforma

### External Dependencies

| Dependencia | Tipo | Criticidad | Fallback |
|-------------|------|------------|----------|
| Supabase | Auth + DB | Crítica | Migrar a otro PostgreSQL + Auth.js (costly) |
| Vercel | Hosting | Crítica | Migrar a otro host (Netlify, Railway) |
| Qdrant | Vector DB | Alta | Migrar a Pinecone o Weaviate |
| OpenAI API | LLM + Embeddings | Media | Usar Anthropic, Google, etc. (multi-provider) |
| Stripe | Billing | Media | Implementar después o usar otro (Paddle) |
| MCP Services (Drive, Notion, etc.) | Integrations | Baja | Implementar en fases, omitir si es necesario |

---

## 14. Future Enhancements (Post-MVP)

**No están en este roadmap, pero se considerarán después del deployment inicial:**

1. **Realtime Collaboration**: WebSocket para edición simultánea de proyectos
2. **Mobile App**: React Native app para iOS/Android
3. **Public API**: Exponer API pública para integraciones de terceros
4. **Webhooks**: Eventos para integraciones externas
5. **Advanced Analytics**: ML-powered insights sobre uso
6. **Multitenancy**: Organizaciones con múltiples workspaces
7. **White-label**: Permitir a clientes enterprise usar su propio branding completo
8. **Marketplace**: Marketplace de agentes creados por usuarios
9. **Fine-tuned Models**: Entrenar modelos propios con datos de usuarios (con permiso)
10. **Advanced RAG**: Hybrid search, reranking, query expansion
11. **Code Execution**: Sandboxed code execution para agents
12. **Voice Interface**: Speech-to-text y text-to-speech
13. **Advanced Permissions**: Granular permissions más allá de roles
14. **Audit Compliance**: SOC2, GDPR, HIPAA compliance tooling

---

## 15. Historial de Cambios

### v1.0 - 2025-11-11
- **Autor**: project-planner-coordinator
- **Cambios**: Creación inicial del ROADMAP completo
  - Visión general del proyecto
  - Fundamentos técnicos documentados
  - Estado actual (Fases 0-10) documentado
  - 6 módulos del sistema diseñados
  - Fases 11-20 planificadas
  - Coordinación de especialistas definida
  - Flujo de trabajo establecido
  - Puertas de validación documentadas
  - Métricas de éxito definidas

---

## 16. Glosario

**ADR**: Architecture Decision Record - Documento que registra una decisión arquitectónica importante
**Agent**: Agente inteligente con especialización específica
**Artifact**: Resultado generado por un agente (texto, imagen, código, etc.)
**Chunking**: Proceso de dividir documentos en fragmentos para embeddings
**Corpus**: Colección de documentos indexados para RAG
**Embeddings**: Representaciones vectoriales de texto para búsqueda semántica
**Gate**: Puerta de validación que debe pasarse para continuar
**Glassmorphic**: Estilo de diseño con efecto de vidrio (transparencia, blur)
**MCP**: Model Context Protocol - Protocolo para conectar servicios externos
**RAG**: Retrieval-Augmented Generation - Técnica para enriquecer prompts con contexto
**RBAC**: Role-Based Access Control - Control de acceso basado en roles
**RLS**: Row Level Security - Seguridad a nivel de fila en PostgreSQL
**RSC**: React Server Components - Componentes que se ejecutan en servidor
**SSE**: Server-Sent Events - Protocolo para streaming de servidor a cliente
**Tier**: Nivel de subscripción (Free, Pro, Elite)

---

## Notas Finales

**Este ROADMAP es la fuente de verdad para el proyecto The Hub.**

- Cualquier cambio debe reflejarse aquí
- Cualquier duda debe resolverse consultando este documento
- Cualquier decisión mayor debe documentarse en ADR y referenciarse aquí

**Para iniciar una fase**:
1. Leer sección completa de la fase
2. Revisar dependencias
3. Confirmar con project-planner-coordinator
4. Ejecutar según workflow (Diseño → Validación → Implementación → Pruebas → Documentación)

**Para reportar progreso**:
- Marcar checkboxes a medida que se completan entregables
- Actualizar sección de blockers si hay impedimentos
- Comunicar en daily updates

**Para obtener ayuda**:
- Consultar documentación en `docs/`
- Revisar ADRs relevantes
- Escalar a project-planner-coordinator

---

**¡Éxito en la construcción de The Hub! 🚀**
