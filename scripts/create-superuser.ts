// ============================================
// CREATE SUPERUSER SCRIPT - CJHIRASHI APP v0.1
// ============================================
// Este script crea un usuario superadministrador
// usando la Admin API de Supabase
//
// Ejecución:
//   npm run db:create-superuser (interactivo)
//   npm run db:create-superuser -- --email admin@example.com --password securepass123
// ============================================

import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '../lib/generated/prisma';
import * as readline from 'readline';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

// ============================================
// VERIFICAR VARIABLES DE ENTORNO
// ============================================

function checkEnvVars(): { url: string; serviceKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    console.error('\n❌ Error: NEXT_PUBLIC_SUPABASE_URL no está configurada en .env.local');
    process.exit(1);
  }

  if (!serviceKey) {
    console.error('\n❌ Error: SUPABASE_SERVICE_ROLE_KEY no está configurada en .env.local');
    console.error('\n📋 Para obtener tu SERVICE_ROLE_KEY:');
    console.error('   1. Ve a tu dashboard de Supabase: https://supabase.cjhirashi.cloud');
    console.error('   2. Settings → API → service_role key (secret)');
    console.error('   3. Copia la key y agrégala a .env.local:');
    console.error('      SUPABASE_SERVICE_ROLE_KEY="tu-service-role-key"');
    console.error('\n⚠️  IMPORTANTE: La service_role key tiene acceso total a tu base de datos.');
    console.error('   Nunca la expongas en el frontend ni la subas a git.\n');
    process.exit(1);
  }

  return { url, serviceKey };
}

// ============================================
// UTILIDADES
// ============================================

function createReadlineInterface(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

function askQuestion(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

// ============================================
// PARSEAR ARGUMENTOS
// ============================================

interface Args {
  email?: string;
  password?: string;
  help?: boolean;
}

function parseArgs(): Args {
  const args: Args = {};
  const argv = process.argv.slice(2);

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--email' && argv[i + 1]) {
      args.email = argv[i + 1];
      i++;
    } else if (argv[i] === '--password' && argv[i + 1]) {
      args.password = argv[i + 1];
      i++;
    } else if (argv[i] === '--help' || argv[i] === '-h') {
      args.help = true;
    }
  }

  return args;
}

function showHelp(): void {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║          CREATE SUPERUSER - CJHIRASHI APP v0.1                ║
╚════════════════════════════════════════════════════════════════╝

DESCRIPCIÓN:
  Crea un usuario superadministrador (admin) en el sistema.
  El usuario se crea en Supabase Auth y se asigna el rol 'admin'.

FORMAS DE USO:

  1. Interactivo (solicita email y password por consola):
     $ npm run db:create-superuser

  2. Con parámetros:
     $ npm run db:create-superuser -- --email admin@example.com --password securePass123

OPCIONES:
  --email EMAIL          Email del superusuario
  --password PASSWORD    Password del superusuario (mínimo 8 caracteres)
  --help, -h             Muestra esta ayuda

REQUISITOS:
  - Archivo .env.local con:
    - NEXT_PUBLIC_SUPABASE_URL
    - SUPABASE_SERVICE_ROLE_KEY (obtener de Supabase Dashboard → Settings → API)

EJEMPLO:
  $ npm run db:create-superuser -- --email admin@company.com --password MySecurePass123
  `);
}

// ============================================
// CREAR SUPERUSUARIO
// ============================================

interface CreateSuperuserParams {
  email: string;
  password: string;
}

async function createSuperuser(params: CreateSuperuserParams): Promise<void> {
  const { email, password } = params;

  console.log('\n✨ Creando superusuario...\n');

  // Verificar variables de entorno
  const { url, serviceKey } = checkEnvVars();

  // Crear cliente Supabase con SERVICE_ROLE_KEY (Admin API)
  const supabaseAdmin = createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    console.log('📧 Email:', email);
    console.log('🔐 Password: ****** (length:', password.length, ')\n');

    // Paso 1: Crear usuario en Supabase Auth usando Admin API
    console.log('👤 Creando usuario en Supabase Auth...');

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirmar email automáticamente
      user_metadata: {
        role: 'admin',
        created_by: 'create-superuser-script'
      }
    });

    if (authError) {
      // Verificar si el usuario ya existe
      if (authError.message.includes('already been registered') ||
          authError.message.includes('already exists')) {
        console.log('  ℹ️  Usuario ya existe en Supabase Auth');

        // Obtener usuario existente
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();

        if (listError) throw listError;

        const existingUser = users?.find(u => u.email === email);
        if (!existingUser) {
          throw new Error('No se pudo encontrar el usuario existente');
        }

        console.log('     User ID:', existingUser.id);

        // Continuar con el usuario existente
        await assignAdminRole(existingUser.id, email);
        return;
      }

      throw authError;
    }

    if (!authData.user) {
      throw new Error('No se pudo crear el usuario');
    }

    console.log('  ✅ Usuario creado en Supabase Auth');
    console.log('     User ID:', authData.user.id);

    // Paso 2: Asignar rol de admin
    await assignAdminRole(authData.user.id, email);

  } catch (error: any) {
    console.error('\n❌ Error creando superusuario:');
    console.error('Mensaje:', error.message);

    if (error.message?.includes('service_role')) {
      console.error('\n💡 Tip: Asegúrate de tener SUPABASE_SERVICE_ROLE_KEY en .env.local');
    }

    throw error;
  }
}

async function assignAdminRole(userId: string, email: string): Promise<void> {
  console.log('\n🔑 Asignando rol de admin...');

  // Crear/actualizar rol en user_roles
  const userRole = await prisma.user_roles.upsert({
    where: { user_id: userId },
    update: {
      role: 'admin',
      assigned_at: new Date(),
      updated_at: new Date()
    },
    create: {
      user_id: userId,
      role: 'admin',
      assigned_by: userId,
      assigned_at: new Date(),
      updated_at: new Date()
    }
  });

  console.log('  ✅ Rol de admin asignado');

  // Crear/actualizar perfil de usuario
  console.log('\n👤 Actualizando perfil de usuario...');

  const userProfile = await prisma.user_profiles.upsert({
    where: { user_id: userId },
    update: {
      status: 'active',
      updated_at: new Date()
    },
    create: {
      user_id: userId,
      status: 'active',
      full_name: 'System Administrator',
      language: 'es',
      timezone: 'America/Mexico_City'
    }
  });

  console.log('  ✅ Perfil actualizado');

  // Resumen final
  console.log('\n' + '═'.repeat(60));
  console.log('✨ ¡SUPERUSUARIO CREADO EXITOSAMENTE!\n');
  console.log('Detalles:');
  console.log('  User ID: ' + userId);
  console.log('  Email: ' + email);
  console.log('  Role: ' + userRole.role);
  console.log('  Status: ' + userProfile.status);
  console.log('  Creado: ' + new Date().toISOString());
  console.log('\nAhora puedes iniciar sesión con:');
  console.log('  Email: ' + email);
  console.log('  Password: (el password que proporcionaste)');
  console.log('═'.repeat(60) + '\n');
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log('\n' + '═'.repeat(60));
  console.log('CREATE SUPERUSER - CJHIRASHI APP v0.1');
  console.log('═'.repeat(60) + '\n');

  try {
    const args = parseArgs();

    if (args.help) {
      showHelp();
      process.exit(0);
    }

    let email = args.email;
    let password = args.password;

    // Modo interactivo si faltan argumentos
    if (!email || !password) {
      const rl = createReadlineInterface();

      console.log('Modo interactivo. Presiona Ctrl+C para cancelar.\n');

      while (!email || !isValidEmail(email)) {
        if (email && !isValidEmail(email)) {
          console.log('❌ Formato de email inválido\n');
        }
        email = await askQuestion(rl, '📧 Ingresa el email del admin: ');
      }

      while (!password || !isValidPassword(password)) {
        if (password && !isValidPassword(password)) {
          console.log('❌ El password debe tener mínimo 8 caracteres\n');
        }
        password = await askQuestion(rl, '🔐 Ingresa el password (mín 8 caracteres): ');
      }

      const confirm = await askQuestion(
        rl,
        '\n📋 ¿Crear usuario admin con email "' + email + '"? (si/no): '
      );

      rl.close();

      if (confirm.toLowerCase() !== 'si' && confirm.toLowerCase() !== 'yes') {
        console.log('\n⚠️  Operación cancelada\n');
        process.exit(0);
      }
    } else {
      if (!isValidEmail(email)) {
        console.error('❌ Formato de email inválido: ' + email);
        process.exit(1);
      }

      if (!isValidPassword(password)) {
        console.error('❌ El password debe tener mínimo 8 caracteres');
        process.exit(1);
      }
    }

    await createSuperuser({ email, password });

  } catch (error: any) {
    console.error('\n❌ Error fatal:');
    console.error(error.message || error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { createSuperuser };
