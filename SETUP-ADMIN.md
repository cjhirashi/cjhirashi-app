# Configurar Admin en CJHirashi App

## Inicio Rápido: 3 Pasos para Crear tu Primer Admin

### Paso 1: Crea usuario en Supabase Auth

**Opción A: Dashboard (Más fácil)**
1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a "Authentication" → "Users"
4. Haz clic en "Add user"
5. Email: `admin@company.com`
6. Password: `MySecurePassword123`
7. Haz clic en "Create user"

**Opción B: Supabase CLI**
```bash
npx supabase auth users create \
  --email admin@company.com \
  --password MySecurePassword123 \
  --email-confirm
```

### Paso 2: Asigna rol de admin

```bash
npm run db:create-superuser -- \
  --email admin@company.com \
  --password MySecurePassword123
```

### Paso 3: Verifica (Optional)

```bash
npm run db:studio
# Busca en tabla: public.user_roles
# Debería haber una fila con role='admin'
```

## Uso Interactivo

No necesitas parámetros, el script te los pide:

```bash
npm run db:create-superuser
```

## Documentación Completa

- **Full Guide:** `docs/database/CREATE-SUPERUSER-README.md`
- **Quick Start:** `docs/database/SUPERUSER-QUICK-START.md`
- **Technical:** `docs/database/CREATE-SUPERUSER-SUMMARY.md`
- **Quick Ref:** `SCRIPT-USAGE.md`

## Comandos Disponibles

```bash
npm run db:create-superuser                    # Interactivo
npm run db:create-superuser -- --help          # Ver ayuda
npm run db:studio                              # Ver DB (Prisma)
npm run db:verify-seed                         # Verificar seed
```

## Requisitos

- Database accesible vía `DATABASE_URL` en `.env.local`
- Usuario debe existir en Supabase Auth primero
- Node.js 18+

## Troubleshooting

| Error | Solución |
|-------|----------|
| "User does not exist in Supabase Auth" | Crear usuario en Supabase primero |
| "Database connection failed" | Verificar DATABASE_URL en .env.local |
| "Invalid email format" | Usar email válido (ej: user@example.com) |
| "Password must be at least 8 characters" | Usar password ≥8 caracteres |

## Más Info

Ver `IMPLEMENTATION-SUMMARY.md` para detalles técnicos completos.
