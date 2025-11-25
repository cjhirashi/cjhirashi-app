# Create Superuser Script - Guía de Referencia

## Comando Rápido

```bash
# Modo interactivo (recomendado)
npm run db:create-superuser

# Modo parámetros (automatización)
npm run db:create-superuser -- --email admin@company.com --password SecurePass123
```

## Archivos Creados

| Archivo | Descripción |
|---------|-------------|
| `scripts/create-superuser.ts` | Script principal (~370 líneas) |
| `docs/database/CREATE-SUPERUSER-README.md` | Documentación completa |
| `docs/database/SUPERUSER-QUICK-START.md` | Guía rápida (3 pasos) |
| `docs/database/CREATE-SUPERUSER-SUMMARY.md` | Resumen técnico |
| `package.json` | Agregado comando `db:create-superuser` |

## Características

✅ Modo interactivo o parámetros
✅ Validación de email y password
✅ Verifica usuario en Supabase Auth
✅ Asigna rol 'admin' automáticamente
✅ Crea perfil de usuario
✅ Mensajes claros de error
✅ Documentación completa

## Requisitos Previos

1. **Usuario en Supabase Auth** (crear primero)
   ```bash
   # Dashboard: https://supabase.com/dashboard
   # O CLI:
   npx supabase auth users create --email admin@company.com --password MySecurePass123 --email-confirm
   ```

2. **Variables de entorno** (en `.env.local`)
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/database"
   ```

## Flujo Completo

```bash
# Paso 1: Crear usuario en Supabase Auth
npx supabase auth users create --email admin@company.com --password MySecurePass123 --email-confirm

# Paso 2: Asignar rol de admin
npm run db:create-superuser -- --email admin@company.com --password MySecurePass123

# Paso 3: Verificar
npm run db:studio
# O:
psql "$DATABASE_URL" -c "SELECT * FROM public.user_roles WHERE role='admin';"
```

## Validaciones

| Aspecto | Requisito |
|---------|-----------|
| Email | Debe ser válido (ej: user@example.com) |
| Password | Mínimo 8 caracteres |
| Usuario | Debe existir en Supabase Auth |
| Database | Debe estar accesible |

## Ejemplos de Uso

### Interactivo
```bash
$ npm run db:create-superuser
════════════════════════════════════════════════════════════════════
CREATE SUPERUSER - CJHIRASHI APP v0.1
════════════════════════════════════════════════════════════════════

Interactive mode. Press Ctrl+C to cancel.

📧 Enter admin email: admin@company.com
🔐 Enter admin password (min 8 characters): MySecurePassword123
📋 Create admin user with email "admin@company.com"? (yes/no): yes

...
✨ SUPERUSER CREATED SUCCESSFULLY!
```

### Con parámetros
```bash
npm run db:create-superuser -- --email admin@company.com --password MySecurePass123

✨ SUPERUSER CREATED SUCCESSFULLY!
```

### Ver ayuda
```bash
npm run db:create-superuser -- --help
```

## Solución Rápida de Problemas

| Error | Solución |
|-------|----------|
| "User does not exist in Supabase Auth" | Crea usuario en Supabase Auth primero |
| "Database connection failed" | Verifica DATABASE_URL en .env.local |
| "Invalid email format" | Usa email válido (user@example.com) |
| "Password must be at least 8 characters" | Usa password ≥8 caracteres |

## Documentación

- **Completa**: `docs/database/CREATE-SUPERUSER-README.md`
- **Rápida**: `docs/database/SUPERUSER-QUICK-START.md`
- **Técnica**: `docs/database/CREATE-SUPERUSER-SUMMARY.md`

## Notas

- El script usa `upsert`, así que si el usuario ya existe, actualiza su rol
- Los passwords deben tener mínimo 8 caracteres (mejor 12+)
- El email debe ser válido y existir en Supabase Auth
- Se crea automáticamente el perfil de usuario si no existe
