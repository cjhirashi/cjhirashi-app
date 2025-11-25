# Backup & Restore Strategy

**Proyecto**: cjhirashi-app v0.1
**Última actualización**: 2025-11-24

---

## Overview

Esta estrategia documenta cómo realizar backups y restore de la base de datos Supabase.

**Objetivos**:
- **RTO (Recovery Time Objective)**: <2 horas
- **RPO (Recovery Point Objective)**: <1 hora (backups automáticos cada hora)

---

## Backups Automáticos de Supabase

### Estado Actual

Supabase realiza backups automáticos según el plan:

| Plan | Frecuencia | Retención |
|------|-----------|-----------|
| **Free** | Diario | 7 días |
| **Pro** | Cada hora | 30 días |
| **Enterprise** | Personalizado | Personalizado |

**Para este proyecto**:
- Plan actual: [Verificar en Supabase Dashboard]
- Backups automáticos: ✅ HABILITADOS (por defecto)
- Ubicación: Supabase maneja almacenamiento

### Verificar Backups Automáticos

1. Acceder a Supabase Dashboard: https://app.supabase.com
2. Navegar a: **Project > Settings > Database**
3. Scroll a: **Backups** section
4. Verificar:
   - ✅ "Automatic backups" está ENABLED
   - Ver lista de backups recientes

---

## Backups Manuales (Recomendado)

### Cuándo Hacer Backup Manual

Antes de:
- ✅ Ejecutar migrations importantes
- ✅ Cambios en schema de DB
- ✅ Actualizaciones mayores de la aplicación
- ✅ Cambios en RLS policies

### Procedimiento de Backup Manual

#### Opción 1: Supabase Dashboard (Más Fácil)

1. Acceder a Supabase Dashboard
2. Navegar a: **Project > Settings > Database**
3. Sección: **Backups**
4. Click: **"Create new backup"**
5. Asignar nombre descriptivo: `pre-migration-2025-11-24`
6. Esperar confirmación

#### Opción 2: pg_dump (Más Control)

**Requisito**: PostgreSQL client instalado localmente

```bash
# Obtener connection string de Supabase Dashboard > Settings > Database
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.your-project.supabase.co:5432/postgres"

# Crear backup completo
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql

# Crear backup solo de schema (sin datos)
pg_dump $DATABASE_URL --schema-only > schema-backup-$(date +%Y%m%d).sql

# Crear backup solo de datos (sin schema)
pg_dump $DATABASE_URL --data-only > data-backup-$(date +%Y%m%d).sql

# Crear backup de tabla específica
pg_dump $DATABASE_URL --table=user_roles > user_roles-backup-$(date +%Y%m%d).sql
```

**⚠️ SEGURIDAD**: Los backups contienen datos sensibles. Almacenar en ubicación segura.

---

## Almacenamiento de Backups

### Opción 1: Supabase (Recomendado para Facilidad)
- ✅ Automático
- ✅ Cifrado
- ✅ Geo-replicado
- ❌ Depende de Supabase

### Opción 2: AWS S3 (Recomendado para Control)
- ✅ Control total
- ✅ Cifrado en reposo
- ✅ Versionado
- ❌ Requiere configuración

### Opción 3: Google Cloud Storage
- Similar a AWS S3

### Script de Backup a S3 (Opcional)

```bash
#!/bin/bash
# backup-to-s3.sh

# Variables
BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S).sql"
S3_BUCKET="s3://your-backup-bucket/cjhirashi-app/"
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.your-project.supabase.co:5432/postgres"

# Crear backup
pg_dump $DATABASE_URL > $BACKUP_NAME

# Comprimir (reduce tamaño 10x)
gzip $BACKUP_NAME

# Subir a S3
aws s3 cp "${BACKUP_NAME}.gz" "${S3_BUCKET}${BACKUP_NAME}.gz"

# Limpiar archivo local
rm "${BACKUP_NAME}.gz"

echo "✅ Backup completado: ${S3_BUCKET}${BACKUP_NAME}.gz"
```

**Ejecutar automáticamente** con cron:
```bash
# Ejecutar diariamente a las 2 AM
0 2 * * * /path/to/backup-to-s3.sh
```

---

## Restore (Recuperación)

### Escenario 1: Restaurar desde Backup Automático de Supabase

**Cuándo usar**: Pérdida de datos accidental (último día/hora)

1. Acceder a Supabase Dashboard
2. Navegar a: **Project > Settings > Database**
3. Sección: **Backups**
4. Encontrar backup deseado
5. Click: **"Restore"**
6. **⚠️ ADVERTENCIA**: Esto SOBRESCRIBIRÁ la DB actual
7. Confirmar restore
8. Esperar completitud (~5-10 minutos)

### Escenario 2: Restaurar desde Backup Manual (pg_dump)

**Requisito**: Archivo `.sql` de backup

```bash
# Obtener connection string
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.your-project.supabase.co:5432/postgres"

# Opción A: Restaurar TODO (⚠️ SOBRESCRIBE TODO)
psql $DATABASE_URL < backup-20251124-100000.sql

# Opción B: Restaurar tabla específica
psql $DATABASE_URL < user_roles-backup-20251124.sql

# Si el backup está comprimido
gunzip < backup-20251124-100000.sql.gz | psql $DATABASE_URL
```

**⚠️ CRÍTICO**: Esto SOBRESCRIBIRÁ datos actuales. Solo usar en emergencia.

### Escenario 3: Restaurar en Nueva Base de Datos (Safest)

**Recomendado para testing de restore**:

1. Crear nuevo proyecto Supabase (temporal)
2. Restaurar backup en ese proyecto
3. Verificar datos
4. Si OK → Promote a producción
5. Si NO → Repetir con backup anterior

---

## Testing de Backups (CRÍTICO)

**⚠️ IMPORTANTE**: Backups sin testing son inútiles.

### Frecuencia de Testing
- **Mínimo**: 1x/mes
- **Recomendado**: 1x/semana

### Procedimiento de Testing

1. **Crear proyecto Supabase temporal** (Plan Free)
2. **Descargar último backup automático**
3. **Restaurar en proyecto temporal**
4. **Verificar datos**:
   ```sql
   -- Contar registros en tablas críticas
   SELECT 'user_roles' as table_name, COUNT(*) as count FROM user_roles
   UNION ALL
   SELECT 'user_profiles', COUNT(*) FROM user_profiles
   UNION ALL
   SELECT 'audit_logs', COUNT(*) FROM audit_logs;

   -- Verificar integridad referencial
   SELECT * FROM pg_constraint WHERE contype = 'f';
   ```
5. **Verificar funcionalidad de app**:
   - Conectar app a DB temporal (cambiar `DATABASE_URL`)
   - Login funciona
   - Query a DB funciona
6. **Documentar resultado** en `docs/deployment/backup-test-log.md`
7. **Eliminar proyecto temporal**

---

## Disaster Recovery Plan

### Escenario: Pérdida Total de Base de Datos

**Pasos**:

1. **NO ENTRAR EN PÁNICO** ✅
2. **Notificar stakeholders** (outage en progreso)
3. **Verificar causa**:
   - Error humano (DELETE accidental)
   - Corrupción de datos
   - Ataque malicioso
4. **Identificar último backup válido**:
   - Verificar en Supabase Dashboard
   - O listar backups en S3
5. **Crear nuevo proyecto Supabase** (si DB está corrupta)
6. **Restaurar backup** en nuevo proyecto
7. **Verificar integridad de datos** (ejecutar tests críticos)
8. **Actualizar `DATABASE_URL` en Vercel**:
   - Vercel Dashboard > Project > Environment Variables
   - Actualizar `DATABASE_URL` con nuevo connection string
9. **Re-deployar aplicación**:
   ```bash
   vercel --prod
   ```
10. **Verificar funcionamiento**:
    - Login funciona
    - APIs responden
    - UI renderiza correctamente
11. **Monitorear errores** (Sentry, logs)
12. **Notificar resolución** a stakeholders

**Tiempo estimado**: 1-2 horas (depende de tamaño de DB)

---

## Checklist de Backup Pre-Production

Antes de deployment inicial:

- [ ] Backups automáticos habilitados en Supabase
- [ ] Script de backup manual documentado
- [ ] Backup manual ejecutado exitosamente (test)
- [ ] Restore testado en proyecto temporal
- [ ] RTO/RPO definidos y documentados
- [ ] Disaster recovery plan revisado por equipo
- [ ] Contactos de emergencia documentados

---

## Contactos de Emergencia

En caso de disaster recovery:

| Rol | Nombre | Contacto |
|-----|--------|----------|
| **Database Admin** | [NOMBRE] | [EMAIL/PHONE] |
| **DevOps Lead** | [NOMBRE] | [EMAIL/PHONE] |
| **Project Owner** | [NOMBRE] | [EMAIL/PHONE] |
| **Supabase Support** | - | support@supabase.com |

---

## Compliance y Regulaciones

### GDPR (si aplica)
- Backups contienen datos personales
- Asegurar que backups están cifrados
- Retención máxima: según política de privacidad
- Derecho al olvido: Eliminar datos de backups si usuario lo solicita

### HIPAA (si aplica)
- Backups de PHI requieren cifrado en reposo
- Acceso controlado a backups (RBAC)
- Audit log de acceso a backups

---

## Referencias

- **Supabase Backups Docs**: https://supabase.com/docs/guides/database/backups
- **PostgreSQL pg_dump**: https://www.postgresql.org/docs/current/app-pgdump.html
- **AWS S3 Backup Best Practices**: https://aws.amazon.com/s3/backup/
- **Disaster Recovery Plan Template**: `docs/deployment/disaster-recovery-plan.md` (crear si necesario)
