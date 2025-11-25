/**
 * Unit Tests - AgentForm Component
 * Tests validation, submit, tabs, fields, loading states
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AgentForm } from '@/components/agents/AgentForm';

describe('AgentForm - Component Tests', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  describe('Rendering Tests', () => {
    it('renders create mode with correct title', () => {
      render(<AgentForm onSubmit={mockOnSubmit} />);

      expect(screen.getByText('Create New Agent')).toBeInTheDocument();
      expect(screen.getByText('Configure AI agent capabilities and model settings')).toBeInTheDocument();
    });

    it('renders edit mode with correct title and data', () => {
      const agent = {
        id: 'agent-1',
        name: 'Test Agent',
        description: 'Test description',
        specialization: 'Frontend',
        is_active: true,
        has_project_capability: true,
        allows_global_corpus: false,
        allows_personal_corpus: true,
      };

      render(<AgentForm agent={agent} onSubmit={mockOnSubmit} />);

      expect(screen.getByText('Edit Agent')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Agent')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Frontend')).toBeInTheDocument();
    });

    it('renders all three tabs', () => {
      render(<AgentForm onSubmit={mockOnSubmit} />);

      expect(screen.getByRole('tab', { name: /Basic Info/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Capabilities/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Models/i })).toBeInTheDocument();
    });
  });

  describe('Basic Info Tab - Fields', () => {
    it('renders all basic info fields', () => {
      render(<AgentForm onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText(/Agent Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Specialization/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Active/i)).toBeInTheDocument();
    });

    it('requires agent name', () => {
      render(<AgentForm onSubmit={mockOnSubmit} />);

      const nameInput = screen.getByLabelText(/Agent Name/i);
      expect(nameInput).toHaveAttribute('required');
    });

    it('allows typing in all basic fields', async () => {
      const user = userEvent.setup();
      render(<AgentForm onSubmit={mockOnSubmit} />);

      const nameInput = screen.getByLabelText(/Agent Name/i);
      const descriptionInput = screen.getByLabelText(/Description/i);
      const specializationInput = screen.getByLabelText(/Specialization/i);

      await user.type(nameInput, 'New Agent');
      await user.type(descriptionInput, 'Agent description');
      await user.type(specializationInput, 'Backend');

      expect(nameInput).toHaveValue('New Agent');
      expect(descriptionInput).toHaveValue('Agent description');
      expect(specializationInput).toHaveValue('Backend');
    });

    it('toggles is_active switch', async () => {
      const user = userEvent.setup();
      render(<AgentForm onSubmit={mockOnSubmit} />);

      const activeSwitch = screen.getByRole('switch', { name: /Active/i });
      expect(activeSwitch).toBeChecked(); // Default true

      await user.click(activeSwitch);
      expect(activeSwitch).not.toBeChecked();
    });
  });

  describe('Capabilities Tab - Switches', () => {
    it('renders all capability switches', async () => {
      const user = userEvent.setup();
      render(<AgentForm onSubmit={mockOnSubmit} />);

      // Navigate to Capabilities tab
      const capabilitiesTab = screen.getByRole('tab', { name: /Capabilities/i });
      await user.click(capabilitiesTab);

      expect(screen.getByLabelText(/Project Capability/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Allow Global Corpus/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Allow Personal Corpus/i)).toBeInTheDocument();
    });

    it('toggles capability switches', async () => {
      const user = userEvent.setup();
      render(<AgentForm onSubmit={mockOnSubmit} />);

      const capabilitiesTab = screen.getByRole('tab', { name: /Capabilities/i });
      await user.click(capabilitiesTab);

      const projectCapSwitch = screen.getByRole('switch', { name: /Project Capability/i });
      const globalCorpusSwitch = screen.getByRole('switch', { name: /Allow Global Corpus/i });

      await user.click(projectCapSwitch);
      await user.click(globalCorpusSwitch);

      // Verify switches toggled
      expect(projectCapSwitch).toBeChecked();
      expect(globalCorpusSwitch).toBeChecked();
    });
  });

  describe('Models Tab - Tier Configuration', () => {
    it('renders all three model tiers', async () => {
      const user = userEvent.setup();
      render(<AgentForm onSubmit={mockOnSubmit} />);

      const modelsTab = screen.getByRole('tab', { name: /Models/i });
      await user.click(modelsTab);

      expect(screen.getByText(/Economy Tier/i)).toBeInTheDocument();
      expect(screen.getByText(/Balanced Tier/i)).toBeInTheDocument();
      expect(screen.getByText(/Premium Tier/i)).toBeInTheDocument();
    });

    it('renders provider and model inputs for each tier', async () => {
      const user = userEvent.setup();
      render(<AgentForm onSubmit={mockOnSubmit} />);

      const modelsTab = screen.getByRole('tab', { name: /Models/i });
      await user.click(modelsTab);

      // Economy tier
      expect(screen.getByLabelText(/economy_provider/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/economy_model/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/economy_prompt/i)).toBeInTheDocument();

      // Balanced tier
      expect(screen.getByLabelText(/balanced_provider/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/balanced_model/i)).toBeInTheDocument();

      // Premium tier
      expect(screen.getByLabelText(/premium_provider/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/premium_model/i)).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('calls onSubmit with form data on submit', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue({ success: true });

      render(<AgentForm onSubmit={mockOnSubmit} />);

      const nameInput = screen.getByLabelText(/Agent Name/i);
      await user.type(nameInput, 'Test Agent');

      const submitButton = screen.getByRole('button', { name: /Create Agent/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
        expect(mockOnSubmit).toHaveBeenCalledWith(expect.any(FormData));
      });
    });

    it('displays error message on submit failure', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue({ error: 'Agent creation failed' });

      render(<AgentForm onSubmit={mockOnSubmit} />);

      const nameInput = screen.getByLabelText(/Agent Name/i);
      await user.type(nameInput, 'Test Agent');

      const submitButton = screen.getByRole('button', { name: /Create Agent/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Agent creation failed')).toBeInTheDocument();
      });
    });

    it('disables form during submission', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<AgentForm onSubmit={mockOnSubmit} />);

      const nameInput = screen.getByLabelText(/Agent Name/i);
      await user.type(nameInput, 'Test Agent');

      const submitButton = screen.getByRole('button', { name: /Create Agent/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(nameInput).toBeDisabled();
        expect(submitButton).toBeDisabled();
        expect(submitButton).toHaveTextContent(/Saving.../i);
      });
    });
  });

  describe('Loading State', () => {
    it('disables all fields when isLoading is true', () => {
      render(<AgentForm onSubmit={mockOnSubmit} isLoading={true} />);

      expect(screen.getByLabelText(/Agent Name/i)).toBeDisabled();
      expect(screen.getByLabelText(/Description/i)).toBeDisabled();
      expect(screen.getByRole('button', { name: /Saving.../i })).toBeDisabled();
    });
  });

  describe('Button States', () => {
    it('shows correct button text for create mode', () => {
      render(<AgentForm onSubmit={mockOnSubmit} />);

      expect(screen.getByRole('button', { name: /Create Agent/i })).toBeInTheDocument();
    });

    it('shows correct button text for edit mode', () => {
      const agent = { id: 'agent-1', name: 'Test', is_active: true, has_project_capability: false };
      render(<AgentForm agent={agent} onSubmit={mockOnSubmit} />);

      expect(screen.getByRole('button', { name: /Update Agent/i })).toBeInTheDocument();
    });

    it('renders cancel button', () => {
      render(<AgentForm onSubmit={mockOnSubmit} />);

      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('switches between tabs correctly', async () => {
      const user = userEvent.setup();
      render(<AgentForm onSubmit={mockOnSubmit} />);

      // Default: Basic Info
      expect(screen.getByLabelText(/Agent Name/i)).toBeInTheDocument();

      // Click Capabilities
      const capabilitiesTab = screen.getByRole('tab', { name: /Capabilities/i });
      await user.click(capabilitiesTab);
      expect(screen.getByLabelText(/Project Capability/i)).toBeInTheDocument();

      // Click Models
      const modelsTab = screen.getByRole('tab', { name: /Models/i });
      await user.click(modelsTab);
      expect(screen.getByText(/Economy Tier/i)).toBeInTheDocument();

      // Click Basic Info again
      const basicTab = screen.getByRole('tab', { name: /Basic Info/i });
      await user.click(basicTab);
      expect(screen.getByLabelText(/Agent Name/i)).toBeInTheDocument();
    });
  });
});
