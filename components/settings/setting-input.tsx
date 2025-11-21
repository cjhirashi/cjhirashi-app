'use client'

/**
 * Setting Input Component
 *
 * Dynamic input component that renders the appropriate input type
 * based on the setting's data type
 */

import { useState, useCallback, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { validateSettingValue } from '@/lib/validation/settings-validation'
import type { SystemSetting } from '@/lib/types/settings'

interface SettingInputProps {
  setting: SystemSetting
  value: string | number | boolean
  onChange: (value: string | number | boolean) => void
  disabled?: boolean
  showLabel?: boolean
}

export function SettingInput({
  setting,
  value,
  onChange,
  disabled = false,
  showLabel = true,
}: SettingInputProps) {
  const [error, setError] = useState<string>('')
  const [isFocused, setIsFocused] = useState(false)

  // Validate on value change
  useEffect(() => {
    if (!isFocused) {
      const validation = validateSettingValue(value, setting.data_type, setting.validation_rules)
      setError(validation.valid ? '' : validation.error || '')
    }
  }, [value, setting.data_type, setting.validation_rules, isFocused])

  const handleChange = useCallback(
    (newValue: string | number | boolean) => {
      onChange(newValue)
    },
    [onChange],
  )

  const handleBlur = useCallback(() => {
    setIsFocused(false)
    const validation = validateSettingValue(value, setting.data_type, setting.validation_rules)
    setError(validation.valid ? '' : validation.error || '')
  }, [value, setting.data_type, setting.validation_rules])

  const handleFocus = useCallback(() => {
    setIsFocused(true)
    setError('')
  }, [])

  const labelId = `setting-${setting.key}`

  switch (setting.data_type) {
    case 'boolean': {
      return (
        <div className="flex flex-col gap-2">
          {showLabel && (
            <div className="flex items-center justify-between">
              <Label htmlFor={labelId} className="cursor-pointer font-medium">
                {setting.key.replace(/_/g, ' ')}
              </Label>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Switch
              id={labelId}
              checked={value === true || value === 'true' || value === '1'}
              onCheckedChange={handleChange}
              disabled={disabled}
              aria-label={setting.description || setting.key}
            />
            <span className="text-sm text-muted-foreground">
              {value === true || value === 'true' || value === '1' ? 'Habilitado' : 'Deshabilitado'}
            </span>
          </div>
          {setting.description && <p className="text-sm text-muted-foreground">{setting.description}</p>}
        </div>
      )
    }

    case 'text': {
      const maxLength = (setting.validation_rules?.maxLength as number) || undefined
      return (
        <div className="flex flex-col gap-2">
          {showLabel && (
            <Label htmlFor={labelId} className="font-medium">
              {setting.key.replace(/_/g, ' ')}
            </Label>
          )}
          <Textarea
            id={labelId}
            value={String(value)}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            onFocus={handleFocus}
            disabled={disabled}
            placeholder={setting.description || ''}
            maxLength={maxLength}
            rows={4}
            className={error ? 'border-red-500' : ''}
            aria-invalid={!!error}
            aria-describedby={error ? `${labelId}-error` : undefined}
          />
          <div className="flex items-center justify-between">
            <div>
              {setting.description && <p className="text-sm text-muted-foreground">{setting.description}</p>}
            </div>
            {maxLength && (
              <span className={`text-xs ${String(value).length > maxLength * 0.9 ? 'text-orange-500' : 'text-muted-foreground'}`}>
                {String(value).length}/{maxLength}
              </span>
            )}
          </div>
          {error && (
            <p id={`${labelId}-error`} className="text-sm text-red-500">
              {error}
            </p>
          )}
        </div>
      )
    }

    case 'number': {
      const min = (setting.validation_rules?.min as number) || undefined
      const max = (setting.validation_rules?.max as number) || undefined

      return (
        <div className="flex flex-col gap-2">
          {showLabel && (
            <Label htmlFor={labelId} className="font-medium">
              {setting.key.replace(/_/g, ' ')}
            </Label>
          )}
          <Input
            id={labelId}
            type="number"
            value={String(value)}
            onChange={(e) => handleChange(e.target.value === '' ? '' : Number(e.target.value))}
            onBlur={handleBlur}
            onFocus={handleFocus}
            disabled={disabled}
            min={min}
            max={max}
            placeholder={setting.description || ''}
            className={error ? 'border-red-500' : ''}
            aria-invalid={!!error}
            aria-describedby={error ? `${labelId}-error` : undefined}
          />
          {setting.description && <p className="text-sm text-muted-foreground">{setting.description}</p>}
          {(min !== undefined || max !== undefined) && (
            <p className="text-xs text-muted-foreground">
              Rango: {min ?? '∞'} - {max ?? '∞'}
            </p>
          )}
          {error && (
            <p id={`${labelId}-error`} className="text-sm text-red-500">
              {error}
            </p>
          )}
        </div>
      )
    }

    case 'email':
    case 'url':
    case 'string':
    default: {
      const maxLength = (setting.validation_rules?.maxLength as number) || undefined

      return (
        <div className="flex flex-col gap-2">
          {showLabel && (
            <Label htmlFor={labelId} className="font-medium">
              {setting.key.replace(/_/g, ' ')}
            </Label>
          )}
          <Input
            id={labelId}
            type={setting.data_type === 'email' ? 'email' : setting.data_type === 'url' ? 'url' : 'text'}
            value={String(value)}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            onFocus={handleFocus}
            disabled={disabled}
            maxLength={maxLength}
            placeholder={setting.description || ''}
            className={error ? 'border-red-500' : ''}
            aria-invalid={!!error}
            aria-describedby={error ? `${labelId}-error` : undefined}
          />
          <div className="flex items-center justify-between">
            <div>
              {setting.description && <p className="text-sm text-muted-foreground">{setting.description}</p>}
            </div>
            {maxLength && (
              <span className={`text-xs ${String(value).length > maxLength * 0.9 ? 'text-orange-500' : 'text-muted-foreground'}`}>
                {String(value).length}/{maxLength}
              </span>
            )}
          </div>
          {error && (
            <p id={`${labelId}-error`} className="text-sm text-red-500">
              {error}
            </p>
          )}
        </div>
      )
    }
  }
}
