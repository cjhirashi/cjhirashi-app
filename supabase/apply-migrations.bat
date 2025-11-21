@echo off
setlocal enabledelayedexpansion

REM ============================================================================
REM Script Automático para Aplicar Migraciones - Admin Panel (Windows)
REM ============================================================================

echo ========================================================================
echo         APLICACION AUTOMATICA DE MIGRACIONES - FASE 1
echo ========================================================================
echo.

REM ============================================================================
REM 1. VERIFICAR PREREQUISITOS
REM ============================================================================

echo ------------------------------------------------------------------------
echo 1. Verificando prerequisitos...
echo ------------------------------------------------------------------------
echo.

REM Verificar si Node.js está instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no esta instalado
    echo Por favor instala Node.js desde https://nodejs.org
    exit /b 1
)
echo [OK] Node.js encontrado

REM Verificar si supabase CLI está instalado
where supabase >nul 2>nul
if %errorlevel% neq 0 (
    echo [WARNING] Supabase CLI no encontrado
    echo.
    echo Instalando Supabase CLI...
    call npm install -g supabase

    if %errorlevel% neq 0 (
        echo [ERROR] Error instalando Supabase CLI
        echo Por favor instala manualmente: npm install -g supabase
        exit /b 1
    )
) else (
    echo [OK] Supabase CLI encontrado
)

echo.

REM Verificar directorio de migraciones
if not exist "supabase\migrations" (
    echo [ERROR] Directorio supabase\migrations no encontrado
    echo Ejecuta este script desde la raiz del proyecto
    exit /b 1
)
echo [OK] Directorio de migraciones encontrado

echo.

REM ============================================================================
REM 2. VERIFICAR CONFIGURACION
REM ============================================================================

echo ------------------------------------------------------------------------
echo 2. Verificando configuracion de Supabase...
echo ------------------------------------------------------------------------
echo.

REM Verificar si el proyecto está linkeado
if not exist "supabase\.temp\project-ref" (
    echo [WARNING] Proyecto no esta linkeado con Supabase
    echo.
    set /p PROJECT_REF="Ingresa tu Project Reference ID: "

    if "!PROJECT_REF!"=="" (
        echo [ERROR] Project Reference ID es requerido
        exit /b 1
    )

    echo Linkeando proyecto...
    call supabase link --project-ref !PROJECT_REF!

    if %errorlevel% neq 0 (
        echo [ERROR] Error linkeando proyecto
        exit /b 1
    )
)

echo [OK] Proyecto configurado
echo.

REM ============================================================================
REM 3. MOSTRAR MIGRACIONES
REM ============================================================================

echo ------------------------------------------------------------------------
echo 3. Migraciones a aplicar:
echo ------------------------------------------------------------------------
echo.

set MIGRATION_001=supabase\migrations\20250101000001_create_core_tables.sql
set MIGRATION_002=supabase\migrations\20250101000002_create_analytics_views.sql
set MIGRATION_003=supabase\migrations\20250101000003_seed_initial_data.sql

if exist "%MIGRATION_001%" (
    echo   [OK] 20250101000001_create_core_tables.sql
) else (
    echo   [ERROR] 20250101000001_create_core_tables.sql ^(NO ENCONTRADO^)
    exit /b 1
)

if exist "%MIGRATION_002%" (
    echo   [OK] 20250101000002_create_analytics_views.sql
) else (
    echo   [ERROR] 20250101000002_create_analytics_views.sql ^(NO ENCONTRADO^)
    exit /b 1
)

if exist "%MIGRATION_003%" (
    echo   [OK] 20250101000003_seed_initial_data.sql
) else (
    echo   [ERROR] 20250101000003_seed_initial_data.sql ^(NO ENCONTRADO^)
    exit /b 1
)

echo.
echo IMPORTANTE: Asegurate de que tu email este configurado en la migracion 003
echo Email configurado: carlos@cjhirashi.com
echo.

set /p CONFIRM="Continuar con la aplicacion de migraciones? (s/n): "
if /i not "%CONFIRM%"=="s" (
    echo Operacion cancelada
    exit /b 0
)

echo.

REM ============================================================================
REM 4. APLICAR MIGRACIONES
REM ============================================================================

echo ------------------------------------------------------------------------
echo 4. Aplicando migraciones...
echo ------------------------------------------------------------------------
echo.

call supabase db push

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Error aplicando migraciones
    echo.
    echo Posibles causas:
    echo   - Las migraciones ya fueron aplicadas
    echo   - Error de conexion con Supabase
    echo   - Error de permisos en la base de datos
    echo.
    echo Intenta aplicar manualmente desde el Dashboard
    exit /b 1
)

echo.
echo [OK] Migraciones aplicadas exitosamente
echo.

REM ============================================================================
REM 5. VERIFICAR INSTALACION
REM ============================================================================

echo ------------------------------------------------------------------------
echo 5. Verificando instalacion...
echo ------------------------------------------------------------------------
echo.

if exist "supabase\test-phase1.sql" (
    echo Ejecutando tests de verificacion...
    echo.

    call supabase db execute --file supabase\test-phase1.sql

    if %errorlevel% equ 0 (
        echo.
        echo [OK] Verificacion completada
    ) else (
        echo.
        echo [WARNING] Algunos tests fallaron, pero las migraciones estan aplicadas
    )
) else (
    echo [WARNING] Archivo de verificacion no encontrado
    echo Saltando verificacion automatica
)

echo.

REM ============================================================================
REM 6. RESUMEN FINAL
REM ============================================================================

echo ========================================================================
echo                          FASE 1 COMPLETADA
echo ========================================================================
echo.
echo Recursos creados:
echo   - 4 tablas core
echo   - 19 indices optimizados
echo   - 12 politicas RLS
echo   - 6 funciones helpers
echo   - 3 vistas de analytics
echo   - 8 configuraciones del sistema
echo.
echo Usuario admin:
echo   - Email: carlos@cjhirashi.com
echo   - Rol: admin
echo.
echo Proximos pasos:
echo   1. Verifica en Supabase Dashboard -^> Table Editor
echo   2. Intenta login en tu aplicacion
echo   3. Cuando este listo, continua con Fase 2
echo.
echo ========================================================================

pause
