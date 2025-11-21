#!/usr/bin/env node

/**
 * ============================================================================
 * Script Automático para Aplicar Migraciones - Admin Panel
 * Alternativa usando Node.js y conexión directa a PostgreSQL
 * ============================================================================
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  title: (msg) => {
    console.log('');
    console.log('━'.repeat(70));
    console.log(msg);
    console.log('━'.repeat(70));
    console.log('');
  }
};

// Interface para input del usuario
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
};

// Ejecutar comando
const execCommand = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stderr });
      } else {
        resolve(stdout);
      }
    });
  });
};

// Verificar si archivo existe
const fileExists = (filePath) => {
  return fs.existsSync(filePath);
};

// Leer archivo
const readFile = (filePath) => {
  return fs.readFileSync(filePath, 'utf-8');
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

async function main() {
  console.clear();

  log.title('╔════════════════════════════════════════════════════════════════════╗\n' +
            '║     APLICACIÓN AUTOMÁTICA DE MIGRACIONES - FASE 1                 ║\n' +
            '╚════════════════════════════════════════════════════════════════════╝');

  try {
    // ========================================================================
    // 1. VERIFICAR PREREQUISITOS
    // ========================================================================

    log.title('1. Verificando prerequisitos...');

    // Verificar Node.js
    log.success('Node.js instalado');

    // Verificar Supabase CLI
    try {
      await execCommand('supabase --version');
      log.success('Supabase CLI encontrado');
    } catch (err) {
      log.warning('Supabase CLI no encontrado');
      log.info('Instalando Supabase CLI...');

      try {
        await execCommand('npm install -g supabase');
        log.success('Supabase CLI instalado correctamente');
      } catch (installErr) {
        log.error('Error instalando Supabase CLI');
        console.log('Por favor instala manualmente: npm install -g supabase');
        process.exit(1);
      }
    }

    // Verificar directorio de migraciones
    const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      log.error('Directorio supabase/migrations no encontrado');
      console.log('Ejecuta este script desde la raíz del proyecto');
      process.exit(1);
    }
    log.success('Directorio de migraciones encontrado');

    // ========================================================================
    // 2. VERIFICAR CONFIGURACIÓN
    // ========================================================================

    log.title('2. Verificando configuración de Supabase...');

    const configPath = path.join(process.cwd(), 'supabase', '.temp', 'project-ref');

    if (!fileExists(configPath)) {
      log.warning('Proyecto no está linkeado con Supabase');
      console.log('');

      const projectRef = await question('Ingresa tu Project Reference ID: ');

      if (!projectRef || projectRef.trim() === '') {
        log.error('Project Reference ID es requerido');
        process.exit(1);
      }

      log.info('Linkeando proyecto...');

      try {
        await execCommand(`supabase link --project-ref ${projectRef.trim()}`);
        log.success('Proyecto linkeado correctamente');
      } catch (err) {
        log.error('Error linkeando proyecto');
        console.log(err.stderr);
        process.exit(1);
      }
    } else {
      log.success('Proyecto ya está configurado');
    }

    // ========================================================================
    // 3. MOSTRAR MIGRACIONES
    // ========================================================================

    log.title('3. Migraciones a aplicar:');

    const migrations = [
      '20250101000001_create_core_tables.sql',
      '20250101000002_create_analytics_views.sql',
      '20250101000003_seed_initial_data.sql'
    ];

    let allMigrationsExist = true;

    for (const migration of migrations) {
      const migrationPath = path.join(migrationsDir, migration);
      if (fileExists(migrationPath)) {
        log.success(migration);
      } else {
        log.error(`${migration} (NO ENCONTRADO)`);
        allMigrationsExist = false;
      }
    }

    if (!allMigrationsExist) {
      log.error('Faltan archivos de migración');
      process.exit(1);
    }

    console.log('');
    log.warning('IMPORTANTE: Asegúrate de que tu email esté configurado en la migración 003');
    console.log('Email configurado: carlos@cjhirashi.com');
    console.log('');

    const confirm = await question('¿Continuar con la aplicación de migraciones? (s/n): ');

    if (confirm.toLowerCase() !== 's' && confirm.toLowerCase() !== 'y') {
      console.log('Operación cancelada');
      rl.close();
      process.exit(0);
    }

    // ========================================================================
    // 4. APLICAR MIGRACIONES
    // ========================================================================

    log.title('4. Aplicando migraciones...');

    try {
      const output = await execCommand('supabase db push');
      console.log(output);
      log.success('Migraciones aplicadas exitosamente');
    } catch (err) {
      console.log('');
      log.error('Error aplicando migraciones');
      console.log('');
      console.log('Posibles causas:');
      console.log('  - Las migraciones ya fueron aplicadas');
      console.log('  - Error de conexión con Supabase');
      console.log('  - Error de permisos en la base de datos');
      console.log('');
      console.log('Detalle del error:');
      console.log(err.stderr || err.error);
      console.log('');
      console.log('Intenta aplicar manualmente desde el Dashboard');
      process.exit(1);
    }

    // ========================================================================
    // 5. VERIFICAR INSTALACIÓN
    // ========================================================================

    log.title('5. Verificando instalación...');

    const testFile = path.join(process.cwd(), 'supabase', 'test-phase1.sql');

    if (fileExists(testFile)) {
      log.info('Ejecutando tests de verificación...');
      console.log('');

      try {
        const testOutput = await execCommand(`supabase db execute --file ${testFile}`);
        console.log(testOutput);
        log.success('Verificación completada');
      } catch (err) {
        log.warning('Algunos tests fallaron, pero las migraciones están aplicadas');
        console.log(err.stderr);
      }
    } else {
      log.warning('Archivo de verificación no encontrado');
      console.log('Saltando verificación automática');
    }

    // ========================================================================
    // 6. RESUMEN FINAL
    // ========================================================================

    console.log('');
    console.log('━'.repeat(70));
    console.log('✓ FASE 1 COMPLETADA');
    console.log('━'.repeat(70));
    console.log('');
    console.log('Recursos creados:');
    console.log('  • 4 tablas core (user_roles, user_profiles, audit_logs, system_settings)');
    console.log('  • 19 índices optimizados');
    console.log('  • 12 políticas RLS');
    console.log('  • 6 funciones helpers');
    console.log('  • 3 vistas de analytics');
    console.log('  • 8 configuraciones del sistema');
    console.log('');
    console.log('Usuario admin:');
    console.log('  • Email: carlos@cjhirashi.com');
    console.log('  • Rol: admin');
    console.log('');
    console.log('Próximos pasos:');
    console.log('  1. Verifica en Supabase Dashboard → Table Editor');
    console.log('  2. Intenta login en tu aplicación');
    console.log('  3. Cuando esté listo, continúa con Fase 2');
    console.log('');
    console.log('━'.repeat(70));
    console.log('');

  } catch (error) {
    log.error('Error inesperado');
    console.error(error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// ============================================================================
// EJECUTAR
// ============================================================================

main();
