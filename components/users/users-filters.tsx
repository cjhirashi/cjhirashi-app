'use client'

import { useCallback, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, X } from 'lucide-react'

interface UsersFiltersProps {
  onFilterChange: (filters: FilterState) => void
  isLoading?: boolean
}

export interface FilterState {
  search: string
  role: string
  status: string
}

export function UsersFilters({ onFilterChange, isLoading = false }: UsersFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    role: '',
    status: '',
  })

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => {
      onFilterChange(filters)
    }, 300)

    return () => clearTimeout(timeout)
  }, [filters, onFilterChange])

  const handleSearchChange = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, search: value }))
  }, [])

  const handleRoleChange = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, role: value }))
  }, [])

  const handleStatusChange = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, status: value }))
  }, [])

  const handleClearFilters = useCallback(() => {
    setFilters({
      search: '',
      role: '',
      status: '',
    })
  }, [])

  const hasActiveFilters = filters.search || filters.role || filters.status

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por email o nombre..."
          value={filters.search}
          onChange={(e) => handleSearchChange(e.target.value)}
          disabled={isLoading}
          className="pl-9"
        />
      </div>

      {/* Filters Row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Role Filter */}
        <Select value={filters.role} onValueChange={handleRoleChange} disabled={isLoading}>
          <SelectTrigger>
            <SelectValue placeholder="Rol..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos los roles</SelectItem>
            <SelectItem value="admin">Administrador</SelectItem>
            <SelectItem value="moderator">Moderador</SelectItem>
            <SelectItem value="user">Usuario</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={filters.status} onValueChange={handleStatusChange} disabled={isLoading}>
          <SelectTrigger>
            <SelectValue placeholder="Estado..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos los estados</SelectItem>
            <SelectItem value="active">Activo</SelectItem>
            <SelectItem value="inactive">Inactivo</SelectItem>
            <SelectItem value="suspended">Suspendido</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearFilters}
            disabled={isLoading}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Limpiar
          </Button>
        )}
      </div>

      {/* Active Filters Indicator */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-primary" />
          {filters.search && <span>Búsqueda: &quot;{filters.search}&quot;</span>}
          {filters.role && <span>Rol: {filters.role}</span>}
          {filters.status && <span>Estado: {filters.status}</span>}
        </div>
      )}
    </div>
  )
}
