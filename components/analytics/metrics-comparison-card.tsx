'use client'

import { Card } from '@/components/ui/card'
import { ArrowUp, ArrowDown, Minus } from 'lucide-react'
import type { MetricComparison } from '@/lib/types/analytics'
import {
  formatNumber,
  formatPercentage,
  getTrendColor,
} from '@/lib/utils/analytics-utils'

interface MetricsComparisonCardProps {
  title: string
  currentValue: number
  previousValue?: number
  format: 'number' | 'percentage'
  icon?: React.ReactNode
  comparison?: MetricComparison
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
}

const variantColors = {
  default: 'text-slate-600',
  success: 'text-green-600',
  warning: 'text-orange-600',
  danger: 'text-red-600',
  info: 'text-blue-600',
}

const variantBgColors = {
  default: 'bg-slate-50 border-slate-200',
  success: 'bg-green-50 border-green-200',
  warning: 'bg-orange-50 border-orange-200',
  danger: 'bg-red-50 border-red-200',
  info: 'bg-blue-50 border-blue-200',
}

export function MetricsComparisonCard({
  title,
  currentValue,
  previousValue,
  format,
  icon,
  comparison,
  variant = 'default',
}: MetricsComparisonCardProps) {
  const formattedCurrent =
    format === 'percentage'
      ? formatPercentage(currentValue)
      : formatNumber(currentValue)

  const trend = comparison?.trend
  const trendIcon =
    trend === 'up' ? (
      <ArrowUp className="h-5 w-5" />
    ) : trend === 'down' ? (
      <ArrowDown className="h-5 w-5" />
    ) : (
      <Minus className="h-5 w-5" />
    )

  const trendColor = trend ? getTrendColor(trend) : 'text-gray-600'

  return (
    <Card
      className={`p-6 border ${variantBgColors[variant]}`}
    >
      <div className="space-y-3">
        {/* Header with Icon and Title */}
        <div className="flex items-start justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">
            {title}
          </h3>
          {icon && <div className="text-slate-400">{icon}</div>}
        </div>

        {/* Current Value */}
        <div>
          <p className={`text-3xl font-bold ${variantColors[variant]}`}>
            {formattedCurrent}
          </p>
        </div>

        {/* Comparison Section */}
        {comparison && (
          <div className="flex items-center gap-2 text-sm">
            <div className={`flex items-center gap-1 ${trendColor}`}>
              {trendIcon}
              <span className="font-semibold">
                {comparison.value >= 0 ? '+' : ''}
                {format === 'percentage'
                  ? formatPercentage(comparison.value)
                  : formatNumber(comparison.value)}
              </span>
            </div>
            <span className="text-muted-foreground">
              ({comparison.percentage > 0 ? '+' : ''}
              {formatPercentage(comparison.percentage)})
            </span>
          </div>
        )}

        {/* Previous Value Display */}
        {previousValue !== undefined && !comparison && (
          <div className="pt-2 text-xs text-muted-foreground border-t">
            <p>Período anterior: {formatNumber(previousValue)}</p>
          </div>
        )}
      </div>
    </Card>
  )
}
