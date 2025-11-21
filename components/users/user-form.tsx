'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { UserRole, UserStatus } from '@/lib/auth/types'

const userFormSchema = z.object({
  email: z.string().email('Email inválido').min(1, 'Email es requerido'),
  fullName: z.string().max(255, 'Máximo 255 caracteres').optional().or(z.literal('')),
  role: z.enum(['admin', 'moderator', 'user'] as const),
  status: z.enum(['active', 'inactive', 'suspended', 'pending'] as const),
  avatarUrl: z.string().url('URL inválida').optional().or(z.literal('')),
})

export type UserFormData = z.infer<typeof userFormSchema>

interface UserFormProps {
  onSubmit: (data: UserFormData) => Promise<void>
  defaultValues?: Partial<UserFormData>
  isLoading?: boolean
  isEditing?: boolean
}

export function UserForm({
  onSubmit,
  defaultValues = {},
  isLoading = false,
  isEditing = false,
}: UserFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      email: '',
      fullName: '',
      role: 'user',
      status: 'pending',
      avatarUrl: '',
      ...defaultValues,
    },
  })

  const role = watch('role')
  const status = watch('status')

  const handleFormSubmit = async (data: UserFormData) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="usuario@ejemplo.com"
          disabled={isEditing || isLoading || isSubmitting}
          {...register('email')}
          aria-invalid={errors.email ? 'true' : 'false'}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      {/* Nombre completo */}
      <div className="space-y-2">
        <Label htmlFor="fullName">Nombre completo (opcional)</Label>
        <Input
          id="fullName"
          placeholder="Juan Pérez"
          disabled={isLoading || isSubmitting}
          {...register('fullName')}
          aria-invalid={errors.fullName ? 'true' : 'false'}
        />
        {errors.fullName && (
          <p className="text-sm text-destructive">{errors.fullName.message}</p>
        )}
      </div>

      {/* Rol */}
      <div className="space-y-2">
        <Label htmlFor="role">Rol</Label>
        <Select
          value={role}
          onValueChange={(value) => setValue('role', value as UserRole)}
          disabled={isLoading || isSubmitting}
        >
          <SelectTrigger id="role" aria-invalid={errors.role ? 'true' : 'false'}>
            <SelectValue placeholder="Seleccionar rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Administrador</SelectItem>
            <SelectItem value="moderator">Moderador</SelectItem>
            <SelectItem value="user">Usuario</SelectItem>
          </SelectContent>
        </Select>
        {errors.role && (
          <p className="text-sm text-destructive">{errors.role.message}</p>
        )}
      </div>

      {/* Estado */}
      <div className="space-y-2">
        <Label htmlFor="status">Estado</Label>
        <Select
          value={status}
          onValueChange={(value) => setValue('status', value as UserStatus)}
          disabled={isLoading || isSubmitting}
        >
          <SelectTrigger id="status" aria-invalid={errors.status ? 'true' : 'false'}>
            <SelectValue placeholder="Seleccionar estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Activo</SelectItem>
            <SelectItem value="inactive">Inactivo</SelectItem>
            <SelectItem value="suspended">Suspendido</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
          </SelectContent>
        </Select>
        {errors.status && (
          <p className="text-sm text-destructive">{errors.status.message}</p>
        )}
      </div>

      {/* Avatar URL */}
      <div className="space-y-2">
        <Label htmlFor="avatarUrl">URL de avatar (opcional)</Label>
        <Input
          id="avatarUrl"
          type="url"
          placeholder="https://ejemplo.com/avatar.jpg"
          disabled={isLoading || isSubmitting}
          {...register('avatarUrl')}
          aria-invalid={errors.avatarUrl ? 'true' : 'false'}
        />
        {errors.avatarUrl && (
          <p className="text-sm text-destructive">{errors.avatarUrl.message}</p>
        )}
      </div>

      {/* Botón de submit */}
      <Button
        type="submit"
        disabled={isLoading || isSubmitting}
        className="w-full"
      >
        {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar usuario' : 'Crear usuario'}
      </Button>
    </form>
  )
}
