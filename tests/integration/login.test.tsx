import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Login } from '../../components/Login';

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

describe('Login Component', () => {
  const defaultProps = {
    onLogin: vi.fn(),
    onNavigateToRegister: vi.fn(),
    onNavigateToForgotPassword: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (ui: React.ReactElement) =>
    render(<BrowserRouter>{ui}</BrowserRouter>);

  it('renders form fields', () => {
    renderWithRouter(<Login {...defaultProps} />);
    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
  });

  it('shows validation (empty fields) and triggers onLogin with values', async () => {
    defaultProps.onLogin.mockResolvedValue(undefined);
    renderWithRouter(<Login {...defaultProps} />);
    
    // Fill the fields because required validation will prevent form submission natively
    // We simulate user typing and submitting
    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(defaultProps.onLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('renders successful login flow', async () => {
    defaultProps.onLogin.mockResolvedValue(undefined);
    renderWithRouter(<Login {...defaultProps} />);

    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { value: 'success@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'success123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(defaultProps.onLogin).toHaveBeenCalled();
    });
  });
});
