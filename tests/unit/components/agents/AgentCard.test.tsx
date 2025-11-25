/**
 * Unit Tests - AgentCard Component
 * Tests rendering, badges, models display, navigation
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AgentCard } from '@/components/agents/AgentCard';

describe('AgentCard - Component Tests', () => {
  const mockAgent = {
    id: 'agent-1',
    name: 'Code Assistant',
    description: 'AI agent specialized in code generation',
    specialization: 'Frontend Development',
    has_project_capability: true,
    project_type: 'nextjs',
    agent_models: [
      { tier: 'economy' },
      { tier: 'balanced' },
      { tier: 'premium' },
    ],
  };

  describe('Rendering Tests', () => {
    it('renders agent card with all content', () => {
      render(<AgentCard agent={mockAgent} />);

      expect(screen.getByText('Code Assistant')).toBeInTheDocument();
      expect(screen.getByText('AI agent specialized in code generation')).toBeInTheDocument();
    });

    it('renders agent name', () => {
      render(<AgentCard agent={mockAgent} />);

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Code Assistant');
    });

    it('renders description when provided', () => {
      render(<AgentCard agent={mockAgent} />);

      expect(screen.getByText('AI agent specialized in code generation')).toBeInTheDocument();
    });

    it('does not render description when null', () => {
      const agentWithoutDesc = { ...mockAgent, description: null };
      render(<AgentCard agent={agentWithoutDesc} />);

      expect(screen.queryByText('AI agent specialized in code generation')).not.toBeInTheDocument();
    });

    it('renders Bot icon', () => {
      const { container } = render(<AgentCard agent={mockAgent} />);

      // Check for Bot icon (Lucide icon)
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Specialization Badge', () => {
    it('renders specialization badge when provided', () => {
      render(<AgentCard agent={mockAgent} />);

      expect(screen.getByText('Frontend Development')).toBeInTheDocument();
    });

    it('does not render specialization badge when null', () => {
      const agentWithoutSpec = { ...mockAgent, specialization: null };
      render(<AgentCard agent={agentWithoutSpec} />);

      expect(screen.queryByText('Frontend Development')).not.toBeInTheDocument();
    });
  });

  describe('Project Capability Badge', () => {
    it('renders Projects badge when has_project_capability is true', () => {
      render(<AgentCard agent={mockAgent} />);

      expect(screen.getByText('Projects')).toBeInTheDocument();
    });

    it('does not render Projects badge when has_project_capability is false', () => {
      const agentWithoutProjects = { ...mockAgent, has_project_capability: false };
      render(<AgentCard agent={agentWithoutProjects} />);

      expect(screen.queryByText('Projects')).not.toBeInTheDocument();
    });

    it('renders Zap icon with Projects badge', () => {
      const { container } = render(<AgentCard agent={mockAgent} />);

      // Zap icon should be present
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(1); // Bot + Zap icons
    });
  });

  describe('Models Display', () => {
    it('renders Models section when agent_models exist', () => {
      render(<AgentCard agent={mockAgent} />);

      expect(screen.getByText('Models:')).toBeInTheDocument();
    });

    it('renders all model tier badges', () => {
      render(<AgentCard agent={mockAgent} />);

      expect(screen.getByText('economy')).toBeInTheDocument();
      expect(screen.getByText('balanced')).toBeInTheDocument();
      expect(screen.getByText('premium')).toBeInTheDocument();
    });

    it('does not render Models section when no models', () => {
      const agentWithoutModels = { ...mockAgent, agent_models: [] };
      render(<AgentCard agent={agentWithoutModels} />);

      expect(screen.queryByText('Models:')).not.toBeInTheDocument();
    });

    it('does not render Models section when agent_models is undefined', () => {
      const agentWithoutModels = { ...mockAgent, agent_models: undefined };
      render(<AgentCard agent={agentWithoutModels} />);

      expect(screen.queryByText('Models:')).not.toBeInTheDocument();
    });

    it('renders single model tier correctly', () => {
      const agentWithOneModel = {
        ...mockAgent,
        agent_models: [{ tier: 'premium' }],
      };
      render(<AgentCard agent={agentWithOneModel} />);

      expect(screen.getByText('premium')).toBeInTheDocument();
      expect(screen.queryByText('economy')).not.toBeInTheDocument();
    });
  });

  describe('View Details Button', () => {
    it('renders View Details button', () => {
      render(<AgentCard agent={mockAgent} />);

      const button = screen.getByRole('button', { name: /View Details/i });
      expect(button).toBeInTheDocument();
    });

    it('button links to agent detail page', () => {
      render(<AgentCard agent={mockAgent} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/dashboard/agents/agent-1');
    });

    it('button is wrapped in Link component', () => {
      const { container } = render(<AgentCard agent={mockAgent} />);

      const link = container.querySelector('a[href="/dashboard/agents/agent-1"]');
      expect(link).toBeInTheDocument();
    });
  });

  describe('Styling and Layout', () => {
    it('applies custom className when provided', () => {
      const { container } = render(<AgentCard agent={mockAgent} className="custom-class" />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('custom-class');
    });

    it('renders with card border styling', () => {
      const { container } = render(<AgentCard agent={mockAgent} />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('border-cyan-500/20');
    });

    it('has gradient background effect', () => {
      const { container } = render(<AgentCard agent={mockAgent} />);

      const gradientDiv = container.querySelector('.bg-gradient-to-br');
      expect(gradientDiv).toBeInTheDocument();
    });
  });

  describe('Text Truncation', () => {
    it('truncates long agent names', () => {
      const agentWithLongName = {
        ...mockAgent,
        name: 'This is a very long agent name that should be truncated when displayed',
      };
      const { container } = render(<AgentCard agent={agentWithLongName} />);

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveClass('line-clamp-1');
    });

    it('truncates long descriptions', () => {
      const agentWithLongDesc = {
        ...mockAgent,
        description: 'This is a very long description that should be truncated to two lines when displayed in the agent card component to maintain consistent layout and prevent overflow issues',
      };
      const { container } = render(<AgentCard agent={agentWithLongDesc} />);

      const descParagraph = screen.getByText(/This is a very long description/);
      expect(descParagraph).toHaveClass('line-clamp-2');
    });
  });

  describe('Multiple Badges Rendering', () => {
    it('renders both Projects and Specialization badges together', () => {
      render(<AgentCard agent={mockAgent} />);

      expect(screen.getByText('Projects')).toBeInTheDocument();
      expect(screen.getByText('Frontend Development')).toBeInTheDocument();
    });

    it('renders only Specialization badge when no project capability', () => {
      const agent = { ...mockAgent, has_project_capability: false };
      render(<AgentCard agent={agent} />);

      expect(screen.queryByText('Projects')).not.toBeInTheDocument();
      expect(screen.getByText('Frontend Development')).toBeInTheDocument();
    });

    it('renders only Projects badge when no specialization', () => {
      const agent = { ...mockAgent, specialization: null };
      render(<AgentCard agent={agent} />);

      expect(screen.getByText('Projects')).toBeInTheDocument();
      expect(screen.queryByText('Frontend Development')).not.toBeInTheDocument();
    });

    it('renders no badges when neither Projects nor Specialization', () => {
      const agent = {
        ...mockAgent,
        has_project_capability: false,
        specialization: null,
      };
      render(<AgentCard agent={agent} />);

      expect(screen.queryByText('Projects')).not.toBeInTheDocument();
      expect(screen.queryByText('Frontend Development')).not.toBeInTheDocument();
    });
  });

  describe('Icon Display', () => {
    it('renders Bot icon in icon container', () => {
      const { container } = render(<AgentCard agent={mockAgent} />);

      const iconContainer = container.querySelector('.bg-cyan-500\\/10');
      expect(iconContainer).toBeInTheDocument();
    });

    it('icon container has proper styling', () => {
      const { container } = render(<AgentCard agent={mockAgent} />);

      const iconContainer = container.querySelector('.bg-cyan-500\\/10');
      expect(iconContainer).toHaveClass('border-cyan-500/20');
      expect(iconContainer).toHaveClass('rounded-lg');
    });
  });

  describe('Accessibility', () => {
    it('button has accessible name', () => {
      render(<AgentCard agent={mockAgent} />);

      const button = screen.getByRole('button', { name: /View Details/i });
      expect(button).toBeInTheDocument();
    });

    it('link has proper href attribute', () => {
      render(<AgentCard agent={mockAgent} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href');
    });

    it('heading has proper semantic level', () => {
      render(<AgentCard agent={mockAgent} />);

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toBeInTheDocument();
    });
  });
});
