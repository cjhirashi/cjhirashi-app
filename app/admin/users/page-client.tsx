'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EditUserModal } from '@/components/users/edit-user-modal'
import { UsersFilters, type FilterState } from '@/components/users/users-filters'
import { UsersTable } from '@/components/users/users-table'
import { UsersPagination } from '@/components/users/users-pagination'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { UserRole, UserStatus } from '@/lib/auth/types'

interface UserData {
  id: string
  email: string
  fullName?: string | null
  avatar_url?: string | null
  role: UserRole
  status: UserStatus
  lastLoginAt?: Date | null
  createdAt: Date
}

interface FetchUsersParams {
  page: number
  pageSize: number
  role?: string
  status?: string
  search?: string
}

interface UsersPageClientProps {
  initialPermissions: {
    canCreate: boolean
    canEdit: boolean
    canDelete: boolean
  }
}

export function UsersPageClient({
  initialPermissions,
}: UsersPageClientProps) {
  const [users, setUsers] = useState<UserData[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    role: '',
    status: '',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingModalOpen, setIsCreatingModalOpen] = useState(false)

  // Fetch users
  const fetchUsers = useCallback(async (params: FetchUsersParams) => {
    setIsLoading(true)
    try {
      const queryParams = new URLSearchParams()
      queryParams.set('page', params.page.toString())
      queryParams.set('pageSize', params.pageSize.toString())

      if (params.role) {
        queryParams.set('role', params.role)
      }
      if (params.status) {
        queryParams.set('status', params.status)
      }
      if (params.search) {
        queryParams.set('search', params.search)
      }

      const response = await fetch(`/api/admin/users?${queryParams.toString()}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al cargar usuarios')
      }

      const data = await response.json()
      setUsers(data.users)
      setTotalCount(data.total)
      setCurrentPage(params.page)
      setPageSize(params.pageSize)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load users on mount and when filters change
  useEffect(() => {
    fetchUsers({
      page: 1,
      pageSize,
      role: filters.role,
      status: filters.status,
      search: filters.search,
    })
  }, [filters, pageSize, fetchUsers])

  const handlePageChange = (newPage: number) => {
    fetchUsers({
      page: newPage,
      pageSize,
      role: filters.role,
      status: filters.status,
      search: filters.search,
    })
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
  }

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }

  const handleRefresh = () => {
    fetchUsers({
      page: currentPage,
      pageSize,
      role: filters.role,
      status: filters.status,
      search: filters.search,
    })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
          <p className="text-muted-foreground mt-2">
            Administra los usuarios del sistema
          </p>
        </div>
        {initialPermissions.canCreate && (
          <Button onClick={() => setIsCreatingModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Usuario
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="p-6">
        <UsersFilters
          onFilterChange={handleFilterChange}
          isLoading={isLoading}
        />
      </Card>

      {/* Table */}
      <Card className="p-6">
        {isLoading && users.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <UsersTable
              users={users}
              totalCount={totalCount}
              currentPage={currentPage}
              pageSize={pageSize}
              onRefresh={handleRefresh}
              canEdit={initialPermissions.canEdit}
              canDelete={initialPermissions.canDelete}
            />

            {/* Pagination */}
            <div className="mt-6 border-t pt-6">
              <UsersPagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalCount={totalCount}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                isLoading={isLoading}
              />
            </div>
          </>
        )}
      </Card>

      {/* Create User Modal */}
      {initialPermissions.canCreate && (
        <EditUserModal
          open={isCreatingModalOpen}
          onOpenChange={setIsCreatingModalOpen}
          user={null}
          onSuccess={handleRefresh}
        />
      )}
    </div>
  )
}
