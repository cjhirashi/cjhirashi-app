'use client'

/**
 * Toast Hook
 *
 * Hook for showing toast notifications (success, error, etc.)
 */

import { useState, useCallback } from 'react'

export interface Toast {
  id: string
  title: string
  description?: string
  variant: 'default' | 'destructive' | 'success'
  duration?: number
}

export interface UseToastReturn {
  toast: (toast: Omit<Toast, 'id'>) => void
  toasts: Toast[]
  dismiss: (id: string) => void
}

export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback(
    ({ title, description, variant = 'default', duration = 5000 }: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).substr(2, 9)

      setToasts((prev) => [...prev, { id, title, description, variant, duration }])

      if (duration !== Infinity) {
        setTimeout(() => {
          dismiss(id)
        }, duration)
      }
    },
    [],
  )

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return { toast, toasts, dismiss }
}
