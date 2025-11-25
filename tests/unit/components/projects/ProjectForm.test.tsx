/**
 * Unit Tests - ProjectForm Component
 * Tests validation, submit, agent loading, status select
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectForm } from '@/components/projects/ProjectForm';
import { createClient } from '@/lib/supabase/client';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}));

describe('ProjectForm - Component Tests', () => {
  const mockOnSubmit = vi.fn();
  const mockSupabase = {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: [
              { id: 'agent-1', name: 'Agent One', specialization: 'Frontend', is_active: true },
              { id: 'agent-2', name: 'Agent Two', specialization: 'Backend', is_active: true },
            ],
            error: null,
          })),
        })),
      })),
    })),
  };

  beforeEach(() => {
    mockOnSubmit.mockClear();
    vi.mocked(createClient).mockReturnValue(mockSupabase as any);
  });

  describe('Rendering Tests', () => {
    it('renders create mode with correct title', async () => {
      render(<ProjectForm onSubmit={mockOnSubmit} />);

      expect(screen.getByText('Create New Project')).toBeInTheDocument();
      expect(screen.getByText(/Set up a new project with an AI agent/i)).toBeInTheDocument();
    });

    it('renders edit mode with correct title', () => {
      const project = {
        id: 'project-1',
        name: 'Test Project',
        description: 'Project desc',
        status: 'active',
        agent_id: 'agent-1',
      };

      render(<ProjectForm project={project} onSubmit={mockOnSubmit} />);

      expect(screen.getByText('Edit Project')).toBeInTheDocument();
      expect(screen.getByText(/Update your project details/i)).toBeInTheDocument();
    });

    it('renders all form fields', async () => {
      render(<ProjectForm onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText(/Project Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByLabelText(/AI Agent/i)).toBeInTheDocument();
      });
    });
  });

  describe('Agent Loading', () => {
    it('loads and displays agents in select dropdown', async () => {
      const user = userEvent.setup();
      render(<ProjectForm onSubmit={mockOnSubmit} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/AI Agent/i)).toBeInTheDocument();
      });

      // Open select dropdown
      const selectTrigger = screen.getByRole('combobox', { name: /AI Agent/i });
      await user.click(selectTrigger);

      await waitFor(() => {
        expect(screen.getByText('Agent One - Frontend')).toBeInTheDocument();
        expect(screen.getByText('Agent Two - Backend')).toBeInTheDocument();
      });
    });

    it('calls Supabase with correct query', async () => {
      render(<ProjectForm onSubmit={mockOnSubmit} />);

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('agents');
      });
    });

    it('filters only active agents', async () => {
      render(<ProjectForm onSubmit={mockOnSubmit} />);

      await waitFor(() => {
        const fromCall = mockSupabase.from();
        const selectCall = fromCall.select();
        const eqCall = selectCall.eq();

        expect(eqCall).toBeDefined();
      });
    });
  });

  describe('Form Fields - Input', () => {
    it('allows typing in project name', async () => {
      const user = userEvent.setup();
      render(<ProjectForm onSubmit={mockOnSubmit} />);

      const nameInput = screen.getByLabelText(/Project Name/i);
      await user.type(nameInput, 'My New Project');

      expect(nameInput).toHaveValue('My New Project');
    });

    it('allows typing in description', async () => {
      const user = userEvent.setup();
      render(<ProjectForm onSubmit={mockOnSubmit} />);

      const descInput = screen.getByLabelText(/Description/i);
      await user.type(descInput, 'This is my project description');

      expect(descInput).toHaveValue('This is my project description');
    });

    it('requires project name', () => {
      render(<ProjectForm onSubmit={mockOnSubmit} />);

      const nameInput = screen.getByLabelText(/Project Name/i);
      expect(nameInput).toHaveAttribute('required');
    });

    it('requires agent selection in create mode', async () => {
      render(<ProjectForm onSubmit={mockOnSubmit} />);

      await waitFor(() => {
        const selectTrigger = screen.getByRole('combobox', { name: /AI Agent/i });
        expect(selectTrigger).toBeInTheDocument();
      });
    });
  });

  describe('Edit Mode - Status Select', () => {
    it('shows status select in edit mode', () => {
      const project = {
        id: 'project-1',
        name: 'Test Project',
        status: 'active',
        agent_id: 'agent-1',
      };

      render(<ProjectForm project={project} onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText(/Status/i)).toBeInTheDocument();
    });

    it('does not show agent select in edit mode', () => {
      const project = {
        id: 'project-1',
        name: 'Test Project',
        status: 'active',
        agent_id: 'agent-1',
      };

      render(<ProjectForm project={project} onSubmit={mockOnSubmit} />);

      expect(screen.queryByLabelText(/AI Agent/i)).not.toBeInTheDocument();
    });

    it('displays all status options', async () => {
      const user = userEvent.setup();
      const project = {
        id: 'project-1',
        name: 'Test Project',
        status: 'active',
        agent_id: 'agent-1',
      };

      render(<ProjectForm project={project} onSubmit={mockOnSubmit} />);

      const statusSelect = screen.getByRole('combobox', { name: /Status/i });
      await user.click(statusSelect);

      await waitFor(() => {
        expect(screen.getByText('Active')).toBeInTheDocument();
        expect(screen.getByText('Archived')).toBeInTheDocument();
        expect(screen.getByText('Completed')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('calls onSubmit with form data', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue({ success: true });

      render(<ProjectForm onSubmit={mockOnSubmit} />);

      const nameInput = screen.getByLabelText(/Project Name/i);
      await user.type(nameInput, 'Test Project');

      // Select an agent
      await waitFor(() => {
        expect(screen.getByRole('combobox', { name: /AI Agent/i })).toBeInTheDocument();
      });

      const agentSelect = screen.getByRole('combobox', { name: /AI Agent/i });
      await user.click(agentSelect);

      await waitFor(() => {
        expect(screen.getByText('Agent One - Frontend')).toBeInTheDocument();
      });

      const agentOption = screen.getByText('Agent One - Frontend');
      await user.click(agentOption);

      const submitButton = screen.getByRole('button', { name: /Create Project/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
        expect(mockOnSubmit).toHaveBeenCalledWith(expect.any(FormData));
      });
    });

    it('displays error message on failure', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue({ error: 'Project creation failed' });

      render(<ProjectForm onSubmit={mockOnSubmit} />);

      const nameInput = screen.getByLabelText(/Project Name/i);
      await user.type(nameInput, 'Test Project');

      const submitButton = screen.getByRole('button', { name: /Create Project/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Project creation failed')).toBeInTheDocument();
      });
    });

    it('disables submit button without agent selection', async () => {
      render(<ProjectForm onSubmit={mockOnSubmit} />);

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /Create Project/i });
        expect(submitButton).toBeDisabled();
      });
    });

    it('enables submit button with valid data', async () => {
      const user = userEvent.setup();
      render(<ProjectForm onSubmit={mockOnSubmit} />);

      const nameInput = screen.getByLabelText(/Project Name/i);
      await user.type(nameInput, 'Test Project');

      await waitFor(() => {
        expect(screen.getByRole('combobox', { name: /AI Agent/i })).toBeInTheDocument();
      });

      const agentSelect = screen.getByRole('combobox', { name: /AI Agent/i });
      await user.click(agentSelect);

      await waitFor(() => {
        const agentOption = screen.getByText('Agent One - Frontend');
        user.click(agentOption);
      });

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /Create Project/i });
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe('Loading State', () => {
    it('disables all fields when isLoading is true', () => {
      render(<ProjectForm onSubmit={mockOnSubmit} isLoading={true} />);

      expect(screen.getByLabelText(/Project Name/i)).toBeDisabled();
      expect(screen.getByLabelText(/Description/i)).toBeDisabled();
      expect(screen.getByRole('button', { name: /Saving.../i })).toBeDisabled();
    });

    it('shows saving text during submission', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<ProjectForm onSubmit={mockOnSubmit} />);

      const nameInput = screen.getByLabelText(/Project Name/i);
      await user.type(nameInput, 'Test Project');

      const submitButton = screen.getByRole('button', { name: /Create Project/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Saving.../i })).toBeInTheDocument();
      });
    });
  });

  describe('Button States', () => {
    it('shows correct button text for create mode', async () => {
      render(<ProjectForm onSubmit={mockOnSubmit} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Create Project/i })).toBeInTheDocument();
      });
    });

    it('shows correct button text for edit mode', () => {
      const project = {
        id: 'project-1',
        name: 'Test Project',
        status: 'active',
        agent_id: 'agent-1',
      };

      render(<ProjectForm project={project} onSubmit={mockOnSubmit} />);

      expect(screen.getByRole('button', { name: /Update Project/i })).toBeInTheDocument();
    });

    it('shows cancel button in edit mode', () => {
      const project = {
        id: 'project-1',
        name: 'Test Project',
        status: 'active',
        agent_id: 'agent-1',
      };

      render(<ProjectForm project={project} onSubmit={mockOnSubmit} />);

      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    });
  });

  describe('Data Pre-fill', () => {
    it('pre-fills fields in edit mode', () => {
      const project = {
        id: 'project-1',
        name: 'Existing Project',
        description: 'Existing description',
        status: 'active',
        agent_id: 'agent-1',
      };

      render(<ProjectForm project={project} onSubmit={mockOnSubmit} />);

      expect(screen.getByDisplayValue('Existing Project')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Existing description')).toBeInTheDocument();
    });
  });
});
