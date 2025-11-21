/**
 * Action Category Badge Component
 * Displays audit action category with appropriate color coding
 */

import { cn } from '@/lib/utils'
import type { audit_action_category as AuditActionCategory } from '@/lib/generated/prisma'

interface ActionCategoryBadgeProps {
  category: AuditActionCategory
}

const categoryStyles: Record<AuditActionCategory, string> = {
  auth: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  user: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  role: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
  setting: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  system: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
}

const categoryLabels: Record<AuditActionCategory, string> = {
  auth: 'Autenticación',
  user: 'Usuario',
  role: 'Rol',
  setting: 'Configuración',
  system: 'Sistema',
}

export function ActionCategoryBadge({ category }: ActionCategoryBadgeProps) {
  const style = categoryStyles[category] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
  const label = categoryLabels[category] || category

  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', style)}>
      {label}
    </span>
  )
}
