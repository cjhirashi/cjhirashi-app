'use client'

import { useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { UserForm, type UserFormData } from './user-form'
import { toast } from 'sonner'

export interface EditUserModalData {
  id: string
  email: string
  fullName?: string | null
  role: 'admin' | 'moderator' | 'user'
  status: 'active' | 'inactive' | 'suspended' | 'pending'
  avatarUrl?: string | null
}

interface EditUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: EditUserModalData | null
  onSuccess?: () => void
}

export function EditUserModal({
  open,
  onOpenChange,
  user,
  onSuccess,
}: EditUserModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const isEditing = user !== null && user !== undefined

  const handleSubmit = useCallback(
    async (data: UserFormData) => {
      setIsLoading(true)
      try {
        if (isEditing && user) {
          // Update existing user
          const response = await fetch(`/api/admin/users/${user.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fullName: data.fullName || null,
              role: data.role,
              status: data.status,
              avatarUrl: data.avatarUrl || null,
            }),
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'Error al actualizar usuario')
          }

          toast.success('Usuario actualizado exitosamente')
        } else {
          // Create new user
          const response = await fetch('/api/admin/users', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: data.email,
              fullName: data.fullName || null,
              role: data.role,
              status: data.status,
              avatarUrl: data.avatarUrl || null,
            }),
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'Error al crear usuario')
          }

          toast.success('Usuario creado exitosamente')
        }

        onOpenChange(false)
        onSuccess?.()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido'
        toast.error(message)
      } finally {
        setIsLoading(false)
      }
    },
    [user, isEditing, onOpenChange, onSuccess]
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar usuario' : 'Crear nuevo usuario'}</DialogTitle>
        </DialogHeader>
        <UserForm
          onSubmit={handleSubmit}
          defaultValues={
            isEditing && user
              ? {
                  email: user.email,
                  fullName: user.fullName || '',
                  role: user.role,
                  status: user.status,
                  avatarUrl: user.avatarUrl || '',
                }
              : {
                  email: '',
                  fullName: '',
                  role: 'user',
                  status: 'pending',
                  avatarUrl: '',
                }
          }
          isLoading={isLoading}
          isEditing={isEditing}
        />
      </DialogContent>
    </Dialog>
  )
}
