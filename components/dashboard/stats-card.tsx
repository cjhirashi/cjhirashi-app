/**
 * Stats Card Component
 * Displays a single statistic with icon, value, trend, and description
 */

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { LucideIcon } from 'lucide-react'

export interface StatsCardProps {
  title: string
  value: number | string
  description?: string
  icon?: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
    label: string
  }
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  loading?: boolean
}

const variantStyles = {
  default: 'border-l-4 border-l-slate-400',
  success: 'border-l-4 border-l-green-500',
  warning: 'border-l-4 border-l-yellow-500',
  danger: 'border-l-4 border-l-red-500',
  info: 'border-l-4 border-l-blue-500',
}

const trendBadgeVariant = {
  true: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  false: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  variant = 'default',
  loading = false,
}: StatsCardProps) {
  if (loading) {
    return (
      <Card className={`p-6 ${variantStyles[variant]}`}>
        <div className="space-y-3">
          <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
          <div className="h-8 bg-muted rounded w-2/3 animate-pulse" />
          <div className="h-3 bg-muted rounded w-1/3 animate-pulse" />
        </div>
      </Card>
    )
  }

  return (
    <Card className={`p-6 ${variantStyles[variant]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {trend && (
              <Badge
                variant="secondary"
                className={`text-xs ${trendBadgeVariant[trend.isPositive ? 'true' : 'false']}`}
              >
                {trend.isPositive ? '+' : ''}{trend.value}%
              </Badge>
            )}
          </div>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-3">{description}</p>
          )}
          {trend && (
            <p className="text-xs text-muted-foreground mt-1">{trend.label}</p>
          )}
        </div>
        {Icon && (
          <div className="p-3 rounded-lg bg-muted/50 ml-2">
            <Icon className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
      </div>
    </Card>
  )
}
