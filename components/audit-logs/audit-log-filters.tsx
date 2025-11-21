'use client'

/**
 * Audit Log Filters Component
 * Provides multiple filter options for audit logs
 */

import { useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import type { AuditLogFilters } from '@/lib/db/audit-helpers'
import type { DateRange } from '@/components/ui/date-range-picker'
import type { audit_action_category as AuditActionCategory } from '@/lib/generated/prisma'

interface AuditLogFiltersProps {
  actions: string[]
  categories: AuditActionCategory[]
  resourceTypes: (string | null)[]
  onFiltersChange: (filters: AuditLogFilters) => void
  isLoading?: boolean
}

const filtersSchema = z.object({
  userId: z.string().optional(),
  action: z.string().optional(),
  actionCategory: z.string().optional(),
  resourceType: z.string().optional(),
  resourceId: z.string().optional(),
  ipAddress: z.string().optional(),
  search: z.string().optional(),
  dateRange: z.object({
    from: z.date().optional(),
    to: z.date().optional(),
  }).optional(),
})

type FiltersFormData = z.infer<typeof filtersSchema>

export function AuditLogFilters({
  actions,
  categories,
  resourceTypes,
  onFiltersChange,
  isLoading = false,
}: AuditLogFiltersProps) {
  const form = useForm<FiltersFormData>({
    resolver: zodResolver(filtersSchema),
    defaultValues: {
      userId: '',
      action: '',
      actionCategory: '',
      resourceType: '',
      resourceId: '',
      ipAddress: '',
      search: '',
      dateRange: {},
    },
  })

  const handleApplyFilters = useCallback(
    (data: FiltersFormData) => {
      const filters: AuditLogFilters = {
        ...(data.userId && { userId: data.userId }),
        ...(data.action && { action: data.action }),
        ...(data.actionCategory && { actionCategory: data.actionCategory as AuditActionCategory }),
        ...(data.resourceType && { resourceType: data.resourceType }),
        ...(data.resourceId && { resourceId: data.resourceId }),
        ...(data.ipAddress && { ipAddress: data.ipAddress }),
        ...(data.search && { search: data.search }),
        ...(data.dateRange?.from && { startDate: data.dateRange.from }),
        ...(data.dateRange?.to && { endDate: data.dateRange.to }),
      }
      onFiltersChange(filters)
    },
    [onFiltersChange],
  )

  const handleClearFilters = useCallback(() => {
    form.reset()
    onFiltersChange({})
  }, [form, onFiltersChange])

  const categoryOptions = useMemo(
    () =>
      categories.map((cat) => ({
        value: cat,
        label:
          cat === 'auth'
            ? 'Autenticación'
            : cat === 'user'
              ? 'Usuario'
              : cat === 'role'
                ? 'Rol'
                : cat === 'setting'
                  ? 'Configuración'
                  : cat === 'system'
                    ? 'Sistema'
                    : cat,
      })),
    [categories],
  )

  const hasActiveFilters = useMemo(
    () =>
      Object.values(form.getValues()).some((value) => {
        if (typeof value === 'object' && value !== null) {
          return Object.values(value).some((v) => v !== undefined && v !== '')
        }
        return value !== '' && value !== undefined
      }),
    [form],
  )

  return (
    <div className="rounded-lg border bg-card p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleApplyFilters)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <FormField
              control={form.control}
              name="search"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Buscar</FormLabel>
                  <FormControl>
                    <Input placeholder="Acción, descripción..." disabled={isLoading} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="action"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Acción</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas las acciones" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Todas las acciones</SelectItem>
                      {actions.map((action) => (
                        <SelectItem key={action} value={action}>
                          {action}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="actionCategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Categoría</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas las categorías" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Todas las categorías</SelectItem>
                      {categoryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="resourceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Tipo de Recurso</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos los tipos" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Todos los tipos</SelectItem>
                      {resourceTypes
                        .filter((rt) => rt !== null)
                        .map((type) => (
                          <SelectItem key={type} value={type || ''}>
                            {type}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">ID Usuario</FormLabel>
                  <FormControl>
                    <Input placeholder="UUID del usuario" disabled={isLoading} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="resourceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">ID Recurso</FormLabel>
                  <FormControl>
                    <Input placeholder="ID del recurso" disabled={isLoading} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ipAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Dirección IP</FormLabel>
                  <FormControl>
                    <Input placeholder="Dirección IP" disabled={isLoading} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dateRange"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Rango de Fechas</FormLabel>
                  <FormControl>
                    <DateRangePicker
                      value={field.value as DateRange | undefined}
                      onChange={(range) => field.onChange(range)}
                      disabled={isLoading}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading}>
              Aplicar Filtros
            </Button>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="outline"
                onClick={handleClearFilters}
                disabled={isLoading}
              >
                <X className="mr-2 h-4 w-4" />
                Limpiar Filtros
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  )
}
