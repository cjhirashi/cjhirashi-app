/**
 * Unit Tests - StatsCard Component
 * Tests value display, trends, variants, loading state, icons
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsCard } from '@/components/dashboard/stats-card';
import { Users, Activity, TrendingUp } from 'lucide-react';

describe('StatsCard - Component Tests', () => {
  describe('Basic Rendering', () => {
    it('renders title and value', () => {
      render(<StatsCard title="Total Users" value={150} />);

      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
    });

    it('renders with string value', () => {
      render(<StatsCard title="Status" value="Active" />);

      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('renders with numeric value', () => {
      render(<StatsCard title="Count" value={0} />);

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('renders description when provided', () => {
      render(<StatsCard title="Users" value={100} description="Total active users" />);

      expect(screen.getByText('Total active users')).toBeInTheDocument();
    });

    it('does not render description when not provided', () => {
      render(<StatsCard title="Users" value={100} />);

      expect(screen.queryByText(/Total active users/)).not.toBeInTheDocument();
    });
  });

  describe('Icon Rendering', () => {
    it('renders icon when provided', () => {
      const { container } = render(
        <StatsCard title="Users" value={100} icon={Users} />
      );

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('does not render icon when not provided', () => {
      const { container } = render(<StatsCard title="Users" value={100} />);

      const iconContainer = container.querySelector('.bg-muted\\/50');
      expect(iconContainer).not.toBeInTheDocument();
    });

    it('renders different icons correctly', () => {
      const { container: container1 } = render(
        <StatsCard title="Activity" value={50} icon={Activity} />
      );
      const { container: container2 } = render(
        <StatsCard title="Trend" value={75} icon={TrendingUp} />
      );

      expect(container1.querySelector('svg')).toBeInTheDocument();
      expect(container2.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Trend Display', () => {
    it('renders positive trend badge', () => {
      const trend = { value: 12, isPositive: true, label: 'vs last month' };
      render(<StatsCard title="Users" value={100} trend={trend} />);

      expect(screen.getByText('+12%')).toBeInTheDocument();
      expect(screen.getByText('vs last month')).toBeInTheDocument();
    });

    it('renders negative trend badge', () => {
      const trend = { value: -5, isPositive: false, label: 'vs last week' };
      render(<StatsCard title="Sales" value={80} trend={trend} />);

      expect(screen.getByText('-5%')).toBeInTheDocument();
      expect(screen.getByText('vs last week')).toBeInTheDocument();
    });

    it('does not render trend when not provided', () => {
      render(<StatsCard title="Users" value={100} />);

      expect(screen.queryByText(/vs last month/)).not.toBeInTheDocument();
    });

    it('applies correct color class to positive trend', () => {
      const trend = { value: 10, isPositive: true, label: 'Up' };
      const { container } = render(<StatsCard title="Growth" value={100} trend={trend} />);

      const badge = screen.getByText('+10%').closest('.bg-green-100');
      expect(badge).toBeInTheDocument();
    });

    it('applies correct color class to negative trend', () => {
      const trend = { value: -8, isPositive: false, label: 'Down' };
      const { container } = render(<StatsCard title="Loss" value={92} trend={trend} />);

      const badge = screen.getByText('-8%').closest('.bg-red-100');
      expect(badge).toBeInTheDocument();
    });

    it('displays trend label below value', () => {
      const trend = { value: 15, isPositive: true, label: 'compared to yesterday' };
      render(<StatsCard title="Traffic" value={1000} trend={trend} />);

      expect(screen.getByText('compared to yesterday')).toBeInTheDocument();
    });
  });

  describe('Variant Styling', () => {
    it('applies default variant styles', () => {
      const { container } = render(
        <StatsCard title="Stat" value={50} variant="default" />
      );

      const card = container.querySelector('.border-l-slate-400');
      expect(card).toBeInTheDocument();
    });

    it('applies success variant styles', () => {
      const { container } = render(
        <StatsCard title="Stat" value={50} variant="success" />
      );

      const card = container.querySelector('.border-l-green-500');
      expect(card).toBeInTheDocument();
    });

    it('applies warning variant styles', () => {
      const { container } = render(
        <StatsCard title="Stat" value={50} variant="warning" />
      );

      const card = container.querySelector('.border-l-yellow-500');
      expect(card).toBeInTheDocument();
    });

    it('applies danger variant styles', () => {
      const { container } = render(
        <StatsCard title="Stat" value={50} variant="danger" />
      );

      const card = container.querySelector('.border-l-red-500');
      expect(card).toBeInTheDocument();
    });

    it('applies info variant styles', () => {
      const { container } = render(
        <StatsCard title="Stat" value={50} variant="info" />
      );

      const card = container.querySelector('.border-l-blue-500');
      expect(card).toBeInTheDocument();
    });

    it('uses default variant when not specified', () => {
      const { container } = render(<StatsCard title="Stat" value={50} />);

      const card = container.querySelector('.border-l-slate-400');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('renders skeleton when loading', () => {
      const { container } = render(
        <StatsCard title="Users" value={100} loading={true} />
      );

      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('does not render actual content when loading', () => {
      render(<StatsCard title="Users" value={100} loading={true} />);

      expect(screen.queryByText('Users')).not.toBeInTheDocument();
      expect(screen.queryByText('100')).not.toBeInTheDocument();
    });

    it('renders with correct variant while loading', () => {
      const { container } = render(
        <StatsCard title="Users" value={100} loading={true} variant="success" />
      );

      const card = container.querySelector('.border-l-green-500');
      expect(card).toBeInTheDocument();
    });

    it('renders actual content when not loading', () => {
      render(<StatsCard title="Users" value={100} loading={false} />);

      expect(screen.getByText('Users')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });
  });

  describe('Complex Combinations', () => {
    it('renders all props together', () => {
      const trend = { value: 20, isPositive: true, label: 'vs last period' };
      const { container } = render(
        <StatsCard
          title="Total Revenue"
          value="$45,231"
          description="This month's revenue"
          icon={TrendingUp}
          trend={trend}
          variant="success"
        />
      );

      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      expect(screen.getByText('$45,231')).toBeInTheDocument();
      expect(screen.getByText("This month's revenue")).toBeInTheDocument();
      expect(screen.getByText('+20%')).toBeInTheDocument();
      expect(screen.getByText('vs last period')).toBeInTheDocument();
      expect(container.querySelector('svg')).toBeInTheDocument();
      expect(container.querySelector('.border-l-green-500')).toBeInTheDocument();
    });

    it('renders without optional props', () => {
      render(<StatsCard title="Simple Stat" value={42} />);

      expect(screen.getByText('Simple Stat')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles zero value', () => {
      render(<StatsCard title="Count" value={0} />);

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('handles negative numeric value', () => {
      render(<StatsCard title="Loss" value={-50} />);

      expect(screen.getByText('-50')).toBeInTheDocument();
    });

    it('handles very large numbers', () => {
      render(<StatsCard title="Total" value={1234567890} />);

      expect(screen.getByText('1234567890')).toBeInTheDocument();
    });

    it('handles empty string value', () => {
      render(<StatsCard title="Status" value="" />);

      const valueElement = screen.getByText((content, element) => {
        return element?.classList.contains('text-3xl') ?? false;
      });
      expect(valueElement).toBeInTheDocument();
    });

    it('handles trend with zero value', () => {
      const trend = { value: 0, isPositive: false, label: 'No change' };
      render(<StatsCard title="Stable" value={100} trend={trend} />);

      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });

  describe('Styling and Layout', () => {
    it('has border-l-4 styling for variant', () => {
      const { container } = render(<StatsCard title="Stat" value={50} />);

      const card = container.querySelector('.border-l-4');
      expect(card).toBeInTheDocument();
    });

    it('value has large font size', () => {
      const { container } = render(<StatsCard title="Stat" value={100} />);

      const value = screen.getByText('100');
      expect(value).toHaveClass('text-3xl');
      expect(value).toHaveClass('font-bold');
    });

    it('title has muted foreground color', () => {
      render(<StatsCard title="My Stat" value={50} />);

      const title = screen.getByText('My Stat');
      expect(title).toHaveClass('text-muted-foreground');
    });

    it('description has smaller font', () => {
      render(<StatsCard title="Stat" value={50} description="Details here" />);

      const description = screen.getByText('Details here');
      expect(description).toHaveClass('text-xs');
    });

    it('icon container has muted background', () => {
      const { container } = render(
        <StatsCard title="Stat" value={50} icon={Users} />
      );

      const iconContainer = container.querySelector('.bg-muted\\/50');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper semantic structure', () => {
      const { container } = render(<StatsCard title="Stat" value={100} />);

      // Card should be a div with proper structure
      expect(container.querySelector('.p-6')).toBeInTheDocument();
    });

    it('text content is readable', () => {
      render(
        <StatsCard
          title="Users"
          value={100}
          description="Total users"
        />
      );

      expect(screen.getByText('Users')).toBeVisible();
      expect(screen.getByText('100')).toBeVisible();
      expect(screen.getByText('Total users')).toBeVisible();
    });
  });
});
