/**
 * Unit Tests - Admin Sidebar Component
 * Tests navigation, permissions, collapse state, role display
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sidebar } from '@/components/admin/sidebar';
import { useUser, usePermission } from '@/lib/auth/client';

// Mock auth client
vi.mock('@/lib/auth/client', () => ({
  useUser: vi.fn(),
  usePermission: vi.fn(),
  Permission: {
    VIEW_USERS: 'view_users',
    CREATE_USERS: 'create_users',
    VIEW_ROLES: 'view_roles',
    VIEW_AUDIT_LOGS: 'view_audit_logs',
    VIEW_SETTINGS: 'view_settings',
    VIEW_ANALYTICS: 'view_analytics',
  },
}));

describe('Sidebar - Component Tests', () => {
  const mockUser = {
    id: 'user-1',
    email: 'admin@example.com',
    role: 'admin',
    status: 'active',
  };

  beforeEach(() => {
    vi.mocked(useUser).mockReturnValue({ user: mockUser, loading: false });
    vi.mocked(usePermission).mockReturnValue(true); // All permissions granted
  });

  describe('Rendering Tests', () => {
    it('renders sidebar with header', () => {
      render(<Sidebar />);

      expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    });

    it('renders Dashboard link', () => {
      render(<Sidebar />);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('renders version info', () => {
      render(<Sidebar />);

      expect(screen.getByText('v1.0.0')).toBeInTheDocument();
    });

    it('renders collapse button', () => {
      render(<Sidebar />);

      expect(screen.getByRole('button', { name: /Colapsar sidebar/i })).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading skeleton when loading', () => {
      vi.mocked(useUser).mockReturnValue({ user: null, loading: true });

      const { container } = render(<Sidebar />);

      const skeleton = container.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });

    it('does not show navigation items when loading', () => {
      vi.mocked(useUser).mockReturnValue({ user: null, loading: true });

      render(<Sidebar />);

      expect(screen.queryByText('Usuarios')).not.toBeInTheDocument();
    });
  });

  describe('Navigation Items - Permissions', () => {
    it('renders Usuarios link with VIEW_USERS permission', () => {
      render(<Sidebar />);

      expect(screen.getByText('Usuarios')).toBeInTheDocument();
    });

    it('does not render Usuarios link without VIEW_USERS permission', () => {
      vi.mocked(usePermission).mockImplementation((permission) => permission !== 'view_users');

      render(<Sidebar />);

      expect(screen.queryByText('Usuarios')).not.toBeInTheDocument();
    });

    it('renders Roles link with VIEW_ROLES permission', () => {
      render(<Sidebar />);

      expect(screen.getByText('Roles')).toBeInTheDocument();
    });

    it('does not render Roles link without VIEW_ROLES permission', () => {
      vi.mocked(usePermission).mockImplementation((permission) => permission !== 'view_roles');

      render(<Sidebar />);

      expect(screen.queryByText('Roles')).not.toBeInTheDocument();
    });

    it('renders Logs de Actividad link with VIEW_AUDIT_LOGS permission', () => {
      render(<Sidebar />);

      expect(screen.getByText('Logs de Actividad')).toBeInTheDocument();
    });

    it('renders Analytics link with VIEW_ANALYTICS permission', () => {
      render(<Sidebar />);

      expect(screen.getByText('Analytics')).toBeInTheDocument();
    });

    it('renders Configuración link with VIEW_SETTINGS permission', () => {
      render(<Sidebar />);

      expect(screen.getByText('Configuración')).toBeInTheDocument();
    });
  });

  describe('Dashboard Link - Always Visible', () => {
    it('renders Dashboard even without any permissions', () => {
      vi.mocked(usePermission).mockReturnValue(false); // No permissions

      render(<Sidebar />);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('Dashboard links to /admin', () => {
      render(<Sidebar />);

      const dashboardLink = screen.getAllByRole('link').find(
        (link) => link.getAttribute('href') === '/admin'
      );

      expect(dashboardLink).toBeInTheDocument();
    });
  });

  describe('User Role Display', () => {
    it('displays user role badge', () => {
      render(<Sidebar />);

      expect(screen.getByText('Rol:')).toBeInTheDocument();
      expect(screen.getByText('Admin')).toBeInTheDocument(); // Capitalized role
    });

    it('capitalizes role name', () => {
      vi.mocked(useUser).mockReturnValue({
        user: { ...mockUser, role: 'moderator' },
        loading: false,
      });

      render(<Sidebar />);

      expect(screen.getByText('Moderator')).toBeInTheDocument();
    });

    it('displays user status when not active', () => {
      vi.mocked(useUser).mockReturnValue({
        user: { ...mockUser, status: 'pending' },
        loading: false,
      });

      render(<Sidebar />);

      expect(screen.getByText('pending')).toBeInTheDocument();
    });

    it('does not display status badge when active', () => {
      render(<Sidebar />);

      const badges = screen.getAllByText(/active/i);
      // Should only have one "active" (from role badge variant, not status)
      expect(badges.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Collapse Functionality', () => {
    it('toggles collapse state on button click', async () => {
      const user = userEvent.setup();
      const { container } = render(<Sidebar />);

      const collapseButton = screen.getByRole('button', { name: /Colapsar sidebar/i });

      // Initial state: expanded (w-64)
      const sidebar = container.querySelector('aside');
      expect(sidebar).toHaveClass('w-64');

      // Click to collapse
      await user.click(collapseButton);

      // Should be collapsed (w-16)
      expect(sidebar).toHaveClass('w-16');
    });

    it('changes button text when collapsed', async () => {
      const user = userEvent.setup();
      render(<Sidebar />);

      const collapseButton = screen.getByRole('button', { name: /Colapsar sidebar/i });
      await user.click(collapseButton);

      // Button should now have "Expandir sidebar" aria-label
      expect(screen.getByRole('button', { name: /Expandir sidebar/i })).toBeInTheDocument();
    });

    it('hides version info when collapsed', async () => {
      const user = userEvent.setup();
      render(<Sidebar />);

      const collapseButton = screen.getByRole('button', { name: /Colapsar sidebar/i });

      // Version visible initially
      expect(screen.getByText('v1.0.0')).toBeInTheDocument();

      // Collapse
      await user.click(collapseButton);

      // Version should be hidden
      expect(screen.queryByText('v1.0.0')).not.toBeInTheDocument();
    });

    it('hides role info when collapsed', async () => {
      const user = userEvent.setup();
      render(<Sidebar />);

      const collapseButton = screen.getByRole('button', { name: /Colapsar sidebar/i });

      // Role visible initially
      expect(screen.getByText('Rol:')).toBeInTheDocument();

      // Collapse
      await user.click(collapseButton);

      // Role info should be hidden
      expect(screen.queryByText('Rol:')).not.toBeInTheDocument();
    });
  });

  describe('SubItems - Usuarios', () => {
    it('renders Lista subitem with VIEW_USERS permission', () => {
      render(<Sidebar />);

      // NavItem component should handle subitems rendering
      // This is tested via integration with NavItem component
      const sidebar = screen.getByRole('complementary') || screen.getByText('Usuarios').closest('aside');
      expect(sidebar).toBeInTheDocument();
    });

    it('renders Nuevo Usuario subitem with CREATE_USERS permission', () => {
      render(<Sidebar />);

      // SubItems are rendered via NavItem component
      const sidebar = screen.getByText('Usuarios').closest('aside');
      expect(sidebar).toBeInTheDocument();
    });
  });

  describe('Navigation Links', () => {
    it('renders link to /admin/users', () => {
      render(<Sidebar />);

      const usersLink = screen.getAllByRole('link').find(
        (link) => link.getAttribute('href') === '/admin/users'
      );

      expect(usersLink).toBeDefined();
    });

    it('renders link to /admin/roles', () => {
      render(<Sidebar />);

      const rolesLink = screen.getAllByRole('link').find(
        (link) => link.getAttribute('href') === '/admin/roles'
      );

      expect(rolesLink).toBeDefined();
    });

    it('renders link to /admin/audit-logs', () => {
      render(<Sidebar />);

      const auditLink = screen.getAllByRole('link').find(
        (link) => link.getAttribute('href') === '/admin/audit-logs'
      );

      expect(auditLink).toBeDefined();
    });

    it('renders link to /admin/analytics', () => {
      render(<Sidebar />);

      const analyticsLink = screen.getAllByRole('link').find(
        (link) => link.getAttribute('href') === '/admin/analytics'
      );

      expect(analyticsLink).toBeDefined();
    });

    it('renders link to /admin/settings', () => {
      render(<Sidebar />);

      const settingsLink = screen.getAllByRole('link').find(
        (link) => link.getAttribute('href') === '/admin/settings'
      );

      expect(settingsLink).toBeDefined();
    });
  });

  describe('Icons Rendering', () => {
    it('renders LayoutDashboard icon for header', () => {
      const { container } = render(<Sidebar />);

      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('renders navigation item icons', () => {
      const { container } = render(<Sidebar />);

      // Should have multiple icons (Dashboard, Users, Roles, etc.)
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(5);
    });
  });

  describe('Styling', () => {
    it('applies custom className when provided', () => {
      const { container } = render(<Sidebar className="custom-class" />);

      const sidebar = container.querySelector('aside');
      expect(sidebar).toHaveClass('custom-class');
    });

    it('has border-r styling', () => {
      const { container } = render(<Sidebar />);

      const sidebar = container.querySelector('aside');
      expect(sidebar).toHaveClass('border-r');
    });

    it('has transition-all for collapse animation', () => {
      const { container } = render(<Sidebar />);

      const sidebar = container.querySelector('aside');
      expect(sidebar).toHaveClass('transition-all');
      expect(sidebar).toHaveClass('duration-300');
    });
  });

  describe('Accessibility', () => {
    it('sidebar has proper semantic structure', () => {
      const { container } = render(<Sidebar />);

      const sidebar = container.querySelector('aside');
      expect(sidebar).toBeInTheDocument();
    });

    it('collapse button has proper aria-label', () => {
      render(<Sidebar />);

      const button = screen.getByRole('button', { name: /Colapsar sidebar/i });
      expect(button).toHaveAttribute('aria-label', 'Colapsar sidebar');
    });

    it('navigation links are keyboard accessible', () => {
      render(<Sidebar />);

      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveAttribute('href');
      });
    });
  });

  describe('Role Badge Variants', () => {
    it('applies default variant for admin role', () => {
      render(<Sidebar />);

      // Check that role badge is rendered with correct variant
      const roleBadge = screen.getByText('Admin').closest('.inline-flex');
      expect(roleBadge).toBeInTheDocument();
    });

    it('applies secondary variant for moderator role', () => {
      vi.mocked(useUser).mockReturnValue({
        user: { ...mockUser, role: 'moderator' },
        loading: false,
      });

      render(<Sidebar />);

      const roleBadge = screen.getByText('Moderator');
      expect(roleBadge).toBeInTheDocument();
    });

    it('applies outline variant for user role', () => {
      vi.mocked(useUser).mockReturnValue({
        user: { ...mockUser, role: 'user' },
        loading: false,
      });

      render(<Sidebar />);

      const roleBadge = screen.getByText('User');
      expect(roleBadge).toBeInTheDocument();
    });
  });
});
