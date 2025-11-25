# Rollback Strategy & Emergency Procedures

**Proyecto**: cjhirashi-app v0.1
**Última actualización**: 2025-11-24

---

## Overview

Esta guía documenta procedimientos de rollback para revertir deployments fallidos.

**Objetivos**:
- **Rollback Time**: <5 minutos
- **Downtime**: <2 minutos
- **Data Loss**: 0 (mediante backups)

---

## Decision Tree: ¿Cuándo Hacer Rollback?

```
¿Deployment causó error crítico?
│
├─ SÍ → ¿Afecta a todos los usuarios?
│       │
│       ├─ SÍ → ROLLBACK INMEDIATO ⚠️
│       │
│       └─ NO → ¿Error se puede corregir en <10 min?
│               │
│               ├─ SÍ → HOTFIX (corregir forward)
│               └─ NO → ROLLBACK
│
└─ NO → ¿Performance degradada >50%?
        │
        ├─ SÍ → Evaluar ROLLBACK
        └─ NO → Monitorear + Decidir
```

---

## Tipos de Rollback

### 1. Rollback de Vercel Deployment (Más Común)

**Cuándo usar**:
- Error en código frontend/backend
- API endpoints no responden
- Performance degradada
- UI rota

**Tiempo estimado**: 2 minutos

### 2. Rollback de Database Migration

**Cuándo usar**:
- Migration causó corrupción de datos
- Foreign keys rotas
- RLS policies incorrectas

**Tiempo estimado**: 10-15 minutos

### 3. Rollback Completo (Deployment + DB)

**Cuándo usar**:
- Deployment y migration fallaron
- Incompatibilidad entre código y schema

**Tiempo estimado**: 15-20 minutos

---

## Procedimiento 1: Rollback de Vercel Deployment

### Método A: Vercel Dashboard (Recomendado)

**Pasos**:

1. **Acceder a Vercel Dashboard**
   - URL: https://vercel.com/dashboard
   - Navegar a proyecto: `cjhirashi-app`

2. **Identificar deployment anterior**
   - Tab: **Deployments**
   - Buscar último deployment STABLE (antes del fallido)
   - Verificar timestamp y commit

3. **Promover deployment anterior**
   - Click en deployment anterior (stable)
   - Click: **"⋯" (3 dots) > "Promote to Production"**
   - Confirmar promoción

4. **Verificar rollback exitoso**
   - Esperar propagación (~30 segundos)
   - Verificar: `curl https://your-app.vercel.app/api/health`
   - Status 200 = ✅ Rollback exitoso

**Tiempo total**: ~2 minutos

---

### Método B: Vercel CLI (Para Automatización)

**Requisito**: Vercel CLI instalado

```bash
# 1. Listar deployments recientes
vercel ls

# Output:
# Age  Deployment                  Status   Duration
# 5m   cjhirashi-app-abc123.vercel.app   ERROR    45s
# 1h   cjhirashi-app-xyz789.vercel.app   READY    52s  ← ESTE (último stable)
# 2h   cjhirashi-app-def456.vercel.app   READY    48s

# 2. Promover deployment anterior
vercel promote cjhirashi-app-xyz789.vercel.app --prod

# 3. Verificar
curl https://cjhirashi-app.vercel.app/api/health
```

**Tiempo total**: ~1 minuto

---

### Método C: Git Revert + Re-deploy (Más Seguro)

**Cuándo usar**: Si Método A/B fallan

```bash
# 1. Identificar commit problemático
git log --oneline
# abc123 Deployment causó error ← ESTE
# xyz789 Último commit stable
# def456 Commit anterior

# 2. Revertir commit
git revert abc123

# 3. Push a main (trigger CI/CD automático)
git push origin main

# 4. Esperar deployment (~3 minutos)

# 5. Verificar
curl https://cjhirashi-app.vercel.app/api/health
```

**Tiempo total**: ~5 minutos

---

## Procedimiento 2: Rollback de Database Migration

### Método A: Prisma Migration Rollback

**Contexto**: Prisma NO soporta rollback automático. Requiere migration manual.

**Pasos**:

1. **Identificar migration problemática**
   ```bash
   npx prisma migrate status
   ```

2. **Crear migration de rollback manual**
   - Revisar migration aplicada en `prisma/migrations/`
   - Crear SQL inverso manualmente

3. **Ejemplo**: Si migration fue `ADD COLUMN`:
   ```sql
   -- Migration original (20251124_add_user_phone.sql)
   ALTER TABLE user_profiles ADD COLUMN phone VARCHAR(20);

   -- Rollback manual
   ALTER TABLE user_profiles DROP COLUMN phone;
   ```

4. **Aplicar rollback en Supabase**
   - Supabase Dashboard > SQL Editor
   - Ejecutar SQL de rollback
   - Verificar con `SELECT * FROM user_profiles LIMIT 1;`

5. **Actualizar Prisma schema**
   - Revertir cambios en `prisma/schema.prisma`
   - `npx prisma generate`

**⚠️ CRÍTICO**: Hacer backup ANTES de rollback

---

### Método B: Restore desde Backup (Nuclear Option)

**Cuándo usar**: Si migration causó corrupción severa

**Pasos**:

1. **Crear backup de estado actual** (por si acaso)
   ```bash
   pg_dump $DATABASE_URL > backup-before-rollback.sql
   ```

2. **Restaurar desde último backup válido**
   - Ver guía completa en `backup-strategy.md`
   - Supabase Dashboard > Backups > Restore

3. **Verificar integridad de datos**
   ```sql
   -- Contar registros críticos
   SELECT COUNT(*) FROM user_roles;
   SELECT COUNT(*) FROM user_profiles;
   ```

4. **Re-aplicar migrations necesarias** (si rollback fue parcial)

**Tiempo total**: 15-20 minutos

---

## Procedimiento 3: Rollback Completo (Deployment + DB)

**Escenario**: Deployment nuevo requiere migration, ambos fallaron

**Pasos**:

1. **Rollback de Database** (Procedimiento 2)
2. **Rollback de Deployment** (Procedimiento 1)
3. **Verificar compatibilidad**:
   - Deployment anterior debe funcionar con DB rollbacked
   - Ejecutar smoke tests

**Tiempo total**: 20-25 minutos

---

## Smoke Tests Post-Rollback

Ejecutar SIEMPRE después de rollback:

```bash
# 1. Health check
curl -f https://your-app.vercel.app/api/health || echo "❌ FAILED"

# 2. Auth endpoint
curl -f https://your-app.vercel.app/api/auth/profile || echo "❌ FAILED"

# 3. Database query
curl -f https://your-app.vercel.app/api/agents || echo "❌ FAILED"

# 4. Admin panel (si autenticado)
curl -f https://your-app.vercel.app/admin -H "Cookie: auth-token=..." || echo "❌ FAILED"
```

**Criterio de éxito**: TODOS los tests retornan 200

---

## Comunicación Durante Rollback

### Template de Notificación (Slack/Email)

**Inicio de Rollback**:
```
🚨 ROLLBACK EN PROGRESO

Deployment: v1.2.3 → v1.2.2
Motivo: [ERROR CRÍTICO / PERFORMANCE DEGRADADA / etc.]
ETA: 5 minutos
Status: https://status.your-app.com

No realizar cambios hasta confirmar rollback completo.
```

**Rollback Completado**:
```
✅ ROLLBACK COMPLETADO

Deployment revertido: v1.2.2 (stable)
Downtime: 3 minutos
Smoke tests: PASANDO
Status: Sistema operacional

Causa raíz: [Descripción breve]
Post-mortem: [Link si aplica]
```

---

## Prevención de Necesidad de Rollback

### Checklist Pre-Deployment

- [ ] Tests passing (766/766)
- [ ] Build completa sin errores
- [ ] Smoke tests en staging PASANDO
- [ ] Migrations testeadas en staging
- [ ] Performance en staging OK
- [ ] Backup manual ejecutado
- [ ] Rollback strategy revisada

### Deployment Estrategias

#### 1. Blue-Green Deployment (Ideal)
- Deploy a nuevo ambiente (green)
- Testear green
- Switch tráfico a green
- Mantener blue por 1 hora (rollback rápido)

#### 2. Canary Deployment
- Deploy a 5% de usuarios
- Monitorear errores
- Si OK → Deploy a 100%
- Si FAIL → Revert canary

**Nota**: Vercel NO soporta estas estrategias nativamente. Requiere configuración avanzada.

---

## Post-Rollback Actions

### Inmediato (0-1 hora)

1. **Notificar stakeholders**: Rollback completado
2. **Monitorear métricas**:
   - Error rate
   - Response time
   - User complaints
3. **Preservar evidencia**:
   - Logs del deployment fallido
   - Screenshots de errores
   - Database state (si aplica)

### Corto Plazo (1-24 horas)

1. **Root Cause Analysis**:
   - ¿Qué causó el error?
   - ¿Por qué no se detectó en testing?
   - ¿Qué test faltó?
2. **Crear post-mortem**: `docs/incidents/incident-YYYYMMDD.md`
3. **Agregar tests**:
   - Crear test que detecte el error
   - Agregar a CI/CD
4. **Corregir issue**:
   - Fix en rama separada
   - Re-testear exhaustivamente
   - Deploy cuando esté 100% validado

### Largo Plazo (1 semana)

1. **Revisar deployment process**:
   - ¿Faltó algún paso?
   - ¿Checklist incompleto?
2. **Actualizar documentación**:
   - Agregar caso a rollback strategy
   - Mejorar testing procedures
3. **Team retrospective**:
   - Lecciones aprendidas
   - Mejoras de proceso

---

## Emergency Contacts

En caso de rollback crítico:

| Rol | Nombre | Contacto | Autoridad |
|-----|--------|----------|-----------|
| **Tech Lead** | [NOMBRE] | [PHONE] | Aprueba rollback |
| **DevOps** | [NOMBRE] | [PHONE] | Ejecuta rollback |
| **Database Admin** | [NOMBRE] | [PHONE] | Rollback de DB |
| **Product Owner** | [NOMBRE] | [PHONE] | Comunicación externa |

**Orden de escalamiento**:
1. DevOps detecta issue → Ejecuta rollback
2. DevOps notifica a Tech Lead
3. Tech Lead evalúa root cause
4. Si afecta usuarios → Notificar Product Owner

---

## Métricas de Rollback

Trackear en `docs/deployment/rollback-log.md`:

| Fecha | Versión | Motivo | Tiempo | Downtime | Afectados |
|-------|---------|--------|--------|----------|-----------|
| 2025-11-24 | v1.2.3 | API error 500 | 3 min | 2 min | 100% |

**Meta**: <2 rollbacks/mes

---

## Testing de Rollback Strategy

**Frecuencia**: 1x/trimestre

**Procedimiento**:

1. **Simular deployment fallido** en staging
2. **Ejecutar rollback** siguiendo esta guía
3. **Medir tiempo** de rollback
4. **Documentar issues** encontrados
5. **Actualizar guía** con aprendizajes

---

## Referencias

- **Vercel Deployments**: https://vercel.com/docs/deployments
- **Prisma Migrations**: https://www.prisma.io/docs/concepts/components/prisma-migrate
- **Backup Strategy**: `docs/deployment/backup-strategy.md`
- **Incident Template**: `docs/incidents/incident-template.md` (crear si necesario)
