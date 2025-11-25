# Environment Variables - Deployment Guide

**Proyecto**: cjhirashi-app v0.1
**Última actualización**: 2025-11-24

---

## Variables Requeridas para Producción

### Supabase (CRÍTICAS)

#### Variables Públicas (Safe for Frontend)
```bash
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="eyJhbGc..."
```

**Dónde configurar**:
- ✅ Vercel: Project Settings > Environment Variables
- ✅ Estas variables PUEDEN exponerse al frontend
- ✅ El prefijo `NEXT_PUBLIC_` las hace accesibles al cliente

**Obtener valores**:
1. Acceder a Supabase Dashboard: https://app.supabase.com
2. Navegar a: **Settings > API**
3. Copiar:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

---

#### Variables Secretas (Server-Only)
```bash
SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.your-project.supabase.co:5432/postgres"
```

**⚠️ CRÍTICO - SEGURIDAD**:
- ❌ **NUNCA** agregar prefijo `NEXT_PUBLIC_` a estas variables
- ❌ **NUNCA** exponer en código frontend
- ❌ **NUNCA** commitear en Git
- ✅ Solo usar en Server Components, API Routes, Server Actions
- ✅ Configurar como **SECRETS** en Vercel

**Dónde configurar**:
- ✅ Vercel: Project Settings > Environment Variables > **Sensitive**
- ✅ Marcar como "Sensitive" para evitar logs

**Obtener valores**:
1. Acceder a Supabase Dashboard
2. Navegar a: **Settings > API**
3. Copiar:
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`
4. Navegar a: **Settings > Database**
5. Copiar:
   - **Connection string (URI)** → `DATABASE_URL`

**⚠️ Uso del Service Role Key**:
- Este key **BYPASSES Row Level Security (RLS)**
- Solo usar en operaciones administrativas backend
- NUNCA usar en operaciones de usuario regular

---

### AI Integration (Opcional)

Si usas Vercel AI SDK o similar:

```bash
OPENAI_API_KEY="sk-..."
# o
ANTHROPIC_API_KEY="sk-ant-..."
```

**Dónde configurar**:
- ✅ Vercel: Project Settings > Environment Variables > **Sensitive**

---

## Configuración por Entorno

### Development (.env.local)
```bash
# Supabase (local development)
NEXT_PUBLIC_SUPABASE_URL="http://supabasekong-....sslip.io"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="eyJ0eXAi..."
SUPABASE_SERVICE_ROLE_KEY="[SECRET]"
DATABASE_URL="postgresql://postgres:[PASSWORD]@31.97.212.194:5432/postgres"

# AI (opcional)
OPENAI_API_KEY="sk-..."
```

### Staging (Vercel Preview Deployments)
```bash
# Supabase (staging project)
NEXT_PUBLIC_SUPABASE_URL="https://staging-project.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="[SECRET]"
DATABASE_URL="postgresql://postgres:[PASSWORD]@staging-db.supabase.co:5432/postgres"
```

### Production (Vercel Production)
```bash
# Supabase (production project)
NEXT_PUBLIC_SUPABASE_URL="https://production-project.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="[SECRET]"
DATABASE_URL="postgresql://postgres:[PASSWORD]@production-db.supabase.co:5432/postgres"
```

---

## Verificación de Configuración

### Checklist Pre-Deployment

#### Variables Públicas
- [ ] `NEXT_PUBLIC_SUPABASE_URL` configurado en Vercel
- [ ] `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` configurado en Vercel
- [ ] Variables disponibles en entorno: **Production**
- [ ] Variables disponibles en entorno: **Preview** (staging)

#### Variables Secretas
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurado como **Sensitive**
- [ ] `DATABASE_URL` configurado como **Sensitive**
- [ ] Variables NO tienen prefijo `NEXT_PUBLIC_`
- [ ] Variables solo accesibles en server-side

#### Seguridad
- [ ] `.env.local` está en `.gitignore`
- [ ] `.env.local.example` existe con placeholders
- [ ] No hay secrets hardcodeados en código
- [ ] Service Role Key solo se usa en backend

---

## Comandos de Verificación

### Verificar Variables en Build (local)
```bash
npm run build
```

Si falta alguna variable crítica, el build fallará con mensaje claro.

### Verificar Variables en Vercel CLI
```bash
# Listar variables de entorno
vercel env ls

# Agregar variable
vercel env add VARIABLE_NAME
```

---

## Troubleshooting

### Error: "Missing environment variables"
**Causa**: Variables no configuradas en Vercel
**Solución**:
1. Ir a Vercel Dashboard > Project Settings > Environment Variables
2. Agregar variables faltantes
3. Re-deployar

### Error: "Supabase client initialization failed"
**Causa**: Variables públicas incorrectas
**Solución**:
1. Verificar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
2. Copiar valores correctos desde Supabase Dashboard > Settings > API
3. Actualizar en Vercel
4. Re-deployar

### Error: "Database connection failed"
**Causa**: `DATABASE_URL` incorrecta
**Solución**:
1. Verificar connection string en Supabase Dashboard > Settings > Database
2. Asegurar que password es correcto
3. Actualizar en Vercel
4. Re-deployar

### Warning: "Service role key exposed"
**Causa**: Variable tiene prefijo `NEXT_PUBLIC_`
**Solución**:
1. ELIMINAR variable `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`
2. Crear nueva variable `SUPABASE_SERVICE_ROLE_KEY` (sin prefijo) marcada como Sensitive
3. Re-deployar INMEDIATAMENTE
4. ROTAR el service role key en Supabase (generar nuevo)

---

## Referencias

- **Vercel Environment Variables**: https://vercel.com/docs/concepts/projects/environment-variables
- **Supabase API Settings**: https://supabase.com/dashboard/project/_/settings/api
- **NextJS Environment Variables**: https://nextjs.org/docs/app/building-your-application/configuring/environment-variables
- **Security Audit Report**: `docs/qa/security-audit-report.md`
