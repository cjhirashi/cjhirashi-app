'use client'

import { useState } from 'react'
import { RoleCard } from '@/components/roles/role-card'
import { PermissionsMatrix } from '@/components/roles/permissions-matrix'
import { RoleDetailsModal } from '@/components/roles/role-details-modal'
import type { UserRole } from '@/lib/auth/types'

interface RoleStats {
  role: UserRole
  userCount: number
  description: string
}

interface RolesPageClientProps {
  roleStats: RoleStats[]
}

export function RolesPageClient({ roleStats }: RolesPageClientProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleViewDetails = (role: UserRole) => {
    setSelectedRole(role)
    setIsModalOpen(true)
  }

  const handleModalClose = (open: boolean) => {
    setIsModalOpen(open)
    if (!open) {
      // Pequeño delay para limpiar el rol seleccionado después de que se cierre el modal
      setTimeout(() => {
        setSelectedRole(null)
      }, 200)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Roles</h1>
        <p className="text-muted-foreground mt-2">
          Administra los roles y permisos del sistema
        </p>
      </div>

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roleStats.map((stats) => (
          <RoleCard
            key={stats.role}
            role={stats.role}
            userCount={stats.userCount}
            onViewDetails={handleViewDetails}
          />
        ))}
      </div>

      {/* Permissions Matrix */}
      <PermissionsMatrix />

      {/* Role Details Modal */}
      <RoleDetailsModal
        role={selectedRole}
        open={isModalOpen}
        onOpenChange={handleModalClose}
      />
    </div>
  )
}
