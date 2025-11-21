# Guía de Verificación - Fase 1

Esta guía te ayudará a aplicar las migraciones de la Fase 1 y verificar que todo funciona correctamente.

## Estado Actual

**Archivos Creados:**
- ✅ `migrations/20250101000001_create_core_tables.sql` (523 líneas)
- ✅ `migrations/20250101000002_create_analytics_views.sql` (113 líneas)
- ✅ `migrations/20250101000003_seed_initial_data.sql` (62 líneas)
- ✅ `scripts/assign_admin.sql`
- ✅ `scripts/verify_setup.sql`
- ✅ `test-phase1.sql` (script de verificación completo)

**Total:** 698 líneas de SQL production-ready

---

## Prerequisitos

1. Tener un proyecto de Supabase creado
2. Tener las variables de entorno configuradas en `.env.local`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=tu-proyecto-url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=tu-key-aqui
   ```

---

## Método 1: Supabase Dashboard (Recomendado para empezar)

### Paso 1: Acceder al Editor SQL

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Click en "SQL Editor" en el menú lateral

### Paso 2: Aplicar Migración 001 (Tablas Core)

1. Click en "New query"
2. Abre el archivo: `supabase/migrations/20250101000001_create_core_tables.sql`
3. Copia TODO el contenido (523 líneas)
4. Pega en el editor SQL
5. Click en "Run" o presiona `Ctrl+Enter`
6. Espera a ver "Success. No rows returned"

**Qué crea esta migración:**
- 4 ENUMs (user_role, user_status, audit_action_category, setting_type)
- 4 tablas (user_roles, user_profiles, audit_logs, system_settings)
- 19 índices optimizados
- 6 funciones helpers
- 12 políticas RLS
- 6 triggers automáticos

### Paso 3: Aplicar Migración 002 (Analytics)

1. Click en "New query"
2. Abre el archivo: `supabase/migrations/20250101000002_create_analytics_views.sql`
3. Copia todo el contenido (113 líneas)
4. Pega en el editor SQL
5. Click en "Run"

**Qué crea esta migración:**
- 1 vista materializada: `admin_dashboard_stats`
- 2 vistas regulares: `user_activity_summary`, `recent_activity`
- Función `refresh_dashboard_stats()`

### Paso 4: Configurar tu Email de Admin

**IMPORTANTE:** Antes de aplicar la migración 003, necesitas configurar tu email.

1. Abre el archivo: `supabase/migrations/20250101000003_seed_initial_data.sql`
2. Busca la línea 44 (aproximadamente) que dice:
   ```sql
   WHERE email = 'admin@example.com'
   ```
3. Reemplaza `'admin@example.com'` con tu email real (el que usas para login en Supabase)
4. Guarda el archivo

### Paso 5: Aplicar Migración 003 (Datos Iniciales)

1. Click en "New query"
2. Copia el contenido MODIFICADO de `20250101000003_seed_initial_data.sql`
3. Pega en el editor SQL
4. Click en "Run"

**Qué crea esta migración:**
- 8 configuraciones del sistema (pagination, auth limits, etc.)
- Asigna rol de admin a tu usuario

### Paso 6: Verificar la Instalación

1. Click en "New query"
2. Abre el archivo: `supabase/test-phase1.sql`
3. Copia todo el contenido
4. Pega en el editor SQL
5. Click en "Run"

**Deberías ver:**
- ✅ 4 tablas con RLS habilitado
- ✅ ~19 índices creados
- ✅ 12+ políticas RLS
- ✅ 6 funciones helpers
- ✅ 3 vistas de analytics
- ✅ 8 configuraciones iniciales
- ✅ Tu usuario con rol 'admin'

---

## Método 2: Supabase CLI (Para Desarrollo)

### Paso 1: Instalar Supabase CLI

```bash
npm install -g supabase
```

### Paso 2: Enlazar tu Proyecto

```bash
# En la raíz del proyecto
npx supabase link --project-ref [tu-project-ref]
```

**¿Dónde encontrar el project-ref?**
- Dashboard → Settings → General → Reference ID

### Paso 3: Modificar Email de Admin

Edita `supabase/migrations/20250101000003_seed_initial_data.sql` línea 44 con tu email real.

### Paso 4: Aplicar todas las Migraciones

```bash
npx supabase db push
```

Este comando aplicará automáticamente todas las migraciones en orden.

### Paso 5: Verificar

```bash
# Ejecutar script de verificación
npx supabase db execute --file supabase/test-phase1.sql
```

---

## Método 3: psql (Avanzado)

### Prerequisitos

- PostgreSQL client instalado
- Connection string de Supabase

### Paso 1: Obtener Connection String

1. Dashboard → Settings → Database
2. Copiar "Connection string" (URI)
3. Reemplazar `[YOUR-PASSWORD]` con tu password de DB

### Paso 2: Modificar Email de Admin

Edita la línea 44 de `20250101000003_seed_initial_data.sql`.

### Paso 3: Aplicar Migraciones

```bash
# Desde la raíz del proyecto
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" \
  -f supabase/migrations/20250101000001_create_core_tables.sql

psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" \
  -f supabase/migrations/20250101000002_create_analytics_views.sql

psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" \
  -f supabase/migrations/20250101000003_seed_initial_data.sql
```

### Paso 4: Verificar

```bash
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" \
  -f supabase/test-phase1.sql
```

---

## Verificación Manual (Sin Script)

Si prefieres verificar manualmente, ejecuta estos queries en el SQL Editor:

### 1. Verificar Tablas y RLS

```sql
SELECT
  tablename,
  CASE WHEN rowsecurity THEN 'Habilitado' ELSE 'DESHABILITADO' END AS rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('user_roles', 'user_profiles', 'audit_logs', 'system_settings');
```

**Esperado:** 4 filas, todas con RLS = 'Habilitado'

### 2. Verificar tu Usuario Admin

```sql
SELECT
  u.email,
  ur.role,
  up.status
FROM auth.users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN user_profiles up ON up.user_id = u.id
WHERE ur.role = 'admin';
```

**Esperado:** Tu email con role = 'admin' y status = 'active'

### 3. Verificar Funciones

```sql
SELECT proname
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN (
    'get_user_role',
    'has_permission',
    'insert_audit_log'
  );
```

**Esperado:** 3 funciones listadas

### 4. Verificar Vistas

```sql
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('admin_dashboard_stats', 'user_activity_summary');
```

**Esperado:** 2 vistas

### 5. Verificar Settings Iniciales

```sql
SELECT key, value_type
FROM system_settings
ORDER BY key;
```

**Esperado:** 8 configuraciones

---

## Solución de Problemas

### Error: "type user_role already exists"

**Causa:** Ya ejecutaste la migración 001 antes.

**Solución:**
1. No es un error crítico si es la primera vez
2. Si necesitas re-ejecutar, primero elimina:
   ```sql
   DROP TYPE IF EXISTS user_role CASCADE;
   DROP TYPE IF EXISTS user_status CASCADE;
   DROP TYPE IF EXISTS audit_action_category CASCADE;
   DROP TYPE IF EXISTS setting_type CASCADE;
   ```

### Error: "relation user_roles already exists"

**Causa:** La tabla ya existe.

**Solución:**
- Si es intencional, ignora el error
- Si quieres empezar limpio:
  ```sql
  DROP TABLE IF EXISTS user_roles CASCADE;
  DROP TABLE IF EXISTS user_profiles CASCADE;
  DROP TABLE IF EXISTS audit_logs CASCADE;
  DROP TABLE IF EXISTS system_settings CASCADE;
  ```

### Error: "insert or update on table violates foreign key constraint"

**Causa:** Estás intentando crear un rol para un usuario que no existe en `auth.users`.

**Solución:**
1. Verifica que tu email existe:
   ```sql
   SELECT id, email FROM auth.users;
   ```
2. Si no aparece, primero debes crear una cuenta en tu app
3. Luego ejecuta `supabase/scripts/assign_admin.sql` con tu email

### No veo mi usuario como admin

**Causa:** El email en la migración 003 no coincide con tu usuario.

**Solución:**
Ejecuta manualmente:
```sql
-- Reemplaza con tu email real
INSERT INTO user_roles (user_id, role, assigned_by)
SELECT id, 'admin'::user_role, id
FROM auth.users
WHERE email = 'tu-email@example.com'
ON CONFLICT (user_id) DO UPDATE
SET role = 'admin';
```

### RLS no está habilitado

**Causa:** La migración 001 no se ejecutó completamente.

**Solución:**
```sql
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
```

---

## Próximos Pasos

Una vez que todas las verificaciones pasen (✅):

1. **Probar en la aplicación:**
   - Hacer login con tu usuario admin
   - Verificar que puedes acceder a datos

2. **Continuar con Fase 2:**
   - Implementar helpers de autorización en Next.js
   - Actualizar middleware
   - Crear rutas protegidas

3. **Opcional - Crear más usuarios admin:**
   - Usa `supabase/scripts/assign_admin.sql`
   - Reemplaza el email y ejecuta

---

## Checklist de Verificación

Marca cada item cuando lo completes:

- [ ] Migración 001 aplicada (tablas core)
- [ ] Migración 002 aplicada (analytics)
- [ ] Email de admin configurado en migración 003
- [ ] Migración 003 aplicada (seed data)
- [ ] Script test-phase1.sql ejecutado
- [ ] 4 tablas con RLS habilitado
- [ ] Tu usuario tiene rol 'admin'
- [ ] 8 configuraciones iniciales existen
- [ ] Funciones helpers creadas
- [ ] Vistas de analytics funcionan

---

## Resumen de Estado

**Fase 1: Base de Datos** ✅ Lista para verificar

**Archivos críticos:**
- `migrations/20250101000001_create_core_tables.sql`
- `migrations/20250101000002_create_analytics_views.sql`
- `migrations/20250101000003_seed_initial_data.sql`
- `test-phase1.sql` (nuevo)

**Documentación:**
- `README.md` - Guía completa
- `MIGRATION_NOTES.md` - Notas técnicas
- `GUIA_VERIFICACION.md` - Este documento

**Scripts de utilidad:**
- `scripts/assign_admin.sql` - Asignar admin a un usuario
- `scripts/verify_setup.sql` - Verificación completa

---

**¿Listo para continuar?** Una vez verificado, avísame y procedemos con la Fase 2: Sistema de Roles y Permisos.
