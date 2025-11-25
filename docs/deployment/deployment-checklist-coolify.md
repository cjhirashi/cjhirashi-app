# Deployment Checklist - Coolify + Hostinger VPS

**Proyecto**: cjhirashi-app v0.1
**Plataforma**: Coolify (self-hosted) en VPS Hostinger
**Última actualización**: 2025-11-24

---

## Pre-Deployment Checklist

### ✅ Infraestructura VPS

- [ ] **VPS de Hostinger configurado**
  - [ ] Specs: Mínimo 2 CPU cores, 4GB RAM, 50GB SSD
  - [ ] OS: Ubuntu 22.04 LTS
  - [ ] Acceso SSH funcional: `ssh root@your-vps-ip`

- [ ] **Coolify instalado en VPS**
  - [ ] Coolify Dashboard accesible: `http://your-vps-ip:8000`
  - [ ] Cuenta admin creada
  - [ ] Containers de Coolify corriendo: `docker ps`

- [ ] **Firewall configurado**
  - [ ] Puerto 22 (SSH) abierto
  - [ ] Puerto 80 (HTTP) abierto
  - [ ] Puerto 443 (HTTPS) abierto
  - [ ] Puerto 8000 (Coolify Dashboard) abierto o restringido a IP específica

- [ ] **Dominio configurado** (opcional pero recomendado)
  - [ ] DNS A Record: `@ → your-vps-ip`
  - [ ] DNS A Record: `www → your-vps-ip`
  - [ ] Propagación DNS completada (verificar: `nslookup yourdomain.com`)

---

### ✅ Código y Testing

- [ ] **Branch main actualizado**
  - [ ] Merge de última PR aprobada
  - [ ] NO hay commits pending en dev branches
  - [ ] Git status clean
  - [ ] Código pushed a GitHub

- [ ] **Tests pasando**
  - [ ] `npm test` → 766/766 tests PASS
  - [ ] `npm run lint` → 0 errores
  - [ ] Coverage >80% en módulos críticos

- [ ] **Build exitoso local**
  - [ ] `npm run build` → Sin errores
  - [ ] Bundle size razonable (<500KB JS)
  - [ ] NO warnings críticos
  - [ ] `npm start` funciona después de build

- [ ] **next.config.ts configurado para Docker**
  ```typescript
  output: 'standalone', // CRÍTICO para Coolify/Docker
  ```

---

### ✅ QA y Auditorías

- [ ] **Security Audit**
  - [ ] 0 vulnerabilidades CRITICAL
  - [ ] 0 vulnerabilidades HIGH (o aceptadas con justificación)
  - [ ] Secrets NO hardcodeados en código
  - [ ] Security headers configurados (next.config.ts)

- [ ] **Performance**
  - [ ] Lighthouse score >80 (Performance)
  - [ ] Code splitting implementado (Modal lazy loaded)
  - [ ] Cache headers configurados

- [ ] **Accessibility**
  - [ ] Skip link implementado
  - [ ] WCAG 2.1 Level A compliance
  - [ ] Lighthouse Accessibility >90

---

### ✅ Database y Migrations

- [ ] **Migrations testeadas**
  - [ ] Migrations ejecutadas en Supabase staging/dev
  - [ ] Schema verificado
  - [ ] NO hay breaking changes

- [ ] **RLS Policies verificadas**
  - [ ] 20 policies ENABLED en Supabase Dashboard
  - [ ] Todas las tablas tienen RLS habilitado
  - [ ] Report: `docs/deployment/rls-verification-report.md` completo

- [ ] **Backup pre-deployment**
  - [ ] Backup manual ejecutado (Supabase Dashboard o pg_dump)
  - [ ] Backup timestamp registrado
  - [ ] Backup accesible y verificado

---

### ✅ Environment Variables en Coolify

- [ ] **Coolify Dashboard > Application > Environment Variables configuradas**

  **Variables públicas**:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL` (production)
  - [ ] `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (production)

  **Variables secretas** (marcadas como "Secret" en Coolify):
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `DATABASE_URL` (connection string de producción)
  - [ ] AI keys (si aplica): `OPENAI_API_KEY`, etc.

  **Variables de sistema**:
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=3000` (NextJS default)

- [ ] **Variables validadas**
  - [ ] NO hay variables con placeholder "your-key-here"
  - [ ] Variables públicas NO incluyen secrets
  - [ ] `DATABASE_URL` apunta a base de datos de PRODUCCIÓN (NO dev)

- [ ] **Documentación actualizada**
  - [ ] `docs/deployment/environment-variables.md` refleja config actual
  - [ ] `.env.local.example` tiene placeholders correctos

---

### ✅ Coolify Application Configuration

- [ ] **Proyecto creado en Coolify**
  - [ ] Project Name: `cjhirashi-app`
  - [ ] Environment: `production`

- [ ] **Repositorio Git conectado**
  - [ ] Source: GitHub
  - [ ] Repository: `your-username/cjhirashi-app`
  - [ ] Branch: `main`
  - [ ] Webhook configurado (auto-deployment)

- [ ] **Build Settings**
  - [ ] Build Pack: Nixpacks (auto-detecta NextJS)
  - [ ] Install Command: `npm install`
  - [ ] Build Command: `npm run build`
  - [ ] Start Command: `npm start`
  - [ ] Port: `3000`

- [ ] **Domain configurado**
  - [ ] Domain: `cjhirashi.yourdomain.com` (o subdomain)
  - [ ] SSL: "Automatic SSL with Let's Encrypt" ENABLED ✅

- [ ] **Docker configurado** (si usa Dockerfile custom)
  - [ ] `Dockerfile` presente en root del proyecto
  - [ ] Dockerfile optimizado (multi-stage build)
  - [ ] `.dockerignore` presente

---

### ✅ Monitoring y Logs

- [ ] **Health Check API funcional**
  - [ ] Endpoint `/api/health` existe
  - [ ] Retorna status 200 con DB check
  - [ ] Responde en <500ms

- [ ] **Logging configurado**
  - [ ] Console.log estructurado (JSON)
  - [ ] Logs accesibles en Coolify Dashboard

- [ ] **Monitoring externo** (opcional)
  - [ ] UptimeRobot configurado para `/api/health`
  - [ ] Alertas configuradas (email)
  - [ ] Check interval: 5 minutos

---

### ✅ Documentación

- [ ] **Deployment docs completos**
  - [ ] `docs/deployment/coolify-deployment-guide.md` ✅
  - [ ] `docs/deployment/deployment-checklist-coolify.md` ✅
  - [ ] `docs/deployment/environment-variables.md` ✅
  - [ ] `docs/deployment/rls-verification-report.md` ✅
  - [ ] `docs/deployment/backup-strategy.md` ✅
  - [ ] `docs/deployment/rollback-strategy.md` ✅
  - [ ] `docs/deployment/monitoring-configuration.md` ✅

- [ ] **README actualizado**
  - [ ] Production URL documentada
  - [ ] Deployment instructions (Coolify-specific)
  - [ ] Links a docs de deployment

---

## Deployment Execution Checklist

### Durante Deployment

- [ ] **Notificar stakeholders**
  ```
  📢 Deployment iniciado
  Version: v0.1
  Platform: Coolify + Hostinger VPS
  ETA: 5-7 minutos
  Downtime esperado: 0 (zero-downtime deployment)
  ```

- [ ] **Ejecutar migrations en production** (si aplica)
  - [ ] Acceder a Supabase Dashboard (production)
  - [ ] SQL Editor > Ejecutar migrations de producción
  - [ ] Verificar schema actualizado
  - [ ] NO errores en console

- [ ] **Trigger deployment en Coolify**

  **Método A: Auto-deployment** (push a main):
  ```bash
  git checkout main
  git pull
  git push origin main
  # Coolify detecta push vía webhook y deploya automáticamente
  ```

  **Método B: Manual deployment**:
  - Coolify Dashboard > Application > "Deploy"
  - Click "Redeploy"
  - Confirmar

- [ ] **Monitorear deployment**
  - [ ] Coolify Dashboard > Deployments > Latest
  - [ ] Status: BUILDING → DEPLOYING → RUNNING
  - [ ] Build logs: Sin errores
  - [ ] Deployment completado en <7 minutos

---

### Post-Deployment (Inmediato)

- [ ] **Smoke Tests en Production**

  **Test 1: Health check**
  ```bash
  curl -f https://cjhirashi.yourdomain.com/api/health
  # Expected: {"status":"healthy","checks":{"database":"connected"}}
  ```

  **Test 2: Home page**
  ```bash
  curl -I https://cjhirashi.yourdomain.com/
  # Expected: HTTP/2 200
  ```

  **Test 3: Login flow**
  - [ ] Abrir `/auth/login`
  - [ ] Login con usuario de prueba
  - [ ] Redirect a `/protected` exitoso

  **Test 4: API endpoints**
  ```bash
  curl https://cjhirashi.yourdomain.com/api/agents
  # Expected: JSON array de agents
  ```

  **Test 5: Admin panel**
  - [ ] Abrir `/admin`
  - [ ] Verificar que carga sin errores
  - [ ] CRUD de usuarios funciona

  **Test 6: Database connection**
  - [ ] Queries funcionan correctamente
  - [ ] RLS policies activas (queries respetan permisos)

- [ ] **Verificar SSL**
  ```bash
  curl -I https://cjhirashi.yourdomain.com/
  # Expected: HTTP/2 200 (SSL working)
  ```
  - [ ] Certificado válido (Let's Encrypt)
  - [ ] No warnings de SSL en navegador

- [ ] **Monitorear logs (15 minutos)**
  - [ ] Coolify Dashboard > Logs
  - [ ] NO errores 500
  - [ ] NO database connection errors
  - [ ] NO auth failures (excepto intentos legítimos fallidos)
  - [ ] NextJS server started successfully

---

### Post-Deployment (1 hora)

- [ ] **Verificar funcionalidad crítica**
  - [ ] User registration funciona
  - [ ] Password reset funciona
  - [ ] CRUD operations funcionan
  - [ ] File uploads funcionan (si aplica)

- [ ] **Lighthouse Audit en producción**
  - [ ] Performance >80
  - [ ] Accessibility >90
  - [ ] Best Practices >90
  - [ ] SEO >80

- [ ] **Verificar métricas de Coolify**
  - [ ] CPU usage normal (<50%)
  - [ ] Memory usage normal (<70%)
  - [ ] Response time <500ms
  - [ ] Error rate <1%

- [ ] **Verificar UptimeRobot** (si configurado)
  - [ ] Monitor status: UP
  - [ ] Response time <1000ms
  - [ ] NO alerts disparadas

---

### Post-Deployment (24 horas)

- [ ] **Revisar métricas acumuladas**
  - [ ] Uptime: 99.9%
  - [ ] Avg response time <500ms
  - [ ] Error rate <0.5%
  - [ ] NO crashes del container

- [ ] **User feedback**
  - [ ] NO reportes de errores críticos
  - [ ] Performance percibida normal
  - [ ] SSL funcionando correctamente

- [ ] **Database health**
  - [ ] Supabase Dashboard > Database > Connections: Normal
  - [ ] NO queries lentas (>1s)
  - [ ] Storage usage razonable

- [ ] **VPS health**
  ```bash
  ssh root@your-vps-ip
  htop  # Verificar CPU, RAM
  df -h # Verificar disk space
  docker ps # Verificar containers running
  ```

---

## Rollback Triggers

Si CUALQUIERA de estos ocurre, considerar rollback inmediato:

- ❌ **Error rate >5%** durante >5 minutos
- ❌ **Response time >2s** promedio
- ❌ **Database connection errors** persistentes
- ❌ **Auth completamente roto** (usuarios no pueden login)
- ❌ **Data corruption** detectada
- ❌ **Critical security vulnerability** expuesta
- ❌ **Container crashea repetidamente** (>3 crashes en 10 minutos)

**Procedimiento de rollback**: Ver `docs/deployment/rollback-strategy.md`

**Rollback rápido en Coolify** (2 minutos):
1. Coolify Dashboard > Application > Deployments
2. Click en deployment anterior (exitoso)
3. Click "Redeploy"
4. Verificar smoke tests PASAN

---

## Post-Deployment Documentation

- [ ] **Actualizar CHANGELOG**
  ```markdown
  ## [0.1.0] - 2025-11-24

  ### Deployment
  - First production deployment to Hostinger VPS via Coolify

  ### Added
  - Admin panel completo (users, roles, audit logs)
  - RBAC system con 3 roles (admin, moderator, user)
  - Skip link para accesibilidad (WCAG 2.4.1)
  - Security headers configurados

  ### Infrastructure
  - Coolify deployment on Hostinger VPS
  - Let's Encrypt SSL certificate
  - Zero-downtime deployments configured
  ```

- [ ] **Crear Git Tag**
  ```bash
  git tag -a v0.1.0 -m "Production release v0.1 - Coolify deployment"
  git push origin v0.1.0
  ```

- [ ] **Deployment Log**
  - [ ] Actualizar `docs/deployment/deployment-log.md`:
    ```markdown
    ## 2025-11-24 - v0.1.0 Production Release

    **Platform**: Coolify + Hostinger VPS
    **Deployed by**: [NOMBRE]
    **Deployment time**: [TIMESTAMP]
    **Duration**: ~5 minutos
    **Downtime**: 0 (zero-downtime deployment)
    **Smoke tests**: PASSED (6/6)
    **Rollback**: NO necesario
    **Issues**: Ninguno

    **Production URL**: https://cjhirashi.yourdomain.com
    **VPS IP**: [your-vps-ip]
    **SSL**: Let's Encrypt (auto-renewed)
    ```

- [ ] **Notificar deployment exitoso**
  ```
  ✅ DEPLOYMENT EXITOSO - Coolify + Hostinger VPS

  Version: v0.1.0
  Production URL: https://cjhirashi.yourdomain.com
  Platform: Coolify (self-hosted)
  VPS: Hostinger (Ubuntu 22.04)

  Smoke tests: PASSED (6/6)
  SSL: Let's Encrypt ✅
  Downtime: 0
  Status: Producción operacional

  Deployment log: docs/deployment/deployment-log.md
  Monitoring: Coolify Dashboard + UptimeRobot
  ```

---

## Emergency Contacts

En caso de issues críticos:

| Rol | Contacto | Autoridad |
|-----|----------|-----------|
| **Tech Lead** | [PHONE/EMAIL] | Aprobar rollback |
| **DevOps** | [PHONE/EMAIL] | Ejecutar rollback, acceso VPS |
| **Database Admin** | [PHONE/EMAIL] | Migrations/Rollback DB |
| **Product Owner** | [PHONE/EMAIL] | Comunicación externa |

---

## Referencias

- **Coolify Deployment Guide**: `docs/deployment/coolify-deployment-guide.md`
- **Environment Variables**: `docs/deployment/environment-variables.md`
- **Rollback Procedures**: `docs/deployment/rollback-strategy.md`
- **Backup Strategy**: `docs/deployment/backup-strategy.md`
- **Monitoring**: `docs/deployment/monitoring-configuration.md`
- **Coolify Docs**: https://coolify.io/docs

---

## Notas Finales

- Este checklist debe ejecutarse **COMPLETO** antes de cada deployment a producción
- NO saltear pasos, cada uno previene clases específicas de errores
- Si un paso falla → Corregir ANTES de proceder
- Deployment es **REVERSIBLE** (rollback en 2 minutos vía Coolify)
- En caso de duda → Consultar con Tech Lead antes de proceder

**CRÍTICO para Coolify**:
- `next.config.ts` DEBE tener `output: 'standalone'` para Docker
- Environment variables DEBEN estar configuradas en Coolify Dashboard (NO en .env.local del repo)
- Domain DNS debe apuntar a VPS IP ANTES de deployment
- SSL se configura automáticamente después de primer deployment exitoso

---

**Última verificación**: 2025-11-24
**Plataforma target**: Coolify + Hostinger VPS
**Status**: Ready for production deployment ✅
