// ============================================
// APPLY SEED DATA - CJHIRASHI APP v0.1
// ============================================
// Este script ejecuta archivos SQL usando psql
// Ejecución: npm run db:apply-seed
// ============================================

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

// Obtener DATABASE_URL
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Error: DATABASE_URL not found in environment variables');
  console.error('Make sure you have a .env.local file with DATABASE_URL set');
  process.exit(1);
}

// Función para ejecutar archivos SQL usando psql
function executeSQLFile(filePath: string, fileDescription: string): void {
  console.log(`  📄 Executing ${fileDescription}...`);

  if (!fs.existsSync(filePath)) {
    console.warn(`  ⚠️  File not found: ${filePath}`);
    console.warn(`  Skipping ${fileDescription}...`);
    return;
  }

  try {
    // Ejecutar usando psql
    const command = `psql "${databaseUrl}" -f "${filePath}"`;

    execSync(command, {
      stdio: 'inherit', // Mostrar output directamente
      encoding: 'utf-8'
    });

    console.log(`  ✅ ${fileDescription} executed successfully`);
  } catch (error: any) {
    console.error(`  ❌ Error executing ${fileDescription}`);

    // Si es error de comando no encontrado
    if (error.message?.includes('command not found') || error.message?.includes('not recognized')) {
      console.error('\n');
      console.error('⚠️  psql command not found!');
      console.error('');
      console.error('SOLUCIÓN:');
      console.error('1. Instala PostgreSQL Client Tools (psql)');
      console.error('2. Windows: https://www.postgresql.org/download/windows/');
      console.error('3. macOS: brew install postgresql');
      console.error('4. Linux: sudo apt-get install postgresql-client');
      console.error('');
      console.error('Alternativamente, puedes ejecutar manualmente:');
      console.error(`  psql "${databaseUrl}" -f "${filePath}"`);
      console.error('');
    }

    throw error;
  }
}

async function main() {
  console.log('🌱 Applying seed data using psql...\n');

  try {
    // ============================================
    // PASO 1: Aplicar RLS Policies
    // ============================================
    console.log('📋 Step 1/2: Applying RLS policies...');

    const rlsPoliciesPath = path.join(process.cwd(), 'supabase', 'rls-policies-v0.1.sql');
    executeSQLFile(rlsPoliciesPath, 'RLS policies');

    console.log('✅ RLS policies applied\n');

    // ============================================
    // PASO 2: Insertar Seed Data
    // ============================================
    console.log('📋 Step 2/2: Inserting seed data...');

    const seedDataPath = path.join(process.cwd(), 'supabase', 'seed-data-v0.1.sql');
    executeSQLFile(seedDataPath, 'Seed data');

    console.log('✅ Seed data inserted\n');

    console.log('✨ Seed data applied successfully!\n');
    console.log('Run `npm run db:verify-seed` to verify the data was inserted correctly.');

  } catch (error) {
    console.error('\n❌ Error during seed process:');
    console.error(error);
    process.exit(1);
  }
}

main();
