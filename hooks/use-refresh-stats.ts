/**
 * Hook: useRefreshStats
 * Manages API calls to refresh dashboard statistics
 * Used by SystemStatusCard component
 */

import { useState, useCallback } from 'react'

export interface RefreshStatsResult {
  success: boolean
  message?: string
  timestamp?: string
  error?: string
}

export function useRefreshStats() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async (): Promise<RefreshStatsResult> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/refresh-stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = (await response.json()) as RefreshStatsResult

      if (!response.ok) {
        const errorMessage =
          data.error ||
          `Error: ${response.status} ${response.statusText}`
        setError(errorMessage)
        throw new Error(errorMessage)
      }

      return data
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    refresh,
    isLoading,
    error,
  }
}
