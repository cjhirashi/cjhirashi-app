# SEED DATA - Guía de Uso

**Versión**: v0.1
**Fecha**: 2025-11-24

---

## Descripción

Este documento explica cómo aplicar y verificar los **seed data** (datos iniciales) de la aplicación CJHIRASHI.

Los seed data incluyen:

- **3 Agentes pre-configurados**:
  1. Escritor de Libros
  2. Analista de Datos
  3. Investigador Técnico

- **9 Modelos de LLM** (3 tiers por agente):
  - **Economy**: GPT-4o Mini
  - **Balanced**: GPT-4o
  - **Premium**: Claude 3.5 Sonnet

- **RLS Policies** para todas las tablas nuevas
- **Triggers** de validación y auto-update

---

## Archivos de Seed Data

### 1. `supabase/rls-policies-v0.1.sql`

Contiene:
- Row Level Security (RLS) policies para todas las tablas
- Triggers de validación
- Funciones de ayuda (PL/pgSQL)

**Tablas cubiertas**:
- `agents`
- `agent_models`
- `projects`
- `conversations`
- `corpora`
- `agent_corpus_assignments`
- `corpus_documents`
- `embeddings`

### 2. `supabase/seed-data-v0.1.sql`

Contiene:
- 3 agentes pre-configurados
- 9 modelos de LLM (3 tiers × 3 agentes)

**Datos insertados**:

| Agente | Especialización | Economy | Balanced | Premium |
|--------|-----------------|---------|----------|---------|
| Escritor de Libros | Escritura Creativa | GPT-4o Mini | GPT-4o | Claude 3.5 Sonnet |
| Analista de Datos | Análisis de Datos | GPT-4o Mini | GPT-4o | Claude 3.5 Sonnet |
| Investigador Técnico | Investigación Técnica | GPT-4o Mini | GPT-4o | Claude 3.5 Sonnet |

---

## Scripts Disponibles

### 1. `npm run db:seed` (Recomendado)

**Descripción**: Aplica RLS policies y seed data usando Prisma.

**Características**:
- ✅ No requiere `psql` instalado
- ✅ Parser inteligente de SQL (NO rompe funciones PL/pgSQL)
- ✅ Funciona en cualquier entorno (Windows, macOS, Linux)
- ✅ Manejo robusto de errores
- ✅ Continúa ejecución si algunos statements fallan

**Uso**:

```bash
npm run db:seed
```

**Output esperado**:

```
🌱 Starting seed process...

📋 Step 1/2: Applying RLS policies...
  📄 Executing RLS policies... (50 statements)
  ✅ RLS policies: 45 success, 5 skipped, 0 errors
✅ RLS policies step completed

📋 Step 2/2: Inserting seed data...
  📄 Executing Seed data... (12 statements)
  ✅ Seed data: 12 success, 0 skipped, 0 errors
✅ Seed data step completed

🔍 Verifying seed data...
  ✓ Agents: 3 records
  ✓ Agent Models: 9 records

✨ Seed process completed successfully!
```

---

### 2. `npm run db:apply-seed` (Alternativo)

**Descripción**: Aplica seed data usando `psql` directamente.

**Características**:
- ✅ Método más robusto (PostgreSQL maneja todo)
- ✅ No requiere parser personalizado
- ❌ Requiere `psql` instalado en el sistema

**Uso**:

```bash
npm run db:apply-seed
```

**Instalación de psql**:

**Windows**:
```bash
# Descargar de: https://www.postgresql.org/download/windows/
# O usar Chocolatey:
choco install postgresql
```

**macOS**:
```bash
brew install postgresql
```

**Linux (Ubuntu/Debian)**:
```bash
sudo apt-get install postgresql-client
```

**Output esperado**:

```
🌱 Applying seed data using psql...

📋 Step 1/2: Applying RLS policies...
  📄 Executing RLS policies...
  [SQL output from psql]
  ✅ RLS policies executed successfully

📋 Step 2/2: Inserting seed data...
  📄 Executing Seed data...
  [SQL output from psql]
  ✅ Seed data inserted successfully

✨ Seed data applied successfully!
```

---

### 3. `npm run db:verify-seed` (Verificación)

**Descripción**: Verifica que los seed data se insertaron correctamente.

**Uso**:

```bash
npm run db:verify-seed
```

**Output esperado**:

```
🔍 Verifying seed data...

📋 Checking Agents...
  ✓ Total agents: 3
  1. Escritor de Libros - Escritor Creativo (Active: true)
  2. Analista de Datos - Análisis de Datos (Active: true)
  3. Investigador Técnico - Investigación Técnica (Active: true)

📋 Checking Agent Models...
  ✓ Total agent models: 9
  Escritor de Libros:
    - economy: openai/gpt-4o-mini (temp: 0.8)
    - balanced: openai/gpt-4o (temp: 0.8)
    - premium: anthropic/claude-3-5-sonnet-20241022 (temp: 0.8)
  Analista de Datos:
    - economy: openai/gpt-4o-mini (temp: 0.3)
    - balanced: openai/gpt-4o (temp: 0.3)
    - premium: anthropic/claude-3-5-sonnet-20241022 (temp: 0.3)
  Investigador Técnico:
    - economy: openai/gpt-4o-mini (temp: 0.5)
    - balanced: openai/gpt-4o (temp: 0.5)
    - premium: anthropic/claude-3-5-sonnet-20241022 (temp: 0.5)

📋 Checking RLS Policies...
  ✓ Total RLS policies: 20+
  agents: 2 policies
    - Admin full access on agents (ALL)
    - Users read active agents (SELECT)
  agent_models: 2 policies
    - Admin full access on agent_models (ALL)
    - Users read active agent models (SELECT)
  ...

📋 Checking Triggers...
  ✓ Total triggers: 5+
  agents.trigger_agents_updated_at (UPDATE)
  projects.trigger_projects_updated_at (UPDATE)
  ...

==========================================
RESUMEN DE VERIFICACIÓN
==========================================
✅ Agents: 3/3 (OK)
✅ Agent Models: 9/9 (OK)
✅ RLS Policies: 20+ (OK)
✅ Triggers: 5+ (OK)

✨ VERIFICACIÓN EXITOSA - Seed data insertado correctamente
```

---

## Workflow Completo

### Primera Ejecución (Proyecto Nuevo)

```bash
# 1. Aplicar seed data
npm run db:seed

# 2. Verificar datos insertados
npm run db:verify-seed
```

### Re-ejecución (Si Falló)

```bash
# Opción 1: Re-intentar con Prisma
npm run db:seed

# Opción 2: Usar psql (más robusto)
npm run db:apply-seed

# Verificar
npm run db:verify-seed
```

### Desarrollo Local

```bash
# Al hacer cambios en seed data:
# 1. Editar archivos SQL
vim supabase/seed-data-v0.1.sql

# 2. Re-aplicar
npm run db:seed

# 3. Verificar
npm run db:verify-seed
```

---

## Troubleshooting

### Error: "No agents found"

**Causa**: Seed data no se insertó.

**Solución**:

```bash
# Verificar errores detallados
npm run db:seed 2>&1 | tee seed-log.txt

# Si hay errores SQL, revisar archivos
cat supabase/seed-data-v0.1.sql
cat supabase/rls-policies-v0.1.sql

# Intentar con psql
npm run db:apply-seed
```

### Error: "psql command not found"

**Causa**: `psql` no está instalado o no está en PATH.

**Solución**:

1. Instalar PostgreSQL Client Tools (ver sección "Instalación de psql")
2. O usar el método con Prisma: `npm run db:seed`

### Error: "Some statements failed"

**Causa**: Algunos statements SQL tienen errores de sintaxis o funciones no existen.

**Solución**:

```bash
# Ver errores detallados en output
npm run db:seed 2>&1 | grep "❌"

# Revisar archivos SQL
cat supabase/seed-data-v0.1.sql
cat supabase/rls-policies-v0.1.sql

# Ejecutar manualmente con psql para ver errores
psql "$DATABASE_URL" -f supabase/seed-data-v0.1.sql
```

### Error: "RLS policies not found"

**Causa**: RLS policies no se aplicaron correctamente.

**Solución**:

```bash
# Aplicar solo RLS policies
psql "$DATABASE_URL" -f supabase/rls-policies-v0.1.sql

# Verificar
npm run db:verify-seed
```

---

## Archivos Relacionados

### Scripts

- `prisma/seed.ts` - Script principal de seed (Prisma)
- `scripts/apply-seed-data.ts` - Script alternativo (psql)
- `scripts/verify-seed-data.ts` - Verificación detallada

### SQL

- `supabase/rls-policies-v0.1.sql` - RLS policies, triggers, funciones
- `supabase/seed-data-v0.1.sql` - Datos iniciales (agents, agent_models)

### Documentación

- `docs/database/SEED-DATA-README.md` - Esta guía
- `docs/phase-4-reports/seed-data-fix-report.md` - Reporte de corrección

---

## Notas Técnicas

### Parser Inteligente de SQL

El script `prisma/seed.ts` incluye un parser que:

1. **Detecta funciones PL/pgSQL**: `CREATE FUNCTION`, `CREATE OR REPLACE FUNCTION`
2. **Detecta triggers**: `CREATE TRIGGER`, `CREATE OR REPLACE TRIGGER`
3. **Detecta bloques DO**: `DO $$`
4. **Cuenta delimitadores `$$`**: Espera a tener 2 `$$` (inicio y fin) antes de dividir
5. **NO rompe funciones**: Mantiene funciones completas como un solo statement

**Beneficio**: Evita errores de sintaxis al ejecutar archivos SQL complejos.

### Idempotencia

Los seed data son **idempotentes**:

- `ON CONFLICT (id) DO NOTHING` en INSERTs
- `CREATE OR REPLACE` en funciones y triggers
- Errores de "already exists" se ignoran

**Beneficio**: Puedes re-ejecutar `npm run db:seed` múltiples veces sin problemas.

---

## Changelog

### v0.1 (2025-11-24)

- ✅ Creación inicial de seed data
- ✅ 3 agentes pre-configurados
- ✅ 9 modelos de LLM (3 tiers × 3 agentes)
- ✅ RLS policies para todas las tablas
- ✅ Triggers de validación
- ✅ Parser inteligente de SQL
- ✅ Script de verificación detallada

---

**Documentación mantenida por**: database-developer (Fase 4)
**Última actualización**: 2025-11-24
