/**
 * Unit Tests - ProjectCard Component
 * Tests rendering, status badges, metadata, date formatting, navigation
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProjectCard } from '@/components/projects/ProjectCard';

describe('ProjectCard - Component Tests', () => {
  const mockProject = {
    id: 'project-1',
    name: 'E-Commerce Platform',
    description: 'Full-stack e-commerce application with Next.js and Stripe',
    status: 'active',
    updated_at: new Date('2024-01-15T10:30:00'),
    agent: {
      name: 'Code Assistant',
      specialization: 'Full-Stack',
    },
  };

  describe('Rendering Tests', () => {
    it('renders project card with all content', () => {
      render(<ProjectCard project={mockProject} />);

      expect(screen.getByText('E-Commerce Platform')).toBeInTheDocument();
      expect(screen.getByText('Full-stack e-commerce application with Next.js and Stripe')).toBeInTheDocument();
    });

    it('renders project name as heading', () => {
      render(<ProjectCard project={mockProject} />);

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('E-Commerce Platform');
    });

    it('renders description when provided', () => {
      render(<ProjectCard project={mockProject} />);

      expect(screen.getByText('Full-stack e-commerce application with Next.js and Stripe')).toBeInTheDocument();
    });

    it('does not render description when null', () => {
      const projectWithoutDesc = { ...mockProject, description: null };
      render(<ProjectCard project={projectWithoutDesc} />);

      expect(screen.queryByText('Full-stack e-commerce application')).not.toBeInTheDocument();
    });

    it('renders FolderKanban icon', () => {
      const { container } = render(<ProjectCard project={mockProject} />);

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Status Badge', () => {
    it('renders status badge with active status', () => {
      render(<ProjectCard project={mockProject} />);

      expect(screen.getByText('active')).toBeInTheDocument();
    });

    it('renders archived status', () => {
      const archivedProject = { ...mockProject, status: 'archived' };
      render(<ProjectCard project={archivedProject} />);

      expect(screen.getByText('archived')).toBeInTheDocument();
    });

    it('renders completed status', () => {
      const completedProject = { ...mockProject, status: 'completed' };
      render(<ProjectCard project={completedProject} />);

      expect(screen.getByText('completed')).toBeInTheDocument();
    });

    it('applies correct color class for active status', () => {
      const { container } = render(<ProjectCard project={mockProject} />);

      const badge = screen.getByText('active').closest('.text-green-300');
      expect(badge).toBeInTheDocument();
    });

    it('applies correct color class for archived status', () => {
      const archivedProject = { ...mockProject, status: 'archived' };
      const { container } = render(<ProjectCard project={archivedProject} />);

      const badge = screen.getByText('archived').closest('.text-gray-300');
      expect(badge).toBeInTheDocument();
    });

    it('applies correct color class for completed status', () => {
      const completedProject = { ...mockProject, status: 'completed' };
      const { container } = render(<ProjectCard project={completedProject} />);

      const badge = screen.getByText('completed').closest('.text-blue-300');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Agent Metadata', () => {
    it('renders agent name when agent exists', () => {
      render(<ProjectCard project={mockProject} />);

      expect(screen.getByText('Code Assistant')).toBeInTheDocument();
    });

    it('renders agent specialization when provided', () => {
      render(<ProjectCard project={mockProject} />);

      expect(screen.getByText('Full-Stack')).toBeInTheDocument();
    });

    it('renders Bot icon with agent info', () => {
      const { container } = render(<ProjectCard project={mockProject} />);

      // Should have FolderKanban + Bot icons
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(1);
    });

    it('does not render agent section when agent is null', () => {
      const projectWithoutAgent = { ...mockProject, agent: null };
      render(<ProjectCard project={projectWithoutAgent} />);

      expect(screen.queryByText('Code Assistant')).not.toBeInTheDocument();
    });

    it('renders agent name without specialization', () => {
      const projectAgentNoSpec = {
        ...mockProject,
        agent: { name: 'Simple Agent', specialization: null },
      };
      render(<ProjectCard project={projectAgentNoSpec} />);

      expect(screen.getByText('Simple Agent')).toBeInTheDocument();
      expect(screen.queryByText('Full-Stack')).not.toBeInTheDocument();
    });
  });

  describe('Updated At Metadata', () => {
    it('renders updated at with relative time', () => {
      render(<ProjectCard project={mockProject} />);

      // Should display relative time like "Updated X days ago"
      expect(screen.getByText(/Updated.*ago/i)).toBeInTheDocument();
    });

    it('renders Calendar icon with updated at', () => {
      const { container } = render(<ProjectCard project={mockProject} />);

      // Calendar icon should be present
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('formats recent dates correctly', () => {
      const recentProject = {
        ...mockProject,
        updated_at: new Date(),
      };
      render(<ProjectCard project={recentProject} />);

      // Should show "Updated less than a minute ago" or similar
      expect(screen.getByText(/Updated.*ago/i)).toBeInTheDocument();
    });
  });

  describe('Open Project Button', () => {
    it('renders Open Project button', () => {
      render(<ProjectCard project={mockProject} />);

      const button = screen.getByRole('button', { name: /Open Project/i });
      expect(button).toBeInTheDocument();
    });

    it('button links to project detail page', () => {
      render(<ProjectCard project={mockProject} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/dashboard/projects/project-1');
    });

    it('button is wrapped in Link component', () => {
      const { container } = render(<ProjectCard project={mockProject} />);

      const link = container.querySelector('a[href="/dashboard/projects/project-1"]');
      expect(link).toBeInTheDocument();
    });
  });

  describe('Styling and Layout', () => {
    it('applies custom className when provided', () => {
      const { container } = render(<ProjectCard project={mockProject} className="custom-class" />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('custom-class');
    });

    it('renders with card border styling', () => {
      const { container } = render(<ProjectCard project={mockProject} />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('border-cyan-500/20');
    });

    it('has gradient background effect', () => {
      const { container } = render(<ProjectCard project={mockProject} />);

      const gradientDiv = container.querySelector('.bg-gradient-to-br');
      expect(gradientDiv).toBeInTheDocument();
    });

    it('icon container has proper styling', () => {
      const { container } = render(<ProjectCard project={mockProject} />);

      const iconContainer = container.querySelector('.bg-cyan-500\\/10');
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer).toHaveClass('border-cyan-500/20');
    });
  });

  describe('Text Truncation', () => {
    it('truncates long project names', () => {
      const projectWithLongName = {
        ...mockProject,
        name: 'This is a very long project name that should be truncated when displayed in the card',
      };
      render(<ProjectCard project={projectWithLongName} />);

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveClass('line-clamp-1');
    });

    it('truncates long descriptions', () => {
      const projectWithLongDesc = {
        ...mockProject,
        description: 'This is a very long description that should be truncated to two lines when displayed in the project card component to maintain consistent layout across all cards and prevent overflow issues',
      };
      render(<ProjectCard project={projectWithLongDesc} />);

      const descParagraph = screen.getByText(/This is a very long description/);
      expect(descParagraph).toHaveClass('line-clamp-2');
    });
  });

  describe('Metadata Section', () => {
    it('renders metadata border separator', () => {
      const { container } = render(<ProjectCard project={mockProject} />);

      const metadataSection = container.querySelector('.border-t.border-cyan-500\\/10');
      expect(metadataSection).toBeInTheDocument();
    });

    it('renders both agent and updated at in metadata', () => {
      render(<ProjectCard project={mockProject} />);

      expect(screen.getByText('Code Assistant')).toBeInTheDocument();
      expect(screen.getByText(/Updated.*ago/i)).toBeInTheDocument();
    });

    it('renders only updated at when no agent', () => {
      const projectWithoutAgent = { ...mockProject, agent: null };
      render(<ProjectCard project={projectWithoutAgent} />);

      expect(screen.queryByText('Code Assistant')).not.toBeInTheDocument();
      expect(screen.getByText(/Updated.*ago/i)).toBeInTheDocument();
    });
  });

  describe('Status Color Mapping', () => {
    it('applies green colors for active status', () => {
      render(<ProjectCard project={mockProject} />);

      const badge = screen.getByText('active');
      expect(badge).toHaveClass('text-green-300');
    });

    it('applies gray colors for archived status', () => {
      const archivedProject = { ...mockProject, status: 'archived' };
      render(<ProjectCard project={archivedProject} />);

      const badge = screen.getByText('archived');
      expect(badge).toHaveClass('text-gray-300');
    });

    it('applies blue colors for completed status', () => {
      const completedProject = { ...mockProject, status: 'completed' };
      render(<ProjectCard project={completedProject} />);

      const badge = screen.getByText('completed');
      expect(badge).toHaveClass('text-blue-300');
    });
  });

  describe('Accessibility', () => {
    it('button has accessible name', () => {
      render(<ProjectCard project={mockProject} />);

      const button = screen.getByRole('button', { name: /Open Project/i });
      expect(button).toBeInTheDocument();
    });

    it('link has proper href attribute', () => {
      render(<ProjectCard project={mockProject} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href');
    });

    it('heading has proper semantic level', () => {
      render(<ProjectCard project={mockProject} />);

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toBeInTheDocument();
    });
  });

  describe('Hover Effects', () => {
    it('has hover transition classes', () => {
      const { container } = render(<ProjectCard project={mockProject} />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('transition-all');
    });

    it('has gradient hover effect div', () => {
      const { container } = render(<ProjectCard project={mockProject} />);

      const hoverGradient = container.querySelector('.group-hover\\:opacity-100');
      expect(hoverGradient).toBeInTheDocument();
    });
  });
});
