/**
 * System Settings Validation
 *
 * Functions for validating settings values based on their type and rules
 */

import { z } from 'zod'
import type { SettingDataType } from '@/lib/types/settings'

export interface ValidationResult {
  valid: boolean
  error?: string
  parsedValue?: unknown
}

/**
 * Validate a setting value based on its data type and validation rules
 */
export function validateSettingValue(
  value: string | number | boolean,
  dataType: SettingDataType,
  validationRules: Record<string, unknown> | null,
): ValidationResult {
  try {
    // Convert value to string for consistent processing
    const strValue = String(value)

    switch (dataType) {
      case 'boolean': {
        const boolValue = value === true || strValue === 'true' || strValue === '1'
        return { valid: true, parsedValue: boolValue }
      }

      case 'number': {
        const numValue = Number(strValue)
        if (Number.isNaN(numValue)) {
          return { valid: false, error: 'Debe ser un número válido' }
        }

        if (validationRules) {
          const min = validationRules.min as number | undefined
          const max = validationRules.max as number | undefined

          if (min !== undefined && numValue < min) {
            return { valid: false, error: `Valor mínimo: ${min}` }
          }

          if (max !== undefined && numValue > max) {
            return { valid: false, error: `Valor máximo: ${max}` }
          }
        }

        return { valid: true, parsedValue: numValue }
      }

      case 'email': {
        const emailSchema = z.string().email('Email inválido')
        const result = emailSchema.safeParse(strValue)
        if (!result.success) {
          const error = result.error.issues[0]?.message || 'Email inválido'
          return { valid: false, error }
        }
        return { valid: true, parsedValue: strValue }
      }

      case 'url': {
        const urlSchema = z.string().url('URL inválida')
        const result = urlSchema.safeParse(strValue)
        if (!result.success) {
          const error = result.error.issues[0]?.message || 'URL inválida'
          return { valid: false, error }
        }
        return { valid: true, parsedValue: strValue }
      }

      case 'string':
      case 'text': {
        if (validationRules) {
          const maxLength = validationRules.maxLength as number | undefined
          if (maxLength && strValue.length > maxLength) {
            return {
              valid: false,
              error: `Máximo ${maxLength} caracteres (${strValue.length}/${maxLength})`,
            }
          }

          const minLength = validationRules.minLength as number | undefined
          if (minLength && strValue.length < minLength) {
            return {
              valid: false,
              error: `Mínimo ${minLength} caracteres (${strValue.length}/${minLength})`,
            }
          }
        }
        return { valid: true, parsedValue: strValue }
      }

      default:
        return { valid: true, parsedValue: strValue }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    return { valid: false, error: `Error al validar: ${errorMessage}` }
  }
}

/**
 * Validate multiple settings at once
 */
export function validateMultipleSettings(
  settings: Array<{
    key: string
    value: string | number | boolean
    dataType: SettingDataType
    validationRules: Record<string, unknown> | null
  }>,
): Record<string, ValidationResult> {
  const results: Record<string, ValidationResult> = {}

  for (const setting of settings) {
    results[setting.key] = validateSettingValue(
      setting.value,
      setting.dataType,
      setting.validationRules,
    )
  }

  return results
}

/**
 * Check if all validations passed
 */
export function allValid(validationResults: Record<string, ValidationResult>): boolean {
  return Object.values(validationResults).every((result) => result.valid)
}

/**
 * Get all validation errors
 */
export function getValidationErrors(
  validationResults: Record<string, ValidationResult>,
): Record<string, string> {
  const errors: Record<string, string> = {}

  for (const [key, result] of Object.entries(validationResults)) {
    if (!result.valid && result.error) {
      errors[key] = result.error
    }
  }

  return errors
}
