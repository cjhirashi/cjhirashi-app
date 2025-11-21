'use client'

import { useState, useCallback } from 'react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface DeleteUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: {
    id: string
    email: string
    fullName?: string | null
  } | null
  onSuccess?: () => void
}

export function DeleteUserDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: DeleteUserDialogProps) {
  const [confirmText, setConfirmText] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleDeleteClick = useCallback(async () => {
    if (!user) return

    // Validate confirmation text
    if (confirmText !== user.email) {
      toast.error(`Debes escribir "${user.email}" para confirmar`)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al eliminar usuario')
      }

      toast.success('Usuario eliminado exitosamente')
      onOpenChange(false)
      setConfirmText('')
      onSuccess?.()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }, [user, confirmText, onOpenChange, onSuccess])

  const handleClose = useCallback(() => {
    if (!isLoading) {
      setConfirmText('')
      onOpenChange(false)
    }
  }, [isLoading, onOpenChange])

  if (!user) return null

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar usuario</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Está a punto de eliminar permanentemente el usuario{' '}
              <strong>{user.fullName || user.email}</strong>. Esta acción no se puede deshacer.
            </p>
            <p>Para confirmar, escriba el email del usuario:</p>
            <Input
              placeholder={user.email}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteClick}
            disabled={isLoading || confirmText !== user.email}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isLoading ? 'Eliminando...' : 'Eliminar usuario'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
