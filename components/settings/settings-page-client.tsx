'use client'

/**
 * Settings Page Client Component
 *
 * Client-side component for managing system settings
 */

import { useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import { SettingsForm } from './settings-form'
import { SettingsCategoryTabs } from './settings-category-tabs'
import { SettingsInfoCard } from './settings-info-card'
import { SETTINGS_CATEGORIES } from '@/lib/constants/settings-categories'
import type { SystemSetting, SettingsByCategory } from '@/lib/types/settings'

interface SettingsPageClientProps {
  settingsByCategory: SettingsByCategory
  canManageSettings: boolean
}

export function SettingsPageClient({
  settingsByCategory,
  canManageSettings,
}: SettingsPageClientProps) {
  const [activeCategory, setActiveCategory] = useState('general')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const currentSettings = settingsByCategory[activeCategory] || []

  const handleSave = useCallback(
    async (updates: Array<{ key: string; value: string }>) => {
      setIsLoading(true)

      try {
        const response = await fetch('/api/admin/settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ updates }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Error al guardar los cambios')
        }

        const result = await response.json()

        toast({
          title: 'Éxito',
          description: result.message || 'Configuración guardada correctamente',
          variant: 'default',
        })

        // Reload settings to reflect changes
        window.location.reload()
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    },
    [toast],
  )

  return (
    <div className="space-y-6">
      {/* Info Card for Current Category */}
      <SettingsInfoCard category={activeCategory} />

      {/* Category Tabs */}
      <SettingsCategoryTabs
        categories={SETTINGS_CATEGORIES}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {/* Settings Form for Active Category */}
      <SettingsForm
        category={activeCategory}
        settings={currentSettings}
        onSave={handleSave}
        disabled={!canManageSettings || isLoading}
      />

      {!canManageSettings && (
        <div className="rounded-md bg-yellow-50 p-4 text-sm text-yellow-800 border border-yellow-200">
          <p className="font-medium">Permisos insuficientes</p>
          <p className="mt-1">
            No tienes permisos para editar estas configuraciones. Contacta a un administrador.
          </p>
        </div>
      )}
    </div>
  )
}
