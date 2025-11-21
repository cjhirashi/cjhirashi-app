/**
 * Seed Script for System Settings
 *
 * Initializes the system_settings table with default configuration values.
 * Run with: pnpm ts-node scripts/seed-settings.ts
 */

import { prisma } from '../lib/db/prisma'

const DEFAULT_SETTINGS = [
  // General Settings
  {
    key: 'site_name',
    value: 'Mi Aplicación',
    description: 'Nombre del sitio web',
    category: 'general',
    data_type: 'string',
    validation_rules: { maxLength: 100 },
    is_public: true,
  },
  {
    key: 'site_description',
    value: 'Descripción de mi aplicación',
    description: 'Descripción breve del sitio para motores de búsqueda',
    category: 'general',
    data_type: 'text',
    validation_rules: { maxLength: 500 },
    is_public: true,
  },
  {
    key: 'site_url',
    value: 'https://example.com',
    description: 'URL principal del sitio',
    category: 'general',
    data_type: 'url',
    validation_rules: null,
    is_public: true,
  },
  {
    key: 'admin_email',
    value: 'admin@example.com',
    description: 'Email del administrador para notificaciones',
    category: 'general',
    data_type: 'email',
    validation_rules: null,
    is_public: false,
  },

  // Security Settings
  {
    key: 'enable_2fa',
    value: 'false',
    description: 'Habilitar autenticación de dos factores (2FA) para los usuarios',
    category: 'security',
    data_type: 'boolean',
    validation_rules: null,
    is_public: false,
  },
  {
    key: 'session_timeout_minutes',
    value: '60',
    description: 'Tiempo de expiración de sesión en minutos',
    category: 'security',
    data_type: 'number',
    validation_rules: { min: 15, max: 1440 },
    is_public: false,
  },
  {
    key: 'max_login_attempts',
    value: '5',
    description: 'Número máximo de intentos de login fallidos antes de bloquear la cuenta',
    category: 'security',
    data_type: 'number',
    validation_rules: { min: 3, max: 10 },
    is_public: false,
  },
  {
    key: 'password_min_length',
    value: '8',
    description: 'Longitud mínima requerida para las contraseñas de usuario',
    category: 'security',
    data_type: 'number',
    validation_rules: { min: 8, max: 128 },
    is_public: false,
  },

  // Features Settings
  {
    key: 'enable_user_registration',
    value: 'true',
    description: 'Permitir que nuevos usuarios se registren en el sitio',
    category: 'features',
    data_type: 'boolean',
    validation_rules: null,
    is_public: false,
  },
  {
    key: 'enable_comments',
    value: 'true',
    description: 'Habilitar el sistema de comentarios en el contenido',
    category: 'features',
    data_type: 'boolean',
    validation_rules: null,
    is_public: false,
  },
  {
    key: 'enable_notifications',
    value: 'true',
    description: 'Habilitar notificaciones del sistema para los usuarios',
    category: 'features',
    data_type: 'boolean',
    validation_rules: null,
    is_public: false,
  },

  // Maintenance Settings
  {
    key: 'maintenance_mode',
    value: 'false',
    description: 'Activar modo mantenimiento (solo administradores pueden acceder)',
    category: 'maintenance',
    data_type: 'boolean',
    validation_rules: null,
    is_public: false,
  },
  {
    key: 'maintenance_message',
    value: 'Sitio en mantenimiento. Volveremos pronto.',
    description: 'Mensaje mostrado a los usuarios cuando el sitio está en mantenimiento',
    category: 'maintenance',
    data_type: 'text',
    validation_rules: { maxLength: 500 },
    is_public: true,
  },
]

async function seedSettings() {
  try {
    console.log('Seeding system settings...')

    let createdCount = 0
    let skippedCount = 0

    for (const setting of DEFAULT_SETTINGS) {
      const existing = await prisma.system_settings.findUnique({
        where: { key: setting.key },
      })

      if (existing) {
        console.log(`⊘ Skipped: ${setting.key} (already exists)`)
        skippedCount++
      } else {
        // Remove created_at since it has a default value in the database
        const { ...dataWithoutCreatedAt } = setting
        await prisma.system_settings.create({
          data: {
            ...dataWithoutCreatedAt,
            updated_at: new Date(),
          },
        })
        console.log(`✓ Created: ${setting.key}`)
        createdCount++
      }
    }

    console.log(`\nSeed completed!`)
    console.log(`- Created: ${createdCount} settings`)
    console.log(`- Skipped: ${skippedCount} settings`)
  } catch (error) {
    console.error('Error seeding settings:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedSettings()
