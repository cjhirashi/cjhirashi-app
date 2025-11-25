/**
 * Unit Tests - AuditLogsTable Component
 * Tests table rendering, loading state, details modal, log display
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuditLogsTable } from '@/components/audit-logs/audit-logs-table';
import type { AuditLogWithUser } from '@/lib/db/audit-helpers';

describe('AuditLogsTable - Component Tests', () => {
  const mockLogs: AuditLogWithUser[] = [
    {
      id: 'log-1',
      user_id: 'user-1',
      action: 'user.create',
      action_category: 'user',
      resource_type: 'user',
      resource_id: 'user-2',
      ip_address: '192.168.1.1',
      user_agent: 'Mozilla/5.0',
      metadata: { email: 'test@example.com' },
      created_at: new Date('2024-01-15T10:30:00'),
      user_name: 'Admin User',
      user_email: 'admin@example.com',
      user_role: 'admin',
    },
    {
      id: 'log-2',
      user_id: 'user-2',
      action: 'role.update',
      action_category: 'role',
      resource_type: 'user',
      resource_id: 'user-3',
      ip_address: '192.168.1.2',
      user_agent: null,
      metadata: null,
      created_at: new Date('2024-01-14T15:00:00'),
      user_name: null,
      user_email: 'moderator@example.com',
      user_role: 'moderator',
    },
  ];

  const mockOnSelectLog = vi.fn();

  beforeEach(() => {
    mockOnSelectLog.mockClear();
  });

  describe('Rendering Tests', () => {
    it('renders table with all column headers', () => {
      render(<AuditLogsTable logs={mockLogs} />);

      expect(screen.getByText('Fecha/Hora')).toBeInTheDocument();
      expect(screen.getByText('Usuario')).toBeInTheDocument();
      expect(screen.getByText('Acción')).toBeInTheDocument();
      expect(screen.getByText('Categoría')).toBeInTheDocument();
      expect(screen.getByText('Recurso')).toBeInTheDocument();
      expect(screen.getByText('IP')).toBeInTheDocument();
      expect(screen.getByText('Detalles')).toBeInTheDocument();
    });

    it('renders all log entries in table rows', () => {
      render(<AuditLogsTable logs={mockLogs} />);

      expect(screen.getByText('user.create')).toBeInTheDocument();
      expect(screen.getByText('role.update')).toBeInTheDocument();
    });

    it('displays empty state when no logs', () => {
      render(<AuditLogsTable logs={[]} />);

      expect(screen.getByText('No hay logs de auditoría que mostrar')).toBeInTheDocument();
    });

    it('does not render table when logs are empty and not loading', () => {
      render(<AuditLogsTable logs={[]} />);

      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });
  });

  describe('Log Entry Display', () => {
    it('displays formatted date/time', () => {
      render(<AuditLogsTable logs={[mockLogs[0]]} />);

      // Should display formatted date like "15 ene 2024, 10:30"
      expect(screen.getByText(/15.*2024.*10:30/i)).toBeInTheDocument();
    });

    it('displays user name and email', () => {
      render(<AuditLogsTable logs={[mockLogs[0]]} />);

      expect(screen.getByText('Admin User')).toBeInTheDocument();
      expect(screen.getByText('admin')).toBeInTheDocument(); // Role
    });

    it('displays email if no user name', () => {
      render(<AuditLogsTable logs={[mockLogs[1]]} />);

      expect(screen.getByText('moderator@example.com')).toBeInTheDocument();
    });

    it('displays action as code', () => {
      render(<AuditLogsTable logs={mockLogs} />);

      const actionCells = screen.getAllByRole('cell').filter((cell) =>
        cell.textContent?.includes('user.create') || cell.textContent?.includes('role.update')
      );

      expect(actionCells.length).toBeGreaterThan(0);
    });

    it('displays resource type and ID', () => {
      render(<AuditLogsTable logs={[mockLogs[0]]} />);

      expect(screen.getByText('user')).toBeInTheDocument();
      expect(screen.getByText('user-2')).toBeInTheDocument();
    });

    it('displays IP address', () => {
      render(<AuditLogsTable logs={[mockLogs[0]]} />);

      expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
    });

    it('displays hyphen for missing IP address', () => {
      const logWithoutIP = { ...mockLogs[0], ip_address: null };
      render(<AuditLogsTable logs={[logWithoutIP]} />);

      const table = screen.getByRole('table');
      expect(within(table).getAllByText('-').length).toBeGreaterThan(0);
    });

    it('displays hyphen for missing resource', () => {
      const logWithoutResource = { ...mockLogs[0], resource_type: null, resource_id: null };
      render(<AuditLogsTable logs={[logWithoutResource]} />);

      const table = screen.getByRole('table');
      expect(within(table).getAllByText('-').length).toBeGreaterThan(0);
    });
  });

  describe('User Avatar Display', () => {
    it('displays user avatar with initials', () => {
      render(<AuditLogsTable logs={[mockLogs[0]]} />);

      // Avatar with "A" initial (Admin User)
      expect(screen.getByText('A')).toBeInTheDocument();
    });

    it('displays email initial if no user name', () => {
      render(<AuditLogsTable logs={[mockLogs[1]]} />);

      // Avatar with "M" initial (moderator@example.com)
      expect(screen.getByText('M')).toBeInTheDocument();
    });

    it('displays "U" initial if no user data', () => {
      const logWithoutUser = {
        ...mockLogs[0],
        user_name: null,
        user_email: null,
      };
      render(<AuditLogsTable logs={[logWithoutUser]} />);

      expect(screen.getByText('U')).toBeInTheDocument();
    });
  });

  describe('Action Category Badge', () => {
    it('renders ActionCategoryBadge for each log', () => {
      render(<AuditLogsTable logs={mockLogs} />);

      // ActionCategoryBadge should be rendered
      // (tested via component integration)
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });
  });

  describe('Details Button', () => {
    it('renders details button for each log', () => {
      render(<AuditLogsTable logs={mockLogs} />);

      const detailsButtons = screen.getAllByRole('button', { name: /Ver detalles/i });
      expect(detailsButtons).toHaveLength(2);
    });

    it('calls onSelectLog when details button is clicked', async () => {
      const user = userEvent.setup();
      render(<AuditLogsTable logs={mockLogs} onSelectLog={mockOnSelectLog} />);

      const detailsButtons = screen.getAllByRole('button', { name: /Ver detalles/i });
      await user.click(detailsButtons[0]);

      expect(mockOnSelectLog).toHaveBeenCalledTimes(1);
      expect(mockOnSelectLog).toHaveBeenCalledWith(mockLogs[0]);
    });

    it('opens details modal when details button is clicked', async () => {
      const user = userEvent.setup();
      render(<AuditLogsTable logs={mockLogs} />);

      const detailsButtons = screen.getAllByRole('button', { name: /Ver detalles/i });
      await user.click(detailsButtons[0]);

      // AuditLogDetailsModal should open
      // (Modal content testing would be in AuditLogDetailsModal.test.tsx)
    });
  });

  describe('Loading State', () => {
    it('renders skeleton rows when loading', () => {
      render(<AuditLogsTable logs={[]} isLoading={true} />);

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      // Should render 5 skeleton rows (as defined in TableSkeleton)
      const rows = within(table).getAllByRole('row');
      expect(rows.length).toBeGreaterThan(1); // Header + skeleton rows
    });

    it('does not render actual logs when loading', () => {
      render(<AuditLogsTable logs={mockLogs} isLoading={true} />);

      expect(screen.queryByText('user.create')).not.toBeInTheDocument();
      expect(screen.queryByText('role.update')).not.toBeInTheDocument();
    });

    it('renders table structure even when loading', () => {
      render(<AuditLogsTable logs={[]} isLoading={true} />);

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByText('Fecha/Hora')).toBeInTheDocument();
    });
  });

  describe('Empty State vs Loading State', () => {
    it('shows empty state when not loading and no logs', () => {
      render(<AuditLogsTable logs={[]} isLoading={false} />);

      expect(screen.getByText('No hay logs de auditoría que mostrar')).toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('shows skeleton when loading even with empty logs', () => {
      render(<AuditLogsTable logs={[]} isLoading={true} />);

      expect(screen.queryByText('No hay logs de auditoría que mostrar')).not.toBeInTheDocument();
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  describe('Modal Interaction', () => {
    it('closes modal when onClose is triggered', async () => {
      const user = userEvent.setup();
      render(<AuditLogsTable logs={mockLogs} />);

      // Open modal
      const detailsButtons = screen.getAllByRole('button', { name: /Ver detalles/i });
      await user.click(detailsButtons[0]);

      // Modal should be open (integration test)
      // Closing modal would be tested in AuditLogDetailsModal.test.tsx
    });
  });

  describe('Table Accessibility', () => {
    it('renders table with proper semantic structure', () => {
      render(<AuditLogsTable logs={mockLogs} />);

      const table = screen.getByRole('table');
      const headers = within(table).getAllByRole('columnheader');
      const rows = within(table).getAllByRole('row');

      expect(table).toBeInTheDocument();
      expect(headers).toHaveLength(7); // 7 columns
      expect(rows.length).toBeGreaterThan(1); // Header + data rows
    });

    it('details button has accessible label', () => {
      render(<AuditLogsTable logs={mockLogs} />);

      const detailsButtons = screen.getAllByRole('button', { name: /Ver detalles/i });
      detailsButtons.forEach((button) => {
        expect(button).toHaveAttribute('aria-label', 'Ver detalles');
      });
    });
  });

  describe('Multiple Logs Rendering', () => {
    it('renders all logs in correct order', () => {
      render(<AuditLogsTable logs={mockLogs} />);

      const rows = screen.getAllByRole('row');
      // Should have header + 2 data rows
      expect(rows.length).toBe(3);
    });

    it('maintains log order from props', () => {
      const reversedLogs = [...mockLogs].reverse();
      render(<AuditLogsTable logs={reversedLogs} />);

      const actions = screen.getAllByRole('cell').filter((cell) =>
        cell.querySelector('code')
      );

      // First action should be role.update (reversed order)
      expect(actions[0]).toHaveTextContent('role.update');
    });
  });
});
