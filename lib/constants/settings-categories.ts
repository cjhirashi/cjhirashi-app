/**
 * Settings Categories Configuration
 *
 * Defines all available settings categories with their metadata
 */

import type { SettingCategory } from '@/lib/types/settings'

export const SETTINGS_CATEGORIES: SettingCategory[] = [
  {
    name: 'general',
    label: 'General',
    description: 'Configuraciones generales del sitio',
    icon: 'Settings',
  },
  {
    name: 'security',
    label: 'Seguridad',
    description: 'Configuraciones de seguridad y autenticación',
    icon: 'Shield',
  },
  {
    name: 'features',
    label: 'Funcionalidades',
    description: 'Habilitar o deshabilitar características',
    icon: 'Sparkles',
  },
  {
    name: 'maintenance',
    label: 'Mantenimiento',
    description: 'Configuraciones de mantenimiento del sistema',
    icon: 'Wrench',
  },
]

export function getCategoryByName(categoryName: string): SettingCategory | undefined {
  return SETTINGS_CATEGORIES.find((c) => c.name === categoryName)
}

export function getCategoryLabel(categoryName: string): string {
  const category = getCategoryByName(categoryName)
  return category?.label || categoryName
}

export function getCategoryDescription(categoryName: string): string {
  const category = getCategoryByName(categoryName)
  return category?.description || ''
}

export const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  general:
    'Estos ajustes controlan la apariencia y la información básica de tu sitio. Son visibles para los usuarios públicos.',
  security:
    'Los cambios aquí pueden afectar significativamente la seguridad y el acceso de los usuarios. Úsalos con cuidado.',
  features:
    'Habilita o deshabilita características del sistema. Los usuarios no podrán acceder a características deshabilitadas.',
  maintenance:
    'Usa el modo mantenimiento cuando necesites actualizar o hacer cambios en el sistema. Los usuarios verán el mensaje de mantenimiento.',
}
