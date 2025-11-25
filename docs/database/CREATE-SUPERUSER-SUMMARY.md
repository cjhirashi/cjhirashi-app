# Resumen de Implementación: Create Superuser Script

## Archivos Creados

### 1. Script Principal
**Ubicación:** `scripts/create-superuser.ts`

**Características:**
- ✅ Modo interactivo (solicita email y password en consola)
- ✅ Modo parámetros (--email y --password)
- ✅ Validación de email y password
- ✅ Verifica que usuario existe en Supabase Auth
- ✅ Crea/actualiza rol 'admin' en `user_roles`
- ✅ Crea/actualiza perfil en `user_profiles`
- ✅ Mensajes de error claros y útiles
- ✅ Soporte para --help
- ✅ Integración con dotenv para .env.local

**Dependencias:**
- `@prisma/client` (ya incluido)
- `dotenv` (ya incluido)
- `readline` (nativa de Node.js)
- `crypto` (nativa de Node.js)

### 2. Comando NPM
**Ubicación:** `package.json` línea 21

```json
"db:create-superuser": "dotenv -e .env.local -- tsx scripts/create-superuser.ts"
```

### 3. Documentación

**Documentación Completa:**
- Ubicación: `docs/database/CREATE-SUPERUSER-README.md`
- Contenido:
  - Descripción detallada
  - Requisitos y instalación
  - Modos de uso (interactivo y parámetros)
  - Cómo crear usuario en Supabase Auth
  - Flujo completo
  - Solución de errores comunes
  - Estructura de base de datos
  - Recomendaciones de seguridad
  - Troubleshooting
  - Extensiones del script

**Guía Rápida:**
- Ubicación: `docs/database/SUPERUSER-QUICK-START.md`
- Contenido:
  - Pasos 1-3 para crear admin
  - Script automatizado
  - Tabla de referencia rápida
  - Solución de problemas común

## Cómo Usar

### Instalación Requerida (Primera Vez)

```bash
# Instalar dependencias (si no está hecho)
npm install
```

### Uso Interactivo (Recomendado para Desarrollo)

```bash
npm run db:create-superuser
```

Salida esperada:
```
════════════════════════════════════════════════════════════════════
CREATE SUPERUSER - CJHIRASHI APP v0.1
════════════════════════════════════════════════════════════════════

Interactive mode. Press Ctrl+C to cancel.

📧 Enter admin email: admin@company.com
🔐 Enter admin password (min 8 characters): MySecurePassword123
📋 Create admin user with email "admin@company.com"? (yes/no): yes

📋 Checking if user exists in database...
  ℹ️  User already exists in database
     User ID: 12345678-1234-1234-1234-123456789012
     Email: admin@company.com

🔑 Setting admin role...
  ✅ Admin role assigned successfully
     Role: admin
     Assigned at: 2025-01-16T14:30:00.000Z

👤 Updating user profile...
  ✅ User profile updated

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

### Uso con Parámetros (Para Automatización)

```bash
npm run db:create-superuser -- --email admin@company.com --password MySecurePass123
```

### Ver Ayuda

```bash
npm run db:create-superuser -- --help
```

## Requisitos Previos

### Variables de Entorno (`.env.local`)

**Requerido:**
```env
DATABASE_URL="postgresql://user:password@host:5432/database"
```

**Opcional pero recomendado:**
```env
NEXT_PUBLIC_SUPABASE_URL="https://project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

### Usuario en Supabase Auth

El script requiere que el usuario YA EXISTA en Supabase Auth. Para crear:

**Opción 1: Dashboard**
1. https://supabase.com/dashboard
2. Authentication → Users → Add user
3. Ingresa email y password

**Opción 2: CLI**
```bash
npx supabase auth users create --email admin@company.com --password MySecurePass123 --email-confirm
```

## Validaciones Implementadas

### Email
- ✅ Formato válido (contiene @)
- ✅ Requerido

### Password
- ✅ Mínimo 8 caracteres
- ✅ Requerido

### Usuario
- ✅ Debe existir en auth.users (Supabase Auth)
- ✅ Si no existe, muestra error claro con instrucciones

### Rol
- ✅ Se asigna automáticamente como 'admin'
- ✅ Si ya existe, se actualiza (upsert)

## Estructura de Base de Datos Afectada

El script modifica/interactúa con:

### Tabla: `auth.users`
- Solo LECTURA
- Verifica que el usuario existe

### Tabla: `public.user_roles`
- LECTURA/ESCRITURA
- Crea o actualiza el rol a 'admin'

### Tabla: `public.user_profiles`
- LECTURA/ESCRITURA
- Crea o actualiza el perfil del usuario

## Flujo del Script

```
1. Parse argumentos de línea de comandos
   └─ Si --help → mostrar ayuda y salir

2. Si no hay argumentos → Modo interactivo
   ├─ Crear readline interface
   ├─ Solicitar email (validar)
   ├─ Solicitar password (validar)
   ├─ Solicitar confirmación
   └─ Cerrar readline

3. Validar email y password
   ├─ Si inválido → Mostrar error y salir
   └─ Si válido → Continuar

4. Verificar que usuario existe en auth.users
   ├─ Si no existe → Mostrar error con instrucciones
   └─ Si existe → Continuar

5. Asignar/actualizar rol en user_roles
   ├─ Usar upsert para create or update
   └─ Mostrar confirmación

6. Crear/actualizar perfil en user_profiles
   ├─ Usar upsert para create or update
   └─ Mostrar confirmación

7. Mostrar resumen final
   └─ Información de login
```

## Manejo de Errores

El script incluye manejo para:

| Error | Mensaje | Solución |
|-------|---------|----------|
| No DATABASE_URL | "Database connection failed" | Verifica .env.local |
| Usuario no existe | "User does not exist in Supabase Auth" | Crea usuario en Supabase Auth primero |
| Email inválido | "Invalid email format" | Usa email válido (ej: user@example.com) |
| Password corto | "Password must be at least 8 characters" | Usa password con ≥8 caracteres |
| Prisma error | Error específico de Prisma | Verifica logs y base de datos |

## Extensibilidad

El script está diseñado para ser extensible:

```typescript
// Importar la función en otro script
import { createSuperuser } from './create-superuser';

// Usar la función programáticamente
await createSuperuser({
  email: 'admin@example.com',
  password: 'password123'
});
```

## Testing

Para probar el script sin crear realmente un usuario:

```bash
# Ver ayuda (no hace cambios)
npm run db:create-superuser -- --help

# Modo interactivo - cancelar con Ctrl+C
npm run db:create-superuser
# Presionar Ctrl+C antes de confirmar
```

## Seguridad

### Recomendaciones Implementadas

✅ **Validación de entrada:**
- Email debe ser válido
- Password mínimo 8 caracteres

✅ **Confirmación en modo interactivo:**
- Se pide confirmación antes de crear

✅ **Mensajes de error claros:**
- No exponen detalles de la DB
- Muestran instrucciones útiles

### Recomendaciones para Producción

⚠️ **Password fuerte:**
- Mínimo 12 caracteres (en lugar de 8)
- Incluir mayúsculas, minúsculas, números, símbolos
- Ejemplo: `M1K3#$uP3r@dM1nP@ssw0rd!`

⚠️ **Auditoría:**
- El script debería registrar en audit_logs
- Implementar después si es necesario

⚠️ **Restricciones de acceso:**
- Limitar quién puede ejecutar el script
- Considerar 2FA para admin

## Verificación Post-Creación

Después de crear el superusuario:

```bash
# Verificar visualmente
npm run db:studio
# Buscar en tabla public.user_roles con role='admin'

# O consultar directamente (si tienes psql)
psql "$DATABASE_URL" -c "
  SELECT u.id, u.email, ur.role, up.status
  FROM auth.users u
  LEFT JOIN public.user_roles ur ON u.id = ur.user_id
  LEFT JOIN public.user_profiles up ON u.id = up.user_id
  WHERE ur.role = 'admin'
  LIMIT 10;
"
```

## Integración con CI/CD

Para usar en pipelines de CI/CD:

```bash
# GitHub Actions example
- name: Create superuser
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
  run: |
    npm run db:create-superuser -- \
      --email ${{ secrets.ADMIN_EMAIL }} \
      --password ${{ secrets.ADMIN_PASSWORD }}
```

## Próximas Mejoras Posibles

- [ ] Integración con Supabase Admin API (crear usuario directamente)
- [ ] Registro automático en audit_logs
- [ ] Generación de password seguro (si no se proporciona)
- [ ] Actualización de metadata de usuario
- [ ] Importación de múltiples admins desde CSV
- [ ] Configuración de 2FA automática

## Soporte

Para problemas:

1. Verifica la documentación completa: `docs/database/CREATE-SUPERUSER-README.md`
2. Verifica la guía rápida: `docs/database/SUPERUSER-QUICK-START.md`
3. Usa `npm run db:create-superuser -- --help` para ayuda del script
4. Verifica los logs: `npm run db:studio` para ver estado actual de DB

## Resumen de Cambios

| Tipo | Archivo | Cambio |
|------|---------|--------|
| Script | `scripts/create-superuser.ts` | Nuevo archivo |
| Config | `package.json` | Agregado comando `db:create-superuser` |
| Docs | `docs/database/CREATE-SUPERUSER-README.md` | Nuevo archivo |
| Docs | `docs/database/SUPERUSER-QUICK-START.md` | Nuevo archivo |
| Docs | `docs/database/CREATE-SUPERUSER-SUMMARY.md` | Este archivo |

## Total de Líneas de Código

- **Script principal**: ~370 líneas
- **Documentación**: ~600 líneas
- **Total**: ~970 líneas de código + documentación

## Fecha de Creación

2025-01-16 (v0.1)
