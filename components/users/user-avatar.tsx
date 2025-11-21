'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface UserAvatarProps {
  fullName?: string | null
  avatarUrl?: string | null
  email?: string
}

export function UserAvatar({ fullName, avatarUrl, email }: UserAvatarProps) {
  const initials = fullName
    ? fullName
        .split(' ')
        .map((name) => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : email
      ? email[0].toUpperCase()
      : '?'

  return (
    <Avatar className="h-9 w-9">
      {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName || email || 'User'} />}
      <AvatarFallback className="text-xs font-bold">{initials}</AvatarFallback>
    </Avatar>
  )
}
