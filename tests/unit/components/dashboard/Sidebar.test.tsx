/**
 * Unit Tests - Dashboard Sidebar Component
 * Tests navigation, active states, user info, sign out link
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardSidebar } from '@/components/dashboard/Sidebar';
import { usePathname } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

describe('DashboardSidebar - Component Tests', () => {
  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2024-01-01',
  } as User;

  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue('/dashboard');
  });

  describe('Basic Rendering', () => {
    it('renders sidebar', () => {
      const { container } = render(<DashboardSidebar user={mockUser} />);

      const sidebar = container.querySelector('aside');
      expect(sidebar).toBeInTheDocument();
    });

    it('has fixed width', () => {
      const { container } = render(<DashboardSidebar user={mockUser} />);

      const sidebar = container.querySelector('.w-64');
      expect(sidebar).toBeInTheDocument();
    });

    it('has glassmorphic styling', () => {
      const { container } = render(<DashboardSidebar user={mockUser} />);

      const sidebar = container.querySelector('.backdrop-blur-xl');
      expect(sidebar).toBeInTheDocument();
    });

    it('has border styling', () => {
      const { container } = render(<DashboardSidebar user={mockUser} />);

      const sidebar = container.querySelector('.border-cyan-500\\/20');
      expect(sidebar).toBeInTheDocument();
    });
  });

  describe('Logo Section', () => {
    it('renders app name', () => {
      render(<DashboardSidebar user={mockUser} />);

      expect(screen.getByText('CJ Hirashi')).toBeInTheDocument();
    });

    it('renders app tagline', () => {
      render(<DashboardSidebar user={mockUser} />);

      expect(screen.getByText('AI Assistant Platform')).toBeInTheDocument();
    });

    it('app name has gradient text', () => {
      const { container } = render(<DashboardSidebar user={mockUser} />);

      const appName = screen.getByText('CJ Hirashi');
      expect(appName).toHaveClass('bg-gradient-to-r');
      expect(appName).toHaveClass('from-cyan-400');
      expect(appName).toHaveClass('to-blue-500');
      expect(appName).toHaveClass('bg-clip-text');
      expect(appName).toHaveClass('text-transparent');
    });

    it('logo section has border below', () => {
      const { container } = render(<DashboardSidebar user={mockUser} />);

      const logoSection = container.querySelector('.p-6.border-b');
      expect(logoSection).toBeInTheDocument();
    });
  });

  describe('Navigation Items', () => {
    it('renders all navigation items', () => {
      render(<DashboardSidebar user={mockUser} />);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Agents')).toBeInTheDocument();
      expect(screen.getByText('Projects')).toBeInTheDocument();
      expect(screen.getByText('Corpus')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('Dashboard links to /dashboard', () => {
      render(<DashboardSidebar user={mockUser} />);

      const dashboardLink = screen.getByText('Dashboard').closest('a');
      expect(dashboardLink).toHaveAttribute('href', '/dashboard');
    });

    it('Agents links to /dashboard/agents', () => {
      render(<DashboardSidebar user={mockUser} />);

      const agentsLink = screen.getByText('Agents').closest('a');
      expect(agentsLink).toHaveAttribute('href', '/dashboard/agents');
    });

    it('Projects links to /dashboard/projects', () => {
      render(<DashboardSidebar user={mockUser} />);

      const projectsLink = screen.getByText('Projects').closest('a');
      expect(projectsLink).toHaveAttribute('href', '/dashboard/projects');
    });

    it('Corpus links to /dashboard/corpus', () => {
      render(<DashboardSidebar user={mockUser} />);

      const corpusLink = screen.getByText('Corpus').closest('a');
      expect(corpusLink).toHaveAttribute('href', '/dashboard/corpus');
    });

    it('Settings links to /dashboard/settings', () => {
      render(<DashboardSidebar user={mockUser} />);

      const settingsLink = screen.getByText('Settings').closest('a');
      expect(settingsLink).toHaveAttribute('href', '/dashboard/settings');
    });
  });

  describe('Active State', () => {
    it('marks Dashboard as active when on /dashboard', () => {
      vi.mocked(usePathname).mockReturnValue('/dashboard');
      const { container } = render(<DashboardSidebar user={mockUser} />);

      const dashboardLink = screen.getByText('Dashboard').closest('a');
      expect(dashboardLink).toHaveClass('bg-gradient-to-r');
      expect(dashboardLink).toHaveClass('from-cyan-500/20');
    });

    it('marks Agents as active when on /dashboard/agents', () => {
      vi.mocked(usePathname).mockReturnValue('/dashboard/agents');
      const { container } = render(<DashboardSidebar user={mockUser} />);

      const agentsLink = screen.getByText('Agents').closest('a');
      expect(agentsLink).toHaveClass('bg-gradient-to-r');
    });

    it('marks item as active when on subpath', () => {
      vi.mocked(usePathname).mockReturnValue('/dashboard/agents/123');
      const { container } = render(<DashboardSidebar user={mockUser} />);

      const agentsLink = screen.getByText('Agents').closest('a');
      expect(agentsLink).toHaveClass('bg-gradient-to-r');
    });

    it('applies different icon color when active', () => {
      vi.mocked(usePathname).mockReturnValue('/dashboard');
      const { container } = render(<DashboardSidebar user={mockUser} />);

      const dashboardLink = screen.getByText('Dashboard').closest('a');
      const icon = dashboardLink?.querySelector('svg');
      expect(icon).toHaveClass('text-cyan-400');
    });

    it('applies different text color when active', () => {
      vi.mocked(usePathname).mockReturnValue('/dashboard');
      const { container } = render(<DashboardSidebar user={mockUser} />);

      const dashboardText = screen.getByText('Dashboard');
      expect(dashboardText).toHaveClass('text-cyan-100');
    });

    it('non-active items have muted colors', () => {
      vi.mocked(usePathname).mockReturnValue('/dashboard');
      const { container } = render(<DashboardSidebar user={mockUser} />);

      const agentsText = screen.getByText('Agents');
      expect(agentsText).toHaveClass('text-cyan-300/80');

      const agentsLink = agentsText.closest('a');
      const icon = agentsLink?.querySelector('svg');
      expect(icon).toHaveClass('text-cyan-300/60');
    });
  });

  describe('Navigation Icons', () => {
    it('renders icons for all navigation items', () => {
      const { container } = render(<DashboardSidebar user={mockUser} />);

      const navIcons = container.querySelectorAll('nav svg');
      expect(navIcons.length).toBe(5); // 5 nav items
    });

    it('icons have proper sizing', () => {
      const { container } = render(<DashboardSidebar user={mockUser} />);

      const navIcons = container.querySelectorAll('nav svg.h-5.w-5');
      expect(navIcons.length).toBeGreaterThan(0);
    });
  });

  describe('User Info Section', () => {
    it('displays user email', () => {
      render(<DashboardSidebar user={mockUser} />);

      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('displays "User Account" label', () => {
      render(<DashboardSidebar user={mockUser} />);

      expect(screen.getByText('User Account')).toBeInTheDocument();
    });

    it('user section has border above', () => {
      const { container } = render(<DashboardSidebar user={mockUser} />);

      const userSection = container.querySelector('.p-4.border-t');
      expect(userSection).toBeInTheDocument();
    });

    it('email is truncated if too long', () => {
      const longEmailUser: User = {
        ...mockUser,
        email: 'verylongemailaddress@verylongdomain.com',
      };

      render(<DashboardSidebar user={longEmailUser} />);

      const email = screen.getByText('verylongemailaddress@verylongdomain.com');
      expect(email).toHaveClass('truncate');
    });

    it('user info has background styling', () => {
      const { container } = render(<DashboardSidebar user={mockUser} />);

      const userInfo = screen.getByText('test@example.com').closest('.bg-cyan-500\\/5');
      expect(userInfo).toBeInTheDocument();
    });
  });

  describe('Sign Out Link', () => {
    it('renders Sign Out link', () => {
      render(<DashboardSidebar user={mockUser} />);

      expect(screen.getByText('Sign Out')).toBeInTheDocument();
    });

    it('Sign Out links to /auth/sign-out', () => {
      render(<DashboardSidebar user={mockUser} />);

      const signOutLink = screen.getByText('Sign Out').closest('a');
      expect(signOutLink).toHaveAttribute('href', '/auth/sign-out');
    });

    it('Sign Out has red styling', () => {
      const { container } = render(<DashboardSidebar user={mockUser} />);

      const signOutLink = screen.getByText('Sign Out').closest('a');
      expect(signOutLink).toHaveClass('hover:bg-red-500/10');
      expect(signOutLink).toHaveClass('text-red-300/80');
    });

    it('Sign Out has LogOut icon', () => {
      const { container } = render(<DashboardSidebar user={mockUser} />);

      const signOutLink = screen.getByText('Sign Out').closest('a');
      const icon = signOutLink?.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Layout Structure', () => {
    it('has flex column layout', () => {
      const { container } = render(<DashboardSidebar user={mockUser} />);

      const flexContainer = container.querySelector('.flex.flex-col.h-full');
      expect(flexContainer).toBeInTheDocument();
    });

    it('navigation expands to fill space', () => {
      const { container } = render(<DashboardSidebar user={mockUser} />);

      const nav = container.querySelector('nav.flex-1');
      expect(nav).toBeInTheDocument();
    });

    it('navigation has proper spacing', () => {
      const { container } = render(<DashboardSidebar user={mockUser} />);

      const nav = container.querySelector('nav.space-y-2');
      expect(nav).toBeInTheDocument();
    });
  });

  describe('Hover Effects', () => {
    it('navigation items have hover effect', () => {
      const { container } = render(<DashboardSidebar user={mockUser} />);

      const dashboardLink = screen.getByText('Dashboard').closest('a');
      expect(dashboardLink).toHaveClass('hover:bg-cyan-500/10');
      expect(dashboardLink).toHaveClass('hover:border-cyan-500/30');
    });

    it('Sign Out link has red hover effect', () => {
      const { container } = render(<DashboardSidebar user={mockUser} />);

      const signOutLink = screen.getByText('Sign Out').closest('a');
      expect(signOutLink).toHaveClass('hover:bg-red-500/10');
      expect(signOutLink).toHaveClass('hover:text-red-200');
    });
  });

  describe('Accessibility', () => {
    it('sidebar uses semantic aside element', () => {
      const { container } = render(<DashboardSidebar user={mockUser} />);

      const sidebar = container.querySelector('aside');
      expect(sidebar).toBeInTheDocument();
    });

    it('navigation uses semantic nav element', () => {
      const { container } = render(<DashboardSidebar user={mockUser} />);

      const nav = container.querySelector('nav');
      expect(nav).toBeInTheDocument();
    });

    it('all links are keyboard accessible', () => {
      render(<DashboardSidebar user={mockUser} />);

      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveAttribute('href');
      });
    });

    it('heading has proper semantic level', () => {
      render(<DashboardSidebar user={mockUser} />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('CJ Hirashi');
    });
  });

  describe('Different User Data', () => {
    it('displays different user email', () => {
      const differentUser: User = {
        ...mockUser,
        email: 'different@example.com',
      };

      render(<DashboardSidebar user={differentUser} />);

      expect(screen.getByText('different@example.com')).toBeInTheDocument();
    });

    it('works with minimal user data', () => {
      const minimalUser: User = {
        id: 'user-2',
        email: 'minimal@example.com',
      } as User;

      render(<DashboardSidebar user={minimalUser} />);

      expect(screen.getByText('minimal@example.com')).toBeInTheDocument();
    });
  });

  describe('Active State Edge Cases', () => {
    it('does not mark item active on different route', () => {
      vi.mocked(usePathname).mockReturnValue('/dashboard/agents');
      const { container } = render(<DashboardSidebar user={mockUser} />);

      const dashboardLink = screen.getByText('Dashboard').closest('a');
      expect(dashboardLink).not.toHaveClass('bg-gradient-to-r');
    });

    it('handles root dashboard path correctly', () => {
      vi.mocked(usePathname).mockReturnValue('/dashboard');
      const { container } = render(<DashboardSidebar user={mockUser} />);

      const dashboardLink = screen.getByText('Dashboard').closest('a');
      expect(dashboardLink).toHaveClass('bg-gradient-to-r');

      const agentsLink = screen.getByText('Agents').closest('a');
      expect(agentsLink).not.toHaveClass('bg-gradient-to-r');
    });

    it('handles nested paths correctly', () => {
      vi.mocked(usePathname).mockReturnValue('/dashboard/projects/123/edit');
      const { container } = render(<DashboardSidebar user={mockUser} />);

      const projectsLink = screen.getByText('Projects').closest('a');
      expect(projectsLink).toHaveClass('bg-gradient-to-r');
    });
  });

  describe('Visual Hierarchy', () => {
    it('logo is larger than other text', () => {
      render(<DashboardSidebar user={mockUser} />);

      const logo = screen.getByText('CJ Hirashi');
      expect(logo).toHaveClass('text-2xl');
      expect(logo).toHaveClass('font-bold');
    });

    it('navigation items have medium font weight', () => {
      render(<DashboardSidebar user={mockUser} />);

      const dashboardText = screen.getByText('Dashboard');
      expect(dashboardText).toHaveClass('font-medium');
    });

    it('user account label is smaller', () => {
      render(<DashboardSidebar user={mockUser} />);

      const label = screen.getByText('User Account');
      expect(label).toHaveClass('text-xs');
    });
  });
});
