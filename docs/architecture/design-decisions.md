# Design Decisions - CJHIRASHI APP

**Version**: 1.0
**Created**: 2025-11-21 (Bootstrap Phase)
**Last Updated**: 2025-11-21
**Status**: Initial Documentation

---

## Overview

This document consolidates key architectural and design decisions for CJHIRASHI APP. For detailed Architecture Decision Records (ADRs), see the `/docs/decisions/` directory.

---

## Core Design Principles

### 1. Security First (Defense in Depth)

**Decision**: Implement security at multiple layers rather than relying on a single security mechanism.

**Rationale**:
- No single point of failure
- Compensates for potential vulnerabilities in any layer
- Provides comprehensive audit trail

**Implementation**:
1. **Middleware Layer**: Session validation, role extraction
2. **Application Layer**: `requireAdmin()`, `requireModerator()` helpers
3. **API Layer**: Re-verification in all routes and actions
4. **Query Layer**: Parameterized queries to prevent SQL injection
5. **Database Layer**: Row-Level Security (RLS) policies

**Related ADR**: [ADR-004: Security Layers](../decisions/adr-004-security-layers.md)

---

### 2. Type Safety (Compile-time + Runtime)

**Decision**: Enforce type safety at both compile-time (TypeScript) and runtime (Zod).

**Rationale**:
- Catch errors during development (TypeScript)
- Validate external inputs at runtime (Zod)
- Reduce production bugs
- Improve developer experience

**Implementation**:
- TypeScript strict mode enabled
- Zod schemas for all API inputs
- Prisma for type-safe database queries
- Type inference throughout the application

**Example**:
```typescript
// Compile-time safety
const updateRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['admin', 'moderator', 'user']),
});

// Runtime validation
const validated = updateRoleSchema.parse(input);
```

---

### 3. Server-First Architecture

**Decision**: Leverage React Server Components and Server Actions as the default pattern.

**Rationale**:
- Reduced JavaScript bundle size
- Improved performance (less client-side work)
- Better SEO
- Direct database access without API layer
- Built-in CSRF protection

**Implementation**:
- Server Components for data fetching
- Client Components only when interactivity needed
- Server Actions for mutations
- Progressive enhancement approach

**Pattern**:
```typescript
// Server Component (default)
export default async function UsersPage() {
  const users = await getUsers(); // Direct DB access
  return <UsersTable users={users} />;
}

// Client Component (when needed)
'use client';
export function InteractiveFilter() {
  const [filter, setFilter] = useState('');
  // ...
}
```

---

### 4. Modular Architecture

**Decision**: Organize system into self-contained modules with clear boundaries.

**Rationale**:
- Independent development and testing
- Easier to scale team
- Reduced coupling
- Progressive feature rollout

**Modules Defined**:
1. **Admin Panel** (✅ Implemented)
2. **AI Agents** (🔄 Planned)
3. **RAG System** (🔄 Planned)
4. **Artifacts** (🔄 Planned)
5. **MCP Integrations** (🔄 Planned)
6. **Projects/Workspaces** (🔄 Planned)
7. **Tier & Billing** (🔄 Planned)
8. **Customization** (🔄 Planned)

---

### 5. Hybrid Database Approach

**Decision**: Use both Prisma Client and Supabase Client depending on use case.

**Rationale**:
- Prisma: Type-safe migrations, excellent DX for complex queries
- Supabase: RLS enforcement, real-time subscriptions, auth integration
- Best of both worlds

**Usage Pattern**:
- **Prisma**: Complex queries, joins, aggregations, migrations
- **Supabase**: Simple CRUD with RLS, real-time features, auth queries

**Related ADR**: [ADR-005: ORM vs Raw SQL](../decisions/adr-005-orm-vs-raw-sql.md)

---

### 6. Immutable Audit Logs

**Decision**: Audit logs are append-only and cannot be modified or deleted.

**Rationale**:
- Compliance requirements
- Forensic analysis capability
- Trust and accountability
- Tamper-proof audit trail

**Implementation**:
- No UPDATE or DELETE operations on `audit_logs` table
- Database triggers prevent modifications
- RLS policies enforce read-only access
- Automatic timestamping

**Related ADR**: [ADR-002: Database Schema Design](../decisions/adr-002-database-schema.md)

---

### 7. Role-Based Access Control (RBAC)

**Decision**: Implement hierarchical role-based permissions rather than fine-grained ACLs.

**Rationale**:
- Simpler to reason about
- Easier to maintain
- Sufficient for current requirements
- Can evolve to ABAC if needed

**Role Hierarchy**:
```
admin (level 3)
  ↳ Full system access
  ↳ User management
  ↳ System configuration

moderator (level 2)
  ↳ Read users
  ↳ Read audit logs
  ↳ Limited analytics

user (level 1)
  ↳ Own profile only
  ↳ Own data only
```

**Related ADR**: [ADR-001: RBAC Implementation](../decisions/adr-001-rbac-implementation.md)

---

### 8. API Route Conventions

**Decision**: Standardize API route structure and response format.

**Rationale**:
- Consistent developer experience
- Easier to document
- Predictable error handling
- Client-side simplification

**Conventions**:
- RESTful resource naming (`/api/admin/users`, `/api/admin/roles`)
- Standard HTTP methods (GET, POST, PUT, DELETE)
- Consistent response format:
  ```typescript
  // Success
  { success: true, data: { ... } }

  // Error
  { success: false, error: { code: "...", message: "..." } }
  ```

**Related ADR**: [ADR-003: API Route Structure](../decisions/adr-003-api-route-structure.md)

---

### 9. Multi-Provider AI Strategy

**Decision**: Abstract LLM provider behind Vercel AI SDK to support multiple providers.

**Rationale**:
- No vendor lock-in
- Leverage strengths of different models
- Cost optimization (route to cheapest capable model)
- Fallback options for reliability

**Planned Providers**:
- OpenAI (GPT-4, GPT-4 Turbo)
- Anthropic (Claude 3.5 Sonnet)
- Google (Gemini Pro)
- Local models (Llama, Mistral)

**Implementation Strategy**:
```typescript
// Unified interface via Vercel AI SDK
const completion = await generateText({
  model: userConfig.preferredModel, // Dynamic
  prompt: "...",
});
```

---

### 10. Progressive Feature Rollout

**Decision**: Implement features in phases (ROADMAP-driven) rather than all at once.

**Rationale**:
- Manage complexity
- Validate assumptions early
- Get user feedback sooner
- Reduce risk of large rewrites

**Phase Strategy**:
1. **Phase 0**: Foundation (Admin Panel + RBAC) ✅
2. **Phase 1**: Conceptualization (Analyze ROADMAP)
3. **Phase 2**: Architecture (Design next iteration)
4. **Phase 3+**: Implement modules incrementally

---

## Technology-Specific Decisions

### Next.js Configuration

**App Router vs Pages Router**:
- ✅ **Decision**: App Router
- **Rationale**: Server Components, Server Actions, improved performance, future of Next.js

**Turbopack vs Webpack**:
- ✅ **Decision**: Turbopack (dev mode)
- **Rationale**: Faster builds, official Next.js recommendation

### Authentication

**Auth Provider**:
- ✅ **Decision**: Supabase Auth
- **Rationale**: Integrated with database, handles sessions, supports OAuth, cookie-based SSR

**Session Management**:
- ✅ **Decision**: Cookie-based (SSR)
- **Rationale**: Better security than localStorage, works with Server Components

### Styling

**CSS Framework**:
- ✅ **Decision**: Tailwind CSS
- **Rationale**: Utility-first, excellent DX, small bundle size, JIT compiler

**Component Library**:
- ✅ **Decision**: shadcn/ui (new-york style)
- **Rationale**: Copy-paste components (no npm bloat), full customization, Radix UI primitives

### Database

**Database Provider**:
- ✅ **Decision**: Supabase (PostgreSQL)
- **Rationale**: Managed PostgreSQL, RLS support, real-time, auth integration

**Query Strategy**:
- ✅ **Decision**: Hybrid (Prisma + Supabase Client)
- **Rationale**: Type safety + RLS enforcement (see ADR-005)

---

## Open Decisions (To Be Made)

### 1. Vector Database Selection

**Options**:
- Qdrant (current plan)
- Pinecone
- Weaviate
- pgvector (PostgreSQL extension)

**Decision Criteria**:
- Cost
- Performance
- Integration complexity
- Scalability

**Status**: 🔄 Pending Phase 3 (RAG System)

---

### 2. Billing Provider

**Options**:
- Stripe
- Paddle
- LemonSqueezy

**Decision Criteria**:
- Fee structure
- International support
- Tax handling
- Developer experience

**Status**: 🔄 Pending Phase 7 (Tier & Billing)

---

### 3. Email Provider

**Options**:
- Resend
- SendGrid
- Postmark

**Decision Criteria**:
- Deliverability
- Cost
- Developer experience
- Template management

**Status**: 🔄 Pending email notification requirements

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-21 | Initial design decisions consolidation |

---

## Related Documentation

- [Architecture Decision Records (ADRs)](../decisions/)
- [System Overview](./system-overview.md)
- [Technology Stack](./technology-stack.md)
- [ROADMAP](../ROADMAP.md)

---

**Document Version**: 1.0
**Maintained By**: fase-docs (doc-writer)
**Review Cycle**: After each major architectural decision
