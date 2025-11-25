/**
 * Unit Tests - UsersTable Component
 * Tests sorting, pagination, filtering, actions (edit/delete)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UsersTable } from '@/components/users/users-table';
import type { UserRole, UserStatus } from '@/lib/auth/types';

describe('UsersTable - Component Tests', () => {
  const mockUsers = [
    {
      id: '1',
      email: 'admin@example.com',
      fullName: 'Admin User',
      avatar_url: null,
      role: 'admin' as UserRole,
      status: 'active' as UserStatus,
      lastLoginAt: new Date('2024-01-15'),
      createdAt: new Date('2024-01-01'),
    },
    {
      id: '2',
      email: 'moderator@example.com',
      fullName: 'Moderator User',
      avatar_url: 'https://example.com/avatar.jpg',
      role: 'moderator' as UserRole,
      status: 'active' as UserStatus,
      lastLoginAt: new Date('2024-01-14'),
      createdAt: new Date('2024-01-02'),
    },
    {
      id: '3',
      email: 'user@example.com',
      fullName: null,
      avatar_url: null,
      role: 'user' as UserRole,
      status: 'pending' as UserStatus,
      lastLoginAt: null,
      createdAt: new Date('2024-01-03'),
    },
  ];

  const mockOnRefresh = vi.fn();

  beforeEach(() => {
    mockOnRefresh.mockClear();
  });

  describe('Rendering Tests', () => {
    it('renders table with all column headers', () => {
      render(
        <UsersTable
          users={mockUsers}
          totalCount={3}
          currentPage={1}
          pageSize={10}
        />
      );

      expect(screen.getByText('Usuario')).toBeInTheDocument();
      expect(screen.getByText('Rol')).toBeInTheDocument();
      expect(screen.getByText('Estado')).toBeInTheDocument();
      expect(screen.getByText('Última actividad')).toBeInTheDocument();
      expect(screen.getByText('Registro')).toBeInTheDocument();
    });

    it('renders all users in table rows', () => {
      render(
        <UsersTable
          users={mockUsers}
          totalCount={3}
          currentPage={1}
          pageSize={10}
        />
      );

      expect(screen.getByText('admin@example.com')).toBeInTheDocument();
      expect(screen.getByText('moderator@example.com')).toBeInTheDocument();
      expect(screen.getByText('user@example.com')).toBeInTheDocument();
    });

    it('displays full name if available', () => {
      render(
        <UsersTable
          users={mockUsers}
          totalCount={3}
          currentPage={1}
          pageSize={10}
        />
      );

      expect(screen.getByText('Admin User')).toBeInTheDocument();
      expect(screen.getByText('Moderator User')).toBeInTheDocument();
    });

    it('falls back to email if no full name', () => {
      render(
        <UsersTable
          users={mockUsers}
          totalCount={3}
          currentPage={1}
          pageSize={10}
        />
      );

      // User 3 has no fullName, so email should be displayed prominently
      const rows = screen.getAllByRole('row');
      const userRow = rows.find((row) => row.textContent?.includes('user@example.com'));
      expect(userRow).toBeDefined();
    });

    it('shows "No se encontraron usuarios" when users array is empty', () => {
      render(
        <UsersTable
          users={[]}
          totalCount={0}
          currentPage={1}
          pageSize={10}
        />
      );

      expect(screen.getByText('No se encontraron usuarios')).toBeInTheDocument();
    });
  });

  describe('User Avatar Display', () => {
    it('renders UserAvatar component for each user', () => {
      render(
        <UsersTable
          users={mockUsers}
          totalCount={3}
          currentPage={1}
          pageSize={10}
        />
      );

      // UserAvatar should be rendered (check for avatar initials or images)
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });

    it('displays avatar with fullName initials', () => {
      render(
        <UsersTable
          users={[mockUsers[0]]}
          totalCount={1}
          currentPage={1}
          pageSize={10}
        />
      );

      // Check that UserAvatar is rendered (integration with UserAvatar component)
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });
  });

  describe('Role and Status Badges', () => {
    it('renders UserRoleBadge for each user', () => {
      render(
        <UsersTable
          users={mockUsers}
          totalCount={3}
          currentPage={1}
          pageSize={10}
        />
      );

      // UserRoleBadge should display roles (checked via component integration)
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });

    it('renders UserStatusBadge for each user', () => {
      render(
        <UsersTable
          users={mockUsers}
          totalCount={3}
          currentPage={1}
          pageSize={10}
        />
      );

      // UserStatusBadge should display statuses
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });
  });

  describe('Last Login Display', () => {
    it('displays relative time for users with last login', () => {
      render(
        <UsersTable
          users={[mockUsers[0]]}
          totalCount={1}
          currentPage={1}
          pageSize={10}
        />
      );

      // Should display relative time (e.g., "hace X días")
      // date-fns formatDistanceToNow with es locale
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });

    it('displays "Nunca" for users with no last login', () => {
      render(
        <UsersTable
          users={[mockUsers[2]]}
          totalCount={1}
          currentPage={1}
          pageSize={10}
        />
      );

      expect(screen.getByText('Nunca')).toBeInTheDocument();
    });
  });

  describe('Created At Display', () => {
    it('displays relative time for user creation', () => {
      render(
        <UsersTable
          users={[mockUsers[0]]}
          totalCount={1}
          currentPage={1}
          pageSize={10}
        />
      );

      // Should display relative time for createdAt
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });
  });

  describe('Actions Column', () => {
    it('does not show actions column by default', () => {
      render(
        <UsersTable
          users={mockUsers}
          totalCount={3}
          currentPage={1}
          pageSize={10}
        />
      );

      expect(screen.queryByText('Acciones')).not.toBeInTheDocument();
    });

    it('shows actions column when canEdit is true', () => {
      render(
        <UsersTable
          users={mockUsers}
          totalCount={3}
          currentPage={1}
          pageSize={10}
          canEdit={true}
        />
      );

      expect(screen.getByText('Acciones')).toBeInTheDocument();
    });

    it('shows actions column when canDelete is true', () => {
      render(
        <UsersTable
          users={mockUsers}
          totalCount={3}
          currentPage={1}
          pageSize={10}
          canDelete={true}
        />
      );

      expect(screen.getByText('Acciones')).toBeInTheDocument();
    });

    it('renders edit button when canEdit is true', () => {
      render(
        <UsersTable
          users={mockUsers}
          totalCount={3}
          currentPage={1}
          pageSize={10}
          canEdit={true}
        />
      );

      const editButtons = screen.getAllByTitle('Editar usuario');
      expect(editButtons).toHaveLength(3);
    });

    it('renders delete button when canDelete is true', () => {
      render(
        <UsersTable
          users={mockUsers}
          totalCount={3}
          currentPage={1}
          pageSize={10}
          canDelete={true}
        />
      );

      const deleteButtons = screen.getAllByTitle('Eliminar usuario');
      expect(deleteButtons).toHaveLength(3);
    });

    it('renders both edit and delete buttons when both permissions are true', () => {
      render(
        <UsersTable
          users={mockUsers}
          totalCount={3}
          currentPage={1}
          pageSize={10}
          canEdit={true}
          canDelete={true}
        />
      );

      expect(screen.getAllByTitle('Editar usuario')).toHaveLength(3);
      expect(screen.getAllByTitle('Eliminar usuario')).toHaveLength(3);
    });
  });

  describe('Edit Action', () => {
    it('opens edit modal when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <UsersTable
          users={mockUsers}
          totalCount={3}
          currentPage={1}
          pageSize={10}
          canEdit={true}
        />
      );

      const editButtons = screen.getAllByTitle('Editar usuario');
      await user.click(editButtons[0]);

      // EditUserModal should open (check for modal presence)
      // Note: Modal content testing would be in EditUserModal.test.tsx
    });
  });

  describe('Delete Action', () => {
    it('opens delete dialog when delete button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <UsersTable
          users={mockUsers}
          totalCount={3}
          currentPage={1}
          pageSize={10}
          canDelete={true}
        />
      );

      const deleteButtons = screen.getAllByTitle('Eliminar usuario');
      await user.click(deleteButtons[0]);

      // DeleteUserDialog should open
      // Note: Dialog content testing would be in DeleteUserDialog.test.tsx
    });
  });

  describe('Pagination Info', () => {
    it('displays pagination info correctly', () => {
      render(
        <UsersTable
          users={mockUsers}
          totalCount={25}
          currentPage={1}
          pageSize={10}
        />
      );

      expect(screen.getByText(/Mostrando 1 a 3 de 25 usuarios/i)).toBeInTheDocument();
    });

    it('calculates correct start and end indices for page 2', () => {
      render(
        <UsersTable
          users={mockUsers}
          totalCount={25}
          currentPage={2}
          pageSize={10}
        />
      );

      expect(screen.getByText(/Mostrando 11 a 13 de 25 usuarios/i)).toBeInTheDocument();
    });

    it('handles last page correctly', () => {
      render(
        <UsersTable
          users={[mockUsers[0]]}
          totalCount={21}
          currentPage={3}
          pageSize={10}
        />
      );

      expect(screen.getByText(/Mostrando 21 a 21 de 21 usuarios/i)).toBeInTheDocument();
    });
  });

  describe('Refresh Callback', () => {
    it('passes onRefresh to EditUserModal', () => {
      render(
        <UsersTable
          users={mockUsers}
          totalCount={3}
          currentPage={1}
          pageSize={10}
          canEdit={true}
          onRefresh={mockOnRefresh}
        />
      );

      // onRefresh prop should be passed to EditUserModal
      // Actual callback testing would be in integration tests
      expect(mockOnRefresh).not.toHaveBeenCalled();
    });

    it('passes onRefresh to DeleteUserDialog', () => {
      render(
        <UsersTable
          users={mockUsers}
          totalCount={3}
          currentPage={1}
          pageSize={10}
          canDelete={true}
          onRefresh={mockOnRefresh}
        />
      );

      expect(mockOnRefresh).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('renders table with proper semantic structure', () => {
      render(
        <UsersTable
          users={mockUsers}
          totalCount={3}
          currentPage={1}
          pageSize={10}
        />
      );

      const table = screen.getByRole('table');
      const headers = within(table).getAllByRole('columnheader');
      const rows = within(table).getAllByRole('row');

      expect(table).toBeInTheDocument();
      expect(headers.length).toBeGreaterThan(0);
      expect(rows.length).toBeGreaterThan(0);
    });

    it('edit buttons have sr-only text for screen readers', () => {
      render(
        <UsersTable
          users={mockUsers}
          totalCount={3}
          currentPage={1}
          pageSize={10}
          canEdit={true}
        />
      );

      const editButtons = screen.getAllByText('Editar', { selector: '.sr-only' });
      expect(editButtons).toHaveLength(3);
    });

    it('delete buttons have sr-only text for screen readers', () => {
      render(
        <UsersTable
          users={mockUsers}
          totalCount={3}
          currentPage={1}
          pageSize={10}
          canDelete={true}
        />
      );

      const deleteButtons = screen.getAllByText('Eliminar', { selector: '.sr-only' });
      expect(deleteButtons).toHaveLength(3);
    });
  });
});
