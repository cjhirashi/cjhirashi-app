# E2E Tests con Playwright

## Estructura de Tests

### 1. Authentication Flow (`auth-flow.spec.ts`)
- **4 tests** cubriendo flujo completo de autenticación
- Login → Dashboard → Logout
- Validación de credenciales inválidas
- Navegación a sign-up
- Navegación a forgot-password

### 2. Admin - Agents Management (`admin-agents.spec.ts`)
- **7 tests** cubriendo CRUD de agents
- Listar agents
- Crear nuevo agent
- Editar agent existente
- Eliminar agent
- Filtrar agents por status
- Buscar agents por nombre
- Ver detalles de agent

### 3. Admin - Users Management (`admin-users.spec.ts`)
- **8 tests** cubriendo gestión de usuarios
- Listar usuarios
- Actualizar rol de usuario
- Desactivar usuario
- Reactivar usuario
- Filtrar usuarios por rol
- Buscar usuarios por email
- Ver detalles de usuario
- Prevenir cambio de rol propio

### 4. Dashboard - Projects Management (`dashboard-projects.spec.ts`)
- **8 tests** cubriendo gestión de proyectos
- Visualizar dashboard de proyectos
- Crear nuevo proyecto
- Ver detalles de proyecto
- Editar proyecto
- Eliminar proyecto
- Filtrar proyectos por tipo
- Buscar proyectos
- Estado vacío (sin proyectos)

### 5. Dashboard - Agents View (`dashboard-agents.spec.ts`)
- **11 tests** cubriendo visualización de agents
- Listar agents
- Ver detalles de agent
- Filtrar por tipo
- Filtrar por status
- Buscar agents
- Estadísticas de agents
- Visualización de jerarquía
- Información de modelos
- Herramientas de agents
- Ordenar por nombre
- Responsabilidades de agents

## Total: 38 Tests E2E

## Comandos Disponibles

```bash
# Ejecutar todos los tests E2E (headless)
npm run test:e2e

# Ejecutar tests con UI de Playwright
npm run test:e2e:ui

# Ejecutar tests con navegador visible
npm run test:e2e:headed
```

## Requisitos

- Servidor de desarrollo ejecutándose en `http://localhost:3000`
- Playwright instalado: `@playwright/test`
- Chromium instalado: `npx playwright install chromium`

## Configuración

Ver `playwright.config.ts` para configuración completa:
- baseURL: `http://localhost:3000`
- testDir: `./tests/e2e`
- Browser: Chromium (Desktop Chrome)
- Screenshots: Solo en fallos
- Traces: Solo en primer retry

## Notas Importantes

1. **Datos de Prueba**: Los tests asumen existencia de usuarios de prueba:
   - `admin@example.com` / `adminpassword`
   - `user@example.com` / `userpassword`

2. **Estado de DB**: Algunos tests pueden modificar datos. Considerar usar DB de testing separada.

3. **Server Automático**: Playwright inicia automáticamente el servidor de desarrollo (`npm run dev`) si no está corriendo.

4. **Test Isolation**: Cada test debe ser independiente y no depender del resultado de otros tests.

## Áreas Cubiertas

- ✅ Autenticación completa
- ✅ CRUD de Agents (Admin)
- ✅ Gestión de Usuarios (Admin)
- ✅ Gestión de Proyectos (Dashboard)
- ✅ Visualización de Agents (Dashboard)
- ✅ Navegación entre páginas
- ✅ Filtros y búsquedas
- ✅ Validaciones de formularios
- ✅ Estados vacíos
- ✅ Permisos y roles
