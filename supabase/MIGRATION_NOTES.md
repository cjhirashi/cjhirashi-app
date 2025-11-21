# Notas de Migración - Admin Panel

## Idempotencia de las Migraciones

### Estado Actual

Las migraciones han sido diseñadas para ser lo más idempotentes posible:

#### ✅ Completamente Idempotentes

- **Tablas**: Usan `CREATE TABLE IF NOT EXISTS`
- **Índices**: Usan `CREATE INDEX IF NOT EXISTS`
- **Funciones**: Usan `CREATE OR REPLACE FUNCTION`
- **Vistas**: Usan `CREATE OR REPLACE VIEW`
- **Vistas Materializadas**: Usan `CREATE MATERIALIZED VIEW IF NOT EXISTS`
- **Extensiones**: Usan `CREATE EXTENSION IF NOT EXISTS`
- **Seeds**: Usan `ON CONFLICT DO NOTHING`

#### ⚠️ Consideraciones Especiales

##### ENUMs (Tipos Enumerados)

Los ENUMs en PostgreSQL **NO** soportan `IF NOT EXISTS` ni `CREATE OR REPLACE`.

**Comportamiento actual**:
- Primera ejecución: Crea los ENUMs correctamente
- Segunda ejecución: Error `type "user_role" already exists`

**Solución para re-ejecutar**:
```sql
-- Opción 1: Drop y recrear (CUIDADO: Elimina datos dependientes)
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS user_status CASCADE;
DROP TYPE IF EXISTS audit_action_category CASCADE;
DROP TYPE IF EXISTS setting_type CASCADE;

-- Opción 2: Verificar antes de crear
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'moderator', 'user');
  END IF;
END $$;
```

**Recomendación**: No re-ejecutar la migración 001 completa. Si es necesario:
1. Hacer backup de la base de datos
2. Usar la Opción 2 (verificación previa)

##### Políticas RLS (Row Level Security)

Las políticas **NO** soportan `IF NOT EXISTS`.

**Comportamiento actual**:
- Primera ejecución: Crea las políticas correctamente
- Segunda ejecución: Error `policy "users_read_own_role" already exists`

**Solución para re-ejecutar**:
```sql
-- Opción 1: Drop y recrear
DROP POLICY IF EXISTS "users_read_own_role" ON public.user_roles;
CREATE POLICY "users_read_own_role" ...

-- Opción 2: Bloque condicional
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'users_read_own_role' 
    AND tablename = 'user_roles'
  ) THEN
    CREATE POLICY "users_read_own_role" ...
  END IF;
END $$;
```

**Recomendación**: Las políticas rara vez necesitan re-ejecutarse. Si es necesario modificar una política:
1. Usar `DROP POLICY` + `CREATE POLICY` en una nueva migración
2. Nunca modificar migraciones ya aplicadas en producción

##### Triggers

Los triggers **NO** soportan `IF NOT EXISTS` directamente.

**Comportamiento actual**:
- Primera ejecución: Crea los triggers correctamente
- Segunda ejecución: Error `trigger "update_user_roles_updated_at" already exists`

**Solución para re-ejecutar**:
```sql
DROP TRIGGER IF EXISTS update_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER update_user_roles_updated_at ...
```

**Recomendación**: Ya están usando `CREATE OR REPLACE FUNCTION`, lo cual es suficiente para las funciones. Para los triggers:
- Primera ejecución en ambiente limpio: OK
- Re-ejecución: Agregar `DROP TRIGGER IF EXISTS` antes de cada `CREATE TRIGGER`

## Recomendaciones de Uso

### En Desarrollo (primera vez)

Ejecutar las migraciones en orden:
```bash
# Opción 1: SQL Editor de Supabase
1. 20250101000001_create_core_tables.sql
2. 20250101000002_create_analytics_views.sql
3. 20250101000003_seed_initial_data.sql

# Opción 2: Supabase CLI
supabase db push

# Opción 3: psql
psql "connection-string" -f 20250101000001_create_core_tables.sql
psql "connection-string" -f 20250101000002_create_analytics_views.sql
psql "connection-string" -f 20250101000003_seed_initial_data.sql
```

### En Producción

1. **Hacer backup SIEMPRE**:
```bash
# Backup desde Supabase Dashboard
# O con pg_dump
pg_dump "connection-string" > backup_$(date +%Y%m%d_%H%M%S).sql
```

2. **Ejecutar en transacción** (ya incluido en las migraciones con BEGIN/COMMIT)

3. **Verificar después de cada migración**:
```bash
psql "connection-string" -f scripts/verify_setup.sql
```

4. **NO re-ejecutar migraciones ya aplicadas**

### Si Necesitas Re-ejecutar

Si una migración falló a mitad de camino:

1. **Revisar el log de error** para saber dónde falló

2. **Rollback manual si es necesario**:
```sql
-- Ver tablas creadas
\dt public.*

-- Drop en orden inverso
DROP TABLE IF EXISTS public.system_settings CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;

-- Drop ENUMs
DROP TYPE IF EXISTS setting_type CASCADE;
DROP TYPE IF EXISTS audit_action_category CASCADE;
DROP TYPE IF EXISTS user_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
```

3. **Re-ejecutar la migración completa**

### Modificar Schema en Producción

**NUNCA modifiques una migración ya aplicada**. En su lugar:

1. Crear una nueva migración con un timestamp posterior:
```sql
-- 20250111000004_add_user_profile_fields.sql
BEGIN;

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS department VARCHAR(100);

COMMIT;
```

2. Ejecutar la nueva migración

3. Documentar el cambio en este archivo

## Testing de Idempotencia

Para verificar que las migraciones son idempotentes:

```bash
# 1. Base de datos limpia
createdb test_migrations

# 2. Primera ejecución
psql test_migrations -f 20250101000001_create_core_tables.sql
# Debe: SUCCESS

# 3. Segunda ejecución (NO debería fallar en partes idempotentes)
psql test_migrations -f 20250101000001_create_core_tables.sql
# Esperado: 
#   - Tablas: skip (ya existen)
#   - Índices: skip (ya existen)
#   - Funciones: reemplazadas (OK)
#   - ENUMs: ERROR (esperado)
#   - Policies: ERROR (esperado)
#   - Triggers: ERROR (esperado)

# 4. Limpiar
dropdb test_migrations
```

## Mejoras Futuras

Para hacer las migraciones 100% idempotentes, considerar:

1. **Wrapper para ENUMs**:
```sql
CREATE OR REPLACE FUNCTION create_enum_if_not_exists(
  enum_name TEXT,
  enum_values TEXT[]
) RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = enum_name) THEN
    EXECUTE format('CREATE TYPE %I AS ENUM (%s)', 
      enum_name, 
      array_to_string(enum_values, ',')
    );
  END IF;
END;
$$ LANGUAGE plpgsql;
```

2. **Wrapper para Policies**:
```sql
CREATE OR REPLACE FUNCTION create_policy_if_not_exists(...) ...
```

3. **Usar herramienta de migración avanzada**:
- Flyway
- Liquibase
- Sqitch
- Supabase CLI con tracking

## Historial de Cambios

| Fecha | Migración | Descripción | Autor |
|-------|-----------|-------------|-------|
| 2025-11-11 | 001 | Core tables y RLS | Architecture Team |
| 2025-11-11 | 002 | Analytics views | Architecture Team |
| 2025-11-11 | 003 | Initial seed data | Architecture Team |

---

**Última Actualización**: 2025-11-11
**Mantenido por**: Architecture Team
