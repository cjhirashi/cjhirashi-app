import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { UserRoleBadge } from '@/components/users/user-role-badge'

describe('UserRoleBadge Component', () => {
  describe('Rendering', () => {
    it('should render admin badge with correct label', () => {
      render(<UserRoleBadge role="admin" />)
      expect(screen.getByText('Administrador')).toBeInTheDocument()
    })

    it('should render moderator badge with correct label', () => {
      render(<UserRoleBadge role="moderator" />)
      expect(screen.getByText('Moderador')).toBeInTheDocument()
    })

    it('should render user badge with correct label', () => {
      render(<UserRoleBadge role="user" />)
      expect(screen.getByText('Usuario')).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('should apply admin styles (red)', () => {
      const { container } = render(<UserRoleBadge role="admin" />)
      const badge = container.querySelector('.bg-red-100')
      expect(badge).toBeInTheDocument()
    })

    it('should apply moderator styles (amber)', () => {
      const { container } = render(<UserRoleBadge role="moderator" />)
      const badge = container.querySelector('.bg-amber-100')
      expect(badge).toBeInTheDocument()
    })

    it('should apply user styles (blue)', () => {
      const { container } = render(<UserRoleBadge role="user" />)
      const badge = container.querySelector('.bg-blue-100')
      expect(badge).toBeInTheDocument()
    })

    it('should have outline variant', () => {
      const { container } = render(<UserRoleBadge role="admin" />)
      const badge = container.querySelector('[class*="border-transparent"]')
      expect(badge).toBeInTheDocument()
    })

    it('should have font-medium weight', () => {
      const { container } = render(<UserRoleBadge role="admin" />)
      const badge = container.querySelector('.font-medium')
      expect(badge).toBeInTheDocument()
    })
  })

  describe('Dark Mode Support', () => {
    it('should include dark mode classes for admin', () => {
      const { container } = render(<UserRoleBadge role="admin" />)
      const badge = container.querySelector('.dark\\:bg-red-900')
      expect(badge).toBeInTheDocument()
    })

    it('should include dark mode classes for moderator', () => {
      const { container } = render(<UserRoleBadge role="moderator" />)
      const badge = container.querySelector('.dark\\:bg-amber-900')
      expect(badge).toBeInTheDocument()
    })

    it('should include dark mode classes for user', () => {
      const { container } = render(<UserRoleBadge role="user" />)
      const badge = container.querySelector('.dark\\:bg-blue-900')
      expect(badge).toBeInTheDocument()
    })
  })

  describe('Role Types', () => {
    it('should accept admin role type', () => {
      expect(() => render(<UserRoleBadge role="admin" />)).not.toThrow()
    })

    it('should accept moderator role type', () => {
      expect(() => render(<UserRoleBadge role="moderator" />)).not.toThrow()
    })

    it('should accept user role type', () => {
      expect(() => render(<UserRoleBadge role="user" />)).not.toThrow()
    })
  })

  describe('Accessibility', () => {
    it('should render as a visible element', () => {
      render(<UserRoleBadge role="admin" />)
      const badge = screen.getByText('Administrador')
      expect(badge).toBeVisible()
    })

    it('should contain readable text for all roles', () => {
      const { rerender } = render(<UserRoleBadge role="admin" />)
      expect(screen.getByText('Administrador')).toBeInTheDocument()

      rerender(<UserRoleBadge role="moderator" />)
      expect(screen.getByText('Moderador')).toBeInTheDocument()

      rerender(<UserRoleBadge role="user" />)
      expect(screen.getByText('Usuario')).toBeInTheDocument()
    })
  })
})
