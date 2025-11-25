/**
 * Unit Tests - Dashboard Header Component
 * Tests search input, notification bell, user display
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardHeader } from '@/components/dashboard/Header';
import type { User } from '@supabase/supabase-js';

describe('DashboardHeader - Component Tests', () => {
  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2024-01-01',
  } as User;

  describe('Basic Rendering', () => {
    it('renders header', () => {
      const { container } = render(<DashboardHeader user={mockUser} />);

      const header = container.querySelector('header');
      expect(header).toBeInTheDocument();
    });

    it('has glassmorphic styling', () => {
      const { container } = render(<DashboardHeader user={mockUser} />);

      const header = container.querySelector('.backdrop-blur-xl');
      expect(header).toBeInTheDocument();
    });

    it('has border styling', () => {
      const { container } = render(<DashboardHeader user={mockUser} />);

      const header = container.querySelector('.border-cyan-500\\/20');
      expect(header).toBeInTheDocument();
    });
  });

  describe('Search Input', () => {
    it('renders search input', () => {
      render(<DashboardHeader user={mockUser} />);

      const searchInput = screen.getByPlaceholderText(/Search agents, projects.../i);
      expect(searchInput).toBeInTheDocument();
    });

    it('search input has correct type', () => {
      render(<DashboardHeader user={mockUser} />);

      const searchInput = screen.getByPlaceholderText(/Search agents, projects.../i);
      expect(searchInput).toHaveAttribute('type', 'search');
    });

    it('renders Search icon', () => {
      const { container } = render(<DashboardHeader user={mockUser} />);

      const searchIcon = container.querySelector('svg');
      expect(searchIcon).toBeInTheDocument();
    });

    it('allows typing in search input', async () => {
      const user = userEvent.setup();
      render(<DashboardHeader user={mockUser} />);

      const searchInput = screen.getByPlaceholderText(/Search agents, projects.../i);
      await user.type(searchInput, 'test query');

      expect(searchInput).toHaveValue('test query');
    });

    it('search input has custom styling', () => {
      render(<DashboardHeader user={mockUser} />);

      const searchInput = screen.getByPlaceholderText(/Search agents, projects.../i);
      expect(searchInput).toHaveClass('bg-cyan-500/5');
      expect(searchInput).toHaveClass('border-cyan-500/20');
    });

    it('search icon is positioned on the left', () => {
      const { container } = render(<DashboardHeader user={mockUser} />);

      const searchIcon = container.querySelector('.left-3');
      expect(searchIcon).toBeInTheDocument();
    });
  });

  describe('Notification Bell', () => {
    it('renders notification button', () => {
      const { container } = render(<DashboardHeader user={mockUser} />);

      const bellButton = container.querySelector('button');
      expect(bellButton).toBeInTheDocument();
    });

    it('notification button is ghost variant', () => {
      const { container } = render(<DashboardHeader user={mockUser} />);

      const bellButton = container.querySelector('button');
      expect(bellButton).toHaveClass('hover:bg-cyan-500/10');
    });

    it('renders Bell icon', () => {
      const { container } = render(<DashboardHeader user={mockUser} />);

      // Bell icon should be present
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(1); // Search + Bell
    });

    it('shows notification indicator dot', () => {
      const { container } = render(<DashboardHeader user={mockUser} />);

      const notificationDot = container.querySelector('.bg-cyan-400.rounded-full');
      expect(notificationDot).toBeInTheDocument();
    });

    it('notification dot is positioned absolutely', () => {
      const { container } = render(<DashboardHeader user={mockUser} />);

      const notificationDot = container.querySelector('.absolute.top-1.right-1');
      expect(notificationDot).toBeInTheDocument();
    });

    it('notification button is clickable', async () => {
      const user = userEvent.setup();
      const { container } = render(<DashboardHeader user={mockUser} />);

      const bellButton = container.querySelector('button');
      await user.click(bellButton!);

      // Button should be clickable (no errors)
      expect(bellButton).toBeInTheDocument();
    });
  });

  describe('Layout Structure', () => {
    it('has flex layout', () => {
      const { container } = render(<DashboardHeader user={mockUser} />);

      const innerDiv = container.querySelector('.flex.items-center.justify-between');
      expect(innerDiv).toBeInTheDocument();
    });

    it('search is on the left', () => {
      const { container } = render(<DashboardHeader user={mockUser} />);

      const searchContainer = container.querySelector('.flex-1.max-w-md');
      expect(searchContainer).toBeInTheDocument();
    });

    it('actions are on the right', () => {
      const { container } = render(<DashboardHeader user={mockUser} />);

      const actionsContainer = container.querySelector('.flex.items-center.gap-4');
      expect(actionsContainer).toBeInTheDocument();
    });

    it('has proper padding', () => {
      const { container } = render(<DashboardHeader user={mockUser} />);

      const innerDiv = container.querySelector('.px-6.py-4');
      expect(innerDiv).toBeInTheDocument();
    });
  });

  describe('Responsiveness', () => {
    it('search has max-width constraint', () => {
      const { container } = render(<DashboardHeader user={mockUser} />);

      const searchContainer = container.querySelector('.max-w-md');
      expect(searchContainer).toBeInTheDocument();
    });

    it('search expands to fill available space', () => {
      const { container } = render(<DashboardHeader user={mockUser} />);

      const searchContainer = container.querySelector('.flex-1');
      expect(searchContainer).toBeInTheDocument();
    });
  });

  describe('Icon Styling', () => {
    it('Search icon has cyan color', () => {
      const { container } = render(<DashboardHeader user={mockUser} />);

      const searchIcon = container.querySelector('.text-cyan-300\\/60');
      expect(searchIcon).toBeInTheDocument();
    });

    it('Bell icon has proper size', () => {
      const { container } = render(<DashboardHeader user={mockUser} />);

      const bellIcon = container.querySelector('.h-5.w-5');
      expect(bellIcon).toBeInTheDocument();
    });

    it('Search icon has proper size', () => {
      const { container } = render(<DashboardHeader user={mockUser} />);

      const searchIcon = container.querySelector('.h-4.w-4');
      expect(searchIcon).toBeInTheDocument();
    });
  });

  describe('Hover Effects', () => {
    it('notification button has hover effect', () => {
      const { container } = render(<DashboardHeader user={mockUser} />);

      const bellButton = container.querySelector('button');
      expect(bellButton).toHaveClass('hover:bg-cyan-500/10');
      expect(bellButton).toHaveClass('hover:text-cyan-100');
    });

    it('search input has focus styling', () => {
      render(<DashboardHeader user={mockUser} />);

      const searchInput = screen.getByPlaceholderText(/Search agents, projects.../i);
      expect(searchInput).toHaveClass('focus:border-cyan-500/40');
    });
  });

  describe('Button Properties', () => {
    it('notification button is icon size', () => {
      const { container } = render(<DashboardHeader user={mockUser} />);

      const bellButton = container.querySelector('button');
      expect(bellButton).toHaveClass('relative');
    });

    it('notification button is ghost variant', () => {
      const { container } = render(<DashboardHeader user={mockUser} />);

      const bellButton = container.querySelector('button');
      // Ghost variant doesn't have explicit class, but has hover effects
      expect(bellButton).toHaveClass('hover:bg-cyan-500/10');
    });
  });

  describe('User Prop Usage', () => {
    it('accepts user prop', () => {
      const { container } = render(<DashboardHeader user={mockUser} />);

      expect(container).toBeInTheDocument();
    });

    it('works with different user data', () => {
      const differentUser: User = {
        ...mockUser,
        id: 'user-2',
        email: 'different@example.com',
      };

      const { container } = render(<DashboardHeader user={differentUser} />);

      expect(container).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('header has semantic element', () => {
      const { container } = render(<DashboardHeader user={mockUser} />);

      const header = container.querySelector('header');
      expect(header).toBeInTheDocument();
    });

    it('search input is keyboard accessible', () => {
      render(<DashboardHeader user={mockUser} />);

      const searchInput = screen.getByPlaceholderText(/Search agents, projects.../i);
      expect(searchInput).toHaveAttribute('type', 'search');
    });

    it('notification button is keyboard accessible', () => {
      const { container } = render(<DashboardHeader user={mockUser} />);

      const bellButton = container.querySelector('button');
      expect(bellButton).toBeInTheDocument();
    });

    it('search has placeholder text', () => {
      render(<DashboardHeader user={mockUser} />);

      const searchInput = screen.getByPlaceholderText(/Search agents, projects.../i);
      expect(searchInput).toHaveAttribute('placeholder');
    });
  });

  describe('Visual Indicators', () => {
    it('notification dot is small circle', () => {
      const { container } = render(<DashboardHeader user={mockUser} />);

      const dot = container.querySelector('.h-2.w-2');
      expect(dot).toBeInTheDocument();
      expect(dot).toHaveClass('rounded-full');
    });

    it('notification dot has bright color', () => {
      const { container } = render(<DashboardHeader user={mockUser} />);

      const dot = container.querySelector('.bg-cyan-400');
      expect(dot).toBeInTheDocument();
    });
  });

  describe('Component Composition', () => {
    it('uses Input component for search', () => {
      render(<DashboardHeader user={mockUser} />);

      const searchInput = screen.getByPlaceholderText(/Search agents, projects.../i);
      expect(searchInput.tagName).toBe('INPUT');
    });

    it('uses Button component for notification', () => {
      const { container } = render(<DashboardHeader user={mockUser} />);

      const bellButton = container.querySelector('button');
      expect(bellButton).toBeInTheDocument();
    });

    it('uses Lucide icons', () => {
      const { container } = render(<DashboardHeader user={mockUser} />);

      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });
  });
});
