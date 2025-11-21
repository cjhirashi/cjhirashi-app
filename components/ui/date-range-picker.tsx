'use client'

/**
 * Date Range Picker Component
 * Allows users to select a date range for filtering
 */

import { useCallback, useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export interface DateRange {
  from?: Date
  to?: Date
}

interface DateRangePickerProps {
  value?: DateRange
  onChange?: (range: DateRange) => void
  placeholder?: string
  disabled?: boolean
}

export function DateRangePicker({ value, onChange, placeholder = 'Seleccionar rango de fechas', disabled = false }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localRange, setLocalRange] = useState<DateRange>(value || {})

  const handleSelect = useCallback(
    (type: 'from' | 'to', date: Date | undefined) => {
      const newRange = { ...localRange, [type]: date }
      setLocalRange(newRange)
      onChange?.(newRange)
    },
    [localRange, onChange],
  )

  const handleClear = useCallback(() => {
    setLocalRange({})
    onChange?.({})
  }, [onChange])

  const formatDateRange = () => {
    if (!localRange.from && !localRange.to) {
      return placeholder
    }

    if (localRange.from && localRange.to) {
      return `${format(localRange.from, 'dd MMM yyyy', { locale: es })} - ${format(localRange.to, 'dd MMM yyyy', { locale: es })}`
    }

    if (localRange.from) {
      return `Desde ${format(localRange.from, 'dd MMM yyyy', { locale: es })}`
    }

    return `Hasta ${format(localRange.to!, 'dd MMM yyyy', { locale: es })}`
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn('w-full justify-start text-left font-normal', !localRange.from && !localRange.to && 'text-muted-foreground')}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDateRange()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="space-y-4 p-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Fecha de inicio</label>
            <Calendar
              mode="single"
              selected={localRange.from}
              onSelect={(date) => handleSelect('from', date)}
              disabled={(date) => {
                if (localRange.to) {
                  return date > localRange.to
                }
                return false
              }}
              locale={es}
              initialFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Fecha final</label>
            <Calendar
              mode="single"
              selected={localRange.to}
              onSelect={(date) => handleSelect('to', date)}
              disabled={(date) => {
                if (localRange.from) {
                  return date < localRange.from
                }
                return false
              }}
              locale={es}
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleClear} className="flex-1">
              Limpiar
            </Button>
            <Button size="sm" onClick={() => setIsOpen(false)} className="flex-1">
              Aplicar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
