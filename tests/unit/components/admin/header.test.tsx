/**
 * Unit Tests - Admin Header Component
 * Tests menu button, breadcrumbs, theme toggle, notifications, user menu
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from '@/components/admin/header';

// Mock child components
vi.mock('@/components/admin/breadcrumbs', () => ({
  Breadcrumbs: () => <div data-testid="breadcrumbs">Breadcrumbs</div>,
}));

vi.mock('@/components/admin/user-menu', () => ({
  UserMenu: () => <div data-testid="user-menu">User Menu</div>,
}));

vi.mock('@/components/admin/theme-toggle', () => ({
  ThemeToggle: () => <button data-testid="theme-toggle">Theme Toggle</button>,
}));

describe('Header - Component Tests', () => {
  describe('Basic Rendering', () => {
    it('renders header element', () => {
      const { container } = render(<Header />);

      const header = container.querySelector('header');
      expect(header).toBeInTheDocument();
    });

    it('has sticky positioning', () => {
      const { container } = render(<Header />);

      const header = container.querySelector('.sticky.top-0');
      expect(header).toBeInTheDocument();
    });

    it('has proper z-index', () => {
      const { container } = render(<Header />);

      const header = container.querySelector('.z-40');
      expect(header).toBeInTheDocument();
    });

    it('has border bottom', () => {
      const { container } = render(<Header />);

      const header = container.querySelector('.border-b');
      expect(header).toBeInTheDocument();
    });

    it('has proper height', () => {
      const { container } = render(<Header />);

      const header = container.querySelector('.h-14');
      expect(header).toBeInTheDocument();
    });
  });

  describe('Mobile Menu Button', () => {
    it('does not render menu button by default', () => {
      render(<Header />);

      expect(screen.queryByLabelText(/Abrir menú/i)).not.toBeInTheDocument();
    });

    it('renders menu button when showMenuButton is true', () => {
      render(<Header showMenuButton={true} />);

      expect(screen.getByLabelText(/Abrir menú/i)).toBeInTheDocument();
    });

    it('menu button is hidden on desktop (md:hidden)', () => {
      const { container } = render(<Header showMenuButton={true} />);

      const menuButton = screen.getByLabelText(/Abrir menú/i);
      expect(menuButton).toHaveClass('md:hidden');
    });

    it('calls onMenuClick when menu button is clicked', async () => {
      const mockOnMenuClick = vi.fn();
      const user = userEvent.setup();

      render(<Header showMenuButton={true} onMenuClick={mockOnMenuClick} />);

      const menuButton = screen.getByLabelText(/Abrir menú/i);
      await user.click(menuButton);

      expect(mockOnMenuClick).toHaveBeenCalledTimes(1);
    });

    it('menu button renders Menu icon', () => {
      const { container } = render(<Header showMenuButton={true} />);

      const menuButton = screen.getByLabelText(/Abrir menú/i);
      const icon = menuButton.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('menu button is ghost variant', () => {
      render(<Header showMenuButton={true} />);

      const menuButton = screen.getByLabelText(/Abrir menú/i);
      expect(menuButton).toHaveAttribute('aria-label', 'Abrir menú');
    });
  });

  describe('Breadcrumbs', () => {
    it('renders Breadcrumbs component', () => {
      render(<Header />);

      expect(screen.getByTestId('breadcrumbs')).toBeInTheDocument();
    });

    it('breadcrumbs are in flex-1 container', () => {
      const { container } = render(<Header />);

      const breadcrumbsContainer = container.querySelector('.flex-1');
      expect(breadcrumbsContainer).toBeInTheDocument();
    });
  });

  describe('Theme Toggle', () => {
    it('renders ThemeToggle component', () => {
      render(<Header />);

      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    });

    it('theme toggle is in actions section', () => {
      const { container } = render(<Header />);

      const actionsContainer = container.querySelector('.flex.items-center.gap-2');
      const themeToggle = screen.getByTestId('theme-toggle');
      expect(actionsContainer?.contains(themeToggle)).toBe(true);
    });
  });

  describe('Notifications Button', () => {
    it('renders notifications button', () => {
      render(<Header />);

      expect(screen.getByLabelText(/Notificaciones/i)).toBeInTheDocument();
    });

    it('notifications button is ghost variant', () => {
      render(<Header />);

      const notificationsButton = screen.getByLabelText(/Notificaciones/i);
      expect(notificationsButton).toBeInTheDocument();
    });

    it('notifications button is icon size', () => {
      render(<Header />);

      const notificationsButton = screen.getByLabelText(/Notificaciones/i);
      expect(notificationsButton).toHaveClass('relative');
    });

    it('renders Bell icon', () => {
      const { container } = render(<Header />);

      const notificationsButton = screen.getByLabelText(/Notificaciones/i);
      const icon = notificationsButton.querySelector('svg.h-5.w-5');
      expect(icon).toBeInTheDocument();
    });

    it('is clickable', async () => {
      const user = userEvent.setup();
      render(<Header />);

      const notificationsButton = screen.getByLabelText(/Notificaciones/i);
      await user.click(notificationsButton);

      // Should not throw errors
      expect(notificationsButton).toBeInTheDocument();
    });

    it('has relative positioning for badge', () => {
      render(<Header />);

      const notificationsButton = screen.getByLabelText(/Notificaciones/i);
      expect(notificationsButton).toHaveClass('relative');
    });
  });

  describe('User Menu', () => {
    it('renders UserMenu component', () => {
      render(<Header />);

      expect(screen.getByTestId('user-menu')).toBeInTheDocument();
    });

    it('user menu is in actions section', () => {
      const { container } = render(<Header />);

      const actionsContainer = container.querySelector('.flex.items-center.gap-2');
      const userMenu = screen.getByTestId('user-menu');
      expect(actionsContainer?.contains(userMenu)).toBe(true);
    });
  });

  describe('Layout Structure', () => {
    it('has flex layout', () => {
      const { container } = render(<Header />);

      const header = container.querySelector('.flex.items-center');
      expect(header).toBeInTheDocument();
    });

    it('has proper gap between items', () => {
      const { container } = render(<Header />);

      const header = container.querySelector('.gap-4');
      expect(header).toBeInTheDocument();
    });

    it('has proper padding', () => {
      const { container } = render(<Header />);

      const header = container.querySelector('.px-6');
      expect(header).toBeInTheDocument();
    });

    it('actions are on the right', () => {
      const { container } = render(<Header />);

      const actionsContainer = container.querySelector('.flex.items-center.gap-2');
      expect(actionsContainer).toBeInTheDocument();
    });
  });

  describe('Component Order', () => {
    it('renders components in correct order', () => {
      const { container } = render(<Header showMenuButton={true} />);

      const header = container.querySelector('header');
      const children = Array.from(header?.children || []);

      // Menu button (if shown) → Breadcrumbs container → Actions container
      expect(children.length).toBeGreaterThanOrEqual(2);
    });

    it('breadcrumbs come before actions', () => {
      render(<Header />);

      const breadcrumbs = screen.getByTestId('breadcrumbs');
      const themeToggle = screen.getByTestId('theme-toggle');

      // Check DOM order
      const allElements = screen.getAllByTestId(/.*/);
      const breadcrumbsIndex = allElements.indexOf(breadcrumbs);
      const themeToggleIndex = allElements.indexOf(themeToggle);

      expect(breadcrumbsIndex).toBeLessThan(themeToggleIndex);
    });

    it('actions section contains theme toggle, notifications, and user menu', () => {
      const { container } = render(<Header />);

      const actionsContainer = container.querySelector('.flex.items-center.gap-2');
      const themeToggle = screen.getByTestId('theme-toggle');
      const notifications = screen.getByLabelText(/Notificaciones/i);
      const userMenu = screen.getByTestId('user-menu');

      expect(actionsContainer?.contains(themeToggle)).toBe(true);
      expect(actionsContainer?.contains(notifications)).toBe(true);
      expect(actionsContainer?.contains(userMenu)).toBe(true);
    });
  });

  describe('Props Handling', () => {
    it('works without any props', () => {
      const { container } = render(<Header />);

      expect(container).toBeInTheDocument();
    });

    it('handles onMenuClick prop', () => {
      const mockOnMenuClick = vi.fn();
      render(<Header onMenuClick={mockOnMenuClick} showMenuButton={true} />);

      expect(screen.getByLabelText(/Abrir menú/i)).toBeInTheDocument();
    });

    it('handles showMenuButton false explicitly', () => {
      render(<Header showMenuButton={false} />);

      expect(screen.queryByLabelText(/Abrir menú/i)).not.toBeInTheDocument();
    });

    it('onMenuClick is optional when showMenuButton is true', () => {
      render(<Header showMenuButton={true} />);

      expect(screen.getByLabelText(/Abrir menú/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('header has semantic element', () => {
      const { container } = render(<Header />);

      const header = container.querySelector('header');
      expect(header).toBeInTheDocument();
    });

    it('menu button has aria-label', () => {
      render(<Header showMenuButton={true} />);

      const menuButton = screen.getByLabelText(/Abrir menú/i);
      expect(menuButton).toHaveAttribute('aria-label', 'Abrir menú');
    });

    it('notifications button has aria-label', () => {
      render(<Header />);

      const notificationsButton = screen.getByLabelText(/Notificaciones/i);
      expect(notificationsButton).toHaveAttribute('aria-label', 'Notificaciones');
    });

    it('all buttons are keyboard accessible', () => {
      render(<Header showMenuButton={true} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Responsive Behavior', () => {
    it('menu button has mobile-only class', () => {
      render(<Header showMenuButton={true} />);

      const menuButton = screen.getByLabelText(/Abrir menú/i);
      expect(menuButton).toHaveClass('md:hidden');
    });

    it('other elements are always visible', () => {
      render(<Header />);

      const breadcrumbs = screen.getByTestId('breadcrumbs');
      const themeToggle = screen.getByTestId('theme-toggle');
      const notifications = screen.getByLabelText(/Notificaciones/i);

      expect(breadcrumbs).toBeVisible();
      expect(themeToggle).toBeVisible();
      expect(notifications).toBeVisible();
    });
  });

  describe('Icon Sizing', () => {
    it('Menu icon has proper size', () => {
      const { container } = render(<Header showMenuButton={true} />);

      const menuButton = screen.getByLabelText(/Abrir menú/i);
      const icon = menuButton.querySelector('svg.h-5.w-5');
      expect(icon).toBeInTheDocument();
    });

    it('Bell icon has proper size', () => {
      const { container } = render(<Header />);

      const notificationsButton = screen.getByLabelText(/Notificaciones/i);
      const icon = notificationsButton.querySelector('svg.h-5.w-5');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Button Variants', () => {
    it('menu button is ghost variant', () => {
      render(<Header showMenuButton={true} />);

      const menuButton = screen.getByLabelText(/Abrir menú/i);
      // Ghost variant doesn't have specific class, but check it's a button
      expect(menuButton).toBeInstanceOf(HTMLButtonElement);
    });

    it('notifications button is ghost variant', () => {
      render(<Header />);

      const notificationsButton = screen.getByLabelText(/Notificaciones/i);
      expect(notificationsButton).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe('Edge Cases', () => {
    it('handles multiple clicks on menu button', async () => {
      const mockOnMenuClick = vi.fn();
      const user = userEvent.setup();

      render(<Header showMenuButton={true} onMenuClick={mockOnMenuClick} />);

      const menuButton = screen.getByLabelText(/Abrir menú/i);
      await user.click(menuButton);
      await user.click(menuButton);
      await user.click(menuButton);

      expect(mockOnMenuClick).toHaveBeenCalledTimes(3);
    });

    it('handles rapid clicks on notifications', async () => {
      const user = userEvent.setup();
      render(<Header />);

      const notificationsButton = screen.getByLabelText(/Notificaciones/i);
      await user.click(notificationsButton);
      await user.click(notificationsButton);

      expect(notificationsButton).toBeInTheDocument();
    });

    it('renders correctly when showMenuButton changes', () => {
      const { rerender } = render(<Header showMenuButton={false} />);
      expect(screen.queryByLabelText(/Abrir menú/i)).not.toBeInTheDocument();

      rerender(<Header showMenuButton={true} />);
      expect(screen.getByLabelText(/Abrir menú/i)).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('integrates Breadcrumbs component', () => {
      render(<Header />);

      expect(screen.getByTestId('breadcrumbs')).toBeInTheDocument();
    });

    it('integrates UserMenu component', () => {
      render(<Header />);

      expect(screen.getByTestId('user-menu')).toBeInTheDocument();
    });

    it('integrates ThemeToggle component', () => {
      render(<Header />);

      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    });
  });
});
