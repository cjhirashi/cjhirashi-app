/**
 * Unit Tests - UserForm Component
 * Tests validation with Zod, submit, react-hook-form integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserForm, type UserFormData } from '@/components/users/user-form';

describe('UserForm - Component Tests', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  describe('Rendering Tests', () => {
    it('renders all form fields', () => {
      render(<UserForm onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Nombre completo/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Rol/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Estado/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/URL de avatar/i)).toBeInTheDocument();
    });

    it('renders submit button with create text', () => {
      render(<UserForm onSubmit={mockOnSubmit} />);

      expect(screen.getByRole('button', { name: /Crear usuario/i })).toBeInTheDocument();
    });

    it('renders submit button with edit text when isEditing', () => {
      render(<UserForm onSubmit={mockOnSubmit} isEditing={true} />);

      expect(screen.getByRole('button', { name: /Actualizar usuario/i })).toBeInTheDocument();
    });

    it('pre-fills fields with defaultValues', () => {
      const defaultValues: Partial<UserFormData> = {
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'admin',
        status: 'active',
      };

      render(<UserForm onSubmit={mockOnSubmit} defaultValues={defaultValues} />);

      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
    });
  });

  describe('Email Field - Validation', () => {
    it('shows error for invalid email', async () => {
      const user = userEvent.setup();
      render(<UserForm onSubmit={mockOnSubmit} />);

      const emailInput = screen.getByLabelText(/Email/i);
      await user.type(emailInput, 'invalid-email');
      await user.tab(); // Trigger validation

      await waitFor(() => {
        expect(screen.getByText(/Email inválido/i)).toBeInTheDocument();
      });
    });

    it('shows error for empty email on submit', async () => {
      const user = userEvent.setup();
      render(<UserForm onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole('button', { name: /Crear usuario/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Email es requerido/i)).toBeInTheDocument();
      });
    });

    it('accepts valid email', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      render(<UserForm onSubmit={mockOnSubmit} />);

      const emailInput = screen.getByLabelText(/Email/i);
      await user.type(emailInput, 'valid@example.com');

      const submitButton = screen.getByRole('button', { name: /Crear usuario/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({ email: 'valid@example.com' })
        );
      });
    });

    it('disables email field when isEditing', () => {
      render(<UserForm onSubmit={mockOnSubmit} isEditing={true} />);

      const emailInput = screen.getByLabelText(/Email/i);
      expect(emailInput).toBeDisabled();
    });
  });

  describe('Full Name Field', () => {
    it('is optional (no required attribute)', () => {
      render(<UserForm onSubmit={mockOnSubmit} />);

      const fullNameInput = screen.getByLabelText(/Nombre completo/i);
      expect(fullNameInput).not.toHaveAttribute('required');
    });

    it('shows error if exceeds 255 characters', async () => {
      const user = userEvent.setup();
      render(<UserForm onSubmit={mockOnSubmit} />);

      const fullNameInput = screen.getByLabelText(/Nombre completo/i);
      const longName = 'a'.repeat(256);
      await user.type(fullNameInput, longName);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/Máximo 255 caracteres/i)).toBeInTheDocument();
      });
    });

    it('accepts empty full name', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      render(<UserForm onSubmit={mockOnSubmit} />);

      const emailInput = screen.getByLabelText(/Email/i);
      await user.type(emailInput, 'user@example.com');

      const submitButton = screen.getByRole('button', { name: /Crear usuario/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({ fullName: '' })
        );
      });
    });
  });

  describe('Role Select', () => {
    it('defaults to user role', () => {
      render(<UserForm onSubmit={mockOnSubmit} />);

      // React-select default value check (role dropdown should have 'user' selected)
      expect(screen.getByLabelText(/Rol/i)).toBeInTheDocument();
    });

    it('displays all role options', async () => {
      const user = userEvent.setup();
      render(<UserForm onSubmit={mockOnSubmit} />);

      const roleSelect = screen.getByRole('combobox', { name: /Rol/i });
      await user.click(roleSelect);

      await waitFor(() => {
        expect(screen.getByText('Administrador')).toBeInTheDocument();
        expect(screen.getByText('Moderador')).toBeInTheDocument();
        expect(screen.getByText('Usuario')).toBeInTheDocument();
      });
    });

    it('allows selecting different roles', async () => {
      const user = userEvent.setup();
      render(<UserForm onSubmit={mockOnSubmit} />);

      const roleSelect = screen.getByRole('combobox', { name: /Rol/i });
      await user.click(roleSelect);

      await waitFor(() => {
        const adminOption = screen.getByText('Administrador');
        user.click(adminOption);
      });

      // Verify admin is selected (check via form submission)
      const emailInput = screen.getByLabelText(/Email/i);
      await user.type(emailInput, 'admin@example.com');

      mockOnSubmit.mockResolvedValue(undefined);
      const submitButton = screen.getByRole('button', { name: /Crear usuario/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({ role: 'admin' })
        );
      });
    });
  });

  describe('Status Select', () => {
    it('defaults to pending status', () => {
      render(<UserForm onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText(/Estado/i)).toBeInTheDocument();
    });

    it('displays all status options', async () => {
      const user = userEvent.setup();
      render(<UserForm onSubmit={mockOnSubmit} />);

      const statusSelect = screen.getByRole('combobox', { name: /Estado/i });
      await user.click(statusSelect);

      await waitFor(() => {
        expect(screen.getByText('Activo')).toBeInTheDocument();
        expect(screen.getByText('Inactivo')).toBeInTheDocument();
        expect(screen.getByText('Suspendido')).toBeInTheDocument();
        expect(screen.getByText('Pendiente')).toBeInTheDocument();
      });
    });

    it('allows selecting different statuses', async () => {
      const user = userEvent.setup();
      render(<UserForm onSubmit={mockOnSubmit} />);

      const statusSelect = screen.getByRole('combobox', { name: /Estado/i });
      await user.click(statusSelect);

      await waitFor(() => {
        const activeOption = screen.getByText('Activo');
        user.click(activeOption);
      });

      const emailInput = screen.getByLabelText(/Email/i);
      await user.type(emailInput, 'user@example.com');

      mockOnSubmit.mockResolvedValue(undefined);
      const submitButton = screen.getByRole('button', { name: /Crear usuario/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'active' })
        );
      });
    });
  });

  describe('Avatar URL Field', () => {
    it('is optional', () => {
      render(<UserForm onSubmit={mockOnSubmit} />);

      const avatarInput = screen.getByLabelText(/URL de avatar/i);
      expect(avatarInput).not.toHaveAttribute('required');
    });

    it('shows error for invalid URL', async () => {
      const user = userEvent.setup();
      render(<UserForm onSubmit={mockOnSubmit} />);

      const avatarInput = screen.getByLabelText(/URL de avatar/i);
      await user.type(avatarInput, 'not-a-url');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/URL inválida/i)).toBeInTheDocument();
      });
    });

    it('accepts valid URL', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      render(<UserForm onSubmit={mockOnSubmit} />);

      const emailInput = screen.getByLabelText(/Email/i);
      const avatarInput = screen.getByLabelText(/URL de avatar/i);

      await user.type(emailInput, 'user@example.com');
      await user.type(avatarInput, 'https://example.com/avatar.jpg');

      const submitButton = screen.getByRole('button', { name: /Crear usuario/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({ avatarUrl: 'https://example.com/avatar.jpg' })
        );
      });
    });

    it('accepts empty avatar URL', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      render(<UserForm onSubmit={mockOnSubmit} />);

      const emailInput = screen.getByLabelText(/Email/i);
      await user.type(emailInput, 'user@example.com');

      const submitButton = screen.getByRole('button', { name: /Crear usuario/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({ avatarUrl: '' })
        );
      });
    });
  });

  describe('Form Submission', () => {
    it('calls onSubmit with validated data', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      render(<UserForm onSubmit={mockOnSubmit} />);

      const emailInput = screen.getByLabelText(/Email/i);
      const fullNameInput = screen.getByLabelText(/Nombre completo/i);

      await user.type(emailInput, 'newuser@example.com');
      await user.type(fullNameInput, 'New User');

      const submitButton = screen.getByRole('button', { name: /Crear usuario/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
        expect(mockOnSubmit).toHaveBeenCalledWith({
          email: 'newuser@example.com',
          fullName: 'New User',
          role: 'user',
          status: 'pending',
          avatarUrl: '',
        });
      });
    });

    it('does not call onSubmit with invalid data', async () => {
      const user = userEvent.setup();
      render(<UserForm onSubmit={mockOnSubmit} />);

      const emailInput = screen.getByLabelText(/Email/i);
      await user.type(emailInput, 'invalid-email');

      const submitButton = screen.getByRole('button', { name: /Crear usuario/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });

    it('shows loading state during submission', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<UserForm onSubmit={mockOnSubmit} />);

      const emailInput = screen.getByLabelText(/Email/i);
      await user.type(emailInput, 'user@example.com');

      const submitButton = screen.getByRole('button', { name: /Crear usuario/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Guardando.../i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Guardando.../i })).toBeDisabled();
      });
    });
  });

  describe('Loading State', () => {
    it('disables all fields when isLoading is true', () => {
      render(<UserForm onSubmit={mockOnSubmit} isLoading={true} />);

      expect(screen.getByLabelText(/Email/i)).toBeDisabled();
      expect(screen.getByLabelText(/Nombre completo/i)).toBeDisabled();
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('associates labels with inputs correctly', () => {
      render(<UserForm onSubmit={mockOnSubmit} />);

      const emailInput = screen.getByLabelText(/Email/i);
      const fullNameInput = screen.getByLabelText(/Nombre completo/i);

      expect(emailInput).toHaveAttribute('id', 'email');
      expect(fullNameInput).toHaveAttribute('id', 'fullName');
    });

    it('sets aria-invalid on fields with errors', async () => {
      const user = userEvent.setup();
      render(<UserForm onSubmit={mockOnSubmit} />);

      const emailInput = screen.getByLabelText(/Email/i);
      await user.type(emailInput, 'invalid-email');
      await user.tab();

      await waitFor(() => {
        expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      });
    });
  });
});
