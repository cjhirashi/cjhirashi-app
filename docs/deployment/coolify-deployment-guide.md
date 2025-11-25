# Coolify Deployment Guide - Hostinger VPS

**Proyecto**: cjhirashi-app v0.1
**Plataforma**: Coolify (self-hosted) en VPS Hostinger
**Última actualización**: 2025-11-24

---

## ¿Qué es Coolify?

Coolify es una alternativa open-source self-hosted a Vercel/Netlify/Heroku que permite desplegar aplicaciones en tu propio VPS usando Docker containers.

**Ventajas**:
- 🚀 Deployment automático desde Git
- 🐳 Docker-based (containers aislados)
- 🔒 Control total sobre infraestructura
- 💰 Costo-efectivo (solo pagas VPS)
- 🔄 Zero-downtime deployments
- 📊 Built-in monitoring y logs

---

## Prerequisitos

### 1. VPS de Hostinger Configurado

**Specs mínimas recomendadas**:
- CPU: 2 cores
- RAM: 4GB
- Storage: 50GB SSD
- OS: Ubuntu 22.04 LTS (recomendado)

**Acceso SSH**:
```bash
ssh root@your-vps-ip
```

### 2. Coolify Instalado en VPS

Si Coolify NO está instalado aún:

```bash
# Conectar a VPS vía SSH
ssh root@your-vps-ip

# Instalar Coolify (script oficial)
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

# Verificar instalación
docker ps
# Deberías ver containers de Coolify corriendo
```

**Acceder a Coolify Dashboard**:
- URL: `http://your-vps-ip:8000`
- Crear cuenta admin en primer acceso
- Configurar dominio (opcional): `coolify.yourdomain.com`

### 3. Dominio Configurado (Opcional)

Si quieres usar dominio personalizado:
- Comprar dominio (Hostinger, Namecheap, etc.)
- Configurar DNS:
  ```
  A Record: @ → your-vps-ip
  A Record: www → your-vps-ip
  ```

---

## Configuración Inicial en Coolify

### PASO 1: Crear Proyecto en Coolify

1. **Login a Coolify Dashboard**: `http://your-vps-ip:8000`

2. **Crear nuevo proyecto**:
   - Click "New Project"
   - Nombre: `cjhirashi-app`
   - Environment: `production`

3. **Conectar repositorio Git**:
   - Click "Add New Resource" > "Application"
   - Source: GitHub
   - Autorizar Coolify en GitHub (OAuth)
   - Seleccionar repositorio: `your-username/cjhirashi-app`
   - Branch: `main`

### PASO 2: Configurar Application Settings

**General Settings**:
- **Application Name**: `cjhirashi-app`
- **Build Pack**: Nixpacks (auto-detecta NextJS)
- **Port**: `3000` (NextJS default)
- **Install Command**: `npm install`
- **Build Command**: `npm run build`
- **Start Command**: `npm start`

**Domain Configuration**:
- **Add Domain**: `cjhirashi.yourdomain.com` (o subdomain que prefieras)
- **SSL**: Enable "Automatic SSL with Let's Encrypt" ✅

### PASO 3: Configurar Environment Variables

En Coolify Dashboard > Application > Environment Variables:

```bash
# Supabase (PRODUCTION)
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-url.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database (PRODUCTION)
DATABASE_URL=postgresql://user:password@31.97.212.194:5432/cjhirashi_prod

# NextJS
NODE_ENV=production

# AI Integration (si aplica)
OPENAI_API_KEY=your-openai-key
```

**CRÍTICO**:
- ✅ Marcar variables sensibles como "Secret" (Coolify las oculta)
- ✅ NO usar valores de desarrollo, SOLO producción
- ✅ Verificar que `DATABASE_URL` apunta a DB de producción

### PASO 4: Configurar Build Settings

**Dockerfile (Opcional)**:
Si Nixpacks no funciona correctamente, crear `Dockerfile`:

```dockerfile
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

**next.config.ts** (ajustar para standalone):
```typescript
const nextConfig = {
  output: 'standalone', // CRÍTICO para Docker
  // ... resto de config
};
```

### PASO 5: Configurar Database Connection

**Opción A: Supabase Cloud (Recomendado)**
- Ya configurado vía `DATABASE_URL` en env vars
- Supabase maneja backups, scaling, etc.

**Opción B: PostgreSQL en mismo VPS**
- Instalar PostgreSQL en VPS
- Configurar database `cjhirashi_prod`
- Actualizar `DATABASE_URL` a `localhost`

**Verificar conexión**:
```bash
# Dentro del container (después de deploy)
docker exec -it cjhirashi-app sh
npx prisma db pull
# Debería conectar exitosamente
```

---

## Deployment Workflow

### Deployment Automático (Recomendado)

1. **Push a branch `main`**:
   ```bash
   git add .
   git commit -m "feat: new feature"
   git push origin main
   ```

2. **Coolify detecta push automáticamente** (webhook de GitHub)

3. **Build inicia**:
   - Coolify clona repo
   - Ejecuta `npm install`
   - Ejecuta `npm run build`
   - Crea Docker image
   - Despliega nuevo container
   - Zero-downtime deployment (blue-green)

4. **Verificar deployment**:
   - Coolify Dashboard > Deployments > Latest
   - Status: SUCCESS ✅
   - Duration: ~3-5 minutos

### Deployment Manual

Si necesitas forzar re-deploy:

1. **Coolify Dashboard** > Application > "Deploy"
2. Click "Redeploy"
3. Espera ~3-5 minutos

---

## Post-Deployment Verification

### 1. Health Check

```bash
curl -f https://cjhirashi.yourdomain.com/api/health
# Expected: {"status":"healthy","checks":{...}}
```

### 2. Smoke Tests Críticos

**Test 1: Home page carga**
```bash
curl -I https://cjhirashi.yourdomain.com/
# Expected: HTTP 200
```

**Test 2: API endpoints**
```bash
curl https://cjhirashi.yourdomain.com/api/agents
# Expected: JSON array
```

**Test 3: Auth flow**
- Abrir `https://cjhirashi.yourdomain.com/auth/login`
- Login con usuario de prueba
- Verificar redirect a `/protected`

**Test 4: Admin panel**
- Abrir `https://cjhirashi.yourdomain.com/admin`
- Verificar carga sin errores
- CRUD operations funcionan

**Test 5: Database connection**
- Ejecutar query desde admin panel
- Verificar datos se cargan correctamente

### 3. Verificar Logs

**Coolify Dashboard** > Application > Logs:
- ✅ NO errores 500
- ✅ NO database connection errors
- ✅ NextJS server started on port 3000

**Logs en tiempo real**:
```bash
# SSH a VPS
ssh root@your-vps-ip

# Ver logs del container
docker logs -f cjhirashi-app
```

### 4. Verificar SSL

```bash
curl -I https://cjhirashi.yourdomain.com/
# Expected: HTTP/2 200 (SSL working)
```

**Verificar certificado**:
- Abrir en navegador
- Click candado 🔒
- Verificar: "Let's Encrypt" certificate válido

---

## Monitoring y Mantenimiento

### Monitoring Built-in de Coolify

**Coolify Dashboard** > Application > Monitoring:
- CPU usage
- Memory usage
- Network traffic
- Disk usage

**Configurar alertas**:
- Settings > Notifications
- Agregar email o webhook
- Triggers: CPU >80%, Memory >90%, App down

### External Monitoring (Opcional)

**UptimeRobot** (gratis):
1. Crear cuenta: https://uptimerobot.com
2. Add New Monitor:
   - Type: HTTPS
   - URL: `https://cjhirashi.yourdomain.com/api/health`
   - Interval: 5 minutos
3. Configurar alertas (email, SMS)

### Logs Persistence

Por default, logs de Docker son efímeros. Para persistencia:

```bash
# SSH a VPS
ssh root@your-vps-ip

# Configurar log rotation
# Coolify lo maneja automáticamente con docker-compose
```

---

## Rollback Procedure

### Rollback Rápido (2 minutos)

**Opción A: Rollback desde Coolify Dashboard**
1. Coolify Dashboard > Application > Deployments
2. Click en deployment anterior (exitoso)
3. Click "Redeploy"
4. Confirmar

**Opción B: Rollback vía Git**
```bash
# Revert último commit en main
git revert HEAD
git push origin main

# Coolify auto-deploya el revert
```

### Rollback Completo (Database + App)

Si necesitas rollback de migrations también:

1. **Rollback database** (si hubo migrations):
   ```bash
   # Acceder a Supabase Dashboard
   # SQL Editor > Ejecutar migration de rollback
   # O restore backup pre-deployment
   ```

2. **Rollback application** (ver Opción A arriba)

3. **Verificar smoke tests** (5/5 deben PASAR)

**Ver**: `docs/deployment/rollback-strategy.md` para más detalles

---

## Troubleshooting

### Build Failures

**Error**: `npm install` fails
**Solución**:
```bash
# Verificar package.json no tiene errores
# Verificar lockfile (package-lock.json) está committed
git add package-lock.json
git commit -m "fix: add package-lock.json"
git push
```

**Error**: `npm run build` fails
**Solución**:
```bash
# Ejecutar build local para identificar error
npm run build

# Verificar env vars en Coolify
# Verificar TypeScript errors: npm run type-check
```

### Runtime Errors

**Error**: App no inicia
**Solución**:
```bash
# Ver logs
docker logs cjhirashi-app

# Verificar PORT está configurado correctamente (3000)
# Verificar env vars están configuradas
```

**Error**: Database connection fails
**Solución**:
```bash
# Verificar DATABASE_URL es correcto
# Verificar VPS puede conectar a Supabase (firewall?)
# Ping desde VPS:
ping 31.97.212.194

# Telnet a puerto 5432:
telnet 31.97.212.194 5432
```

### SSL Issues

**Error**: SSL certificate no genera
**Solución**:
- Verificar DNS apunta a VPS IP correcta
- Esperar propagación DNS (hasta 48h)
- Verificar puerto 80 y 443 abiertos en firewall

---

## Scaling y Performance

### Vertical Scaling (Upgrade VPS)

Si app necesita más recursos:
1. Hostinger Panel > Upgrade VPS
2. Seleccionar plan con más CPU/RAM
3. NO requiere reconfiguración de Coolify

### Horizontal Scaling (Multiple Instances)

Coolify soporta múltiples replicas:
1. Coolify Dashboard > Application > Scale
2. Replicas: `2` (o más)
3. Coolify automáticamente:
   - Crea múltiples containers
   - Configura load balancer (Traefik)
   - Distribuye tráfico

---

## Security Best Practices

### 1. Firewall Configuration

```bash
# SSH a VPS
ssh root@your-vps-ip

# Configurar ufw (Ubuntu Firewall)
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 8000/tcp  # Coolify Dashboard (opcional: restringir a IP específica)
ufw enable
```

### 2. SSH Key Authentication

```bash
# En tu máquina local
ssh-keygen -t ed25519

# Copiar key a VPS
ssh-copy-id root@your-vps-ip

# Deshabilitar password login en VPS
# /etc/ssh/sshd_config:
# PasswordAuthentication no
```

### 3. Regular Updates

```bash
# SSH a VPS
ssh root@your-vps-ip

# Update system packages
apt update && apt upgrade -y

# Update Coolify (cuando haya nueva versión)
# Coolify Dashboard muestra notificación
```

---

## Backup Strategy

### Application Backups

**Git es tu backup**:
- Código fuente en GitHub
- Coolify puede re-deployar desde cualquier commit

### Database Backups

**Supabase Cloud** (si usas):
- Backups automáticos diarios
- Point-in-time recovery
- Ver: `docs/deployment/backup-strategy.md`

**PostgreSQL en VPS** (si usas):
```bash
# Backup manual
pg_dump -U postgres cjhirashi_prod > backup-$(date +%Y%m%d).sql

# Backup automático (cron job)
0 2 * * * pg_dump -U postgres cjhirashi_prod > /backups/backup-$(date +\%Y\%m\%d).sql
```

---

## Referencias

- **Coolify Docs**: https://coolify.io/docs
- **Deployment Checklist**: `docs/deployment/deployment-checklist-coolify.md`
- **Environment Variables**: `docs/deployment/environment-variables.md`
- **Rollback Strategy**: `docs/deployment/rollback-strategy.md`
- **Backup Strategy**: `docs/deployment/backup-strategy.md`

---

## Soporte

**Coolify Community**:
- Discord: https://coolify.io/discord
- GitHub Issues: https://github.com/coollabsio/coolify/issues

**Hostinger Support**:
- VPS issues: https://www.hostinger.com/tutorials/vps

---

**CRÍTICO**: Antes de primer deployment a producción, ejecutar checklist completo en `docs/deployment/deployment-checklist-coolify.md`
