# Create Superuser Script

## Descripción

El script `scripts/create-superuser.ts` permite crear un usuario superadministrador (admin) en el sistema de CJHirashi App v0.1.

El script:
1. Verifica si el usuario existe en Supabase Auth
2. Asigna el rol 'admin' en la tabla `user_roles`
3. Actualiza el perfil del usuario en `user_profiles`
4. Retorna información de confirmación

## Requisitos

- Base de datos PostgreSQL accesible
- Variables de entorno configuradas en `.env.local`:
  - `DATABASE_URL` - Conexión a la base de datos
  - `NEXT_PUBLIC_SUPABASE_URL` (opcional)
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (opcional)
- Usuario ya creado en Supabase Auth (ver sección "Crear Usuario en Supabase Auth")

## Instalación

El script ya está incluido en el proyecto. Solo necesitas ejecutar:

```bash
npm install
```

## Uso

### Modo Interactivo (Recomendado)

```bash
npm run db:create-superuser
```

El script te solicitará:
1. **Email**: dirección de correo válida
2. **Password**: contraseña (mínimo 8 caracteres)
3. **Confirmación**: pregunta de confirmación

Ejemplo:
```
═════════════════════════════════════════════════════════════════
CREATE SUPERUSER - CJHIRASHI APP v0.1
═════════════════════════════════════════════════════════════════

Interactive mode. Press Ctrl+C to cancel.

📧 Enter admin email: admin@company.com
🔐 Enter admin password (min 8 characters): MySecurePassword123

📋 Create admin user with email "admin@company.com"? (yes/no): yes
```

### Modo Parámetros

```bash
npm run db:create-superuser -- --email admin@company.com --password MySecurePass123
```

**Opciones:**
- `--email EMAIL` - Email del superusuario (requerido)
- `--password PASSWORD` - Password del superusuario (mínimo 8 caracteres, requerido)
- `--help, -h` - Muestra la ayuda

### Ver Ayuda

```bash
npm run db:create-superuser -- --help
```

## Crear Usuario en Supabase Auth

El script espera que el usuario ya exista en Supabase Auth. Para crear el usuario, tienes varias opciones:

### Opción 1: Dashboard de Supabase (Más Fácil)

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a "Authentication" → "Users"
4. Haz clic en "Add user"
5. Ingresa el email y contraseña
6. Haz clic en "Create user"

### Opción 2: Supabase CLI

```bash
# Crear usuario con email y password
npx supabase auth users create --email admin@company.com --password MySecurePass123
```

### Opción 3: JavaScript/TypeScript (Con Supabase Admin Key)

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_ADMIN_KEY!, // Requiere admin key
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

const { data, error } = await supabase.auth.admin.createUser({
  email: 'admin@company.com',
  password: 'MySecurePass123',
  email_confirm: true, // Confirmar email automáticamente
})

if (error) {
  console.error('Error creating user:', error)
} else {
  console.log('User created:', data.user?.id)
}
```

## Flujo Completo

Aquí está el flujo paso a paso para crear un superusuario:

```bash
# Paso 1: Crear usuario en Supabase Auth (Dashboard o CLI)
# Dashboard: https://supabase.com/dashboard → Authentication → Add user
# O vía CLI: npx supabase auth users create --email admin@company.com --password MySecurePass123

# Paso 2: Asignar rol de admin con este script
npm run db:create-superuser

# Paso 3: Verificar que el usuario se creó correctamente
npm run db:studio
# Y verificar en las tablas:
#   - auth.users (usuario existe)
#   - public.user_roles (rol = 'admin')
#   - public.user_profiles (status = 'active')
```

## Ejemplo Completo

```bash
# 1. Crear el usuario en Supabase Auth
npx supabase auth users create \
  --email admin@example.com \
  --password MySecurePassword123 \
  --email-confirm

# 2. Asignar rol de admin (modo parámetros)
npm run db:create-superuser -- \
  --email admin@example.com \
  --password MySecurePassword123

# 3. Verificar en Prisma Studio
npm run db:studio
```

## Salida Esperada

Si el script funciona correctamente, deberías ver:

```
═════════════════════════════════════════════════════════════════════════════
✨ SUPERUSER CREATED SUCCESSFULLY!

Details:
  User ID: 12345678-1234-1234-1234-123456789012
  Email: admin@company.com
  Role: admin
  Status: active
  Created: 2025-01-16T14:30:00.000Z

You can now login with:
  Email: admin@company.com
  Password: (the password you provided)
═════════════════════════════════════════════════════════════════════════════
```

## Errores Comunes

### Error: "User does not exist in Supabase Auth"

**Causa:** El usuario aún no ha sido creado en Supabase Auth

**Solución:**
1. Crea primero el usuario en Supabase Auth (ver sección "Crear Usuario en Supabase Auth")
2. Luego ejecuta el script

### Error: "Database connection failed"

**Causa:** `DATABASE_URL` no está configurado o es inválido

**Solución:**
1. Verifica que existe el archivo `.env.local`
2. Verifica que contiene `DATABASE_URL` válido
3. Verifica que la base de datos es accesible desde tu máquina

### Error: "Invalid email format"

**Causa:** El email no tiene el formato correcto

**Solución:** Usa un email válido, ej: `admin@company.com`

### Error: "Password must be at least 8 characters"

**Causa:** El password es muy corto

**Solución:** Usa un password con mínimo 8 caracteres

## Actualizar Rol Existente

Si un usuario ya existe en la base de datos pero quieres cambiar su rol a admin:

```bash
# El script automáticamente actualiza el rol si el usuario ya existe
npm run db:create-superuser -- --email existing@user.com --password password123
```

El script usará `upsert`, que actualiza el rol si ya existe, o lo crea si no existe.

## Verificación

Para verificar que el superusuario se creó correctamente:

```bash
# Opción 1: Usar Prisma Studio (interfaz visual)
npm run db:studio

# Opción 2: Consultar directamente
npx prisma db execute << 'SQL'
SELECT u.id, u.email, ur.role, up.status
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.user_profiles up ON u.id = up.user_id
WHERE u.email = 'admin@company.com';
SQL
```

## Estructura de Base de Datos

El script interactúa con estas tablas:

### `auth.users` (Supabase Auth)
```sql
CREATE TABLE auth.users (
  id UUID PRIMARY KEY,
  email VARCHAR(255),
  encrypted_password VARCHAR(255),
  email_confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  ...
);
```

### `public.user_roles` (Roles de usuario)
```sql
CREATE TABLE public.user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role DEFAULT 'user', -- admin, moderator, user
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  ...
);
```

### `public.user_profiles` (Perfil del usuario)
```sql
CREATE TABLE public.user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255),
  status user_status DEFAULT 'pending', -- active, inactive, suspended, pending
  language VARCHAR(10) DEFAULT 'es',
  timezone VARCHAR(50) DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  ...
);
```

## Variables de Entorno Requeridas

**`.env.local`** (requerido):
```env
DATABASE_URL="postgresql://user:password@host:5432/database"
```

**Opcional pero recomendado:**
```env
NEXT_PUBLIC_SUPABASE_URL="https://project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

## Seguridad

**Recomendaciones:**

1. **Password fuerte**: Usa passwords con:
   - Mínimo 12 caracteres (el script requiere 8, pero más es mejor)
   - Mayúsculas y minúsculas
   - Números
   - Caracteres especiales

2. **Ejemplo de password fuerte:**
   ```
   M1K3#$uP3r@dM1nP@ssw0rd!
   ```

3. **No compartas el script**: Aunque está en el repositorio, los parámetros (especialmente passwords) no deberían estar en el histórico de git

4. **Usa argumentos en lugar de interactivo**: Para máquinas automatizadas, pasa los parámetros al script para evitar que aparezcan en el historial de comandos

## Troubleshooting

### El script no ejecuta

```bash
# Verifica que tsx esté instalado
npm install

# Verifica el archivo script existe
ls scripts/create-superuser.ts

# Intenta ejecutar directamente
npx tsx scripts/create-superuser.ts --help
```

### Problemas de conexión a DB

```bash
# Verifica la conexión a la base de datos
npm run db:studio

# Si da error, verifica DATABASE_URL en .env.local
cat .env.local | grep DATABASE_URL
```

### El usuario no aparece después de ejecutar el script

```bash
# Verifica en Prisma Studio
npm run db:studio

# O consulta manualmente:
# 1. Ve a https://supabase.com/dashboard
# 2. Selecciona tu proyecto
# 3. Ve a "SQL Editor"
# 4. Ejecuta:
SELECT * FROM public.user_roles WHERE role = 'admin';
SELECT * FROM public.user_profiles;
```

## Notas para Desarrollo

### Archivo de Código

**Ubicación:** `scripts/create-superuser.ts`

**Dependencias:**
- `@prisma/client` - ORM para base de datos
- `dotenv` - Carga variables de entorno
- `readline` - Entrada interactiva en consola
- `crypto` - Utilidades criptográficas

### Flujo del Script

```
1. Parse argumentos (--email, --password, --help)
2. Si no hay argumentos:
   a. Crear readline interface
   b. Solicitar email (validar)
   c. Solicitar password (validar)
   d. Solicitar confirmación
3. Verificar que usuario existe en auth.users
4. Si no existe:
   a. Mostrar error
   b. Explicar cómo crear en Supabase Auth
5. Si existe:
   a. Crear/actualizar rol en user_roles
   b. Crear/actualizar perfil en user_profiles
   c. Mostrar resumen
```

### Extender el Script

Para agregar más funcionalidad:

```typescript
// Crear función exportable
export async function createSuperuser(params: CreateSuperuserParams): Promise<void> {
  // ...
}

// Luego usar en otros scripts:
import { createSuperuser } from './create-superuser';

await createSuperuser({
  email: 'admin@example.com',
  password: 'password123'
});
```

## Referencias

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Admin API](https://supabase.com/docs/reference/javascript/admin-createUser)
- [Prisma Client](https://www.prisma.io/docs/reference/prisma-client)
- [PostgreSQL RBAC](https://www.postgresql.org/docs/current/sql-createrole.html)
