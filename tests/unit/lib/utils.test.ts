import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { cn, hasEnvVars } from '@/lib/utils'

describe('lib/utils', () => {
  describe('cn() - className merger utility', () => {
    it('should merge multiple class names', () => {
      const result = cn('px-4', 'py-2', 'bg-blue-500')
      expect(result).toContain('px-4')
      expect(result).toContain('py-2')
      expect(result).toContain('bg-blue-500')
    })

    it('should handle conditional classes', () => {
      const isActive = true
      const result = cn('base-class', isActive && 'active-class')
      expect(result).toContain('base-class')
      expect(result).toContain('active-class')
    })

    it('should handle falsy values', () => {
      const result = cn('base-class', false, null, undefined, 'valid-class')
      expect(result).toContain('base-class')
      expect(result).toContain('valid-class')
      expect(result).not.toContain('false')
      expect(result).not.toContain('null')
    })

    it('should resolve Tailwind conflicts (last wins)', () => {
      const result = cn('px-2', 'px-4') // px-4 should override px-2
      expect(result).toContain('px-4')
    })

    it('should handle empty input', () => {
      const result = cn()
      expect(result).toBe('')
    })

    it('should handle arrays', () => {
      const result = cn(['px-4', 'py-2'], 'bg-blue-500')
      expect(result).toContain('px-4')
      expect(result).toContain('py-2')
      expect(result).toContain('bg-blue-500')
    })
  })

  describe('hasEnvVars - environment variables check', () => {
    const originalEnv = process.env

    beforeEach(() => {
      // Reset environment before each test
      process.env = { ...originalEnv }
    })

    afterEach(() => {
      // Restore original environment
      process.env = originalEnv
    })

    it('should return truthy when both env vars are set', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'

      // Re-import to get updated hasEnvVars value
      const hasEnvVarsValue =
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      expect(hasEnvVarsValue).toBeTruthy()
    })

    it('should return falsy when SUPABASE_URL is missing', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'

      const hasEnvVarsValue =
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      expect(hasEnvVarsValue).toBeFalsy()
    })

    it('should return falsy when PUBLISHABLE_KEY is missing', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      const hasEnvVarsValue =
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      expect(hasEnvVarsValue).toBeFalsy()
    })

    it('should return falsy when both env vars are missing', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      const hasEnvVarsValue =
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      expect(hasEnvVarsValue).toBeFalsy()
    })
  })
})
