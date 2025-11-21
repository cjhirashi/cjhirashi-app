/**
 * Individual System Setting API Route
 *
 * GET: Retrieve a specific system setting
 * PATCH: Update a specific system setting
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getRolePermissions } from '@/lib/auth/server'
import { getSystemSetting, updateSystemSetting } from '@/lib/db/helpers'
import { createAuditLog } from '@/lib/db/helpers'
import { Permission } from '@/lib/auth/types'

/**
 * GET /api/admin/settings/[key]
 * Retrieve a specific system setting
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params
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

    const setting = await getSystemSetting(key)

    if (!setting) {
      return NextResponse.json(
        { error: 'Setting not found' },
        { status: 404 }
      )
    }

    // Check if user can view private settings
    const canEditSettings = userPermissions.includes(Permission.EDIT_SETTINGS)
    if (!setting.is_public && !canEditSettings) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    return NextResponse.json(setting)
  } catch (error) {
    console.error('[API] Error fetching setting:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/settings/[key]
 * Update a specific system setting
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params
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
    const { value } = body as { value: string }

    if (!value) {
      return NextResponse.json(
        { error: 'Invalid request: value is required' },
        { status: 400 }
      )
    }

    // Get the setting to validate
    const setting = await getSystemSetting(key)
    if (!setting) {
      return NextResponse.json(
        { error: 'Setting not found' },
        { status: 404 }
      )
    }

    // Validate the value
    const validation = validateSettingValue(value, setting.data_type, setting.validation_rules)
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error },
        { status: 400 }
      )
    }

    const previousValue = setting.value

    // Update the setting
    const updatedSetting = await updateSystemSetting(key, value, user.id)

    // Create audit log
    await createAuditLog({
      user_id: user.id,
      action: 'system_setting.updated',
      category: 'settings' as any,
      entity_type: 'system_settings',
      entity_id: key,
      description: `Updated system setting: ${key}`,
      metadata: {
        key: key,
        previous_value: previousValue,
        new_value: value,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Setting updated successfully',
      updated: updatedSetting,
    })
  } catch (error) {
    console.error('[API] Error updating setting:', error)
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
