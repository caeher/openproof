'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getAvatarInitials, getUserDisplayName } from '@/lib/avatar'
import { cn } from '@/lib/utils'

interface UserAvatarProps {
  user?: {
    name?: string | null
    email?: string | null
    avatarUrl?: string | null
  } | null
  className?: string
  fallbackClassName?: string
  alt?: string
}

export function UserAvatar({ user, className, fallbackClassName, alt }: UserAvatarProps) {
  const displayName = getUserDisplayName(user)

  return (
    <Avatar className={className}>
      <AvatarImage src={user?.avatarUrl || undefined} alt={alt || displayName} />
      <AvatarFallback
        className={cn(
          'bg-secondary text-foreground font-semibold',
          fallbackClassName,
        )}
      >
        {getAvatarInitials(user?.name, user?.email)}
      </AvatarFallback>
    </Avatar>
  )
}