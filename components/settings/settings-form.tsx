'use client'

/**
 * Settings Form Component
 *
 * Form for editing settings in a specific category
 */

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SettingInput } from './setting-input'
import { validateMultipleSettings, allValid, getValidationErrors } from '@/lib/validation/settings-validation'
import { getCategoryLabel } from '@/lib/constants/settings-categories'
import type { SystemSetting } from '@/lib/types/settings'

interface SettingsFormProps {
  category: string
  settings: SystemSetting[]
  onSave: (updates: Array<{ key: string; value: string }>) => Promise<void>
  onCancel?: () => void
  disabled?: boolean
}

export function SettingsForm({
  category,
  settings,
  onSave,
  onCancel,
  disabled = false,
}: SettingsFormProps) {
  const [formValues, setFormValues] = useState<Record<string, string | number | boolean>>(() => {
    const initial: Record<string, string | number | boolean> = {}
    for (const setting of settings) {
      initial[setting.key] = setting.value
    }
    return initial
  })

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const handleValueChange = useCallback(
    (key: string, value: string | number | boolean) => {
      setFormValues((prev) => {
        const updated = { ...prev, [key]: value }
        const hasAnyChanges = Object.entries(updated).some(([settingKey, settingValue]) => {
          const original = settings.find((s) => s.key === settingKey)
          return original && original.value !== String(settingValue)
        })
        setHasChanges(hasAnyChanges)
        return updated
      })
    },
    [settings],
  )

  const handleSave = useCallback(async () => {
    // Validate all settings
    const validations = validateMultipleSettings(
      settings.map((s) => ({
        key: s.key,
        value: formValues[s.key] ?? s.value,
        dataType: s.data_type,
        validationRules: s.validation_rules,
      })),
    )

    if (!allValid(validations)) {
      setValidationErrors(getValidationErrors(validations))
      return
    }

    setValidationErrors({})
    setIsSaving(true)

    try {
      const updates = settings
        .filter((setting) => formValues[setting.key] !== setting.value)
        .map((setting) => ({
          key: setting.key,
          value: String(formValues[setting.key] ?? setting.value),
        }))

      if (updates.length > 0) {
        await onSave(updates)
        setHasChanges(false)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al guardar'
      setValidationErrors({ _form: errorMessage })
    } finally {
      setIsSaving(false)
    }
  }, [settings, formValues, onSave])

  const handleCancel = useCallback(() => {
    // Reset form values
    const initial: Record<string, string | number | boolean> = {}
    for (const setting of settings) {
      initial[setting.key] = setting.value
    }
    setFormValues(initial)
    setValidationErrors({})
    setHasChanges(false)
    onCancel?.()
  }, [settings, onCancel])

  if (settings.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">No hay configuraciones disponibles en esta categoría.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{getCategoryLabel(category)}</CardTitle>
        <CardDescription>
          Modifica la configuración según sea necesario. Los cambios se guardarán en la base de datos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {validationErrors._form && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
            {validationErrors._form}
          </div>
        )}

        <div className="space-y-6">
          {settings.map((setting) => (
            <div key={setting.key} className="space-y-2">
              <SettingInput
                setting={setting}
                value={formValues[setting.key] ?? setting.value}
                onChange={(value) => handleValueChange(setting.key, value)}
                disabled={disabled || isSaving}
                showLabel
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 border-t pt-6">
          {onCancel && (
            <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
              Cancelar
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving || disabled}
            className={hasChanges ? '' : 'opacity-50 cursor-not-allowed'}
          >
            {isSaving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
