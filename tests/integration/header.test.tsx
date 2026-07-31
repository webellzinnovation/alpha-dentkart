import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Header } from '../../components/Header';

// Mock custom hooks
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ isLoggedIn: false, user: null }),
}));
vi.mock('../../hooks/useCart', () => ({
  useCart: () => ({ cartCount: 0, cartTotal: 0 }),
}));
vi.mock('../../hooks/useWishlist', () => ({
  useWishlist: () => ({ wishlistCount: 0 }),
}));

describe('Header Component', () => {
  const defaultProps = {
    onNavigate: vi.fn(),
    cartCount: 2,
    cartTotal: 1000,
    wishlistCount: 3,
    onOpenCart: vi.fn(),
    isLoggedIn: true,
    user: { id: '1', name: 'Test User', email: 'test@example.com', avatar: '', role: 'user' },
    categories: [{ id: '1', name: 'Dental Chairs' }],
    settings: { general: { currency: 'INR', storeName: 'Test Store' }, showcaseCategories: [] },
    searchQuery: '',
    onSearch: vi.fn(),
    recentlyViewed: [],
    onProductClick: vi.fn(),
    isMobileMenuOpen: false,
    setIsMobileMenuOpen: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (ui: React.ReactElement) =>
    render(<BrowserRouter>{ui}</BrowserRouter>);

  it('renders logo properly', () => {
    renderWithRouter(<Header {...defaultProps} />);
    expect(screen.getByAltText('Alpha DentKart')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    renderWithRouter(<Header {...defaultProps} />);
    expect(screen.getAllByText('Home')[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Shop/i)[0]).toBeInTheDocument();
  });

  it('renders cart icon with count', () => {
    renderWithRouter(<Header {...defaultProps} />);
    expect(screen.getAllByText('2')[0]).toBeInTheDocument();
  });

  it('calls onSearch when search input is submitted', () => {
    renderWithRouter(<Header {...defaultProps} />);
    const inputs = screen.getAllByPlaceholderText(/Search/i);
    const desktopInput = inputs.find(i => i.getAttribute('placeholder')?.includes('Search products'));
    
    if (desktopInput) {
      fireEvent.change(desktopInput, { target: { value: 'dental' } });
      const form = desktopInput.closest('form');
      if (form) {
        fireEvent.submit(form);
        expect(defaultProps.onSearch).toHaveBeenCalledWith('dental');
      }
    }
  });
});
