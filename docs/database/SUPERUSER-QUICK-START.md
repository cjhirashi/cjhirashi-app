# Superuser Quick Start Guide

## Crear un Admin en 3 Pasos

### Paso 1: Crear usuario en Supabase Auth

**Opción A: Dashboard de Supabase (Más Fácil)**

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a "Authentication" → "Users"
4. Haz clic en "Add user"
5. Ingresa:
   - Email: `admin@company.com`
   - Password: `MySecurePassword123`
6. Haz clic en "Create user"

**Opción B: Supabase CLI**

```bash
npx supabase auth users create \
  --email admin@company.com \
  --password MySecurePassword123 \
  --email-confirm
```

### Paso 2: Asignar rol de Admin (Script)

```bash
# Modo parámetros (no interactivo)
npm run db:create-superuser -- \
  --email admin@company.com \
  --password MySecurePassword123
```

O **modo interactivo**:

```bash
npm run db:create-superuser
# Luego ingresa: admin@company.com
# Luego ingresa: MySecurePassword123
# Confirma: yes
```

### Paso 3: Verifica que funcionó

```bash
# Opción A: Visual (Prisma Studio)
npm run db:studio
# Busca la tabla public.user_roles y verifica que aparezca con role='admin'

# Opción B: Línea de comandos (si tienes psql)
psql "$DATABASE_URL" -c "
  SELECT u.email, ur.role, up.status
  FROM auth.users u
  LEFT JOIN public.user_roles ur ON u.id = ur.user_id
  LEFT JOIN public.user_profiles up ON u.id = up.user_id
  WHERE u.email = 'admin@company.com';
"
```

## Código Completo para Automatizar

```bash
#!/bin/bash
# crear-admin.sh - Script para crear admin automáticamente

EMAIL="admin@company.com"
PASSWORD="MySecurePassword123"

echo "📧 Creando usuario en Supabase Auth..."
npx supabase auth users create \
  --email "$EMAIL" \
  --password "$PASSWORD" \
  --email-confirm

echo "🔑 Asignando rol de admin..."
npm run db:create-superuser -- \
  --email "$EMAIL" \
  --password "$PASSWORD"

echo "✅ Admin creado exitosamente!"
echo "Email: $EMAIL"
echo "Password: $PASSWORD"
```

Ejecutar:
```bash
bash crear-admin.sh
```

## Información Rápida

| Aspecto | Valor |
|--------|-------|
| **Comando** | `npm run db:create-superuser` |
| **Ubicación del Script** | `scripts/create-superuser.ts` |
| **Documentación Completa** | `docs/database/CREATE-SUPERUSER-README.md` |
| **Password Mínimo** | 8 caracteres |
| **Email** | Debe ser válido |
| **Requisitos** | Usuario debe existir en Supabase Auth primero |

## Solución de Problemas Rápida

| Problema | Solución |
|----------|----------|
| **"User does not exist in Supabase Auth"** | Crea el usuario primero en Supabase Auth (Paso 1) |
| **"Database connection failed"** | Verifica `DATABASE_URL` en `.env.local` |
| **"Invalid email format"** | Usa un email válido (ej: admin@company.com) |
| **"Password must be at least 8 characters"** | Usa un password con mínimo 8 caracteres |

## URLs Útiles

- **Supabase Dashboard**: https://supabase.com/dashboard
- **Documentación del Script**: `docs/database/CREATE-SUPERUSER-README.md`
- **Prisma Studio**: `npm run db:studio`
- **Verificar Seed Data**: `npm run db:verify-seed`

## Notas

- El script está incluido en el repositorio
- Usa dotenv para cargar variables de `.env.local`
- Automáticamente crea perfil en `user_profiles` si no existe
- Soporta modo interactivo y modo parámetros
