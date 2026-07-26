import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from '../../components/ProductCard';

// Mock custom hooks
vi.mock('../../hooks/useCart', () => ({
  useCart: () => ({}),
}));
vi.mock('../../hooks/useWishlist', () => ({
  useWishlist: () => ({}),
}));

describe('ProductCard Component', () => {
  const mockProduct = {
    id: '1',
    name: 'Test Product',
    price: 1500,
    originalPrice: 2000,
    image: '/test.png',
    category: 'Equipment',
    rating: 4.5,
    reviews: 10,
    stock: 5,
  };

  const defaultProps = {
    product: mockProduct,
    onProductClick: vi.fn(),
    onAddToCart: vi.fn(),
    onToggleWishlist: vi.fn(),
    isInWishlist: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders product details correctly', () => {
    render(<ProductCard {...defaultProps} />);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('Equipment')).toBeInTheDocument();
  });

  it('calls onAddToCart when add to cart button is clicked', () => {
    const { container } = render(<ProductCard {...defaultProps} />);
    const plusIcon = container.querySelector('.fa-plus');
    if (plusIcon?.parentElement) {
      fireEvent.click(plusIcon.parentElement);
      expect(defaultProps.onAddToCart).toHaveBeenCalledWith(mockProduct);
    } else {
      throw new Error('Add to cart button not found');
    }
  });

  it('calls onToggleWishlist when wishlist button is clicked', () => {
    const { container } = render(<ProductCard {...defaultProps} />);
    const heartIcon = container.querySelector('.fa-heart');
    if (heartIcon?.parentElement) {
      fireEvent.click(heartIcon.parentElement);
      expect(defaultProps.onToggleWishlist).toHaveBeenCalledWith(mockProduct);
    } else {
      throw new Error('Wishlist button not found');
    }
  });
});
