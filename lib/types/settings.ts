/**
 * System Settings Types
 *
 * Type definitions for system configuration management
 */

export type SettingDataType = 'string' | 'number' | 'boolean' | 'text' | 'email' | 'url' | 'json'

export interface SystemSetting {
  key: string
  value: string
  description: string | null
  category: string
  data_type: SettingDataType
  validation_rules: any
  is_public: boolean
  is_encrypted?: boolean
  updated_by: string | null
  updated_at: Date
  created_at?: Date
}

export interface SettingFormData {
  [key: string]: string | number | boolean
}

export interface SettingCategory {
  name: string
  label: string
  description: string
  icon: string
}

export interface SettingsByCategory {
  [category: string]: SystemSetting[]
}

export interface ValidationError {
  field: string
  message: string
}

export interface SettingUpdatePayload {
  key: string
  value: string
}

export interface BulkUpdatePayload {
  updates: SettingUpdatePayload[]
}
