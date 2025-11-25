# Deployment Checklist - Production

**Proyecto**: cjhirashi-app v0.1
**Última actualización**: 2025-11-24

---

## Pre-Deployment Checklist

### ✅ Código y Testing

- [ ] **Branch main actualizado**
  - [ ] Merge de última PR aprobada
  - [ ] NO hay commits pending en dev branches
  - [ ] Git status clean

- [ ] **Tests pasando**
  - [ ] `npm test` → 766/766 tests PASS
  - [ ] `npm run lint` → 0 errores
  - [ ] Coverage >80% en módulos críticos

- [ ] **Build exitoso**
  - [ ] `npm run build` → Sin errores
  - [ ] Bundle size razonable (<500KB JS)
  - [ ] NO warnings críticos

---

### ✅ QA y Auditorías

- [ ] **Security Audit**
  - [ ] 0 vulnerabilidades CRITICAL
  - [ ] 0 vulnerabilidades HIGH (o aceptadas con justificación)
  - [ ] Secrets NO hardcodeados en código

- [ ] **Performance**
  - [ ] Lighthouse score >80 (Performance)
  - [ ] Code splitting implementado (Modal lazy loaded)
  - [ ] Cache headers configurados

- [ ] **Accessibility**
  - [ ] Skip link implementado
  - [ ] WCAG 2.1 Level A compliance
  - [ ] Lighthouse Accessibility >90

- [ ] **SEO**
  - [ ] Metadata configurado
  - [ ] Robots.txt presente
  - [ ] Sitemap generado (si aplica)

---

### ✅ Database y Migrations

- [ ] **Migrations testeadas en staging**
  - [ ] Migrations ejecutadas en Supabase staging
  - [ ] Schema verificado en staging
  - [ ] NO hay breaking changes

- [ ] **RLS Policies verificadas**
  - [ ] 20 policies ENABLED en staging
  - [ ] Todas las tablas tienen RLS habilitado
  - [ ] Report: `docs/deployment/rls-verification-report.md` completo

- [ ] **Backup pre-deployment**
  - [ ] Backup manual ejecutado (Supabase Dashboard)
  - [ ] Backup timestamp registrado
  - [ ] Backup testeado (restore en proyecto temporal)

---

### ✅ Environment Variables

- [ ] **Variables configuradas en Vercel**
  - [ ] `NEXT_PUBLIC_SUPABASE_URL` (production)
  - [ ] `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (production)
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` (SENSITIVE)
  - [ ] `DATABASE_URL` (SENSITIVE)
  - [ ] AI keys (si aplica)

- [ ] **Variables validadas**
  - [ ] NO hay variables con placeholder "your-key-here"
  - [ ] Variables públicas NO incluyen secrets
  - [ ] Variables disponibles en entorno: **Production**

- [ ] **Documentación actualizada**
  - [ ] `docs/deployment/environment-variables.md` refleja state actual
  - [ ] `.env.local.example` tiene placeholders correctos

---

### ✅ CI/CD Pipeline

- [ ] **GitHub Actions configurado**
  - [ ] Workflow: `.github/workflows/deploy.yml` presente
  - [ ] Secrets configurados en GitHub:
    - [ ] `VERCEL_TOKEN`
    - [ ] `VERCEL_ORG_ID`
    - [ ] `VERCEL_PROJECT_ID`
  - [ ] Pipeline ejecuta en PR (preview deployment)
  - [ ] Pipeline ejecuta en push a main (production)

- [ ] **Vercel configurado**
  - [ ] Proyecto conectado a GitHub repo
  - [ ] Auto-deployment habilitado
  - [ ] Preview deployments habilitados

---

### ✅ Monitoring y Alertas

- [ ] **Health Check API**
  - [ ] Endpoint `/api/health` funciona
  - [ ] Retorna status 200 con DB check

- [ ] **Logging configurado**
  - [ ] Console.log estructurado (JSON)
  - [ ] Vercel logs accesibles

- [ ] **Monitoring (Opcional)**
  - [ ] Sentry configurado (si decidido)
  - [ ] UptimeRobot configurado para `/api/health`
  - [ ] Alertas configuradas (email/Slack)

---

### ✅ Documentación

- [ ] **Deployment docs completos**
  - [ ] `docs/deployment/deployment-strategy.md`
  - [ ] `docs/deployment/environment-variables.md`
  - [ ] `docs/deployment/rls-verification-report.md`
  - [ ] `docs/deployment/backup-strategy.md`
  - [ ] `docs/deployment/rollback-strategy.md`
  - [ ] `docs/deployment/monitoring-configuration.md`

- [ ] **README actualizado**
  - [ ] Production URL documentada
  - [ ] Deployment instructions actualizadas
  - [ ] Links a docs de deployment

---

## Deployment Execution Checklist

### Durante Deployment

- [ ] **Notificar stakeholders**
  ```
  📢 Deployment iniciado
  Version: v0.1
  ETA: 5 minutos
  Downtime esperado: 0
  ```

- [ ] **Ejecutar migrations en production** (si aplica)
  - [ ] Acceder a Supabase Dashboard (production)
  - [ ] SQL Editor > Ejecutar migrations
  - [ ] Verificar schema actualizado
  - [ ] NO errores en console

- [ ] **Trigger deployment**
  - **Método A**: Push a `main` branch (automático vía CI/CD)
    ```bash
    git checkout main
    git pull
    git push
    ```
  - **Método B**: Vercel CLI (manual)
    ```bash
    vercel --prod
    ```

- [ ] **Monitorear deployment**
  - [ ] Vercel Dashboard > Deployments > Estado: BUILDING
  - [ ] Build logs: Sin errores
  - [ ] Deployment completado en <3 minutos

---

### Post-Deployment (Inmediato)

- [ ] **Smoke Tests en Production**
  - [ ] Health check:
    ```bash
    curl -f https://your-app.vercel.app/api/health
    # Expected: {"status":"healthy","checks":{...}}
    ```
  - [ ] Login flow:
    - [ ] Abrir `/auth/login`
    - [ ] Login con usuario de prueba
    - [ ] Redirect a `/protected`
  - [ ] API endpoints:
    ```bash
    curl -f https://your-app.vercel.app/api/agents
    # Expected: JSON array de agents
    ```
  - [ ] Admin panel:
    - [ ] Abrir `/admin`
    - [ ] Verificar que carga sin errores
    - [ ] CRUD de usuarios funciona

- [ ] **Verificar métricas**
  - [ ] Vercel Analytics: Request success rate >99%
  - [ ] Response time <500ms
  - [ ] Error rate <1%

- [ ] **Monitorear logs (15 minutos)**
  - [ ] Vercel Dashboard > Logs
  - [ ] NO errores 500
  - [ ] NO database connection errors
  - [ ] NO auth failures (excepto intentos legítimos fallidos)

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

- [ ] **Verificar Sentry (si configurado)**
  - [ ] NO nuevos errores en Sentry dashboard
  - [ ] Error rate normal (<5 events/hour)

---

### Post-Deployment (24 horas)

- [ ] **Revisar métricas acumuladas**
  - [ ] Uptime: 99.9%
  - [ ] Avg response time <500ms
  - [ ] Error rate <0.5%

- [ ] **User feedback**
  - [ ] NO reportes de errores críticos
  - [ ] Performance percibida normal

- [ ] **Database health**
  - [ ] Supabase Dashboard > Database > Connections: Normal
  - [ ] NO queries lentas (>1s)
  - [ ] Storage usage razonable

---

## Rollback Triggers

Si CUALQUIERA de estos ocurre, considerar rollback inmediato:

- ❌ **Error rate >5%** durante >5 minutos
- ❌ **Response time >2s** promedio
- ❌ **Database connection errors** persistentes
- ❌ **Auth completamente roto** (usuarios no pueden login)
- ❌ **Data corruption** detectada
- ❌ **Critical security vulnerability** expuesta

**Procedimiento de rollback**: Ver `docs/deployment/rollback-strategy.md`

---

## Post-Deployment Documentation

- [ ] **Actualizar CHANGELOG**
  ```markdown
  ## [0.1.0] - 2025-11-24

  ### Added
  - Admin panel completo (users, roles, audit logs)
  - RBAC system con 3 roles (admin, moderator, user)
  - Smoke tests en CI/CD

  ### Fixed
  - Skip link para accesibilidad (WCAG 2.4.1)
  - Security headers configurados
  - Code splitting para EditUserModal
  ```

- [ ] **Crear Git Tag**
  ```bash
  git tag -a v0.1.0 -m "Production release v0.1"
  git push origin v0.1.0
  ```

- [ ] **Deployment Log**
  - [ ] Actualizar `docs/deployment/deployment-log.md`:
    ```markdown
    ## 2025-11-24 - v0.1.0 Production Release
    - **Deployed by**: [NOMBRE]
    - **Deployment time**: 14:30 UTC
    - **Duration**: 4 minutos
    - **Downtime**: 0
    - **Smoke tests**: PASSED (5/5)
    - **Rollback**: NO necesario
    - **Issues**: Ninguno
    ```

- [ ] **Notificar deployment exitoso**
  ```
  ✅ DEPLOYMENT EXITOSO

  Version: v0.1.0
  URL: https://cjhirashi-app.vercel.app
  Smoke tests: PASSED
  Downtime: 0
  Status: Producción operacional

  Changelog: [link]
  ```

---

## Emergency Contacts

En caso de issues críticos:

| Rol | Contacto | Autoridad |
|-----|----------|-----------|
| **Tech Lead** | [PHONE/EMAIL] | Aprobar rollback |
| **DevOps** | [PHONE/EMAIL] | Ejecutar rollback |
| **Database Admin** | [PHONE/EMAIL] | Migrations/Rollback DB |
| **Product Owner** | [PHONE/EMAIL] | Comunicación externa |

---

## Referencias

- **Deployment Strategy**: `docs/deployment/deployment-strategy.md`
- **Environment Variables**: `docs/deployment/environment-variables.md`
- **Rollback Procedures**: `docs/deployment/rollback-strategy.md`
- **Backup Strategy**: `docs/deployment/backup-strategy.md`
- **Monitoring**: `docs/deployment/monitoring-configuration.md`

---

## Notas Finales

- Este checklist debe ejecutarse **COMPLETO** antes de cada deployment a producción
- NO saltear pasos, cada uno previene clases específicas de errores
- Si un paso falla → Corregir ANTES de proceder
- Deployment es **REVERSIBLE** (rollback strategy documentada)
- En caso de duda → Consultar con Tech Lead antes de proceder
