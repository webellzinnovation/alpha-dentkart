import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Shop } from '../../components/Shop';

// Mock API
vi.mock('../../utils/api', () => ({
  productsAPI: {
    getAll: vi.fn().mockResolvedValue({
      products: [
        {
          id: 1,
          name: 'Test Shop Product',
          price: 1500,
          category: 'Equipment',
          rating: 4,
          stock: 10,
        }
      ],
      pagination: { total: 1 }
    })
  }
}));

describe('Shop Component', () => {
  const defaultProps = {
    products: [],
    categories: [{ id: '1', name: 'Equipment', iconClass: 'fa-test' }],
    brands: [{ id: '1', name: 'Test Brand', logo: '', description: '', productCount: 1 }],
    onProductClick: vi.fn(),
    onToggleWishlist: vi.fn(),
    onAddToCart: vi.fn(),
    onQuickView: vi.fn(),
    wishlistIds: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders products from API', async () => {
    render(<Shop {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Shop Product')).toBeInTheDocument();
    });
  });

  it('renders categories filter', async () => {
    render(<Shop {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Equipment').length).toBeGreaterThan(0);
    });
  });

  it('renders brands filter', async () => {
    render(<Shop {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Test Brand').length).toBeGreaterThan(0);
    });
  });
});
