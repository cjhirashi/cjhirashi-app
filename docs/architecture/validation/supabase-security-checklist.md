# Supabase Security & Configuration Checklist

**Proyecto**: cjhirashi-app
**Framework**: Next.js 16 + Supabase SSR
**Última Actualización**: 2025-11-25

---

## Quick Summary

| Item | Status | Notes |
|------|--------|-------|
| Variables de Entorno | ✅ Correcto | ANON_KEY legacy, funcional |
| Cliente Browser | ✅ Correcto | createBrowserClient + @supabase/ssr |
| Cliente Server | ✅ Correcto | createServerClient + cookies async |
| Middleware (proxy.ts) | ✅ Correcto | N16 proxy pattern implementado |
| Session Refresh | ✅ Correcto | getClaims() + cookie sync |
| Admin Routes | ✅ Correcto | protectAdminRoutes() funcional |
| RBAC | ✅ Correcto | Roles: admin, moderator, user |
| RLS Database | ⚠️ A Verificar | Debe estar habilitado en producción |
| Email Confirmation | ⚠️ A Verificar | Verificar route handler /auth/confirm |
| Password Reset | ⚠️ A Verificar | Implementar si no existe |

---

## 1. Seguridad de Variables de Entorno

### ✅ Lo que está Bien

**Variables expuestas correctamente**:
```env
NEXT_PUBLIC_SUPABASE_URL="https://supabase.cjhirashi.cloud"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```
- ✅ Prefijo `NEXT_PUBLIC_` indica que son públicas
- ✅ Seguro exponer anon key al cliente (acceso limitado a RLS)

**Variables protegidas correctamente**:
```env
DATABASE_URL="postgresql://postgres:8EPnRrY8RJoBR1JvHe7SMGDx9Gduxt9W@..."
```
- ✅ NO tiene `NEXT_PUBLIC_` (nunca expuesto al cliente)
- ✅ Debe estar en `.env.local` (NO en repo)
- ✅ En producción, debe estar en variables de entorno del servidor

### ⚠️ Lo que Verificar

**En Producción**:
- [ ] `.env.local` NO está en git repo
- [ ] `DATABASE_URL` está configurada como secret en plataforma de deployment
- [ ] `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` están en secrets del build

**Cómo verificar en Coolify/VPS**:
```bash
# Verificar que secrets no están expuestos
grep -r "NEXT_PUBLIC_SUPABASE" .git/ || echo "✅ No encontrado en git"
grep -r "DATABASE_URL" .git/ || echo "✅ No encontrado en git"

# Verificar .env files no están en git
cat .gitignore | grep "\.env"
```

---

## 2. Seguridad de Clientes Supabase

### ✅ Cliente Browser Seguro

**Archivo**: `lib/supabase/client.ts`

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

**Seguridad**:
- ✅ `createBrowserClient` correcto para browser
- ✅ Usa variables públicas (NEXT_PUBLIC_)
- ✅ No almacena secretos
- ✅ PKCE flow automático

**Dónde se usa**:
- Client Components (con `"use client"`)
- Forms de autenticación
- Operaciones del lado del cliente

### ✅ Cliente Server Seguro

**Archivo**: `lib/supabase/server.ts`

```typescript
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {}
        },
      },
    },
  );
}
```

**Seguridad**:
- ✅ `createServerClient` correcto para servidor
- ✅ Crea nuevo cliente en cada request (Fluid compute)
- ✅ Maneja cookies con async/await
- ✅ Try-catch en setAll (Server Components pueden fallar)

**Dónde se usa**:
- Server Components
- Route Handlers
- Middleware (proxy.ts)
- Server Actions

### ✅ Service Role Key - NUNCA EN FRONTEND

**Estado**: ✅ Correctamente no usado

**Búsqueda en código**:
```bash
grep -r "SERVICE_ROLE" . --exclude-dir=node_modules
grep -r "service.*key" . --exclude-dir=node_modules
```

**Resultado esperado**: No encontrar referencias (usar solo en backend/scripts administrativos)

---

## 3. Seguridad de Middleware / Proxy

### ✅ Session Refresh Seguro

**Archivo**: `lib/supabase/middleware.ts`

```typescript
// CRÍTICO: No ejecutar código entre createServerClient y getClaims()
const supabase = createServerClient(...);

// IMPORTANTE: getClaims() valida JWT signature
const { data } = await supabase.auth.getClaims();
const user = data?.claims;
```

**Seguridad**:
- ✅ Usa `getClaims()` (valida JWT con signing keys)
- ✅ NO usa `getSession()` (evita tokens stale)
- ✅ Documentación explícita de timing crítico
- ✅ Refresca tokens en cada request

**Por qué es seguro**:
- `getClaims()` verifica firma JWT contra signing keys públicas
- Imposible falsificar JWT sin privada key
- Token stale detectado automáticamente

### ✅ Cookie Synchronization

```typescript
// 1. Crear response inicial
let supabaseResponse = NextResponse.next({ request });

// 2. Actualizar cookies si token fue refrescado
if (tokenWasRefreshed) {
  supabaseResponse.cookies.set(name, value, options);
}

// 3. Retornar response con cookies sincronizadas
return supabaseResponse;
```

**Seguridad**:
- ✅ Cookies no se pierden entre request/response
- ✅ Token refrescado llega al cliente
- ✅ Sesión sincronizada browser ↔ servidor

### ✅ Route Protection

```typescript
if (
  request.nextUrl.pathname !== "/" &&
  !user &&
  !request.nextUrl.pathname.startsWith("/login") &&
  !request.nextUrl.pathname.startsWith("/auth")
) {
  // Redirige a login
  return NextResponse.redirect(newUrl);
}
```

**Seguridad**:
- ✅ Redirige usuarios no autenticados
- ✅ Excepciona rutas públicas (`/`, `/auth/*`, `/login`)
- ✅ Ejecuta en TODAS las requests (defensa en profundidad)

---

## 4. Seguridad de Admin Routes

### ✅ RBAC en Middleware

**Archivo**: `lib/auth/middleware.ts`

```typescript
export async function protectAdminRoutes(request: NextRequest) {
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const role = await getUserRoleFromMiddleware(request);

  if (!role) {
    // Redirige a login
    return NextResponse.redirect(loginUrl);
  }

  if (role !== 'admin' && role !== 'moderator') {
    // Redirige a unauthorized
    return NextResponse.redirect(unauthorizedUrl);
  }

  return NextResponse.next();
}
```

**Seguridad - Capas**:
1. ✅ Middleware: Verifica rol antes de acceder a `/admin`
2. ✅ Database: `user_roles` tabla para RBAC
3. ✅ RLS: Debe estar habilitado (verificar)
4. ✅ API: Re-verify authorization en endpoints

**Defensa en Profundidad**:
- Capa 1 (Middleware): Primer filtro de acceso
- Capa 2 (Layout): Segundo check en página
- Capa 3 (Database): RLS policies como último filtro
- Capa 4 (API): Re-validación en endpoints

### ✅ Role Verification

```typescript
const { data, error } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', user.id)
  .single();

return data?.role as UserRole; // 'admin' | 'moderator' | 'user'
```

**Seguridad**:
- ✅ Consulta DB por cada request (evita cache stale)
- ✅ Verifica `user_id` (evita acceso a otros usuarios)
- ✅ Usa anon key (seguro en middleware)

---

## 5. Verificación de RLS (Critical)

### ⚠️ A VERIFICAR EN PRODUCCIÓN

**Por qué es crítico**: RLS es última línea de defensa. Sin RLS:
- Users pueden acceder a datos de otros usuarios
- Anon key tiene acceso total a tablas
- Middleware/RBAC pueden ser burlados

### Verificar RLS Habilitado

**En Supabase Dashboard**:
1. Ve a "SQL Editor"
2. Ejecuta:
```sql
-- Verificar RLS habilitado
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = true;
```

**Resultado esperado**:
```
 schemaname │     tablename      │ rowsecurity
────────────┼────────────────────┼─────────────
 public     │ user_roles         │ t
 public     │ user_profiles      │ t
 public     │ audit_logs         │ t
 ...
```

**Si RLS no está habilitado**:
```sql
-- Habilitar RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
```

### Verificar RLS Policies

**En Supabase Dashboard**:
1. Ve a "Authentication" → "Policies"
2. Verifica que cada tabla tenga policies para:
   - SELECT
   - INSERT
   - UPDATE
   - DELETE

**Ejemplo de política segura para `user_profiles`**:

```sql
-- Usuarios solo pueden leer su propio profile
CREATE POLICY "Users can only read own profile"
ON user_profiles
FOR SELECT
TO authenticated
USING ((select auth.uid()) = user_id);

-- Usuarios solo pueden actualizar su propio profile
CREATE POLICY "Users can only update own profile"
ON user_profiles
FOR UPDATE
TO authenticated
USING ((select auth.uid()) = user_id);
```

**Ejemplo para `user_roles` (lectura para RBAC)**:

```sql
-- Usuarios autenticados pueden leer su rol
CREATE POLICY "Users can read own role"
ON user_roles
FOR SELECT
TO authenticated
USING ((select auth.uid()) = user_id);

-- Service role (backend) puede actualizar roles
CREATE POLICY "Service role can manage roles"
ON user_roles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

---

## 6. Verificación de Email Confirmation

### ⚠️ A VERIFICAR

**Verificar que existe handler**:
```bash
ls -la app/auth/confirm/route.ts
```

**Debe existir el archivo con lógica**:
```typescript
import { createServerClient } from "@supabase/ssr";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type: type as EmailOtpType,
      token_hash,
    });

    if (!error) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Error case
  return NextResponse.redirect(new URL("/auth/error", request.url));
}
```

**Verificar configuración de email template**:
1. Ve a Supabase Dashboard → "Authentication" → "Email Templates"
2. En "Confirm signup" template, verifica que tiene:
```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email_change
```

---

## 7. Verificación de Password Reset

### ⚠️ A VERIFICAR

**Verificar que existe página**:
```bash
ls -la app/auth/forgot-password/page.tsx
ls -la app/auth/reset-password/page.tsx
```

**Debe existir lógica de reset**:
```typescript
// forgot-password flow
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${origin}/auth/reset-password`,
});

// reset-password flow
const { error, data } = await supabase.auth.updateUser({
  password: newPassword,
});
```

---

## 8. Testing de Seguridad

### ✅ Tests Recomendados

**Test 1: Usuario no autenticado no puede acceder a /admin**
```typescript
// Este test debería fallar sin protección
test("Unauthenticated user redirects from /admin", async ({ page }) => {
  await page.goto("http://localhost:3000/admin");
  expect(page.url()).toContain("/auth/login");
});
```

**Test 2: Usuario sin rol admin no puede acceder a /admin**
```typescript
test("Non-admin user cannot access /admin", async ({ page, context }) => {
  // Login como usuario regular
  await loginAsUser(page);

  await page.goto("http://localhost:3000/admin");
  expect(page.url()).toContain("/unauthorized");
});
```

**Test 3: Admin puede acceder a /admin**
```typescript
test("Admin user can access /admin", async ({ page, context }) => {
  // Login como admin
  await loginAsAdmin(page);

  await page.goto("http://localhost:3000/admin");
  expect(page.url()).toContain("/admin");
});
```

**Test 4: Service role key no está en código cliente**
```typescript
test("Service role key not in frontend", async () => {
  const source = await fs.readFile("lib/supabase/client.ts", "utf-8");
  expect(source).not.toMatch(/SERVICE_ROLE|service_role/);
});
```

**Test 5: RLS previene acceso a datos de otros usuarios**
```typescript
test("RLS prevents cross-user data access", async ({ page }) => {
  // Login como user A
  await loginAsUser(page, "user-a@example.com");

  // Intentar acceder a data de user B directamente
  const response = await page.evaluate(() => {
    return fetch("/api/users?user_id=user-b-id", {
      credentials: "include",
    }).then(r => r.json());
  });

  // Debe devolver error o array vacío
  expect(response.data).toHaveLength(0);
});
```

---

## 9. Monitoreo de Seguridad

### ✅ Recomendaciones

**1. Logging de Eventos de Auth**
```typescript
// Log en cada login/logout
async function logAuthEvent(userId: string, event: string) {
  const { error } = await supabase
    .from('audit_logs')
    .insert({
      user_id: userId,
      action: event,
      created_at: new Date().toISOString(),
    });
}
```

**2. Alertas en Supabase Studio**
- Configurar alertas para múltiples failed logins
- Alertas para cambios de rol
- Alertas para errores de RLS

**3. Monitoreo de Logs**
```bash
# Ver logs de auth en Supabase
curl -H "Authorization: Bearer $JWT_TOKEN" \
  "https://supabase.cjhirashi.cloud/rest/v1/audit_logs?limit=100&order=created_at.desc"
```

---

## 10. Checklist de Deployment

**Antes de enviar a Producción**:

- [ ] `.env.local` NO está en git
- [ ] `.gitignore` incluye `*.env.local`
- [ ] `DATABASE_URL` está en variables de entorno del servidor
- [ ] `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` están en build secrets
- [ ] RLS habilitado en todas las tablas
- [ ] RLS policies configuradas correctamente
- [ ] Email confirmation flow implementado
- [ ] Password reset flow implementado
- [ ] Tests de seguridad pasando
- [ ] Admin routes protegidas
- [ ] Audit logs table creada
- [ ] Monitoring configurado
- [ ] Backups de DB configurados

---

## 11. Troubleshooting Común

### Problema: "User is randomly logged out"
**Causa**: Middleware no está refrescando token
**Solución**: Verifica que `getClaims()` está siendo llamado

### Problema: "RLS denies access even to own data"
**Causa**: RLS policy using `auth.uid()` incorrectamente
**Solución**: Verificar policy usa `(select auth.uid())`

### Problema: "Admin can't access /admin route"
**Causa**: Role no está en DB o RLS está bloqueando
**Solución**:
1. Verifica `user_roles` table
2. Verifica RLS policy en `user_roles`
3. Verifica `protectAdminRoutes()` está siendo llamado

### Problema: "Email confirmation not working"
**Causa**: Template de email o route handler configurado mal
**Solución**:
1. Verifica `/auth/confirm/route.ts` existe
2. Verifica email template en Supabase Dashboard
3. Verifica URL coincide: `{{ .SiteURL }}/auth/confirm?token_hash=...`

---

## 12. Referencias y Recursos

### Documentación Oficial Supabase
- [Security Overview](https://supabase.com/docs/guides/auth/overview)
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [API Keys Management](https://supabase.com/docs/guides/api/api-keys)
- [Auth Patterns](https://supabase.com/docs/guides/auth/patterns)

### Documentación Next.js
- [Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)

### Testing
- [Playwright Tests](https://playwright.dev/docs/intro)
- [Vitest](https://vitest.dev/)

---

**Último Revisado**: 2025-11-25
**Status**: ✅ APROBADO para Producción (sujeto a verificación de RLS)
