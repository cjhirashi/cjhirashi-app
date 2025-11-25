// ============================================
// PRISMA SEED SCRIPT - CJHIRASHI APP v0.1
// ============================================
// Este script aplica RLS policies y seed data
// Ejecución: npm run db:seed (definido en package.json)
// ============================================

import { PrismaClient } from '@/lib/generated/prisma';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Función para parsear SQL y dividir en statements inteligentemente
// NO romper funciones PL/pgSQL, triggers, etc.
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

    // Contar delimitadores $$ (inicio y fin de funciones)
    const dollarMatches = line.match(/\$\$/g);
    if (dollarMatches) {
      dollarQuoteCount += dollarMatches.length;
    }

    currentStatement += line + '\n';

    // Si estamos en función/trigger, esperar hasta el final
    if (inFunction || inDoBlock) {
      // Las funciones PL/pgSQL terminan con $$ seguido de ;
      // O terminan con END $$ seguido de ;
      if (dollarQuoteCount >= 2 && (trimmedLine.endsWith(';') || trimmedLine === '$$;')) {
        statements.push(currentStatement.trim());
        currentStatement = '';
        inFunction = false;
        inDoBlock = false;
        dollarQuoteCount = 0;
      }
    } else if (trimmedLine.endsWith(';')) {
      // Statement normal (no función), termina con ;
      statements.push(currentStatement.trim());
      currentStatement = '';
    }
  }

  // Agregar último statement si existe
  if (currentStatement.trim().length > 0) {
    statements.push(currentStatement.trim());
  }

  return statements;
}

// Función auxiliar para ejecutar statements SQL
async function executeStatements(statements: string[], fileDescription: string): Promise<void> {
  console.log(`  📄 Executing ${fileDescription}... (${statements.length} statements)`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];

    // Ignorar statements vacíos o comentarios
    if (statement.length === 0 || statement.startsWith('--')) {
      skipCount++;
      continue;
    }

    try {
      await prisma.$executeRawUnsafe(statement);
      successCount++;
    } catch (error: any) {
      // Ignorar errores esperados
      if (
        error.message?.includes('already exists') ||
        error.message?.includes('duplicate key') ||
        error.code === '42710' || // duplicate_object
        error.code === '23505' || // unique_violation
        error.code === '42P07'    // duplicate_table
      ) {
        skipCount++;
        console.warn(`  ⚠️  Statement ${i + 1}: Already exists (skipped)`);
      } else {
        errorCount++;
        console.error(`  ❌ Statement ${i + 1} failed:`);
        console.error(`     Error code: ${error.code}`);
        console.error(`     Error message: ${error.message?.substring(0, 200)}`);
        console.error(`     Statement preview: ${statement.substring(0, 100)}...`);

        // NO lanzar error, continuar con siguientes statements
      }
    }
  }

  console.log(`  ✅ ${fileDescription}: ${successCount} success, ${skipCount} skipped, ${errorCount} errors`);

  if (errorCount > 0) {
    console.warn(`  ⚠️  Some statements failed. Check logs above.`);
  }
}

async function main() {
  console.log('🌱 Starting seed process...\n');

  try {
    // ============================================
    // PASO 1: Aplicar RLS Policies
    // ============================================
    console.log('📋 Step 1/2: Applying RLS policies...');

    const rlsPoliciesPath = path.join(process.cwd(), 'supabase', 'rls-policies-v0.1.sql');

    if (!fs.existsSync(rlsPoliciesPath)) {
      console.warn(`  ⚠️  RLS policies file not found at: ${rlsPoliciesPath}`);
      console.warn(`  Skipping RLS policies...`);
    } else {
      const rlsPoliciesSQL = fs.readFileSync(rlsPoliciesPath, 'utf-8');
      const rlsStatements = parseSQL(rlsPoliciesSQL);
      await executeStatements(rlsStatements, 'RLS policies');
    }

    console.log('✅ RLS policies step completed\n');

    // ============================================
    // PASO 2: Insertar Seed Data
    // ============================================
    console.log('📋 Step 2/2: Inserting seed data...');

    const seedDataPath = path.join(process.cwd(), 'supabase', 'seed-data-v0.1.sql');

    if (!fs.existsSync(seedDataPath)) {
      console.warn(`  ⚠️  Seed data file not found at: ${seedDataPath}`);
      console.warn(`  Skipping seed data...`);
    } else {
      const seedDataSQL = fs.readFileSync(seedDataPath, 'utf-8');
      const seedStatements = parseSQL(seedDataSQL);
      await executeStatements(seedStatements, 'Seed data');
    }

    console.log('✅ Seed data step completed\n');

    // ============================================
    // VERIFICACIÓN: Contar registros insertados
    // ============================================
    console.log('🔍 Verifying seed data...');

    const agentsCount = await prisma.agents.count();
    const agentModelsCount = await prisma.agent_models.count();

    console.log(`  ✓ Agents: ${agentsCount} records`);
    console.log(`  ✓ Agent Models: ${agentModelsCount} records`);

    if (agentsCount === 0) {
      console.warn(`  ⚠️  No agents found - seed data may not have been inserted`);
      console.warn(`  Run: npm run db:verify-seed for detailed diagnostics`);
    } else if (agentsCount !== 3) {
      console.warn(`  ⚠️  Expected 3 agents, found ${agentsCount}`);
    }

    if (agentModelsCount === 0) {
      console.warn(`  ⚠️  No agent models found - seed data may not have been inserted`);
      console.warn(`  Run: npm run db:verify-seed for detailed diagnostics`);
    } else if (agentModelsCount !== 9) {
      console.warn(`  ⚠️  Expected 9 agent models (3 tiers × 3 agents), found ${agentModelsCount}`);
    }

    if (agentsCount > 0 && agentModelsCount > 0) {
      console.log('\n✨ Seed process completed successfully!\n');
      console.log('Run `npm run db:verify-seed` for detailed verification.\n');
    } else {
      console.warn('\n⚠️  Seed process completed with warnings - check logs above\n');
      console.warn('Run `npm run db:verify-seed` for detailed diagnostics.\n');
    }

  } catch (error) {
    console.error('\n❌ Error during seed process:');
    console.error(error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
