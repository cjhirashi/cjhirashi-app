# ADR-003: Estructura de API Routes y Convenciones

**Estado:** Aceptado
**Fecha:** 2025-11-11
**Decisores:** Backend Team, Frontend Team
**Contexto Técnico:** Next.js 15 App Router, REST API, TypeScript

---

## Contexto y Problema

Necesitamos definir una estructura consistente para las API routes del admin panel que:

1. Sea intuitiva y RESTful
2. Soporte autenticación y autorización de manera uniforme
3. Maneje errores de forma consistente
4. Incluya validación de datos
5. Genere respuestas tipadas
6. Facilite testing y mantenimiento

### Requisitos Específicos

- **Convención REST**: Seguir principios REST para operaciones CRUD
- **Type Safety**: TypeScript end-to-end
- **Error Handling**: Manejo consistente de errores con códigos apropiados
- **Validación**: Validar todas las entradas con Zod
- **Autorización**: Verificar permisos en cada endpoint
- **Logging**: Registrar operaciones sensibles
- **Performance**: Respuestas rápidas con paginación

---

## Opciones Consideradas

### Opción 1: Server Actions Únicamente

**Descripción**: Usar solo Server Actions, sin API routes

**Pros:**
- Type-safe por defecto
- Integración directa con React
- Menos código boilerplate

**Contras:**
- No RESTful (dificulta integraciones externas)
- Difícil de testear independientemente
- No adecuado para webhooks o APIs públicas

**Evaluación:** Rechazada - Limita flexibilidad futura

---

### Opción 2: API Routes + Server Actions Híbrido (SELECCIONADA)

**Descripción**:
- **API Routes**: Para operaciones CRUD, listados, búsquedas
- **Server Actions**: Para mutaciones desde formularios y acciones rápidas

**Pros:**
- RESTful para integraciones
- Type-safe con Server Actions
- Flexible y escalable
- Testeable independientemente

**Contras:**
- Más código que opción 1
- Duplicación potencial de lógica

**Evaluación:** ACEPTADA - Balance óptimo

---

### Opción 3: tRPC

**Descripción**: Usar tRPC para type-safe API

**Pros:**
- Type safety completo
- Excelente DX

**Contras:**
- Dependencia adicional
- No REST (dificulta documentación estándar)
- Over-engineering para este proyecto

**Evaluación:** Rechazada - Excesivo para las necesidades actuales

---

## Decisión

Implementar **Opción 2: API Routes + Server Actions Híbrido**

---

## Estructura de Directorios

```
app/api/admin/
├── users/
│   ├── route.ts                    → GET /api/admin/users, POST /api/admin/users
│   ├── [id]/
│   │   ├── route.ts                → GET/PUT/DELETE /api/admin/users/[id]
│   │   └── status/
│   │       └── route.ts            → PATCH /api/admin/users/[id]/status
│   └── stats/
│       └── route.ts                → GET /api/admin/users/stats
│
├── roles/
│   ├── route.ts                    → GET/POST /api/admin/roles
│   └── [id]/
│       └── route.ts                → GET/PUT/DELETE /api/admin/roles/[id]
│
├── audit-logs/
│   ├── route.ts                    → GET /api/admin/audit-logs
│   ├── [id]/
│   │   └── route.ts                → GET /api/admin/audit-logs/[id]
│   └── export/
│       └── route.ts                → POST /api/admin/audit-logs/export
│
├── analytics/
│   ├── dashboard/
│   │   └── route.ts                → GET /api/admin/analytics/dashboard
│   ├── users/
│   │   └── route.ts                → GET /api/admin/analytics/users
│   └── activity/
│       └── route.ts                → GET /api/admin/analytics/activity
│
└── settings/
    ├── route.ts                    → GET/PUT /api/admin/settings
    └── [key]/
        └── route.ts                → GET/PUT /api/admin/settings/[key]
```

---

## Convenciones de API

### 1. RESTful Endpoints

| Método HTTP | Ruta | Acción | Descripción |
|-------------|------|--------|-------------|
| GET | `/api/admin/users` | index | Listar usuarios (paginado) |
| GET | `/api/admin/users/[id]` | show | Obtener un usuario |
| POST | `/api/admin/users` | create | Crear usuario |
| PUT | `/api/admin/users/[id]` | update | Actualizar usuario (completo) |
| PATCH | `/api/admin/users/[id]` | partial update | Actualizar usuario (parcial) |
| DELETE | `/api/admin/users/[id]` | destroy | Eliminar usuario |

### 2. Naming Conventions

- **Rutas**: Plural para colecciones (`/users`, no `/user`)
- **IDs**: Siempre UUIDs, parámetro `[id]`
- **Sub-recursos**: Anidados cuando sea lógico (`/users/[id]/status`)
- **Acciones especiales**: Verbos al final (`/audit-logs/export`)

### 3. Query Parameters

```typescript
// GET /api/admin/users?page=1&limit=20&role=admin&status=active&search=john

interface UsersQueryParams {
  page?: number;        // Default: 1
  limit?: number;       // Default: 20, Max: 100
  role?: 'admin' | 'moderator' | 'user';
  status?: 'active' | 'inactive' | 'suspended' | 'pending';
  search?: string;      // Busca en name, email
  sort?: string;        // Default: 'created_at'
  order?: 'asc' | 'desc'; // Default: 'desc'
}
```

### 4. Response Format

#### Success Response

```typescript
// GET /api/admin/users (Lista)
{
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "admin",
      "status": "active",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}

// GET /api/admin/users/[id] (Detalle)
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "admin",
    "status": "active",
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-10T00:00:00Z"
  }
}

// POST /api/admin/users (Creación)
{
  "data": { /* usuario creado */ },
  "message": "User created successfully"
}
```

#### Error Response

```typescript
// 400 Bad Request
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}

// 401 Unauthorized
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}

// 403 Forbidden
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions"
  }
}

// 404 Not Found
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  }
}

// 500 Internal Server Error
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred",
    "requestId": "req-123" // Para debugging
  }
}
```

---

## Implementación Base

### 1. Helper de Respuestas

```typescript
// lib/api/response.ts
import { NextResponse } from 'next/server';

export type ApiResponse<T = any> = {
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  message?: string;
};

export type ApiError = {
  error: {
    code: string;
    message: string;
    details?: any;
    requestId?: string;
  };
};

export function apiSuccess<T>(data: T, meta?: ApiResponse['meta'], message?: string) {
  return NextResponse.json({ data, meta, message } as ApiResponse<T>, {
    status: 200,
  });
}

export function apiCreated<T>(data: T, message = 'Resource created successfully') {
  return NextResponse.json({ data, message } as ApiResponse<T>, {
    status: 201,
  });
}

export function apiError(
  code: string,
  message: string,
  status = 500,
  details?: any,
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details,
        requestId: crypto.randomUUID(),
      },
    } as ApiError,
    { status },
  );
}

export function apiValidationError(details: any) {
  return apiError('VALIDATION_ERROR', 'Invalid input data', 400, details);
}

export function apiUnauthorized(message = 'Authentication required') {
  return apiError('UNAUTHORIZED', message, 401);
}

export function apiForbidden(message = 'Insufficient permissions') {
  return apiError('FORBIDDEN', message, 403);
}

export function apiNotFound(message = 'Resource not found') {
  return apiError('NOT_FOUND', message, 404);
}
```

### 2. Helper de Autorización para API

```typescript
// lib/api/auth.ts
import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
import { apiUnauthorized, apiForbidden } from './response';
import type { Role } from '@/lib/admin/rbac/roles';

export async function requireApiAuth(request: NextRequest) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims?.sub) {
    throw apiUnauthorized();
  }

  return {
    id: data.claims.sub,
    email: data.claims.email!,
  };
}

export async function requireApiRole(request: NextRequest, requiredRole: Role) {
  const user = await requireApiAuth(request);
  const supabase = await createClient();

  const { data: userRole, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (error || !userRole) {
    throw apiForbidden();
  }

  // Verificar jerarquía de roles
  const ROLE_HIERARCHY = { admin: 3, moderator: 2, user: 1 };
  const userLevel = ROLE_HIERARCHY[userRole.role as Role] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;

  if (userLevel < requiredLevel) {
    throw apiForbidden();
  }

  return {
    ...user,
    role: userRole.role as Role,
  };
}
```

### 3. Helper de Validación

```typescript
// lib/api/validation.ts
import { z } from 'zod';
import { apiValidationError } from './response';

export function validateBody<T extends z.ZodType>(schema: T, body: unknown) {
  const result = schema.safeParse(body);

  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    throw apiValidationError(details);
  }

  return result.data as z.infer<T>;
}

export function validateQuery<T extends z.ZodType>(
  schema: T,
  searchParams: URLSearchParams,
) {
  const params = Object.fromEntries(searchParams.entries());
  const result = schema.safeParse(params);

  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    throw apiValidationError(details);
  }

  return result.data as z.infer<T>;
}
```

### 4. Wrapper de Error Handling

```typescript
// lib/api/handler.ts
import { NextRequest, NextResponse } from 'next/server';
import { apiError } from './response';

export function apiHandler(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
) {
  return async (request: NextRequest, context?: any) => {
    try {
      return await handler(request, context);
    } catch (error: any) {
      // Si el error ya es un NextResponse (lanzado por helpers), retornarlo
      if (error instanceof NextResponse) {
        return error;
      }

      // Logging
      console.error('[API Error]', {
        url: request.url,
        method: request.method,
        error: error.message,
        stack: error.stack,
      });

      // Error genérico
      return apiError(
        'INTERNAL_ERROR',
        process.env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : error.message,
        500,
      );
    }
  };
}
```

---

## Ejemplo Completo: Users API

### GET /api/admin/users (Lista)

```typescript
// app/api/admin/users/route.ts
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api/handler';
import { requireApiRole } from '@/lib/api/auth';
import { apiSuccess } from '@/lib/api/response';
import { validateQuery } from '@/lib/api/validation';
import { getUsers } from '@/lib/admin/queries/users';

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  role: z.enum(['admin', 'moderator', 'user']).optional(),
  status: z.enum(['active', 'inactive', 'suspended', 'pending']).optional(),
  search: z.string().optional(),
  sort: z.string().default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const GET = apiHandler(async (request: NextRequest) => {
  // 1. Autenticación y autorización
  await requireApiRole(request, 'moderator');

  // 2. Validar query params
  const params = validateQuery(querySchema, request.nextUrl.searchParams);

  // 3. Obtener datos
  const { users, total } = await getUsers({
    page: params.page,
    limit: params.limit,
    filters: {
      role: params.role,
      status: params.status,
      search: params.search,
    },
    sort: params.sort,
    order: params.order,
  });

  // 4. Retornar respuesta
  return apiSuccess(users, {
    page: params.page,
    limit: params.limit,
    total,
    totalPages: Math.ceil(total / params.limit),
  });
});
```

### POST /api/admin/users (Crear)

```typescript
// app/api/admin/users/route.ts (continúa)
import { createUser } from '@/lib/admin/mutations/users';
import { createAuditLog } from '@/lib/admin/audit';

const createUserSchema = z.object({
  email: z.string().email('Invalid email'),
  full_name: z.string().min(2).max(255),
  role: z.enum(['admin', 'moderator', 'user']).default('user'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const POST = apiHandler(async (request: NextRequest) => {
  // 1. Autenticación y autorización
  const admin = await requireApiRole(request, 'admin');

  // 2. Validar body
  const body = await request.json();
  const validated = validateBody(createUserSchema, body);

  // 3. Crear usuario
  const user = await createUser(validated);

  // 4. Audit log
  await createAuditLog({
    userId: admin.id,
    action: 'user.create',
    resourceType: 'user',
    resourceId: user.id,
    changes: { email: validated.email, role: validated.role },
  });

  // 5. Retornar respuesta
  return apiCreated(user, 'User created successfully');
});
```

### GET /api/admin/users/[id] (Detalle)

```typescript
// app/api/admin/users/[id]/route.ts
import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { requireApiRole } from '@/lib/api/auth';
import { apiSuccess, apiNotFound } from '@/lib/api/response';
import { getUserById } from '@/lib/admin/queries/users';

export const GET = apiHandler(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    // 1. Autenticación y autorización
    await requireApiRole(request, 'moderator');

    // 2. Obtener usuario
    const user = await getUserById(params.id);

    if (!user) {
      throw apiNotFound('User not found');
    }

    // 3. Retornar respuesta
    return apiSuccess(user);
  },
);
```

### PUT /api/admin/users/[id] (Actualizar)

```typescript
// app/api/admin/users/[id]/route.ts (continúa)
import { updateUser } from '@/lib/admin/mutations/users';

const updateUserSchema = z.object({
  full_name: z.string().min(2).max(255).optional(),
  role: z.enum(['admin', 'moderator', 'user']).optional(),
  status: z.enum(['active', 'inactive', 'suspended', 'pending']).optional(),
});

export const PUT = apiHandler(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    // 1. Autenticación y autorización
    const admin = await requireApiRole(request, 'admin');

    // 2. Validar body
    const body = await request.json();
    const validated = validateBody(updateUserSchema, body);

    // 3. Obtener usuario actual (para audit log)
    const currentUser = await getUserById(params.id);
    if (!currentUser) throw apiNotFound('User not found');

    // 4. Actualizar usuario
    const updatedUser = await updateUser(params.id, validated);

    // 5. Audit log
    await createAuditLog({
      userId: admin.id,
      action: 'user.update',
      resourceType: 'user',
      resourceId: params.id,
      changes: {
        full_name: {
          from: currentUser.full_name,
          to: validated.full_name,
        },
        role: {
          from: currentUser.role,
          to: validated.role,
        },
      },
    });

    // 6. Retornar respuesta
    return apiSuccess(updatedUser, undefined, 'User updated successfully');
  },
);
```

### DELETE /api/admin/users/[id] (Eliminar)

```typescript
// app/api/admin/users/[id]/route.ts (continúa)
import { deleteUser } from '@/lib/admin/mutations/users';

export const DELETE = apiHandler(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    // 1. Autenticación y autorización
    const admin = await requireApiRole(request, 'admin');

    // 2. Verificar que el usuario existe
    const user = await getUserById(params.id);
    if (!user) throw apiNotFound('User not found');

    // 3. No permitir eliminar al propio usuario
    if (user.id === admin.id) {
      throw apiForbidden('Cannot delete your own account');
    }

    // 4. Eliminar usuario
    await deleteUser(params.id);

    // 5. Audit log
    await createAuditLog({
      userId: admin.id,
      action: 'user.delete',
      resourceType: 'user',
      resourceId: params.id,
      changes: { email: user.email },
    });

    // 6. Retornar respuesta
    return NextResponse.json(
      { message: 'User deleted successfully' },
      { status: 204 },
    );
  },
);
```

---

## Server Actions (Complemento)

Para mutaciones desde formularios, usar Server Actions:

```typescript
// lib/admin/actions/users.ts
'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth/require-admin';
import { updateUser } from '@/lib/admin/mutations/users';
import { createAuditLog } from '@/lib/admin/audit';
import { z } from 'zod';

const updateUserRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['admin', 'moderator', 'user']),
});

export async function updateUserRole(userId: string, role: string) {
  // 1. Autorización
  const admin = await requireAdmin();

  // 2. Validación
  const validated = updateUserRoleSchema.parse({ userId, role });

  // 3. Obtener usuario actual
  const currentUser = await getUserById(validated.userId);

  // 4. Actualizar
  await updateUser(validated.userId, { role: validated.role });

  // 5. Audit log
  await createAuditLog({
    userId: admin.id,
    action: 'user.role.update',
    resourceType: 'user',
    resourceId: validated.userId,
    changes: {
      role: { from: currentUser?.role, to: validated.role },
    },
  });

  // 6. Revalidar cache
  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${validated.userId}`);

  return { success: true };
}
```

**Uso desde Client Component:**

```typescript
'use client';

import { updateUserRole } from '@/lib/admin/actions/users';
import { toast } from '@/components/ui/use-toast';

export function ChangeRoleButton({ userId, currentRole }) {
  const handleChange = async (newRole: string) => {
    try {
      await updateUserRole(userId, newRole);
      toast({ title: 'Role updated successfully' });
    } catch (error) {
      toast({ title: 'Error updating role', variant: 'destructive' });
    }
  };

  return <button onClick={() => handleChange('admin')}>Make Admin</button>;
}
```

---

## Rate Limiting

```typescript
// lib/api/rate-limit.ts
import { NextRequest } from 'next/server';
import { apiForbidden } from './response';

const rateLimit = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  request: NextRequest,
  identifier: string,
  max: number,
  windowMs: number,
) {
  const now = Date.now();
  const record = rateLimit.get(identifier);

  if (record && now < record.resetAt) {
    if (record.count >= max) {
      throw apiForbidden('Rate limit exceeded. Try again later.');
    }
    record.count++;
  } else {
    rateLimit.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
  }

  // Cleanup old entries
  if (Math.random() < 0.01) {
    for (const [key, value] of rateLimit.entries()) {
      if (now >= value.resetAt) {
        rateLimit.delete(key);
      }
    }
  }
}

// Uso en API route
export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireApiAuth(request);

  // 10 requests por minuto
  checkRateLimit(request, user.id, 10, 60000);

  // ... resto de la lógica
});
```

**Nota**: Para producción, considerar usar Upstash Rate Limit o Vercel's built-in rate limiting.

---

## Testing de API Routes

```typescript
// __tests__/app/api/admin/users/route.test.ts
import { GET, POST } from '@/app/api/admin/users/route';
import { createMockRequest } from '@/test/utils';
import { createTestUser } from '@/test/factories';

describe('/api/admin/users', () => {
  describe('GET', () => {
    it('should return users list for admin', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const request = createMockRequest({ user: admin });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toBeInstanceOf(Array);
      expect(data.meta).toMatchObject({
        page: 1,
        limit: 20,
      });
    });

    it('should return 401 for unauthenticated requests', async () => {
      const request = createMockRequest();

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 403 for non-admin users', async () => {
      const user = await createTestUser({ role: 'user' });
      const request = createMockRequest({ user });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.code).toBe('FORBIDDEN');
    });
  });

  describe('POST', () => {
    it('should create user for admin', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const request = createMockRequest({
        user: admin,
        body: {
          email: 'newuser@example.com',
          full_name: 'New User',
          role: 'user',
          password: 'password123',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.data.email).toBe('newuser@example.com');
    });

    it('should return 400 for invalid email', async () => {
      const admin = await createTestUser({ role: 'admin' });
      const request = createMockRequest({
        user: admin,
        body: { email: 'invalid-email' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
```

---

## Documentación de API

Considerar usar OpenAPI/Swagger para documentación automática:

```typescript
// lib/api/openapi.ts
export const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Admin Panel API',
    version: '1.0.0',
  },
  paths: {
    '/api/admin/users': {
      get: {
        summary: 'List users',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
        ],
        responses: {
          200: {
            description: 'Users list',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UsersList' },
              },
            },
          },
        },
      },
    },
  },
};
```

---

## Consecuencias

### Positivas

1. **Consistencia**: API predecible y fácil de usar
2. **Type Safety**: TypeScript end-to-end
3. **Validación**: Zod garantiza datos válidos
4. **Error Handling**: Manejo uniforme de errores
5. **Testeable**: Fácil de testear independientemente
6. **Documentable**: Compatible con OpenAPI

### Negativas

1. **Boilerplate**: Más código que solo Server Actions
2. **Mantenimiento**: Dos sistemas (API + Actions) para mantener

---

## Documentos Relacionados

- [ADR-001: RBAC Implementation](./adr-001-rbac-implementation.md)
- [ADR-004: Security Layers](./adr-004-security-layers.md)
- [Arquitectura del Admin Panel](../architecture/admin-panel-architecture.md)

---

**Estado Final:** ACEPTADO

**Aprobadores:**
- [ ] Backend Lead
- [ ] Frontend Lead
- [ ] Tech Lead
