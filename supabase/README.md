# Supabase Database - Admin Panel

**Base de Datos:** PostgreSQL 15+ (Supabase)
**Última Actualización:** 2025-11-11
**Nivel de Seguridad:** Production-Ready

---

## Índice

1. [Resumen](#resumen)
2. [Migraciones](#migraciones)
3. [Seguridad](#seguridad)
4. [Testing](#testing)
5. [Mantenimiento](#mantenimiento)
6. [Troubleshooting](#troubleshooting)

---

## Resumen

Esta base de datos implementa un sistema completo de administración con:

- **RBAC (Role-Based Access Control)**: 3 roles (admin, moderator, user)
- **Row Level Security (RLS)**: Habilitado en todas las tablas
- **Audit Logging**: Registro inmutable de todas las acciones administrativas
- **Rate Limiting**: Protección contra abuso a nivel de base de datos
- **Failed Login Tracking**: Monitoreo de intentos de acceso fallidos
- **Security Monitoring**: Vistas para detectar actividad sospechosa

---

## Migraciones

### Orden de Ejecución

Las migraciones deben aplicarse en orden secuencial:

```bash
# 1. Crear tablas core y RLS policies
psql -f supabase/migrations/20250101000001_core_admin_tables.sql

# 2. Crear vistas de analytics
psql -f supabase/migrations/20250101000002_analytics_views.sql

# 3. Seed de datos iniciales
psql -f supabase/migrations/20250101000003_seed_initial_data.sql

# 4. Security enhancements
psql -f supabase/migrations/20250101000004_security_enhancements.sql
```

### Usando Supabase CLI

```bash
# Inicializar Supabase en el proyecto
supabase init

# Aplicar todas las migraciones
supabase db push

# Verificar estado
supabase db status
```

### Rollback

Si necesitas revertir cambios:

```bash
# Ver historial de migraciones
supabase db migrations list

# Revertir última migración
supabase db reset
```

---

## Seguridad

### Arquitectura de Seguridad

Este sistema implementa **defensa en profundidad** con 5 capas de seguridad:

1. **Middleware**: Autenticación básica
2. **Layout/Page**: Autorización de rutas basada en roles
3. **API Routes/Server Actions**: Validación y rate limiting
4. **Database Queries**: Queries parametrizadas
5. **RLS Policies**: Última línea de defensa

Ver [ADR-004: Security Layers](../docs/decisions/adr-004-security-layers.md) para detalles.

### Row Level Security (RLS)

#### ¿Qué es RLS?

Row Level Security es una característica de PostgreSQL que permite definir políticas de acceso a nivel de fila. Esto significa que los usuarios solo pueden ver/modificar los datos que las políticas les permiten, **incluso si la aplicación tiene bugs**.

#### Tablas con RLS Habilitado

- ✓ `user_roles` - Solo admins pueden modificar roles
- ✓ `user_profiles` - Usuarios pueden ver/editar su perfil (excepto status)
- ✓ `audit_logs` - Solo lectura para admins/moderators, inmutable
- ✓ `system_settings` - Settings públicos vs privados
- ✓ `rate_limits` - Solo admins pueden ver
- ✓ `failed_login_attempts` - Solo admins pueden ver

#### Verificar RLS

```sql
-- Verificar que RLS está habilitado
SELECT tablename, relrowsecurity
FROM pg_tables
JOIN pg_class ON pg_class.relname = pg_tables.tablename
WHERE schemaname = 'public';

-- Resultado esperado: relrowsecurity = true para todas las tablas admin
```

#### Políticas Críticas

**user_roles - Prevención de Auto-Escalación:**

```sql
-- Usuarios NO pueden modificar su propio rol
CREATE POLICY "admins_modify_roles"
  ON public.user_roles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    user_id != auth.uid()  -- 🔒 Previene auto-promoción
  );
```

**audit_logs - Inmutabilidad:**

```sql
-- NO hay políticas INSERT/UPDATE/DELETE
-- Solo lectura para admins/moderators
CREATE POLICY "admins_read_logs"
  ON public.audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- Inmutabilidad adicional vía triggers (defense in depth)
```

### Prevención de Escalación de Privilegios

#### Medidas Implementadas

1. **RLS Policy con WITH CHECK**: Previene modificación del propio rol
2. **Trigger de validación**: `prevent_self_role_escalation()`
3. **Audit automático**: Todos los cambios de rol se registran
4. **Verificación en aplicación**: Capa 2 y 3 verifican permisos

#### Test de Escalación

```sql
-- Como usuario regular, intentar promover a admin (debe fallar)
UPDATE public.user_roles
SET role = 'admin'
WHERE user_id = auth.uid();

-- Resultado esperado: ERROR - Cannot modify your own role
```

### Inmutabilidad de Audit Logs

#### Implementación

Los audit logs son **append-only** (solo agregar):

1. **Sin políticas UPDATE/DELETE**: RLS no permite modificaciones
2. **Triggers de protección**: Lanzan error si se intenta modificar
3. **Función SECURITY DEFINER**: Solo `insert_audit_log()` puede insertar

#### Verificación

```sql
-- Intentar modificar un log (debe fallar)
UPDATE public.audit_logs
SET action = 'modified'
WHERE id = 'some-uuid';

-- Resultado esperado: ERROR - Audit logs are immutable

-- Intentar eliminar un log (debe fallar)
DELETE FROM public.audit_logs
WHERE id = 'some-uuid';

-- Resultado esperado: ERROR - Audit logs are immutable
```

### Rate Limiting

#### A Nivel de Base de Datos

```sql
-- Verificar rate limit para una acción
SELECT check_rate_limit(
  'user@example.com',  -- identifier
  'login',             -- action
  5,                   -- max_requests
  60                   -- window_seconds
);

-- Retorna: TRUE si permitido, FALSE si excede límite
```

#### Uso en Aplicación

```typescript
// lib/api/rate-limit.ts
export async function checkDatabaseRateLimit(
  userId: string,
  action: string,
  maxRequests: number = 100,
  windowSeconds: number = 60
) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_identifier: userId,
    p_action: action,
    p_max_requests: maxRequests,
    p_window_seconds: windowSeconds,
  });

  if (error) throw error;
  return data as boolean;
}
```

### Failed Login Tracking

#### Registro de Intentos Fallidos

```sql
-- Registrar intento fallido
SELECT record_failed_login(
  'user@example.com',
  '192.168.1.1'::INET,
  'Mozilla/5.0...'
);

-- Verificar si cuenta está bloqueada
SELECT is_account_locked('user@example.com');

-- Retorna: TRUE si >= 5 intentos en 15 minutos
```

#### Monitoreo

```sql
-- Ver actividad sospechosa de login
SELECT * FROM public.suspicious_login_activity;

-- Ver intentos recientes
SELECT email, COUNT(*) as attempts
FROM public.failed_login_attempts
WHERE attempted_at > NOW() - INTERVAL '1 hour'
GROUP BY email
ORDER BY attempts DESC;
```

### Validación de Datos

#### Constraints Implementados

**user_profiles:**

- ✓ Teléfono: Formato E.164 (`^\+?[0-9]{10,20}$`)
- ✓ Full name: No puede estar vacío si está presente
- ✓ Bio: Máximo 1000 caracteres
- ✓ Metadata: Debe ser objeto JSON válido

**audit_logs:**

- ✓ Action: Formato `categoria.accion` (e.g., `user.create`)
- ✓ Resource type: Solo letras minúsculas y guiones bajos

**system_settings:**

- ✓ Key: Formato dot notation (e.g., `app.name`)
- ✓ Key: Mínimo 3 caracteres

### Security Functions (SECURITY DEFINER)

#### Uso Seguro de SECURITY DEFINER

Las funciones con `SECURITY DEFINER` se ejecutan con permisos del owner (bypass RLS). Solo usar cuando sea absolutamente necesario.

**Funciones SECURITY DEFINER en este sistema:**

1. `insert_audit_log()` - Permite insertar logs sin dar permisos INSERT a usuarios
2. `prevent_self_role_escalation()` - Ejecuta validaciones de seguridad
3. `check_rate_limit()` - Accede a tabla rate_limits sin exponer datos
4. `is_account_locked()` - Verifica intentos fallidos sin exponer información
5. `update_last_login()` - Actualiza timestamp de login

#### Best Practices

```sql
-- ✓ CORRECTO: Función limitada y validada
CREATE OR REPLACE FUNCTION insert_audit_log(...)
RETURNS UUID AS $$
BEGIN
  -- Solo INSERT, no permite modificar datos existentes
  INSERT INTO public.audit_logs (...) VALUES (...);
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ✗ INCORRECTO: SECURITY DEFINER sin validación
CREATE OR REPLACE FUNCTION dangerous_function(p_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Permite modificar cualquier usuario sin validación
  UPDATE public.user_roles SET role = 'admin' WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Mejores Prácticas de Seguridad

#### 1. Nunca Confiar en el Cliente

```typescript
// ✗ INCORRECTO
export async function updateUserRole(userId: string, role: string) {
  // Solo validación en cliente
  const supabase = await createClient();
  await supabase.from('user_roles').update({ role }).eq('user_id', userId);
}

// ✓ CORRECTO
export async function updateUserRole(userId: string, role: string) {
  // 1. Verificar autorización
  const admin = await requireAdmin();

  // 2. Validar entrada
  const validated = updateRoleSchema.parse({ userId, role });

  // 3. Verificar lógica de negocio
  if (validated.userId === admin.id) {
    throw new Error('Cannot modify your own role');
  }

  // 4. Ejecutar con RLS activo
  const supabase = await createClient();
  const { error } = await supabase
    .from('user_roles')
    .update({ role: validated.role, assigned_by: admin.id })
    .eq('user_id', validated.userId);

  // 5. Audit log
  await createAuditLog({...});
}
```

#### 2. Siempre Usar Queries Parametrizadas

```typescript
// ✗ INCORRECTO - SQL Injection vulnerable
const query = `SELECT * FROM users WHERE name = '${searchTerm}'`;

// ✓ CORRECTO - Supabase escapa automáticamente
const { data } = await supabase
  .from('users')
  .select('*')
  .ilike('name', `%${searchTerm}%`);
```

#### 3. Principle of Least Privilege

```typescript
// ✗ INCORRECTO - Dar permisos de admin por defecto
INSERT INTO user_roles (user_id, role) VALUES (NEW.id, 'admin');

// ✓ CORRECTO - Rol user por defecto, admin asignado manualmente
INSERT INTO user_roles (user_id, role) VALUES (NEW.id, 'user');
```

#### 4. Audit de Operaciones Sensibles

```typescript
// ✓ CORRECTO - Audit todas las operaciones admin
await createAuditLog({
  userId: admin.id,
  action: 'user.role.update',
  resourceType: 'user',
  resourceId: userId,
  changes: { role: { from: oldRole, to: newRole } },
  metadata: { ip_address: request.ip, user_agent: request.headers['user-agent'] },
});
```

### Monitoreo y Alertas

#### Vistas de Monitoreo

```sql
-- Actividad de login sospechosa (>= 3 intentos fallidos en 1 hora)
SELECT * FROM public.suspicious_login_activity;

-- Actividad administrativa sospechosa (>= 10 acciones en 1 hora)
SELECT * FROM public.suspicious_admin_activity;
```

#### Alertas Recomendadas

1. **Alerta Critical**: Usuario con >= 10 intentos fallidos en 1 hora
2. **Alerta High**: Cambio de rol a admin
3. **Alerta High**: Usuario suspendido intenta acceder
4. **Alerta Medium**: >= 5 intentos fallidos en 15 minutos
5. **Alerta Medium**: Modificación de system_settings críticos

#### Implementación con Supabase

```typescript
// lib/monitoring/alerts.ts
export async function checkSecurityAlerts() {
  const supabase = await createServiceRoleClient();

  // Alert 1: Suspicious login activity
  const { data: suspiciousLogins } = await supabase
    .from('suspicious_login_activity')
    .select('*');

  if (suspiciousLogins && suspiciousLogins.length > 0) {
    await sendAlert({
      level: 'critical',
      title: 'Suspicious login activity detected',
      details: suspiciousLogins,
    });
  }

  // Alert 2: Suspicious admin activity
  const { data: suspiciousAdmin } = await supabase
    .from('suspicious_admin_activity')
    .select('*');

  if (suspiciousAdmin && suspiciousAdmin.length > 0) {
    await sendAlert({
      level: 'high',
      title: 'Unusual admin activity detected',
      details: suspiciousAdmin,
    });
  }
}
```

### Pitfalls Comunes a Evitar

#### 1. Bypass Accidental de RLS

```typescript
// ✗ INCORRECTO - Usar service role key en lugar de user token
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Bypasses RLS!
);

// ✓ CORRECTO - Usar anon key con user session
const supabase = await createClient(); // Usa session del usuario
```

#### 2. Exponer Service Role Key

```typescript
// ✗ INCORRECTO - Exponer en cliente
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // ¡NUNCA en NEXT_PUBLIC_!
);

// ✓ CORRECTO - Solo en servidor
const supabase = createClient(
  process.env.SUPABASE_URL, // No public
  process.env.SUPABASE_SERVICE_ROLE_KEY // No public
);
```

#### 3. No Validar en Todas las Capas

```typescript
// ✗ INCORRECTO - Solo validar en Capa 2
export default async function AdminPage() {
  await requireAdmin(); // Validación aquí
  return <AdminUI />;
}

export async function deleteUser(userId: string) {
  // ¡No hay validación aquí! Vulnerable si se llama directamente
  await supabase.from('users').delete().eq('id', userId);
}

// ✓ CORRECTO - Validar en cada punto de entrada
export async function deleteUser(userId: string) {
  await requireAdmin(); // Re-validar en Server Action
  // ... resto del código
}
```

### Auditoría Manual

#### Checklist de Seguridad

```bash
# 1. Verificar que RLS está habilitado
psql -c "SELECT tablename, relrowsecurity FROM pg_tables JOIN pg_class ON pg_class.relname = pg_tables.tablename WHERE schemaname = 'public';"

# 2. Verificar políticas RLS
psql -c "SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;"

# 3. Verificar triggers de seguridad
psql -c "SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE event_object_schema = 'public';"

# 4. Verificar funciones SECURITY DEFINER
psql -c "SELECT routine_name, security_type FROM information_schema.routines WHERE routine_schema = 'public' AND security_type = 'DEFINER';"

# 5. Ejecutar tests de seguridad
psql -f supabase/security-tests.sql
```

---

## Testing

### Tests Automatizados

```bash
# Ejecutar todos los security tests
psql -f supabase/security-tests.sql > security-test-results.log

# Revisar resultados
grep "FAIL" security-test-results.log
grep "PASS" security-test-results.log | wc -l
```

### Tests Manuales

#### Test 1: RLS con Usuario Regular

```sql
-- Conectarse como user@test.com
SET SESSION AUTHORIZATION 'user@test.com';

-- Intentar leer roles de otros usuarios (debe fallar)
SELECT * FROM public.user_roles WHERE user_id != auth.uid();
-- Resultado esperado: 0 rows

-- Intentar modificar propio rol (debe fallar)
UPDATE public.user_roles SET role = 'admin' WHERE user_id = auth.uid();
-- Resultado esperado: ERROR
```

#### Test 2: Escalación de Privilegios

```sql
-- Como moderator, intentar crear admin (debe fallar)
UPDATE public.user_roles
SET role = 'admin', assigned_by = auth.uid()
WHERE user_id = 'target-user-id';
-- Resultado esperado: ERROR - Only admins can assign admin role
```

#### Test 3: Inmutabilidad de Audit Logs

```sql
-- Como admin, intentar modificar log (debe fallar)
UPDATE public.audit_logs SET action = 'modified' WHERE id = 'log-id';
-- Resultado esperado: ERROR - Audit logs are immutable

DELETE FROM public.audit_logs WHERE id = 'log-id';
-- Resultado esperado: ERROR - Audit logs are immutable
```

---

## Mantenimiento

### Refresh de Vistas Materializadas

```sql
-- Manual refresh
REFRESH MATERIALIZED VIEW CONCURRENTLY public.admin_dashboard_stats;

-- Automatizar con pg_cron (requiere extensión)
SELECT cron.schedule(
  'refresh-dashboard-stats',
  '*/5 * * * *',  -- Cada 5 minutos
  'REFRESH MATERIALIZED VIEW CONCURRENTLY public.admin_dashboard_stats'
);
```

### Limpieza de Datos

```sql
-- Limpiar rate limits antiguos (ejecutar diariamente)
SELECT cleanup_rate_limits();

-- Limpiar failed login attempts (ejecutar diariamente)
DELETE FROM public.failed_login_attempts
WHERE attempted_at < NOW() - INTERVAL '24 hours';
```

### Backup y Archivado

```sql
-- Archivar audit logs antiguos (ejecutar mensualmente)
CREATE TABLE IF NOT EXISTS public.audit_logs_archive (
  LIKE public.audit_logs INCLUDING ALL
);

WITH moved AS (
  DELETE FROM public.audit_logs
  WHERE created_at < NOW() - INTERVAL '1 year'
  RETURNING *
)
INSERT INTO public.audit_logs_archive
SELECT * FROM moved;
```

---

## Troubleshooting

### Problema: RLS Bloquea Operaciones Legítimas

**Síntoma:**

```
Error: new row violates row-level security policy
```

**Diagnóstico:**

```sql
-- Verificar políticas activas
SELECT * FROM pg_policies WHERE tablename = 'nombre_tabla';

-- Verificar usuario actual
SELECT auth.uid();

-- Verificar rol del usuario
SELECT * FROM public.user_roles WHERE user_id = auth.uid();
```

**Solución:**

1. Verificar que el usuario tiene el rol correcto
2. Revisar la política RLS para asegurar que cubre el caso de uso
3. Si es operación del sistema, usar service role key

### Problema: Triggers Bloquean Operaciones

**Síntoma:**

```
Error: Cannot modify your own role
```

**Diagnóstico:**

```sql
-- Ver triggers activos
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE event_object_schema = 'public';
```

**Solución:**

- Este es comportamiento esperado para prevenir escalación de privilegios
- Si necesitas modificar tu rol, pide a otro admin que lo haga

### Problema: Performance Lenta en Queries

**Diagnóstico:**

```sql
-- Ver plan de ejecución
EXPLAIN ANALYZE
SELECT * FROM public.user_profiles
WHERE status = 'active'
LIMIT 20;
```

**Solución:**

```sql
-- Actualizar estadísticas
ANALYZE public.user_profiles;

-- Verificar que índices existen
SELECT indexname FROM pg_indexes
WHERE tablename = 'user_profiles';

-- Crear índice si falta
CREATE INDEX IF NOT EXISTS idx_user_profiles_status
ON public.user_profiles(status);
```

### Problema: Audit Logs Creciendo Demasiado

**Diagnóstico:**

```sql
-- Ver tamaño de tabla
SELECT
  pg_size_pretty(pg_total_relation_size('public.audit_logs')) as size,
  COUNT(*) as rows
FROM public.audit_logs;
```

**Solución:**

```sql
-- Archivar logs antiguos (ver sección Mantenimiento)
-- O ajustar retención en system_settings
UPDATE public.system_settings
SET value = '180'  -- 6 meses en lugar de 1 año
WHERE key = 'audit.retention_days';
```

---

## Recursos Adicionales

- [Documentación de RLS en Supabase](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [ADR-004: Security Layers](../docs/decisions/adr-004-security-layers.md)

---

**Última Revisión:** 2025-11-11
**Mantenido por:** Security Team
**Nivel de Clasificación:** INTERNAL USE
