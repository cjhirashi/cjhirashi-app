'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { Fragment } from 'react'
import { cn } from '@/lib/utils'

// Map of route segments to human-readable labels
const SEGMENT_LABELS: Record<string, string> = {
  admin: 'Admin',
  users: 'Usuarios',
  roles: 'Roles',
  settings: 'Configuración',
  analytics: 'Analytics',
  'audit-logs': 'Logs de Actividad',
  profile: 'Perfil',
  new: 'Nuevo',
  edit: 'Editar',
}

interface BreadcrumbItem {
  label: string
  href: string
  isLast: boolean
}

export function Breadcrumbs() {
  const pathname = usePathname()

  // Generate breadcrumb items from pathname
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    // Remove leading/trailing slashes and split
    const segments = pathname.split('/').filter(Boolean)

    // Build breadcrumb items
    const items: BreadcrumbItem[] = []
    let currentPath = ''

    segments.forEach((segment, index) => {
      currentPath += `/${segment}`

      // Get label from map or capitalize segment
      const label =
        SEGMENT_LABELS[segment] ||
        segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')

      items.push({
        label,
        href: currentPath,
        isLast: index === segments.length - 1,
      })
    })

    return items
  }

  const breadcrumbs = generateBreadcrumbs()

  // Don't show breadcrumbs on the root admin page
  if (pathname === '/admin') {
    return null
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-1 text-sm">
      {/* Home/Root link */}
      <Link
        href="/admin"
        className="flex items-center text-muted-foreground transition-colors hover:text-foreground"
        aria-label="Ir al inicio"
      >
        <Home className="h-4 w-4" />
      </Link>

      {/* Breadcrumb items */}
      {breadcrumbs.map((item, index) => (
        <Fragment key={item.href}>
          <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          {item.isLast ? (
            <span
              className="font-medium text-foreground"
              aria-current="page"
            >
              {item.label}
            </span>
          ) : (
            <Link
              href={item.href}
              className={cn(
                'text-muted-foreground transition-colors hover:text-foreground',
                'truncate max-w-[150px]'
              )}
            >
              {item.label}
            </Link>
          )}
        </Fragment>
      ))}
    </nav>
  )
}
