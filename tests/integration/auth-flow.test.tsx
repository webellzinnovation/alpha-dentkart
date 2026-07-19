import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Login } from '../../components/Login';
import { Register } from '../../components/Register';

// Mock Firebase Auth
vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: vi.fn().mockImplementation(() => ({
    setCustomParameters: vi.fn(),
  })),
  signInWithPopup: vi.fn(),
}));

vi.mock('../../src/services/firebase', () => ({
  auth: { currentUser: null },
}));

const renderWithRouter = (ui: React.ReactElement) =>
  render(<BrowserRouter>{ui}</BrowserRouter>);

describe('Login Component', () => {
  const defaultProps = {
    onLogin: vi.fn(),
    onNavigateToRegister: vi.fn(),
    onNavigateToForgotPassword: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders email and password fields', () => {
    renderWithRouter(<Login {...defaultProps} />);
    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
  });

  it('renders sign in button', () => {
    renderWithRouter(<Login {...defaultProps} />);
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders navigation to register', () => {
    renderWithRouter(<Login {...defaultProps} />);
    expect(screen.getByText(/Don't have an account/)).toBeInTheDocument();
    expect(screen.getByText('Sign Up')).toBeInTheDocument();
  });

  it('renders forgot password link', () => {
    renderWithRouter(<Login {...defaultProps} />);
    expect(screen.getByText('Forgot password?')).toBeInTheDocument();
  });

  it('calls onNavigateToRegister when Sign Up is clicked', () => {
    renderWithRouter(<Login {...defaultProps} />);
    fireEvent.click(screen.getByText('Sign Up'));
    expect(defaultProps.onNavigateToRegister).toHaveBeenCalledTimes(1);
  });

  it('calls onNavigateToForgotPassword when Forgot password is clicked', () => {
    renderWithRouter(<Login {...defaultProps} />);
    fireEvent.click(screen.getByText('Forgot password?'));
    expect(defaultProps.onNavigateToForgotPassword).toHaveBeenCalledTimes(1);
  });

  it('calls onLogin with email and password on submit', async () => {
    defaultProps.onLogin.mockResolvedValue(undefined);
    renderWithRouter(<Login {...defaultProps} />);

    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'Password1!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(defaultProps.onLogin).toHaveBeenCalledWith('test@example.com', 'Password1!');
    });
  });

  it('displays error message when login fails', async () => {
    defaultProps.onLogin.mockRejectedValue(new Error('Invalid credentials'));
    renderWithRouter(<Login {...defaultProps} />);

    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'wrong' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('shows Google sign-in button when onGoogleLogin is provided', () => {
    renderWithRouter(
      <Login {...defaultProps} onGoogleLogin={vi.fn()} />
    );
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
  });

  it('does not show Google sign-in button when onGoogleLogin is omitted', () => {
    renderWithRouter(<Login {...defaultProps} />);
    expect(screen.queryByText('Continue with Google')).not.toBeInTheDocument();
  });

  it('updates input values as user types', () => {
    renderWithRouter(<Login {...defaultProps} />);
    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');

    fireEvent.change(emailInput, { target: { value: 'user@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Secret1!' } });

    expect(emailInput).toHaveValue('user@test.com');
    expect(passwordInput).toHaveValue('Secret1!');
  });
});

describe('Register Component', () => {
  const defaultProps = {
    onRegister: vi.fn(),
    onNavigateToLogin: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all base form fields', () => {
    renderWithRouter(<Register {...defaultProps} />);
    expect(screen.getByPlaceholderText('Full Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
  });

  it('renders user type selector with all options', () => {
    renderWithRouter(<Register {...defaultProps} />);
    expect(screen.getByText('Regular Customer')).toBeInTheDocument();
    expect(screen.getByText('Dental Doctor')).toBeInTheDocument();
    expect(screen.getByText('Dental Student')).toBeInTheDocument();
    expect(screen.getByText('Dental Business (Clinic/Lab)')).toBeInTheDocument();
  });

  it('renders create account button', () => {
    renderWithRouter(<Register {...defaultProps} />);
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('renders navigation to login', () => {
    renderWithRouter(<Register {...defaultProps} />);
    expect(screen.getByText(/Already have an account/)).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('calls onNavigateToLogin when Sign In is clicked', () => {
    renderWithRouter(<Register {...defaultProps} />);
    fireEvent.click(screen.getByText('Sign In'));
    expect(defaultProps.onNavigateToLogin).toHaveBeenCalledTimes(1);
  });

  it('shows validation error when submitting with short name', async () => {
    renderWithRouter(<Register {...defaultProps} />);

    fireEvent.change(screen.getByPlaceholderText('Full Name'), {
      target: { value: 'A' },
    });
    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'StrongPass1!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/Name must be at least 2 characters long/)).toBeInTheDocument();
    });
    expect(defaultProps.onRegister).not.toHaveBeenCalled();
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

  it('shows validation error when password lacks special characters', async () => {
    renderWithRouter(<Register {...defaultProps} />);

    fireEvent.change(screen.getByPlaceholderText('Full Name'), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'NoSpecial1' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/Password must contain at least one special character/)).toBeInTheDocument();
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

  it('shows dental-doctor fields when user type is dental-doctor', () => {
    renderWithRouter(<Register {...defaultProps} />);

    fireEvent.change(screen.getByDisplayValue('Regular Customer'), {
      target: { value: 'dental-doctor' },
    });

    expect(screen.getByPlaceholderText('License ID')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('License State')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Specialization')).toBeInTheDocument();
  });

  it('shows dental-student fields when user type is dental-student', () => {
    renderWithRouter(<Register {...defaultProps} />);

    fireEvent.change(screen.getByDisplayValue('Regular Customer'), {
      target: { value: 'dental-student' },
    });

    expect(screen.getByPlaceholderText('Institution Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Student ID')).toBeInTheDocument();
  });

  it('shows dental-business fields when user type is dental-business', () => {
    renderWithRouter(<Register {...defaultProps} />);

    fireEvent.change(screen.getByDisplayValue('Regular Customer'), {
      target: { value: 'dental-business' },
    });

    expect(screen.getByPlaceholderText('Business Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('GST Number')).toBeInTheDocument();
  });

  it('hides conditional fields when user type is regular', () => {
    renderWithRouter(<Register {...defaultProps} />);

    expect(screen.queryByPlaceholderText('License ID')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Institution Name')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Business Name')).not.toBeInTheDocument();
  });

  it('shows Google sign-in button when onGoogleLogin is provided', () => {
    renderWithRouter(
      <Register {...defaultProps} onGoogleLogin={vi.fn()} />
    );
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
  });

  it('does not show Google sign-in button when onGoogleLogin is omitted', () => {
    renderWithRouter(<Register {...defaultProps} />);
    expect(screen.queryByText('Continue with Google')).not.toBeInTheDocument();
  });
});
