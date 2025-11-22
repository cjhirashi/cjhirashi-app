// ============================================
// PRISMA SEED SCRIPT - CJHIRASHI APP v0.1
// ============================================
// Este script aplica RLS policies y seed data
// Ejecución: npm run db:seed (definido en package.json)
// ============================================

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed process...\n');

  try {
    // ============================================
    // PASO 1: Aplicar RLS Policies
    // ============================================
    console.log('📋 Step 1/2: Applying RLS policies...');

    const rlsPoliciesPath = path.join(process.cwd(), 'supabase', 'rls-policies-v0.1.sql');
    const rlsPoliciesSQL = fs.readFileSync(rlsPoliciesPath, 'utf-8');

    // Ejecutar SQL directamente usando $executeRawUnsafe
    // Nota: Se usa $executeRawUnsafe porque el SQL contiene múltiples statements
    await prisma.$executeRawUnsafe(rlsPoliciesSQL);

    console.log('✅ RLS policies applied successfully\n');

    // ============================================
    // PASO 2: Insertar Seed Data
    // ============================================
    console.log('📋 Step 2/2: Inserting seed data...');

    const seedDataPath = path.join(process.cwd(), 'supabase', 'seed-data-v0.1.sql');
    const seedDataSQL = fs.readFileSync(seedDataPath, 'utf-8');

    // Ejecutar seed data
    await prisma.$executeRawUnsafe(seedDataSQL);

    console.log('✅ Seed data inserted successfully\n');

    // ============================================
    // VERIFICACIÓN: Contar registros insertados
    // ============================================
    console.log('🔍 Verifying seed data...');

    const agentsCount = await prisma.agents.count();
    const agentModelsCount = await prisma.agent_models.count();

    console.log(`  ✓ Agents: ${agentsCount} records`);
    console.log(`  ✓ Agent Models: ${agentModelsCount} records`);

    if (agentsCount !== 3) {
      console.warn(`  ⚠️  Expected 3 agents, found ${agentsCount}`);
    }

    if (agentModelsCount !== 9) {
      console.warn(`  ⚠️  Expected 9 agent models (3 tiers × 3 agents), found ${agentModelsCount}`);
    }

    console.log('\n✨ Seed process completed successfully!\n');

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
