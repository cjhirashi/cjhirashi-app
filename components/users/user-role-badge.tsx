'use client'

import { Badge } from '@/components/ui/badge'
import type { UserRole } from '@/lib/auth/types'

const ROLE_STYLES: Record<UserRole, { bg: string; text: string; label: string }> = {
  admin: {
    bg: 'bg-red-100 dark:bg-red-900',
    text: 'text-red-800 dark:text-red-100',
    label: 'Administrador',
  },
  moderator: {
    bg: 'bg-amber-100 dark:bg-amber-900',
    text: 'text-amber-800 dark:text-amber-100',
    label: 'Moderador',
  },
  user: {
    bg: 'bg-blue-100 dark:bg-blue-900',
    text: 'text-blue-800 dark:text-blue-100',
    label: 'Usuario',
  },
}

interface UserRoleBadgeProps {
  role: UserRole
}

export function UserRoleBadge({ role }: UserRoleBadgeProps) {
  const style = ROLE_STYLES[role]

  return (
    <Badge
      variant="outline"
      className={`${style.bg} ${style.text} border-transparent font-medium`}
    >
      {style.label}
    </Badge>
  )
}
