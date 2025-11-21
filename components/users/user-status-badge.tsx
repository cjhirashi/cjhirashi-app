'use client'

import { Badge } from '@/components/ui/badge'
import type { UserStatus } from '@/lib/auth/types'

const STATUS_STYLES: Record<UserStatus, { bg: string; text: string; label: string }> = {
  active: {
    bg: 'bg-green-100 dark:bg-green-900',
    text: 'text-green-800 dark:text-green-100',
    label: 'Activo',
  },
  inactive: {
    bg: 'bg-gray-100 dark:bg-gray-900',
    text: 'text-gray-800 dark:text-gray-100',
    label: 'Inactivo',
  },
  suspended: {
    bg: 'bg-red-100 dark:bg-red-900',
    text: 'text-red-800 dark:text-red-100',
    label: 'Suspendido',
  },
  pending: {
    bg: 'bg-yellow-100 dark:bg-yellow-900',
    text: 'text-yellow-800 dark:text-yellow-100',
    label: 'Pendiente',
  },
}

interface UserStatusBadgeProps {
  status: UserStatus
}

export function UserStatusBadge({ status }: UserStatusBadgeProps) {
  const style = STATUS_STYLES[status]

  return (
    <Badge
      variant="outline"
      className={`${style.bg} ${style.text} border-transparent font-medium`}
    >
      {style.label}
    </Badge>
  )
}
