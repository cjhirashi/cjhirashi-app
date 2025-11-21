'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LucideIcon, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export interface NavItemProps {
  href: string
  icon: LucideIcon
  label: string
  collapsed?: boolean
  subItems?: {
    href: string
    label: string
    visible?: boolean
  }[]
  visible?: boolean
}

export function NavItem({
  href,
  icon: Icon,
  label,
  collapsed = false,
  subItems,
  visible = true,
}: NavItemProps) {
  const pathname = usePathname()
  const [isExpanded, setIsExpanded] = useState(false)

  // Don't render if not visible (permissions check)
  if (!visible) {
    return null
  }

  // Check if current route matches this nav item or any of its subitems
  const isActive = pathname === href || pathname.startsWith(href + '/')
  const hasVisibleSubItems = subItems?.some(item => item.visible !== false)
  const hasSubItems = hasVisibleSubItems && subItems && subItems.length > 0

  // Main nav item without subitems
  if (!hasSubItems) {
    return (
      <Link href={href} className="block">
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start gap-3 h-10 px-3',
            collapsed && 'justify-center px-2',
            isActive && 'bg-accent text-accent-foreground font-medium'
          )}
          title={collapsed ? label : undefined}
        >
          <Icon className="h-5 w-5 shrink-0" />
          {!collapsed && <span className="truncate">{label}</span>}
        </Button>
      </Link>
    )
  }

  // Nav item with subitems
  return (
    <div>
      <Button
        variant="ghost"
        className={cn(
          'w-full justify-start gap-3 h-10 px-3',
          collapsed && 'justify-center px-2',
          isActive && 'bg-accent text-accent-foreground font-medium'
        )}
        onClick={() => !collapsed && setIsExpanded(!isExpanded)}
        title={collapsed ? label : undefined}
        asChild={collapsed}
      >
        {collapsed ? (
          <Link href={href}>
            <Icon className="h-5 w-5 shrink-0" />
          </Link>
        ) : (
          <>
            <Icon className="h-5 w-5 shrink-0" />
            <span className="flex-1 truncate text-left">{label}</span>
            <ChevronRight
              className={cn(
                'h-4 w-4 shrink-0 transition-transform',
                isExpanded && 'rotate-90'
              )}
            />
          </>
        )}
      </Button>

      {/* Subitems - only show when expanded and not collapsed */}
      {isExpanded && !collapsed && (
        <div className="ml-8 mt-1 space-y-1 border-l-2 border-border pl-3">
          {subItems?.map(
            (subItem) =>
              subItem.visible !== false && (
                <Link key={subItem.href} href={subItem.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'w-full justify-start h-8 px-3',
                      pathname === subItem.href &&
                        'bg-accent text-accent-foreground font-medium'
                    )}
                  >
                    <span className="truncate">{subItem.label}</span>
                  </Button>
                </Link>
              )
          )}
        </div>
      )}
    </div>
  )
}
