/**
 * Unit Tests - DashboardCard Component (Glassmorphic)
 * Tests glassmorphic styling, trend arrows, icon rendering
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { Users, TrendingUp, Activity } from 'lucide-react';

describe('DashboardCard - Component Tests', () => {
  describe('Basic Rendering', () => {
    it('renders title and value', () => {
      render(<DashboardCard title="Total Users" value={250} />);

      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('250')).toBeInTheDocument();
    });

    it('renders with string value', () => {
      render(<DashboardCard title="Status" value="Online" />);

      expect(screen.getByText('Online')).toBeInTheDocument();
    });

    it('renders with numeric value', () => {
      render(<DashboardCard title="Count" value={0} />);

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('renders description when provided', () => {
      render(
        <DashboardCard
          title="Active Users"
          value={150}
          description="Users online now"
        />
      );

      expect(screen.getByText('Users online now')).toBeInTheDocument();
    });

    it('does not render description when not provided', () => {
      render(<DashboardCard title="Users" value={100} />);

      const card = screen.getByText('Users').closest('div');
      expect(card).toBeInTheDocument();
      // No description should be present
    });
  });

  describe('Icon Rendering', () => {
    it('renders icon when provided', () => {
      const { container } = render(
        <DashboardCard title="Users" value={100} icon={Users} />
      );

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('does not render icon when not provided', () => {
      const { container } = render(<DashboardCard title="Users" value={100} />);

      const iconContainer = container.querySelector('.bg-cyan-500\\/10');
      expect(iconContainer).not.toBeInTheDocument();
    });

    it('icon has proper styling', () => {
      const { container } = render(
        <DashboardCard title="Activity" value={50} icon={Activity} />
      );

      const iconWrapper = container.querySelector('.bg-cyan-500\\/10');
      expect(iconWrapper).toBeInTheDocument();
      expect(iconWrapper).toHaveClass('border-cyan-500/20');
    });

    it('renders different icons correctly', () => {
      const { container: container1 } = render(
        <DashboardCard title="Users" value={100} icon={Users} />
      );
      const { container: container2 } = render(
        <DashboardCard title="Trend" value={200} icon={TrendingUp} />
      );

      expect(container1.querySelector('svg')).toBeInTheDocument();
      expect(container2.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Trend Display', () => {
    it('renders positive trend with up arrow', () => {
      const trend = { value: 15, isPositive: true };
      render(<DashboardCard title="Growth" value={500} trend={trend} />);

      expect(screen.getByText(/↑/)).toBeInTheDocument();
      expect(screen.getByText(/15%/)).toBeInTheDocument();
      expect(screen.getByText('vs last month')).toBeInTheDocument();
    });

    it('renders negative trend with down arrow', () => {
      const trend = { value: -10, isPositive: false };
      render(<DashboardCard title="Loss" value={450} trend={trend} />);

      expect(screen.getByText(/↓/)).toBeInTheDocument();
      expect(screen.getByText(/10%/)).toBeInTheDocument();
    });

    it('applies green color to positive trend', () => {
      const trend = { value: 20, isPositive: true };
      const { container } = render(
        <DashboardCard title="Growth" value={100} trend={trend} />
      );

      const trendElement = screen.getByText(/↑/).closest('.text-green-400');
      expect(trendElement).toBeInTheDocument();
    });

    it('applies red color to negative trend', () => {
      const trend = { value: -5, isPositive: false };
      const { container } = render(
        <DashboardCard title="Decline" value={95} trend={trend} />
      );

      const trendElement = screen.getByText(/↓/).closest('.text-red-400');
      expect(trendElement).toBeInTheDocument();
    });

    it('does not render trend when not provided', () => {
      render(<DashboardCard title="Users" value={100} />);

      expect(screen.queryByText(/vs last month/)).not.toBeInTheDocument();
    });

    it('uses absolute value for negative trends', () => {
      const trend = { value: -25, isPositive: false };
      render(<DashboardCard title="Down" value={75} trend={trend} />);

      expect(screen.getByText(/25%/)).toBeInTheDocument();
    });

    it('handles zero trend', () => {
      const trend = { value: 0, isPositive: false };
      render(<DashboardCard title="Stable" value={100} trend={trend} />);

      expect(screen.getByText(/0%/)).toBeInTheDocument();
    });
  });

  describe('Glassmorphic Styling', () => {
    it('has border-cyan-500/20 class', () => {
      const { container } = render(<DashboardCard title="Stat" value={50} />);

      const card = container.querySelector('.border-cyan-500\\/20');
      expect(card).toBeInTheDocument();
    });

    it('has backdrop-blur-xl class', () => {
      const { container } = render(<DashboardCard title="Stat" value={50} />);

      const card = container.querySelector('.backdrop-blur-xl');
      expect(card).toBeInTheDocument();
    });

    it('has gradient background', () => {
      const { container } = render(<DashboardCard title="Stat" value={50} />);

      const card = container.querySelector('.bg-gradient-to-br');
      expect(card).toBeInTheDocument();
    });

    it('has hover effects', () => {
      const { container } = render(<DashboardCard title="Stat" value={50} />);

      const card = container.querySelector('.hover\\:border-cyan-500\\/40');
      expect(card).toBeInTheDocument();
    });

    it('has gradient overlay', () => {
      const { container } = render(<DashboardCard title="Stat" value={50} />);

      const overlay = container.querySelector('.bg-gradient-to-br.from-cyan-500\\/5');
      expect(overlay).toBeInTheDocument();
    });
  });

  describe('Custom ClassName', () => {
    it('applies custom className', () => {
      const { container } = render(
        <DashboardCard title="Stat" value={50} className="custom-class" />
      );

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('custom-class');
    });

    it('merges custom className with default classes', () => {
      const { container } = render(
        <DashboardCard title="Stat" value={50} className="my-custom-class" />
      );

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('my-custom-class');
      expect(card).toHaveClass('border-cyan-500/20');
    });
  });

  describe('Text Styling', () => {
    it('title has cyan-300/80 color', () => {
      render(<DashboardCard title="My Title" value={100} />);

      const title = screen.getByText('My Title');
      expect(title).toHaveClass('text-cyan-300/80');
    });

    it('value has large font size', () => {
      render(<DashboardCard title="Stat" value={1000} />);

      const value = screen.getByText('1000');
      expect(value).toHaveClass('text-3xl');
      expect(value).toHaveClass('font-bold');
      expect(value).toHaveClass('text-cyan-100');
    });

    it('description has muted cyan color', () => {
      render(
        <DashboardCard
          title="Stat"
          value={50}
          description="Details here"
        />
      );

      const description = screen.getByText('Details here');
      expect(description).toHaveClass('text-cyan-300/60');
    });

    it('trend label has muted color', () => {
      const trend = { value: 10, isPositive: true };
      render(<DashboardCard title="Stat" value={100} trend={trend} />);

      const label = screen.getByText('vs last month');
      expect(label).toHaveClass('text-cyan-300/60');
    });
  });

  describe('Layout Structure', () => {
    it('has proper flex layout for title and icon', () => {
      const { container } = render(
        <DashboardCard title="Users" value={100} icon={Users} />
      );

      const header = screen.getByText('Users').closest('.flex.items-center');
      expect(header).toBeInTheDocument();
    });

    it('has relative positioning for overlay', () => {
      const { container } = render(<DashboardCard title="Stat" value={50} />);

      const card = container.querySelector('.relative.overflow-hidden');
      expect(card).toBeInTheDocument();
    });

    it('icon is positioned on the right', () => {
      const { container } = render(
        <DashboardCard title="Users" value={100} icon={Users} />
      );

      const header = screen.getByText('Users').closest('.justify-between');
      expect(header).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles zero value', () => {
      render(<DashboardCard title="Count" value={0} />);

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('handles negative numeric value', () => {
      render(<DashboardCard title="Loss" value={-100} />);

      expect(screen.getByText('-100')).toBeInTheDocument();
    });

    it('handles very large numbers', () => {
      render(<DashboardCard title="Total" value={9999999} />);

      expect(screen.getByText('9999999')).toBeInTheDocument();
    });

    it('handles empty string value', () => {
      render(<DashboardCard title="Status" value="" />);

      const card = screen.getByText('Status').closest('div');
      expect(card).toBeInTheDocument();
    });

    it('handles formatted string value', () => {
      render(<DashboardCard title="Revenue" value="$1,234.56" />);

      expect(screen.getByText('$1,234.56')).toBeInTheDocument();
    });
  });

  describe('Complete Component', () => {
    it('renders all props together', () => {
      const trend = { value: 25, isPositive: true };
      const { container } = render(
        <DashboardCard
          title="Total Revenue"
          value="$50,000"
          description="Monthly income"
          icon={TrendingUp}
          trend={trend}
          className="extra-class"
        />
      );

      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      expect(screen.getByText('$50,000')).toBeInTheDocument();
      expect(screen.getByText('Monthly income')).toBeInTheDocument();
      expect(screen.getByText(/↑/)).toBeInTheDocument();
      expect(screen.getByText(/25%/)).toBeInTheDocument();
      expect(container.querySelector('svg')).toBeInTheDocument();
      expect(container.firstChild).toHaveClass('extra-class');
    });

    it('renders minimal version with only required props', () => {
      render(<DashboardCard title="Simple" value={42} />);

      expect(screen.getByText('Simple')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper semantic structure', () => {
      const { container } = render(<DashboardCard title="Stat" value={100} />);

      const card = container.querySelector('div.p-6');
      expect(card).toBeInTheDocument();
    });

    it('text is readable with proper contrast', () => {
      render(<DashboardCard title="Users" value={100} />);

      const title = screen.getByText('Users');
      const value = screen.getByText('100');

      expect(title).toBeVisible();
      expect(value).toBeVisible();
    });
  });
});
