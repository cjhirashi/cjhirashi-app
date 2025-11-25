# GitHub Secrets Setup Guide

**Proyecto**: cjhirashi-app v0.1
**Última actualización**: 2025-11-24

---

## Overview

Esta guía documenta cómo configurar GitHub Secrets necesarios para el CI/CD pipeline.

**Requisitos**:
- Acceso de admin al repositorio GitHub
- Cuenta de Vercel con proyecto creado
- Cuenta de Supabase con proyecto creado

---

## Secrets Requeridos

### 1. Vercel Secrets

| Secret Name | Descripción | Dónde obtenerlo |
|------------|-------------|-----------------|
| `VERCEL_TOKEN` | API token de Vercel | Vercel Dashboard |
| `VERCEL_ORG_ID` | ID de organización | Vercel CLI |
| `VERCEL_PROJECT_ID` | ID del proyecto | Vercel CLI |

### 2. Supabase Secrets (Para CI/CD Testing)

| Secret Name | Descripción | Dónde obtenerlo |
|------------|-------------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de Supabase | Supabase Dashboard |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Anon key | Supabase Dashboard |

---

## Paso 1: Obtener VERCEL_TOKEN

1. **Acceder a Vercel Dashboard**
   - URL: https://vercel.com/account/tokens

2. **Crear nuevo token**
   - Click: **"Create"**
   - Name: `GitHub Actions - cjhirashi-app`
   - Scope: **Full Account**
   - Expiration: **No Expiration** (o personalizado)
   - Click: **"Create Token"**

3. **Copiar token**
   - ⚠️ **IMPORTANTE**: Solo se muestra UNA VEZ
   - Copiar y guardar temporalmente
   - Ejemplo: `vercel_abc123...xyz789`

---

## Paso 2: Obtener VERCEL_ORG_ID y VERCEL_PROJECT_ID

### Método A: Vercel CLI (Recomendado)

```bash
# 1. Instalar Vercel CLI (si no está instalado)
npm install -g vercel

# 2. Login a Vercel
vercel login

# 3. Link proyecto local a Vercel
cd /path/to/cjhirashi-app
vercel link

# 4. Copiar IDs desde .vercel/project.json
cat .vercel/project.json
```

**Output esperado**:
```json
{
  "orgId": "team_abc123xyz",
  "projectId": "prj_def456uvw"
}
```

Copiar:
- `orgId` → `VERCEL_ORG_ID`
- `projectId` → `VERCEL_PROJECT_ID`

---

### Método B: Vercel Dashboard (Alternativo)

1. **Acceder a Vercel Dashboard**
   - URL: https://vercel.com/dashboard

2. **Abrir proyecto**
   - Click en: `cjhirashi-app`

3. **Copiar Project ID de URL**
   - URL formato: `https://vercel.com/[ORG]/[PROJECT]/settings`
   - Project ID está en: **Settings > General > Project ID**

4. **Copiar Org ID**
   - Settings > General > Team ID (si es team)
   - O usar Vercel CLI (más fácil)

---

## Paso 3: Obtener Supabase Variables

1. **Acceder a Supabase Dashboard**
   - URL: https://app.supabase.com

2. **Seleccionar proyecto**
   - Click en proyecto: `cjhirashi-app`

3. **Navegar a API settings**
   - Sidebar: **Settings > API**

4. **Copiar variables**
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
     - Ejemplo: `https://abcdefgh.supabase.co`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
     - Ejemplo: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## Paso 4: Configurar Secrets en GitHub

1. **Acceder a repositorio GitHub**
   - URL: `https://github.com/[USERNAME]/cjhirashi-app`

2. **Navegar a Settings**
   - Tab: **Settings**
   - Sidebar: **Secrets and variables > Actions**

3. **Agregar cada secret**
   - Click: **"New repository secret"**
   - Para cada secret:

### VERCEL_TOKEN
```
Name: VERCEL_TOKEN
Secret: vercel_abc123...xyz789
```
Click: **"Add secret"**

### VERCEL_ORG_ID
```
Name: VERCEL_ORG_ID
Secret: team_abc123xyz
```
Click: **"Add secret"**

### VERCEL_PROJECT_ID
```
Name: VERCEL_PROJECT_ID
Secret: prj_def456uvw
```
Click: **"Add secret"**

### NEXT_PUBLIC_SUPABASE_URL
```
Name: NEXT_PUBLIC_SUPABASE_URL
Secret: https://abcdefgh.supabase.co
```
Click: **"Add secret"**

### NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```
Name: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
Secret: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
Click: **"Add secret"**

---

## Paso 5: Verificar Configuración

### Checklist de Secrets

- [ ] `VERCEL_TOKEN` configurado
- [ ] `VERCEL_ORG_ID` configurado
- [ ] `VERCEL_PROJECT_ID` configurado
- [ ] `NEXT_PUBLIC_SUPABASE_URL` configurado
- [ ] `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` configurado

### Verificar en GitHub Actions

1. **Crear Pull Request de prueba**
   ```bash
   git checkout -b test-ci-cd
   echo "# Test" >> README.md
   git add README.md
   git commit -m "Test CI/CD pipeline"
   git push origin test-ci-cd
   ```

2. **Abrir PR en GitHub**
   - GitHub > Pull Requests > New

3. **Verificar workflow ejecuta**
   - Tab: **Actions**
   - Workflow: `Deploy to Vercel`
   - Status: ✅ RUNNING / PASSED

4. **Verificar preview deployment**
   - Comentario en PR debe incluir URL de preview
   - Ejemplo: `🚀 Preview deployment ready! URL: https://cjhirashi-app-git-test-ci-cd.vercel.app`

---

## Troubleshooting

### Error: "VERCEL_TOKEN is required"

**Causa**: Secret no configurado o nombre incorrecto

**Solución**:
1. Verificar que secret existe en GitHub Settings > Secrets
2. Verificar que nombre es EXACTAMENTE `VERCEL_TOKEN` (case-sensitive)
3. Re-run workflow

---

### Error: "Project not found"

**Causa**: `VERCEL_ORG_ID` o `VERCEL_PROJECT_ID` incorrectos

**Solución**:
1. Verificar IDs con: `cat .vercel/project.json`
2. Actualizar secrets en GitHub
3. Re-run workflow

---

### Error: "Unauthorized"

**Causa**: `VERCEL_TOKEN` expiró o fue revocado

**Solución**:
1. Crear nuevo token en Vercel Dashboard
2. Actualizar secret `VERCEL_TOKEN` en GitHub
3. Re-run workflow

---

### Error: "Supabase client initialization failed"

**Causa**: Variables de Supabase incorrectas

**Solución**:
1. Verificar variables en Supabase Dashboard > Settings > API
2. Actualizar secrets en GitHub
3. Re-run workflow

---

## Seguridad de Secrets

### ✅ Buenas Prácticas

- ✅ Secrets NUNCA se commitean en Git
- ✅ Secrets NUNCA se exponen en logs (GitHub los oculta automáticamente)
- ✅ Secrets con scope mínimo necesario
- ✅ Tokens con expiration date (si posible)
- ✅ Rotar secrets periódicamente (cada 3 meses)

### ❌ Malas Prácticas

- ❌ NO compartir secrets por email/Slack
- ❌ NO usar mismo token para múltiples proyectos
- ❌ NO configurar secrets en variables de entorno públicas
- ❌ NO commitear secrets en código (ni siquiera en branches privadas)

---

## Rotación de Secrets (Cada 3 meses)

### Procedimiento

1. **Crear nuevo VERCEL_TOKEN**
   - Vercel Dashboard > Account > Tokens
   - Create new token
   - Copiar nuevo token

2. **Actualizar secret en GitHub**
   - GitHub Settings > Secrets > VERCEL_TOKEN
   - Update secret con nuevo valor

3. **Revocar token anterior**
   - Vercel Dashboard > Account > Tokens
   - Delete token anterior

4. **Verificar workflows funcionan**
   - Trigger workflow manualmente
   - Verificar que deployment exitoso

**Repetir para todos los secrets cada 3 meses**

---

## Referencias

- **Vercel Tokens**: https://vercel.com/account/tokens
- **GitHub Secrets**: https://docs.github.com/en/actions/security-guides/encrypted-secrets
- **Supabase API Settings**: https://supabase.com/dashboard/project/_/settings/api
- **CI/CD Workflow**: `.github/workflows/deploy.yml`
