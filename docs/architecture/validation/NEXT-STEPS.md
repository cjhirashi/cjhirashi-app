# Supabase Auth - Próximos Pasos y Recomendaciones

**Proyecto**: cjhirashi-app
**Fecha**: 2025-11-25

---

## Overview

Esta documento proporciona pasos concretos y priorizados para completar la implementación de Supabase Auth en tu proyecto.

---

## Fase 1: Verificación Crítica (ANTES de Producción)

### 1.1 Verificar RLS en Base de Datos

**Por qué**: RLS es la última línea de defensa. Sin RLS, cualquiera con anon key puede leer toda la data.

**Pasos**:

1. **Conectar a Supabase SQL Editor**
   - Ve a Supabase Dashboard → SQL Editor

2. **Verificar que RLS está habilitado**
   ```sql
   -- Ejecutar en SQL Editor
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE schemaname = 'public'
   ORDER BY tablename;
   ```

   **Resultado esperado**:
   ```
    tablename       | rowsecurity
   ─────────────────┼────────────
    audit_logs      | t
    user_profiles   | t
    user_roles      | t
   ```

   Si `rowsecurity = f`, ejecutar:
   ```sql
   ALTER TABLE tablename ENABLE ROW LEVEL SECURITY;
   ```

3. **Verificar policies existen**
   ```sql
   -- Ver todas las policies
   SELECT schemaname, tablename, policyname, cmd
   FROM pg_policies
   WHERE schemaname = 'public'
   ORDER BY tablename, policyname;
   ```

   **Debe haber policies para cada tabla**:
   - SELECT: Quién puede leer
   - INSERT: Quién puede insertar
   - UPDATE: Quién puede actualizar
   - DELETE: Quién puede eliminar

4. **Si faltan policies, crear las básicas**

   **Para `user_profiles` (datos de usuario)**:
   ```sql
   -- Usuarios solo pueden leer su propio profile
   CREATE POLICY "Users can select own profile"
   ON user_profiles
   FOR SELECT
   TO authenticated
   USING ((select auth.uid()) = user_id);

   -- Usuarios solo pueden actualizar su propio profile
   CREATE POLICY "Users can update own profile"
   ON user_profiles
   FOR UPDATE
   TO authenticated
   USING ((select auth.uid()) = user_id)
   WITH CHECK ((select auth.uid()) = user_id);

   -- Usuarios pueden insertar su propio profile
   CREATE POLICY "Users can insert own profile"
   ON user_profiles
   FOR INSERT
   TO authenticated
   WITH CHECK ((select auth.uid()) = user_id);

   -- Solo admins pueden eliminar profiles
   CREATE POLICY "Admins can delete profiles"
   ON user_profiles
   FOR DELETE
   TO authenticated
   USING (
     (select auth.uid()) IN (
       select user_id from user_roles where role = 'admin'
     )
   );
   ```

   **Para `user_roles` (lectura para RBAC)**:
   ```sql
   -- Usuarios autenticados pueden leer su rol
   CREATE POLICY "Users can read own role"
   ON user_roles
   FOR SELECT
   TO authenticated
   USING ((select auth.uid()) = user_id);

   -- Service role puede actualizar roles
   CREATE POLICY "Service role can manage roles"
   ON user_roles
   FOR ALL
   TO service_role
   USING (true)
   WITH CHECK (true);

   -- Admins pueden actualizar roles
   CREATE POLICY "Admins can update roles"
   ON user_roles
   FOR UPDATE
   TO authenticated
   USING (
     (select auth.uid()) IN (
       select user_id from user_roles where role = 'admin'
     )
   )
   WITH CHECK (
     (select auth.uid()) IN (
       select user_id from user_roles where role = 'admin'
     )
   );
   ```

   **Para `audit_logs` (solo lectura/insert)**:
   ```sql
   -- Solo admins y moderators pueden leer audit logs
   CREATE POLICY "Admins and moderators can read audit logs"
   ON audit_logs
   FOR SELECT
   TO authenticated
   USING (
     (select auth.uid()) IN (
       select user_id from user_roles
       where role = 'admin' or role = 'moderator'
     )
   );

   -- Service role puede insertar logs
   CREATE POLICY "Service role can insert audit logs"
   ON audit_logs
   FOR INSERT
   TO service_role
   WITH CHECK (true);
   ```

**Validación**: Si todas las queries devuelven `rowsecurity = t` con policies, ✅ está listo.

**Recursos**:
- [Supabase RLS Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [RLS Best Practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv)

---

### 1.2 Verificar Email Confirmation Flow

**Por qué**: Previene signups con emails falsos y verifica posesión del email.

**Pasos**:

1. **Verificar que route handler existe**
   ```bash
   # Debe existir este archivo
   ls app/auth/confirm/route.ts
   ```

   Si no existe, crear:
   ```typescript
   // app/auth/confirm/route.ts
   import { createClient } from '@/lib/supabase/server'
   import { NextResponse } from 'next/server'

   export async function GET(request: Request) {
     const { searchParams } = new URL(request.url)
     const token_hash = searchParams.get('token_hash')
     const type = searchParams.get('type')

     const supabase = await createClient()

     if (token_hash && type) {
       const { error } = await supabase.auth.verifyOtp({
         type: type as 'email' | 'sms' | 'recovery' | 'phone_change' | 'email_change',
         token_hash,
       })

       if (!error) {
         // Redirect to dashboard/home after successful confirmation
         return NextResponse.redirect(new URL('/protected', request.url))
       }
     }

     // Redirect to error page if verification failed
     return NextResponse.redirect(new URL('/auth/error?error=Invalid+verification+link', request.url))
   }
   ```

2. **Verificar email template en Supabase Dashboard**
   - Ve a: Authentication → Email Templates → Confirm signup
   - Debe tener este contenido:
   ```
   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email_change
   ```

   Si no está correcto, editar template.

3. **Test del flow**
   ```bash
   # 1. Sign up
   npm run dev
   # Ir a http://localhost:3000/auth/sign-up
   # Ingresar email de prueba

   # 2. Verificar que email fue enviado
   # En Supabase Dashboard → Auth → Users
   # Buscar el usuario, debe tener email_confirmed_at vacío

   # 3. Simular click en link de email
   # En desarrollo, usar Supabase test email o verificar logs

   # 4. Verificar que email_confirmed_at ahora tiene timestamp
   ```

**Validación**: Usuario puede completar signup → confirmation → acceder a protected routes.

**Recursos**:
- [Email Confirmation Setup](https://supabase.com/docs/guides/auth/server-side/creating-a-client)

---

### 1.3 Verificar Protección de Routes Admin

**Por qué**: Admin routes deben ser inaccesibles para usuarios regulares.

**Pasos**:

1. **Verificar que `protectAdminRoutes()` está siendo usado**
   ```bash
   grep -r "protectAdminRoutes" app/
   # Debe encontrar referencias en proxy.ts
   ```

2. **Test manual**
   ```bash
   # 1. Iniciar servidor
   npm run dev

   # 2. Sin autenticar, ir a http://localhost:3000/admin
   # Debe redirigir a /auth/login

   # 3. Login como usuario regular
   # Ir a http://localhost:3000/admin
   # Debe redirigir a /unauthorized

   # 4. Login como admin
   # Ir a http://localhost:3000/admin
   # Debe permitir acceso
   ```

3. **Verificar que `user_roles` tiene datos**
   ```sql
   -- En Supabase SQL Editor
   SELECT user_id, role FROM user_roles LIMIT 10;
   ```

   Si está vacío, crear datos de test:
   ```sql
   -- Agregar tu email como admin (reemplazar con tu actual email)
   INSERT INTO user_roles (user_id, role)
   SELECT id, 'admin'
   FROM auth.users
   WHERE email = 'tu-email@example.com'
   ON CONFLICT(user_id) DO UPDATE SET role = 'admin';
   ```

**Validación**: Solo admins pueden acceder a `/admin`, otros redirigen.

---

## Fase 2: Implementación de Funcionalidades (Corto Plazo)

### 2.1 Implementar Password Reset Flow

**Archivos a crear**:
- `app/auth/forgot-password/page.tsx` (Client Component)
- `app/auth/reset-password/page.tsx` (Client Component)
- `app/auth/reset-password/route.ts` (Route Handler)

**Implementación**:

```typescript
// app/auth/forgot-password/page.tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const supabase = createClient()

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) {
      setMessage('Error: ' + error.message)
    } else {
      setMessage('Check your email for the password reset link')
    }

    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form onSubmit={handleReset} className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold">Reset Password</h1>

        <Input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Button type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send Reset Link'}
        </Button>

        {message && <p className="text-sm">{message}</p>}
      </form>
    </div>
  )
}
```

```typescript
// app/auth/reset-password/page.tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const router = useRouter()
  const supabase = createClient()

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      setLoading(false)
      return
    }

    const { error: err } = await supabase.auth.updateUser({
      password: password,
    })

    if (err) {
      setError(err.message)
    } else {
      router.push('/protected?message=Password+reset+successful')
    }

    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form onSubmit={handleReset} className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold">Reset Password</h1>

        <Input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />

        <Input
          type="password"
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <Button type="submit" disabled={loading}>
          {loading ? 'Resetting...' : 'Reset Password'}
        </Button>
      </form>
    </div>
  )
}
```

**Verificar template de email en Supabase Dashboard**:
- Authentication → Email Templates → Password reset
- Debe tener:
  ```
  {{ .SiteURL }}/auth/reset-password?token_hash={{ .TokenHash }}&type=recovery
  ```

**Test**:
```bash
# 1. Ir a /auth/forgot-password
# 2. Ingresar email
# 3. Simular click en link (en desarrollo, ver logs)
# 4. Ingresar nueva contraseña
# 5. Verificar que funciona login con nueva contraseña
```

**Recursos**:
- [Password Reset Guide](https://supabase.com/docs/guides/auth/passwords)

---

### 2.2 Implementar Audit Logging

**Por qué**: Auditar cambios de datos y eventos de seguridad.

**Pasos**:

1. **Crear tabla `audit_logs` si no existe**
   ```sql
   CREATE TABLE IF NOT EXISTS audit_logs (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
     action VARCHAR(255) NOT NULL,
     resource_type VARCHAR(100),
     resource_id UUID,
     changes JSONB,
     ip_address INET,
     user_agent TEXT,
     created_at TIMESTAMPTZ DEFAULT now()
   );

   -- Index para queries rápidas
   CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
   CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
   CREATE INDEX idx_audit_logs_action ON audit_logs(action);
   ```

2. **Crear helper para logging**
   ```typescript
   // lib/audit/log.ts
   import { createClient } from '@/lib/supabase/server'

   interface AuditLogEntry {
     action: string
     resourceType?: string
     resourceId?: string
     changes?: Record<string, any>
   }

   export async function logAuditEvent(entry: AuditLogEntry) {
     try {
       const supabase = await createClient()
       const { data: { user } } = await supabase.auth.getUser()

       if (!user) return

       const { error } = await supabase
         .from('audit_logs')
         .insert({
           user_id: user.id,
           action: entry.action,
           resource_type: entry.resourceType,
           resource_id: entry.resourceId,
           changes: entry.changes,
           created_at: new Date().toISOString(),
         })

       if (error) console.error('Audit log error:', error)
     } catch (e) {
       console.error('Failed to log audit event:', e)
     }
   }
   ```

3. **Usar en API routes y Server Actions**
   ```typescript
   // app/api/admin/users/[id]/route.ts
   import { logAuditEvent } from '@/lib/audit/log'

   export async function PUT(request: Request) {
     const { id } = params
     const body = await request.json()

     // ... actualizar usuario ...

     // Log the change
     await logAuditEvent({
       action: 'user.updated',
       resourceType: 'user',
       resourceId: id,
       changes: body,
     })

     return Response.json({ success: true })
   }
   ```

---

### 2.3 Agregar Tests de Seguridad

**Crear archivo de tests**:

```typescript
// tests/auth.e2e.ts
import { test, expect } from '@playwright/test'

test.describe('Authentication Security', () => {
  test('Unauthenticated user redirects from protected routes', async ({
    page,
  }) => {
    await page.goto('http://localhost:3000/protected')
    expect(page.url()).toContain('/auth/login')
  })

  test('Unauthenticated user cannot access /admin', async ({ page }) => {
    await page.goto('http://localhost:3000/admin')
    expect(page.url()).toContain('/auth/login')
  })

  test('Non-admin user cannot access /admin', async ({ page, context }) => {
    // Login as regular user
    await loginAsUser(page, 'user@example.com')

    // Try to access admin
    await page.goto('http://localhost:3000/admin')
    expect(page.url()).toContain('/unauthorized')
  })

  test('Admin user can access /admin', async ({ page }) => {
    // Login as admin
    await loginAsAdmin(page)

    // Should access admin
    await page.goto('http://localhost:3000/admin')
    expect(page.url()).not.toContain('/login')
    expect(page.url()).toContain('/admin')
  })

  test('Email confirmation required for signup', async ({ page }) => {
    // Sign up
    await page.goto('http://localhost:3000/auth/sign-up')
    await page.fill('input[type="email"]', 'newuser@example.com')
    await page.fill('input[type="password"]', 'Password123!')
    await page.click('button:has-text("Sign Up")')

    // Should see confirmation message
    await expect(page).toContainText(/check.*email|confirmation/i)
  })
})

async function loginAsUser(page, email: string) {
  await page.goto('http://localhost:3000/auth/login')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', 'password123')
  await page.click('button:has-text("Sign In")')
  await page.waitForURL('**/protected')
}

async function loginAsAdmin(page) {
  // Login with admin account (pre-configured in DB)
  await loginAsUser(page, 'admin@example.com')
}
```

**Ejecutar tests**:
```bash
npm run test:e2e
```

---

## Fase 3: Mejoras de Seguridad Avanzada (Mediano Plazo)

### 3.1 Migrar a PUBLISHABLE_KEY

**Cuándo**: Después de v0.1 estable

**Por qué**: Short-lived JWTs vs 10-años expiry legacy keys

**Pasos**:

1. **Generar PUBLISHABLE_KEY en Supabase Dashboard**
   - API Keys → Create new API Keys → Copy Publishable key

2. **Actualizar `.env.local`**
   ```env
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."
   ```

3. **Actualizar clientes**
   - `lib/supabase/client.ts` y `lib/supabase/server.ts`
   - Cambiar `NEXT_PUBLIC_SUPABASE_ANON_KEY` por `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

4. **Test**
   - Verificar que auth flows aún funcionan
   - Validar RLS policies

### 3.2 Implementar 2FA (Two-Factor Authentication)

**Si requerido**: Para mayor seguridad en cuentas admin.

**Opciones**:
- TOTP (Authenticator apps)
- SMS
- Email verification

**Referencia**: [Supabase MFA Guide](https://supabase.com/docs/guides/auth/auth-mfa)

### 3.3 Social Login (OAuth)

**Proveedores soportados**:
- Google
- GitHub
- Discord
- Etc.

**Referencia**: [Social Login Guide](https://supabase.com/docs/guides/auth/social-login)

---

## Checklist Final de Validación

Antes de desplegar a producción:

```
VALIDATION CHECKLIST
═════════════════════════════════════════════════════════════════

✅ SEGURIDAD
  [x] Variables de entorno correctamente configuradas
  [x] Service role key NO en frontend
  [x] DATABASE_URL NO en repo
  [ ] RLS habilitado en todas las tablas
  [ ] RLS policies correctamente configuradas
  [ ] Email templates configuradas
  [ ] Password reset template configurada

✅ AUTH FLOWS
  [ ] Sign up funciona
  [ ] Email confirmation funciona
  [ ] Login funciona
  [ ] Logout funciona
  [ ] Password reset funciona
  [ ] Protected routes redirigen si no autenticado
  [ ] Admin routes redirigen sin permisos

✅ ADMIN PANEL
  [ ] Admin can access /admin
  [ ] Non-admin gets /unauthorized
  [ ] Role verification funciona
  [ ] User management funciona
  [ ] Audit logs se registran

✅ TESTING
  [ ] Unit tests pasando
  [ ] E2E tests pasando
  [ ] Security tests pasando
  [ ] Manual testing completado

✅ DEPLOYMENT
  [ ] Secrets configurados en plataforma
  [ ] Env variables en servidor
  [ ] Database backups configurados
  [ ] Monitoring configurado
  [ ] Error logging configurado
```

---

## Resumen de Timeline

| Fase | Timeline | Tareas |
|------|----------|--------|
| **Fase 1** | Inmediato | Verificar RLS, Email confirmation, Admin routes |
| **Fase 2** | Semana 1 | Password reset, Audit logging, Tests |
| **Fase 3** | Semana 2+ | Migrar PUBLISHABLE_KEY, 2FA, Social login |

---

## Preguntas Frecuentes

**Q: ¿Qué pasa si RLS no está habilitado?**
A: Cualquiera con anon key puede leer toda la data. CRÍTICO habilitarlo.

**Q: ¿Puedo usar anon key en el backend?**
A: SÍ, es seguro. Service role key es lo que NO debe exponerse al frontend.

**Q: ¿Cuál es la diferencia entre anon y publishable key?**
A: Anon = legacy (10 años expiry), publishable = nuevo (short-lived JWTs).

**Q: ¿Necesito 2FA?**
A: Recomendado para admin. Opcional para usuarios regulares.

---

**Última actualización**: 2025-11-25
