# REPORTE DE CORRECCIÓN - SEED DATA v0.1

**Fecha**: 2025-11-24
**Responsable**: fase-4-desarrollo-leader
**Worker**: database-developer (corrección aplicada)
**Fase**: Fase 4 - Desarrollo (Database)
**Status**: CORREGIDO ✅

---

## PROBLEMA IDENTIFICADO

### Descripción del Error

El script de seed (`npm run db:seed`) reportaba éxito pero **NO insertaba datos** en las tablas `agents` y `agent_models`:

- **Esperado**: 3 agents, 9 agent_models
- **Real**: 0 agents, 0 agent_models

### Errores SQL Reportados

```
Error 42601: Syntax error en SQL
Error 42883: Function does not exist
```

### Causa Raíz

El script `prisma/seed.ts` original usaba un método `executeMultipleStatements()` que:

1. **Dividía el SQL por `;`** de forma simplista
2. **Rompía funciones PL/pgSQL** que contienen `;` internos
3. **Rompía triggers** que contienen `;` internos
4. **Rompía bloques `DO $$`** con múltiples statements

**Ejemplo de problema**:

```sql
CREATE OR REPLACE FUNCTION validate_personal_corpus_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- Este ; interno rompía el parser
  IF NEW.assignment_type = 'personal' THEN
    ...
  END IF;  -- <- Este ; causaba división incorrecta
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## SOLUCIÓN APLICADA

### Nuevo Parser Inteligente de SQL

Implementado en `prisma/seed.ts` con las siguientes características:

1. **Detecta funciones PL/pgSQL**: `CREATE FUNCTION`, `CREATE OR REPLACE FUNCTION`
2. **Detecta triggers**: `CREATE TRIGGER`, `CREATE OR REPLACE TRIGGER`
3. **Detecta bloques DO**: `DO $$`
4. **Cuenta delimitadores `$$`**: Espera a tener 2 `$$` (inicio y fin) antes de dividir
5. **Divide correctamente**: Solo divide en `;` cuando NO está dentro de función/trigger/bloque

### Código del Parser

```typescript
function parseSQL(sql: string): string[] {
  const statements: string[] = [];
  let currentStatement = '';
  let inFunction = false;
  let inDoBlock = false;
  let dollarQuoteCount = 0;

  const lines = sql.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Ignorar comentarios
    if (trimmedLine.startsWith('--') || trimmedLine.length === 0) {
      continue;
    }

    // Detectar inicio de función o trigger
    if (
      trimmedLine.includes('CREATE OR REPLACE FUNCTION') ||
      trimmedLine.includes('CREATE FUNCTION') ||
      trimmedLine.includes('CREATE TRIGGER') ||
      trimmedLine.includes('CREATE OR REPLACE TRIGGER')
    ) {
      inFunction = true;
    }

    // Detectar bloques DO $$
    if (trimmedLine.includes('DO $$')) {
      inDoBlock = true;
    }

    // Contar delimitadores $$
    const dollarMatches = line.match(/\$\$/g);
    if (dollarMatches) {
      dollarQuoteCount += dollarMatches.length;
    }

    currentStatement += line + '\n';

    // Si estamos en función/trigger, esperar hasta el final
    if (inFunction || inDoBlock) {
      if (dollarQuoteCount >= 2 && (trimmedLine.endsWith(';') || trimmedLine === '$$;')) {
        statements.push(currentStatement.trim());
        currentStatement = '';
        inFunction = false;
        inDoBlock = false;
        dollarQuoteCount = 0;
      }
    } else if (trimmedLine.endsWith(';')) {
      // Statement normal, termina con ;
      statements.push(currentStatement.trim());
      currentStatement = '';
    }
  }

  return statements;
}
```

### Manejo de Errores Mejorado

```typescript
async function executeStatements(statements: string[], fileDescription: string): Promise<void> {
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    try {
      await prisma.$executeRawUnsafe(statements[i]);
      successCount++;
    } catch (error: any) {
      // Ignorar errores esperados (objetos ya existen)
      if (
        error.message?.includes('already exists') ||
        error.code === '42710' || // duplicate_object
        error.code === '23505'    // unique_violation
      ) {
        skipCount++;
      } else {
        errorCount++;
        // Mostrar error detallado pero NO detener ejecución
        console.error(`Statement ${i + 1} failed: ${error.code} - ${error.message}`);
      }
    }
  }

  console.log(`${fileDescription}: ${successCount} success, ${skipCount} skipped, ${errorCount} errors`);
}
```

---

## SCRIPTS ADICIONALES CREADOS

### 1. `scripts/apply-seed-data.ts`

Script alternativo que usa `psql` directamente (método más robusto):

```bash
npm run db:apply-seed
```

**Ventajas**:
- Ejecuta archivos SQL completos sin parsear
- PostgreSQL maneja correctamente funciones, triggers, bloques
- Método más confiable para scripts complejos

**Desventajas**:
- Requiere tener `psql` instalado en el sistema
- No funciona si `psql` no está en PATH

### 2. `scripts/verify-seed-data.ts`

Script de verificación detallada:

```bash
npm run db:verify-seed
```

**Verifica**:
- Cantidad de agents (esperado: 3)
- Cantidad de agent_models (esperado: 9)
- RLS policies aplicadas
- Triggers creados
- Detalles de cada agente y modelo

---

## ARCHIVOS MODIFICADOS

### 1. `prisma/seed.ts`

**Cambio**: Parser SQL inteligente que NO rompe funciones PL/pgSQL

**Rutas**:
- `/prisma/seed.ts`

### 2. `package.json`

**Nuevos scripts**:

```json
{
  "scripts": {
    "db:seed": "dotenv -e .env.local -- tsx prisma/seed.ts",
    "db:apply-seed": "dotenv -e .env.local -- tsx scripts/apply-seed-data.ts",
    "db:verify-seed": "dotenv -e .env.local -- tsx scripts/verify-seed-data.ts"
  }
}
```

### 3. Nuevos archivos creados

- `scripts/apply-seed-data.ts` - Método alternativo usando `psql`
- `scripts/verify-seed-data.ts` - Verificación detallada de seed data

---

## INSTRUCCIONES DE USO

### Opción 1: Usar Prisma (Recomendado para desarrollo)

```bash
npm run db:seed
```

**Pros**:
- No requiere `psql` instalado
- Funciona en cualquier entorno
- Parser inteligente incluido

**Cons**:
- Más complejo que usar `psql` directamente

### Opción 2: Usar psql (Recomendado para producción)

```bash
npm run db:apply-seed
```

**Pros**:
- Método más robusto
- PostgreSQL maneja todo correctamente

**Cons**:
- Requiere `psql` instalado

### Verificación

```bash
npm run db:verify-seed
```

**Output esperado**:

```
✅ Agents: 3/3 (OK)
✅ Agent Models: 9/9 (OK)
✅ RLS Policies: 20+ (OK)
✅ Triggers: 5+ (OK)
```

---

## PRÓXIMOS PASOS

### 1. Ejecutar Seed Data

```bash
npm run db:seed
```

### 2. Verificar Datos

```bash
npm run db:verify-seed
```

### 3. Si falla, usar método alternativo

```bash
npm run db:apply-seed
```

### 4. Continuar con Fase 4

Una vez verificado que los datos están insertados correctamente:

- **Validación 1 COMPLETA** ✅ (database-developer)
- **Continuar con backend-developer** (Route Handlers y Server Actions)

---

## VALIDACIÓN ITERATIVA 1 (Database)

### Status: PENDIENTE DE RE-EJECUCIÓN

**Criterios de validación**:

1. ✅ Migrations ejecutan correctamente
2. ⚠️ RLS policies están activas (PENDIENTE verificar)
3. ⚠️ Seeds generan datos válidos (PENDIENTE re-ejecutar)
4. ✅ Prisma Client types generados correctamente

**Acción requerida**:

```bash
npm run db:seed          # Re-ejecutar seed con parser corregido
npm run db:verify-seed   # Verificar datos insertados
```

**GO/NO-GO 1: DB Funcional**

- Criterio: code-quality-validator confirma DB funcional
- Status actual: NO-GO (datos no insertados)
- Próximo paso: Re-ejecutar seed con parser corregido

---

## RESUMEN EJECUTIVO

### Problema

Script de seed reportaba éxito pero NO insertaba datos (0 agents, 0 agent_models).

### Causa

Parser SQL simplista rompía funciones PL/pgSQL al dividir por `;` sin contexto.

### Solución

1. **Parser inteligente** en `prisma/seed.ts` que detecta funciones/triggers/bloques
2. **Script alternativo** con `psql` para máxima robustez
3. **Script de verificación** detallada

### Archivos Afectados

- ✅ `prisma/seed.ts` - CORREGIDO
- ✅ `scripts/apply-seed-data.ts` - NUEVO
- ✅ `scripts/verify-seed-data.ts` - NUEVO
- ✅ `package.json` - ACTUALIZADO con nuevos scripts

### Próximo Paso

**Re-ejecutar seed data**:

```bash
npm run db:seed
npm run db:verify-seed
```

Una vez verificado → **Continuar con backend-developer** (Fase 4, FASE 2).

---

**Reporte completado por**: fase-4-desarrollo-leader
**Fecha**: 2025-11-24
**Status**: CORRECCIÓN APLICADA - PENDIENTE RE-EJECUCIÓN
