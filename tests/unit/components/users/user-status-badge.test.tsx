import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { UserStatusBadge } from '@/components/users/user-status-badge'

describe('UserStatusBadge Component', () => {
  describe('Rendering', () => {
    it('should render active badge with correct label', () => {
      render(<UserStatusBadge status="active" />)
      expect(screen.getByText('Activo')).toBeInTheDocument()
    })

    it('should render inactive badge with correct label', () => {
      render(<UserStatusBadge status="inactive" />)
      expect(screen.getByText('Inactivo')).toBeInTheDocument()
    })

    it('should render suspended badge with correct label', () => {
      render(<UserStatusBadge status="suspended" />)
      expect(screen.getByText('Suspendido')).toBeInTheDocument()
    })

    it('should render pending badge with correct label', () => {
      render(<UserStatusBadge status="pending" />)
      expect(screen.getByText('Pendiente')).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('should apply active styles (green)', () => {
      const { container } = render(<UserStatusBadge status="active" />)
      const badge = container.querySelector('.bg-green-100')
      expect(badge).toBeInTheDocument()
    })

    it('should apply inactive styles (gray)', () => {
      const { container } = render(<UserStatusBadge status="inactive" />)
      const badge = container.querySelector('.bg-gray-100')
      expect(badge).toBeInTheDocument()
    })

    it('should apply suspended styles (red)', () => {
      const { container } = render(<UserStatusBadge status="suspended" />)
      const badge = container.querySelector('.bg-red-100')
      expect(badge).toBeInTheDocument()
    })

    it('should apply pending styles (yellow)', () => {
      const { container } = render(<UserStatusBadge status="pending" />)
      const badge = container.querySelector('.bg-yellow-100')
      expect(badge).toBeInTheDocument()
    })

    it('should have outline variant', () => {
      const { container } = render(<UserStatusBadge status="active" />)
      const badge = container.querySelector('[class*="border-transparent"]')
      expect(badge).toBeInTheDocument()
    })

    it('should have font-medium weight', () => {
      const { container } = render(<UserStatusBadge status="active" />)
      const badge = container.querySelector('.font-medium')
      expect(badge).toBeInTheDocument()
    })
  })

  describe('Dark Mode Support', () => {
    it('should include dark mode classes for active', () => {
      const { container } = render(<UserStatusBadge status="active" />)
      const badge = container.querySelector('.dark\\:bg-green-900')
      expect(badge).toBeInTheDocument()
    })

    it('should include dark mode classes for inactive', () => {
      const { container } = render(<UserStatusBadge status="inactive" />)
      const badge = container.querySelector('.dark\\:bg-gray-900')
      expect(badge).toBeInTheDocument()
    })

    it('should include dark mode classes for suspended', () => {
      const { container } = render(<UserStatusBadge status="suspended" />)
      const badge = container.querySelector('.dark\\:bg-red-900')
      expect(badge).toBeInTheDocument()
    })

    it('should include dark mode classes for pending', () => {
      const { container } = render(<UserStatusBadge status="pending" />)
      const badge = container.querySelector('.dark\\:bg-yellow-900')
      expect(badge).toBeInTheDocument()
    })
  })

  describe('Status Types', () => {
    it('should accept active status type', () => {
      expect(() => render(<UserStatusBadge status="active" />)).not.toThrow()
    })

    it('should accept inactive status type', () => {
      expect(() => render(<UserStatusBadge status="inactive" />)).not.toThrow()
    })

    it('should accept suspended status type', () => {
      expect(() => render(<UserStatusBadge status="suspended" />)).not.toThrow()
    })

    it('should accept pending status type', () => {
      expect(() => render(<UserStatusBadge status="pending" />)).not.toThrow()
    })
  })

  describe('Visual Semantics', () => {
    it('should use green for positive status (active)', () => {
      const { container } = render(<UserStatusBadge status="active" />)
      expect(container.querySelector('.bg-green-100')).toBeInTheDocument()
      expect(container.querySelector('.text-green-800')).toBeInTheDocument()
    })

    it('should use red for negative status (suspended)', () => {
      const { container } = render(<UserStatusBadge status="suspended" />)
      expect(container.querySelector('.bg-red-100')).toBeInTheDocument()
      expect(container.querySelector('.text-red-800')).toBeInTheDocument()
    })

    it('should use yellow for warning status (pending)', () => {
      const { container } = render(<UserStatusBadge status="pending" />)
      expect(container.querySelector('.bg-yellow-100')).toBeInTheDocument()
      expect(container.querySelector('.text-yellow-800')).toBeInTheDocument()
    })

    it('should use gray for neutral status (inactive)', () => {
      const { container } = render(<UserStatusBadge status="inactive" />)
      expect(container.querySelector('.bg-gray-100')).toBeInTheDocument()
      expect(container.querySelector('.text-gray-800')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should render as a visible element', () => {
      render(<UserStatusBadge status="active" />)
      const badge = screen.getByText('Activo')
      expect(badge).toBeVisible()
    })

    it('should contain readable text for all statuses', () => {
      const { rerender } = render(<UserStatusBadge status="active" />)
      expect(screen.getByText('Activo')).toBeInTheDocument()

      rerender(<UserStatusBadge status="inactive" />)
      expect(screen.getByText('Inactivo')).toBeInTheDocument()

      rerender(<UserStatusBadge status="suspended" />)
      expect(screen.getByText('Suspendido')).toBeInTheDocument()

      rerender(<UserStatusBadge status="pending" />)
      expect(screen.getByText('Pendiente')).toBeInTheDocument()
    })
  })
})
