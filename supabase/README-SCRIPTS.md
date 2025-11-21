# Scripts de Migración Automática

He creado 3 scripts diferentes para aplicar las migraciones automáticamente. Elige el que más te convenga según tu entorno.

---

## 📋 Scripts Disponibles

### 1. `apply-migrations.sh` (Linux/Mac/Git Bash)

**Recomendado para:** Linux, macOS, o Windows con Git Bash

**Cómo usarlo:**

```bash
# Dar permisos de ejecución (solo primera vez)
chmod +x supabase/apply-migrations.sh

# Ejecutar
./supabase/apply-migrations.sh
```

**Características:**
- ✅ Verifica prerequisitos automáticamente
- ✅ Instala Supabase CLI si no está instalado
- ✅ Solicita Project Reference ID si no está linkeado
- ✅ Aplica todas las migraciones en orden
- ✅ Ejecuta tests de verificación
- ✅ Muestra resumen colorido

---

### 2. `apply-migrations.bat` (Windows nativo)

**Recomendado para:** Windows sin Git Bash

**Cómo usarlo:**

```cmd
# Desde CMD o PowerShell
cd C:\PROYECTOS\APPS\cjhirashi-app
supabase\apply-migrations.bat
```

O simplemente doble-click en el archivo desde el explorador de Windows.

**Características:**
- ✅ Funciona en CMD y PowerShell
- ✅ No requiere Git Bash
- ✅ Instala Supabase CLI si es necesario
- ✅ Solicita confirmación antes de aplicar
- ✅ Muestra progreso paso a paso

---

### 3. `apply-migrations.js` (Node.js multiplataforma)

**Recomendado para:** Cualquier plataforma con Node.js

**Cómo usarlo:**

```bash
# Ejecutar con Node
node supabase/apply-migrations.js

# O hacerlo ejecutable (Linux/Mac)
chmod +x supabase/apply-migrations.js
./supabase/apply-migrations.js
```

**Características:**
- ✅ Funciona en cualquier plataforma con Node.js
- ✅ Colores en terminal
- ✅ Manejo de errores detallado
- ✅ No requiere dependencias adicionales

---

## 🚀 Flujo de Ejecución

Todos los scripts siguen el mismo flujo:

```
1. Verificar prerequisitos
   └─> Node.js instalado
   └─> Supabase CLI instalado (lo instala si falta)
   └─> Directorio de migraciones existe

2. Verificar configuración
   └─> Proyecto linkeado con Supabase
   └─> Si no: solicita Project Reference ID

3. Mostrar migraciones
   └─> Lista las 3 migraciones a aplicar
   └─> Verifica que existen
   └─> Muestra email configurado (carlos@cjhirashi.com)

4. Solicitar confirmación
   └─> Usuario debe confirmar (s/n)

5. Aplicar migraciones
   └─> Ejecuta: supabase db push
   └─> Maneja errores

6. Verificar instalación
   └─> Ejecuta: supabase/test-phase1.sql
   └─> Muestra resultados

7. Resumen final
   └─> Lista recursos creados
   └─> Muestra usuario admin
   └─> Próximos pasos
```

---

## ⚙️ Prerequisitos

### Todos los scripts requieren:

1. **Node.js instalado**
   - Descarga: https://nodejs.org
   - Verifica: `node --version`

2. **Acceso a Internet**
   - Para instalar Supabase CLI si es necesario
   - Para conectarse a tu proyecto Supabase

3. **Project Reference ID** (si no está linkeado)
   - Dónde encontrarlo: Supabase Dashboard → Settings → General → Reference ID
   - Ejemplo: `abcdefghijklmnop`

### Opcional pero recomendado:

4. **Git instalado** (para apply-migrations.sh)
   - Descarga: https://git-scm.com

---

## 📝 ¿Qué Script Usar?

**¿Tienes Git Bash en Windows?**
→ Usa `apply-migrations.sh`

**¿Windows sin Git Bash?**
→ Usa `apply-migrations.bat`

**¿Prefieres Node.js puro?**
→ Usa `apply-migrations.js`

**¿Linux/Mac?**
→ Usa `apply-migrations.sh`

**¿No estás seguro?**
→ Prueba `apply-migrations.js` (funciona en todas las plataformas)

---

## 🔧 Solución de Problemas

### Error: "supabase command not found"

**Causa:** Supabase CLI no está instalado.

**Solución:**
```bash
npm install -g supabase
```

### Error: "Project not linked"

**Causa:** No has configurado el Project Reference ID.

**Solución:** El script te lo pedirá automáticamente. También puedes hacerlo manualmente:
```bash
supabase link --project-ref tu-project-ref
```

### Error: "relation already exists"

**Causa:** Las migraciones ya fueron aplicadas anteriormente.

**Solución:** Esto es normal si ya ejecutaste las migraciones antes. Las migraciones son idempotentes donde PostgreSQL lo permite.

### Error: "permission denied"

**Causa:** El script no tiene permisos de ejecución (Linux/Mac).

**Solución:**
```bash
chmod +x supabase/apply-migrations.sh
```

### Las migraciones se aplican pero la verificación falla

**Causa:** Puede ser que necesites esperar unos segundos para que RLS se propague.

**Solución:** Ejecuta manualmente la verificación:
```bash
supabase db execute --file supabase/test-phase1.sql
```

---

## 🎯 Verificación Manual (si los scripts fallan)

Si por alguna razón los scripts automáticos no funcionan, puedes aplicar las migraciones manualmente:

### Opción 1: Supabase Dashboard (100% confiable)

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Click en "SQL Editor"
4. Copia y pega cada migración una por una:
   - `supabase/migrations/20250101000001_create_core_tables.sql`
   - `supabase/migrations/20250101000002_create_analytics_views.sql`
   - `supabase/migrations/20250101000003_seed_initial_data.sql`
5. Click "Run" después de cada una

### Opción 2: Supabase CLI manual

```bash
# Linkear proyecto (solo primera vez)
supabase link --project-ref tu-project-ref

# Aplicar migraciones
supabase db push
```

---

## 📊 Qué Hace Cada Migración

### Migration 001 (create_core_tables.sql)
- Crea 4 ENUMs (tipos de datos)
- Crea 4 tablas principales
- Crea 19 índices optimizados
- Crea 6 funciones helpers
- Habilita RLS en todas las tablas
- Crea 12 políticas RLS
- Crea 6 triggers automáticos

### Migration 002 (create_analytics_views.sql)
- Crea vista materializada para dashboard stats
- Crea 2 vistas regulares para actividad
- Crea función para refrescar stats

### Migration 003 (seed_initial_data.sql)
- Inserta 8 configuraciones del sistema
- Asigna rol de admin a tu usuario (carlos@cjhirashi.com)

---

## ✅ Verificar que Todo Funcionó

Después de ejecutar cualquier script, verifica en Supabase:

1. **Dashboard → Table Editor**
   - Deberías ver: user_roles, user_profiles, audit_logs, system_settings

2. **Dashboard → SQL Editor** (ejecuta):
   ```sql
   SELECT * FROM user_roles WHERE role = 'admin';
   ```
   - Deberías ver tu usuario con rol admin

3. **Dashboard → Database → Functions**
   - Deberías ver 6 funciones: get_user_role, has_permission, etc.

---

## 🎉 ¿Todo Listo?

Si ejecutaste un script exitosamente y ves el mensaje **"✓ FASE 1 COMPLETADA"**, entonces:

✅ Base de datos configurada
✅ RLS habilitado
✅ Tu usuario es admin
✅ Listo para Fase 2

---

## 💬 ¿Necesitas Ayuda?

Si tienes problemas con los scripts:

1. Lee la sección "Solución de Problemas" arriba
2. Revisa `supabase/GUIA_VERIFICACION.md` para método manual
3. Intenta el método Dashboard (siempre funciona)

---

**Última Actualización:** 2025-11-11
**Fase Actual:** Fase 1 - Configuración de Base de Datos
