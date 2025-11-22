# Implementation Templates - CJHIRASHI APP

**Version**: 1.0
**Created**: 2025-11-21 (Bootstrap Phase)
**Last Updated**: 2025-11-21
**Status**: Initial Documentation

---

## Overview

This document provides standardized code templates for common patterns in CJHIRASHI APP. These templates ensure consistency, security, and best practices across the codebase.

---

## Template 1: Server Component (Protected)

**Use Case**: Server-rendered pages that require authentication and authorization

**File**: `app/admin/[feature]/page.tsx`

```typescript
import { requireAdmin } from '@/lib/auth/require-admin';
// or: import { requireModerator } from '@/lib/auth/require-moderator';
import { getFeaturesData } from '@/lib/admin/queries/features';
import { FeatureTable } from '@/components/admin/features/feature-table';

export default async function FeaturePage({
  searchParams,
}: {
  searchParams: { page?: string; filter?: string };
}) {
  // 1. Authorization (throws/redirects if not authorized)
  await requireAdmin();

  // 2. Parse search params
  const page = Number(searchParams.page) || 1;
  const filter = searchParams.filter || '';

  // 3. Fetch data (with RLS active)
  const { data, total } = await getFeaturesData({ page, limit: 20, filter });

  // 4. Render Server Component
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Feature Management</h1>
        <p className="text-muted-foreground">
          Manage features and their configurations
        </p>
      </div>
      <FeatureTable data={data} total={total} currentPage={page} />
    </div>
  );
}
```

**Key Points**:
- ✅ Authorization first (fail fast)
- ✅ Type-safe search params
- ✅ Direct database access
- ✅ No client-side JavaScript unless needed

---

## Template 2: Client Component (Interactive)

**Use Case**: Interactive UI elements with local state

**File**: `components/admin/[feature]/feature-dialog.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateFeature } from '@/lib/admin/actions/features';
import { toast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type FeatureDialogProps = {
  feature: Feature;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function FeatureDialog({ feature, open, onOpenChange }: FeatureDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      await updateFeature(feature.id, formData);

      toast({
        title: 'Success',
        description: 'Feature updated successfully',
      });

      onOpenChange(false);
      router.refresh(); // Refresh Server Component data
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update feature',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Feature</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Form fields */}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

**Key Points**:
- ✅ `'use client'` directive
- ✅ Local state management
- ✅ Optimistic UI updates
- ✅ Error handling with toast
- ✅ Loading states

---

## Template 3: Server Action (Mutation)

**Use Case**: Form submissions and data mutations

**File**: `lib/admin/actions/features.ts`

```typescript
'use server';

import { z } from 'zod';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { createAuditLog } from '@/lib/admin/audit';

// 1. Define validation schema
const updateFeatureSchema = z.object({
  featureId: z.string().uuid(),
  name: z.string().min(2).max(100),
  enabled: z.boolean(),
});

export async function updateFeature(featureId: string, formData: FormData) {
  // 2. Authorization
  const admin = await requireAdmin();

  // 3. Input validation
  const validated = updateFeatureSchema.parse({
    featureId,
    name: formData.get('name'),
    enabled: formData.get('enabled') === 'true',
  });

  // 4. Get Supabase client
  const supabase = await createClient();

  // 5. Get current state for audit log
  const { data: currentFeature } = await supabase
    .from('features')
    .select('*')
    .eq('id', validated.featureId)
    .single();

  if (!currentFeature) {
    throw new Error('Feature not found');
  }

  // 6. Perform mutation (within transaction if multiple operations)
  const { error } = await supabase
    .from('features')
    .update({
      name: validated.name,
      enabled: validated.enabled,
      updated_at: new Date().toISOString(),
    })
    .eq('id', validated.featureId);

  if (error) {
    throw new Error(`Failed to update feature: ${error.message}`);
  }

  // 7. Create audit log
  await createAuditLog({
    userId: admin.id,
    action: 'feature.update',
    actionCategory: 'feature',
    resourceType: 'feature',
    resourceId: validated.featureId,
    changes: {
      name: { from: currentFeature.name, to: validated.name },
      enabled: { from: currentFeature.enabled, to: validated.enabled },
    },
  });

  // 8. Revalidate cache
  revalidatePath('/admin/features');
  revalidatePath(`/admin/features/${validated.featureId}`);

  return { success: true };
}
```

**Key Points**:
- ✅ `'use server'` directive
- ✅ Authorization check first
- ✅ Zod validation
- ✅ Audit logging
- ✅ Cache revalidation
- ✅ Error handling

---

## Template 4: API Route (REST)

**Use Case**: RESTful API endpoints for external consumption or complex logic

**File**: `app/api/admin/features/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireApiRole } from '@/lib/api/auth';
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { z } from 'zod';

// GET /api/admin/features
export async function GET(request: NextRequest) {
  try {
    // 1. Authorization
    await requireApiRole(request, 'moderator');

    // 2. Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = Number(searchParams.get('page') || '1');
    const limit = Number(searchParams.get('limit') || '20');

    // 3. Fetch data
    const supabase = await createClient();
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('features')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      return apiError(error.message, 500);
    }

    // 4. Return standardized response
    return apiSuccess({
      features: data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
}

// POST /api/admin/features
export async function POST(request: NextRequest) {
  try {
    // 1. Authorization (admin only for create)
    await requireApiRole(request, 'admin');

    // 2. Parse and validate body
    const body = await request.json();
    const createSchema = z.object({
      name: z.string().min(2).max(100),
      enabled: z.boolean().default(false),
    });

    const validated = createSchema.parse(body);

    // 3. Create resource
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('features')
      .insert({
        name: validated.name,
        enabled: validated.enabled,
      })
      .select()
      .single();

    if (error) {
      return apiError(error.message, 400);
    }

    // 4. Return success
    return apiSuccess(data, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError('Validation error', 400, error.errors);
    }
    return apiError(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
}
```

**Key Points**:
- ✅ Authorization per HTTP method
- ✅ Input validation
- ✅ Standardized responses
- ✅ Proper HTTP status codes
- ✅ Error handling

---

## Template 5: Database Query (Type-Safe)

**Use Case**: Reusable database queries with filtering and pagination

**File**: `lib/admin/queries/features.ts`

```typescript
import { createClient } from '@/lib/supabase/server';

type GetFeaturesOptions = {
  page?: number;
  limit?: number;
  filters?: {
    enabled?: boolean;
    search?: string;
  };
};

export async function getFeatures({
  page = 1,
  limit = 20,
  filters = {},
}: GetFeaturesOptions = {}) {
  const supabase = await createClient();

  // Build query
  let query = supabase
    .from('features')
    .select('*', { count: 'exact' });

  // Apply filters
  if (filters.enabled !== undefined) {
    query = query.eq('enabled', filters.enabled);
  }

  if (filters.search) {
    query = query.ilike('name', `%${filters.search}%`);
  }

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(`Failed to fetch features: ${error.message}`);
  }

  return {
    data: data || [],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

export async function getFeatureById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('features')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(`Failed to fetch feature: ${error.message}`);
  }

  return data;
}
```

**Key Points**:
- ✅ Type-safe options
- ✅ Filter support
- ✅ Pagination support
- ✅ Consistent error handling
- ✅ Reusable across components

---

## Template 6: Validation Schema (Zod)

**Use Case**: Reusable validation schemas for forms and API inputs

**File**: `lib/admin/schemas/features.ts`

```typescript
import { z } from 'zod';

export const createFeatureSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  enabled: z.boolean()
    .default(false),
  config: z.record(z.unknown())
    .optional(),
});

export const updateFeatureSchema = createFeatureSchema.partial().extend({
  id: z.string().uuid(),
});

export type CreateFeatureInput = z.infer<typeof createFeatureSchema>;
export type UpdateFeatureInput = z.infer<typeof updateFeatureSchema>;
```

**Key Points**:
- ✅ Descriptive error messages
- ✅ Type inference for TypeScript
- ✅ Reusable schemas
- ✅ Schema composition (`.partial()`, `.extend()`)

---

## Template 7: Audit Logging

**Use Case**: Logging admin actions for compliance and debugging

**File**: `lib/admin/audit.ts` (helper usage)

```typescript
import { createAuditLog } from '@/lib/admin/audit';

// In a Server Action
export async function deleteFeature(featureId: string) {
  const admin = await requireAdmin();
  const supabase = await createClient();

  // Get feature before deletion (for audit log)
  const { data: feature } = await supabase
    .from('features')
    .select('*')
    .eq('id', featureId)
    .single();

  // Delete feature
  const { error } = await supabase
    .from('features')
    .delete()
    .eq('id', featureId);

  if (error) throw new Error(error.message);

  // Create audit log
  await createAuditLog({
    userId: admin.id,
    action: 'feature.delete',
    actionCategory: 'feature',
    resourceType: 'feature',
    resourceId: featureId,
    changes: {
      deleted: feature, // Store deleted data for reference
    },
    metadata: {
      reason: 'User requested deletion',
    },
  });

  revalidatePath('/admin/features');
  return { success: true };
}
```

**Key Points**:
- ✅ Log BEFORE and AFTER states
- ✅ Include user context
- ✅ Categorize actions
- ✅ Add metadata for context

---

## Template Usage Guidelines

### When to Use Each Template

| Template | Use When... |
|----------|-------------|
| **Server Component** | Displaying data to authenticated users, SEO important |
| **Client Component** | Need interactivity, local state, or event handlers |
| **Server Action** | Handling form submissions, mutations |
| **API Route** | External API access, webhooks, complex business logic |
| **Database Query** | Reusable data fetching logic |
| **Validation Schema** | Input validation, type inference |
| **Audit Logging** | Any admin action that modifies data |

### Security Checklist

Before deploying code based on these templates:

- [ ] Authorization check at the start
- [ ] Input validation with Zod
- [ ] Parameterized database queries (no SQL injection)
- [ ] Audit logging for sensitive operations
- [ ] Error messages don't leak sensitive information
- [ ] Cache revalidation after mutations
- [ ] Rate limiting considered (if public endpoint)

---

## Related Documentation

- [System Overview](../architecture/system-overview.md)
- [Security Layers](../decisions/adr-004-security-layers.md)
- [API Route Structure](../decisions/adr-003-api-route-structure.md)

---

**Document Version**: 1.0
**Maintained By**: fase-docs (doc-writer)
**Review Cycle**: After each pattern change or new template addition
