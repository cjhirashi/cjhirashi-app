/**
 * Unit Tests - RecentActivityTable Component
 * Tests activity display, category badges, avatars, date formatting
 */

import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { RecentActivityTable } from '@/components/dashboard/recent-activity-table';
import type { RecentActivity } from '@/lib/db/views';

describe('RecentActivityTable - Component Tests', () => {
  const mockActivities: RecentActivity[] = [
    {
      id: '1',
      user_id: 'user-1',
      user_name: 'John Doe',
      user_email: 'john@example.com',
      action: 'user.create',
      action_category: 'user_management',
      resource_type: 'user',
      created_at: new Date('2024-01-15T10:30:00'),
    },
    {
      id: '2',
      user_id: 'user-2',
      user_name: null,
      user_email: 'jane@example.com',
      action: 'auth.login',
      action_category: 'authentication',
      resource_type: null,
      created_at: new Date('2024-01-14T15:00:00'),
    },
  ];

  describe('Empty State', () => {
    it('renders empty state when no activities', () => {
      render(<RecentActivityTable activities={[]} />);

      expect(screen.getByText('Actividad Reciente')).toBeInTheDocument();
      expect(screen.getByText('No hay actividad registrada')).toBeInTheDocument();
    });

    it('does not render ScrollArea when empty', () => {
      const { container } = render(<RecentActivityTable activities={[]} />);

      const scrollArea = container.querySelector('[data-radix-scroll-area-viewport]');
      expect(scrollArea).not.toBeInTheDocument();
    });
  });

  describe('Rendering with Activities', () => {
    it('renders title', () => {
      render(<RecentActivityTable activities={mockActivities} />);

      expect(screen.getByText('Actividad Reciente')).toBeInTheDocument();
    });

    it('renders "Ver más" link', () => {
      render(<RecentActivityTable activities={mockActivities} />);

      const link = screen.getByText('Ver más');
      expect(link).toBeInTheDocument();
      expect(link.closest('a')).toHaveAttribute('href', '/admin/audit-logs');
    });

    it('renders all activities', () => {
      render(<RecentActivityTable activities={mockActivities} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });

    it('renders activities in ScrollArea', () => {
      const { container } = render(<RecentActivityTable activities={mockActivities} />);

      const scrollArea = container.querySelector('.h-\\[400px\\]');
      expect(scrollArea).toBeInTheDocument();
    });
  });

  describe('User Display', () => {
    it('displays user name when available', () => {
      render(<RecentActivityTable activities={[mockActivities[0]]} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('displays user email', () => {
      render(<RecentActivityTable activities={[mockActivities[0]]} />);

      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    it('falls back to email when no name', () => {
      render(<RecentActivityTable activities={[mockActivities[1]]} />);

      const emailElements = screen.getAllByText('jane@example.com');
      expect(emailElements.length).toBeGreaterThan(0);
    });

    it('displays "Usuario desconocido" when no name or email', () => {
      const activityNoUser: RecentActivity = {
        ...mockActivities[0],
        user_name: null,
        user_email: null,
      };

      render(<RecentActivityTable activities={[activityNoUser]} />);

      expect(screen.getByText('Usuario desconocido')).toBeInTheDocument();
    });
  });

  describe('Avatar Display', () => {
    it('renders avatar for each activity', () => {
      const { container } = render(<RecentActivityTable activities={mockActivities} />);

      const avatars = container.querySelectorAll('[role="img"]');
      expect(avatars.length).toBeGreaterThanOrEqual(2);
    });

    it('displays initials from user name', () => {
      render(<RecentActivityTable activities={[mockActivities[0]]} />);

      expect(screen.getByText('JD')).toBeInTheDocument(); // John Doe
    });

    it('displays initial from email when no name', () => {
      render(<RecentActivityTable activities={[mockActivities[1]]} />);

      expect(screen.getByText('J')).toBeInTheDocument(); // jane@example.com
    });

    it('displays "U" when no user info', () => {
      const activityNoUser: RecentActivity = {
        ...mockActivities[0],
        user_name: null,
        user_email: null,
      };

      render(<RecentActivityTable activities={[activityNoUser]} />);

      expect(screen.getByText('U')).toBeInTheDocument();
    });
  });

  describe('Action Category Badges', () => {
    it('renders category badge for user_management', () => {
      render(<RecentActivityTable activities={[mockActivities[0]]} />);

      expect(screen.getByText('Gestión de Usuarios')).toBeInTheDocument();
    });

    it('renders category badge for authentication', () => {
      render(<RecentActivityTable activities={[mockActivities[1]]} />);

      expect(screen.getByText('Autenticación')).toBeInTheDocument();
    });

    it('applies correct color for user_management', () => {
      const { container } = render(<RecentActivityTable activities={[mockActivities[0]]} />);

      const badge = screen.getByText('Gestión de Usuarios').closest('.bg-purple-100');
      expect(badge).toBeInTheDocument();
    });

    it('applies correct color for authentication', () => {
      const { container } = render(<RecentActivityTable activities={[mockActivities[1]]} />);

      const badge = screen.getByText('Autenticación').closest('.bg-blue-100');
      expect(badge).toBeInTheDocument();
    });

    it('handles unknown category gracefully', () => {
      const activityUnknown: RecentActivity = {
        ...mockActivities[0],
        action_category: 'unknown_category' as any,
      };

      render(<RecentActivityTable activities={[activityUnknown]} />);

      expect(screen.getByText('unknown_category')).toBeInTheDocument();
    });
  });

  describe('Action Display', () => {
    it('displays action name', () => {
      render(<RecentActivityTable activities={[mockActivities[0]]} />);

      expect(screen.getByText(/user.create/)).toBeInTheDocument();
    });

    it('displays action with resource type', () => {
      render(<RecentActivityTable activities={[mockActivities[0]]} />);

      expect(screen.getByText(/- user/)).toBeInTheDocument();
    });

    it('displays action without resource type when null', () => {
      render(<RecentActivityTable activities={[mockActivities[1]]} />);

      expect(screen.getByText('auth.login')).toBeInTheDocument();
      expect(screen.queryByText(/- null/)).not.toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('displays relative time for activity', () => {
      render(<RecentActivityTable activities={[mockActivities[0]]} />);

      // Should display "hace X días" or similar
      const dateText = screen.getByText(/hace/i);
      expect(dateText).toBeInTheDocument();
    });

    it('uses Spanish locale for date formatting', () => {
      render(<RecentActivityTable activities={[mockActivities[0]]} />);

      // Check for Spanish time phrases
      const text = screen.getByText(/hace/i);
      expect(text).toBeInTheDocument();
    });
  });

  describe('Layout and Structure', () => {
    it('separates activities with borders', () => {
      const { container } = render(<RecentActivityTable activities={mockActivities} />);

      const separators = container.querySelectorAll('.border-b');
      expect(separators.length).toBeGreaterThan(0);
    });

    it('last activity has no bottom border', () => {
      const { container } = render(<RecentActivityTable activities={mockActivities} />);

      const lastActivity = container.querySelector('.last\\:border-b-0');
      expect(lastActivity).toBeInTheDocument();
    });

    it('has flex layout for activity items', () => {
      const { container } = render(<RecentActivityTable activities={[mockActivities[0]]} />);

      const activityItem = container.querySelector('.flex.items-start.gap-4');
      expect(activityItem).toBeInTheDocument();
    });
  });

  describe('Multiple Activities', () => {
    it('renders all activities in order', () => {
      render(<RecentActivityTable activities={mockActivities} />);

      const activities = screen.getAllByText(/user\.create|auth\.login/);
      expect(activities.length).toBeGreaterThanOrEqual(2);
    });

    it('handles large number of activities', () => {
      const manyActivities: RecentActivity[] = Array.from({ length: 20 }, (_, i) => ({
        id: `activity-${i}`,
        user_id: `user-${i}`,
        user_name: `User ${i}`,
        user_email: `user${i}@example.com`,
        action: 'test.action',
        action_category: 'system',
        resource_type: 'test',
        created_at: new Date(),
      }));

      render(<RecentActivityTable activities={manyActivities} />);

      const scrollArea = screen.getByText('User 0').closest('.space-y-4');
      expect(scrollArea).toBeInTheDocument();
    });
  });

  describe('Category Color Mapping', () => {
    it('applies purple for user_management', () => {
      render(<RecentActivityTable activities={[mockActivities[0]]} />);

      const badge = screen.getByText('Gestión de Usuarios');
      expect(badge).toHaveClass('bg-purple-100');
    });

    it('applies blue for authentication', () => {
      render(<RecentActivityTable activities={[mockActivities[1]]} />);

      const badge = screen.getByText('Autenticación');
      expect(badge).toHaveClass('bg-blue-100');
    });

    it('applies green for content_management', () => {
      const activity: RecentActivity = {
        ...mockActivities[0],
        action_category: 'content_management',
      };

      render(<RecentActivityTable activities={[activity]} />);

      const badge = screen.getByText('Gestión de Contenido');
      expect(badge).toHaveClass('bg-green-100');
    });

    it('applies orange for system', () => {
      const activity: RecentActivity = {
        ...mockActivities[0],
        action_category: 'system',
      };

      render(<RecentActivityTable activities={[activity]} />);

      const badge = screen.getByText('Sistema');
      expect(badge).toHaveClass('bg-orange-100');
    });

    it('applies gray for unknown category', () => {
      const activity: RecentActivity = {
        ...mockActivities[0],
        action_category: 'unknown' as any,
      };

      render(<RecentActivityTable activities={[activity]} />);

      const badge = screen.getByText('unknown').closest('.bg-gray-100');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper card structure', () => {
      const { container } = render(<RecentActivityTable activities={mockActivities} />);

      const card = container.querySelector('.p-6');
      expect(card).toBeInTheDocument();
    });

    it('link is keyboard accessible', () => {
      render(<RecentActivityTable activities={mockActivities} />);

      const link = screen.getByText('Ver más').closest('a');
      expect(link).toHaveAttribute('href');
    });

    it('avatars have proper role', () => {
      const { container } = render(<RecentActivityTable activities={mockActivities} />);

      const avatars = container.querySelectorAll('[role="img"]');
      expect(avatars.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('handles activity with all null optional fields', () => {
      const minimalActivity: RecentActivity = {
        id: '1',
        user_id: 'user-1',
        user_name: null,
        user_email: null,
        action: 'test.action',
        action_category: 'system',
        resource_type: null,
        created_at: new Date(),
      };

      render(<RecentActivityTable activities={[minimalActivity]} />);

      expect(screen.getByText('Usuario desconocido')).toBeInTheDocument();
      expect(screen.getByText('test.action')).toBeInTheDocument();
    });

    it('handles very recent activity', () => {
      const recentActivity: RecentActivity = {
        ...mockActivities[0],
        created_at: new Date(),
      };

      render(<RecentActivityTable activities={[recentActivity]} />);

      expect(screen.getByText(/hace/i)).toBeInTheDocument();
    });
  });
});
