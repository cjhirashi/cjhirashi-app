/**
 * System Settings API Route
 *
 * GET: Retrieve system settings (with category filter support)
 * PUT: Update multiple system settings in bulk
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getRolePermissions } from '@/lib/auth/server'
import {
  getSystemSettings,
  getSystemSettingsByCategory,
  bulkUpdateSystemSettings,
} from '@/lib/db/helpers'
import { createAuditLog } from '@/lib/db/helpers'
import { validateMultipleSettings, allValid, getValidationErrors } from '@/lib/validation/settings-validation'
import { Permission } from '@/lib/auth/types'
import type { SettingsByCategory } from '@/lib/types/settings'

/**
 * GET /api/admin/settings
 * Retrieve system settings with optional category filtering
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    // Check authentication
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    const userPermissions = getRolePermissions(user.role)
    if (!userPermissions.includes(Permission.VIEW_SETTINGS)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get category filter from query params
    const url = new URL(request.url)
    const category = url.searchParams.get('category')

    let settings
    if (category) {
      settings = await getSystemSettingsByCategory(category)
    } else {
      settings = await getSystemSettings()
    }

    // Group settings by category
    const grouped: SettingsByCategory = {}
    for (const setting of settings) {
      if (!grouped[setting.category]) {
        grouped[setting.category] = []
      }
      grouped[setting.category].push(setting)
    }

    return NextResponse.json(grouped)
  } catch (error) {
    console.error('[API] Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/settings
 * Update multiple system settings in a transaction
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    // Check authentication
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    const userPermissions = getRolePermissions(user.role)
    if (!userPermissions.includes(Permission.EDIT_SETTINGS)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { updates } = body as { updates: Array<{ key: string; value: string }> }

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: updates must be a non-empty array' },
        { status: 400 }
      )
    }

    // Get all settings for validation
    const allSettings = await getSystemSettings()
    const settingsMap = new Map(allSettings.map((s) => [s.key, s]))

    // Validate each update
    const validations: Record<string, any> = {}
    for (const update of updates) {
      const setting = settingsMap.get(update.key)
      if (!setting) {
        return NextResponse.json(
          { error: `Setting not found: ${update.key}` },
          { status: 400 }
        )
      }

      const validation = validateSettingValue(update.value, setting.data_type, setting.validation_rules)
      if (!validation.valid) {
        validations[update.key] = validation.error
      }
    }

    if (Object.keys(validations).length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: validations },
        { status: 400 }
      )
    }

    // Update settings in transaction
    const updatedSettings = await bulkUpdateSystemSettings(updates, user.id)

    // Create audit logs for each change
    for (const update of updates) {
      const previousValue = allSettings.find((s) => s.key === update.key)?.value
      await createAuditLog({
        user_id: user.id,
        action: 'system_setting.updated',
        category: 'settings' as any,
        entity_type: 'system_settings',
        entity_id: update.key,
        description: `Updated system setting: ${update.key}`,
        metadata: {
          key: update.key,
          previous_value: previousValue,
          new_value: update.value,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: `${updatedSettings.length} setting(s) updated successfully`,
      updated: updatedSettings,
    })
  } catch (error) {
    console.error('[API] Error updating settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to validate setting value
function validateSettingValue(
  value: string,
  dataType: string,
  validationRules: any,
): { valid: boolean; error?: string } {
  try {
    switch (dataType) {
      case 'boolean':
        return { valid: true }
      case 'number': {
        const numValue = Number(value)
        if (Number.isNaN(numValue)) {
          return { valid: false, error: 'Must be a valid number' }
        }
        if (validationRules?.min !== undefined && numValue < validationRules.min) {
          return { valid: false, error: `Minimum value: ${validationRules.min}` }
        }
        if (validationRules?.max !== undefined && numValue > validationRules.max) {
          return { valid: false, error: `Maximum value: ${validationRules.max}` }
        }
        return { valid: true }
      }
      case 'email': {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return {
          valid: emailRegex.test(value),
          error: emailRegex.test(value) ? undefined : 'Invalid email format',
        }
      }
      case 'url': {
        try {
          new URL(value)
          return { valid: true }
        } catch {
          return { valid: false, error: 'Invalid URL format' }
        }
      }
      case 'string':
      case 'text':
      default: {
        if (validationRules?.maxLength && value.length > validationRules.maxLength) {
          return {
            valid: false,
            error: `Maximum length is ${validationRules.maxLength} characters`,
          }
        }
        return { valid: true }
      }
    }
  } catch (error) {
    return { valid: false, error: 'Validation error' }
  }
}
