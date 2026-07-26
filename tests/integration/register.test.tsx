import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Register } from '../../components/Register';

// Mock hooks
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ isLoggedIn: false, user: null }),
}));

vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: vi.fn().mockImplementation(() => ({
    setCustomParameters: vi.fn(),
  })),
  signInWithPopup: vi.fn(),
}));

vi.mock('../../src/services/firebase', () => ({
  auth: { currentUser: null },
}));

describe('Register Component', () => {
  const defaultProps = {
    onRegister: vi.fn(),
    onNavigateToLogin: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (ui: React.ReactElement) =>
    render(<BrowserRouter>{ui}</BrowserRouter>);

  it('renders form fields', () => {
    renderWithRouter(<Register {...defaultProps} />);
    expect(screen.getByPlaceholderText('Full Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
  });

  it('renders user type selection', () => {
    renderWithRouter(<Register {...defaultProps} />);
    expect(screen.getByText('Regular Customer')).toBeInTheDocument();
    expect(screen.getByText('Dental Doctor')).toBeInTheDocument();
    expect(screen.getByText('Dental Student')).toBeInTheDocument();
    expect(screen.getByText('Dental Business (Clinic/Lab)')).toBeInTheDocument();
  });

  it('shows validation error when password is too short', async () => {
    renderWithRouter(<Register {...defaultProps} />);
    
    fireEvent.change(screen.getByPlaceholderText('Full Name'), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'short' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/Password must be at least 8 characters long/)).toBeInTheDocument();
    });
    expect(defaultProps.onRegister).not.toHaveBeenCalled();
  });

  it('calls onRegister with valid data', async () => {
    defaultProps.onRegister.mockImplementation(() => {});
    renderWithRouter(<Register {...defaultProps} />);
    
    fireEvent.change(screen.getByPlaceholderText('Full Name'), {
      target: { value: 'Dr. Smith' },
    });
    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { value: 'smith@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'StrongPass1!' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(defaultProps.onRegister).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Dr. Smith',
          email: 'smith@example.com',
          password: 'StrongPass1!',
          userType: 'regular',
        })
      );
    });
  });
});
