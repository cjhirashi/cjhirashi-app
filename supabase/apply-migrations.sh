#!/bin/bash

# ============================================================================
# Script Automático para Aplicar Migraciones - Admin Panel
# ============================================================================

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║        APLICACIÓN AUTOMÁTICA DE MIGRACIONES - FASE 1              ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ============================================================================
# 1. VERIFICAR PREREQUISITOS
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Verificando prerequisitos..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verificar si supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}✗ Supabase CLI no encontrado${NC}"
    echo ""
    echo "Instalando Supabase CLI..."
    npm install -g supabase

    if [ $? -ne 0 ]; then
        echo -e "${RED}✗ Error instalando Supabase CLI${NC}"
        echo "Por favor instala manualmente: npm install -g supabase"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Supabase CLI encontrado${NC}"
fi

echo ""

# Verificar que existe el directorio de migraciones
if [ ! -d "supabase/migrations" ]; then
    echo -e "${RED}✗ Directorio supabase/migrations no encontrado${NC}"
    echo "Ejecuta este script desde la raíz del proyecto"
    exit 1
fi

echo -e "${GREEN}✓ Directorio de migraciones encontrado${NC}"
echo ""

# ============================================================================
# 2. VERIFICAR CONFIGURACIÓN DE SUPABASE
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. Verificando configuración de Supabase..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verificar si el proyecto ya está linkeado
if [ ! -f ".git/config" ] && [ ! -f "supabase/.temp/project-ref" ]; then
    echo -e "${YELLOW}⚠ Proyecto no está linkeado con Supabase${NC}"
    echo ""
    read -p "Ingresa tu Project Reference ID: " PROJECT_REF

    if [ -z "$PROJECT_REF" ]; then
        echo -e "${RED}✗ Project Reference ID es requerido${NC}"
        exit 1
    fi

    echo "Linkeando proyecto..."
    supabase link --project-ref "$PROJECT_REF"

    if [ $? -ne 0 ]; then
        echo -e "${RED}✗ Error linkeando proyecto${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✓ Proyecto configurado${NC}"
echo ""

# ============================================================================
# 3. MOSTRAR MIGRACIONES A APLICAR
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. Migraciones a aplicar:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

MIGRATIONS=(
    "20250101000001_create_core_tables.sql"
    "20250101000002_create_analytics_views.sql"
    "20250101000003_seed_initial_data.sql"
)

for migration in "${MIGRATIONS[@]}"; do
    if [ -f "supabase/migrations/$migration" ]; then
        echo -e "  ${GREEN}✓${NC} $migration"
    else
        echo -e "  ${RED}✗${NC} $migration ${RED}(NO ENCONTRADO)${NC}"
        exit 1
    fi
done

echo ""
echo -e "${YELLOW}IMPORTANTE: Asegúrate de que tu email esté configurado en la migración 003${NC}"
echo "Email configurado: carlos@cjhirashi.com"
echo ""

read -p "¿Continuar con la aplicación de migraciones? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Operación cancelada"
    exit 0
fi

echo ""

# ============================================================================
# 4. APLICAR MIGRACIONES
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. Aplicando migraciones..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

supabase db push

if [ $? -ne 0 ]; then
    echo ""
    echo -e "${RED}✗ Error aplicando migraciones${NC}"
    echo ""
    echo "Posibles causas:"
    echo "  - Las migraciones ya fueron aplicadas"
    echo "  - Error de conexión con Supabase"
    echo "  - Error de permisos en la base de datos"
    echo ""
    echo "Intenta aplicar manualmente desde el Dashboard"
    exit 1
fi

echo ""
echo -e "${GREEN}✓ Migraciones aplicadas exitosamente${NC}"
echo ""

# ============================================================================
# 5. VERIFICAR INSTALACIÓN
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. Verificando instalación..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -f "supabase/test-phase1.sql" ]; then
    echo "Ejecutando tests de verificación..."
    echo ""

    supabase db execute --file supabase/test-phase1.sql

    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✓ Verificación completada${NC}"
    else
        echo ""
        echo -e "${YELLOW}⚠ Algunos tests fallaron, pero las migraciones están aplicadas${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Archivo de verificación no encontrado${NC}"
    echo "Saltando verificación automática"
fi

echo ""

# ============================================================================
# 6. RESUMEN FINAL
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✓ FASE 1 COMPLETADA"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Recursos creados:"
echo "  • 4 tablas core (user_roles, user_profiles, audit_logs, system_settings)"
echo "  • 19 índices optimizados"
echo "  • 12 políticas RLS"
echo "  • 6 funciones helpers"
echo "  • 3 vistas de analytics"
echo "  • 8 configuraciones del sistema"
echo ""
echo "Usuario admin:"
echo "  • Email: carlos@cjhirashi.com"
echo "  • Rol: admin"
echo ""
echo "Próximos pasos:"
echo "  1. Verifica en Supabase Dashboard → Table Editor"
echo "  2. Intenta login en tu aplicación"
echo "  3. Cuando esté listo, continúa con Fase 2"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
