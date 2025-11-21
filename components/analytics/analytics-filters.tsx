'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Calendar, RotateCcw } from 'lucide-react'
import type {
  AnalyticsFilters,
  DateRangePreset,
  DateRange,
} from '@/lib/types/analytics'
import {
  getDateRangeFromPreset,
  formatDateDisplay,
} from '@/lib/utils/analytics-utils'
import { DateRangePicker } from '@/components/ui/date-range-picker'

interface AnalyticsFiltersProps {
  filters: AnalyticsFilters
  onFiltersChange: (filters: AnalyticsFilters) => void
}

const PRESET_OPTIONS: Array<{
  value: DateRangePreset
  label: string
}> = [
  { value: 'today', label: 'Hoy' },
  { value: 'yesterday', label: 'Ayer' },
  { value: 'last7days', label: 'Últimos 7 días' },
  { value: 'last30days', label: 'Últimos 30 días' },
  { value: 'last90days', label: 'Últimos 90 días' },
  { value: 'thisMonth', label: 'Este mes' },
  { value: 'lastMonth', label: 'Mes anterior' },
  { value: 'custom', label: 'Personalizado' },
]

export function AnalyticsFilters({
  filters,
  onFiltersChange,
}: AnalyticsFiltersProps) {
  const [isCustomDateRange, setIsCustomDateRange] = useState(
    filters.preset === 'custom'
  )
  const [compareWithPrevious, setCompareWithPrevious] = useState(
    !!filters.compareWith
  )

  const handlePresetChange = (preset: DateRangePreset) => {
    if (preset === 'custom') {
      setIsCustomDateRange(true)
    } else {
      setIsCustomDateRange(false)
      const dateRange = getDateRangeFromPreset(preset)
      onFiltersChange({
        dateRange,
        preset,
        compareWith: compareWithPrevious ? filters.compareWith : undefined,
      })
    }
  }

  const handleDateRangeChange = (dateRange: DateRange) => {
    onFiltersChange({
      dateRange,
      preset: 'custom',
      compareWith: compareWithPrevious ? filters.compareWith : undefined,
    })
  }

  const handleCompareToggle = (checked: boolean) => {
    setCompareWithPrevious(checked)
    const compareWith = checked ? filters.compareWith : undefined
    onFiltersChange({
      ...filters,
      compareWith,
    })
  }

  const handleReset = () => {
    setIsCustomDateRange(false)
    setCompareWithPrevious(false)
    const defaultRange = getDateRangeFromPreset('last30days')
    onFiltersChange({
      dateRange: defaultRange,
      preset: 'last30days',
      compareWith: undefined,
    })
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Filtros</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Restablecer
          </Button>
        </div>

        {/* Preset Selection */}
        <div className="space-y-2">
          <Label htmlFor="preset-select" className="text-sm font-medium">
            Período predefinido
          </Label>
          <Select
            value={filters.preset}
            onValueChange={handlePresetChange}
          >
            <SelectTrigger id="preset-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRESET_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Custom Date Range */}
        {isCustomDateRange && (
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Rango personalizado
            </Label>
            <DateRangePicker
              value={filters.dateRange}
              onChange={handleDateRangeChange}
            />
          </div>
        )}

        {/* Date Range Display */}
        <div className="bg-muted/50 rounded p-3 text-sm">
          <p className="text-muted-foreground">
            <span className="font-medium">Período:</span>{' '}
            {formatDateDisplay(filters.dateRange.from)} a{' '}
            {formatDateDisplay(filters.dateRange.to)}
          </p>
        </div>

        {/* Compare with Previous Period */}
        <div className="flex items-center space-x-2 pt-2">
          <Checkbox
            id="compare-checkbox"
            checked={compareWithPrevious}
            onCheckedChange={handleCompareToggle}
          />
          <Label
            htmlFor="compare-checkbox"
            className="text-sm font-medium cursor-pointer"
          >
            Comparar con período anterior
          </Label>
        </div>
      </div>
    </Card>
  )
}
