import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from '../../../components/ProductCard';
import type { Product } from '../../../types';

vi.mock('../../../utils/stockNotificationService', () => ({
  subscribeToProduct: vi.fn().mockReturnValue({ success: true, message: 'Subscribed' }),
  unsubscribeFromProduct: vi.fn().mockReturnValue({ success: true, message: 'Unsubscribed' }),
  isSubscribedToProduct: vi.fn().mockReturnValue(false),
}));

vi.mock('../../../components/OptimizedImage', () => ({
  default: (props: any) => <img src={props.src} alt={props.alt} data-testid="optimized-image" />,
}));

const baseProduct: Product = {
  id: 1,
  name: 'Dental Composite',
  category: 'Restorative',
  price: 3500,
  originalPrice: 4200,
  rating: 4.5,
  reviews: 12,
  image: '/test-product.png',
  stock: 10,
  badge: 'Best Seller',
  badgeColor: 'green',
  timer: '2h left',
};

describe('ProductCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders product name', () => {
    render(<ProductCard product={baseProduct} />);
    expect(screen.getByText('Dental Composite')).toBeDefined();
  });

  it('renders product price', () => {
    render(<ProductCard product={baseProduct} />);
    expect(screen.getByText('₹3,500')).toBeDefined();
  });

  it('renders original price with strikethrough', () => {
    render(<ProductCard product={baseProduct} />);
    expect(screen.getByText('₹4,200')).toBeDefined();
  });

  it('renders category', () => {
    render(<ProductCard product={baseProduct} />);
    expect(screen.getByText('Restorative')).toBeDefined();
  });

  it('renders rating', () => {
    render(<ProductCard product={baseProduct} />);
    expect(screen.getByText('4.5')).toBeDefined();
  });

  it('renders badge', () => {
    render(<ProductCard product={baseProduct} />);
    expect(screen.getByText('Best Seller')).toBeDefined();
  });

  it('renders timer', () => {
    render(<ProductCard product={baseProduct} />);
    expect(screen.getByText('2h left')).toBeDefined();
  });

  it('calls onProductClick when clicked', () => {
    const onProductClick = vi.fn();
    render(<ProductCard product={baseProduct} onProductClick={onProductClick} />);
    fireEvent.click(screen.getByText('Dental Composite'));
    expect(onProductClick).toHaveBeenCalledWith(baseProduct);
  });

  it('calls onAddToCart when add button clicked', () => {
    const onAddToCart = vi.fn();
    const { container } = render(<ProductCard product={baseProduct} onAddToCart={onAddToCart} />);
    const addBtn = container.querySelector('.fa-plus')?.closest('button');
    if (addBtn) fireEvent.click(addBtn);
    expect(onAddToCart).toHaveBeenCalledWith(baseProduct);
  });

  it('calls onToggleWishlist when heart clicked', () => {
    const onToggleWishlist = vi.fn();
    render(<ProductCard product={baseProduct} onToggleWishlist={onToggleWishlist} />);
    const heartBtns = screen.getAllByRole('button');
    const heartBtn = heartBtns.find(btn => btn.querySelector('.fa-heart'));
    if (heartBtn) fireEvent.click(heartBtn);
    expect(onToggleWishlist).toHaveBeenCalledWith(baseProduct);
  });

  it('shows filled heart when in wishlist', () => {
    const { container } = render(<ProductCard product={baseProduct} isInWishlist />);
    const filledHeart = container.querySelector('.fas.fa-heart');
    expect(filledHeart).not.toBeNull();
  });

  it('shows outline heart when not in wishlist', () => {
    const { container } = render(<ProductCard product={baseProduct} isInWishlist={false} />);
    const outlineHeart = container.querySelector('.far.fa-heart');
    expect(outlineHeart).not.toBeNull();
  });

  it('shows out of stock button when stock is 0', () => {
    const outOfStock = { ...baseProduct, stock: 0 };
    const { container } = render(<ProductCard product={outOfStock} />);
    const bellBtn = container.querySelector('.fa-bell');
    expect(bellBtn).not.toBeNull();
  });

  it('does not show add-to-cart button when stock is 0', () => {
    const outOfStock = { ...baseProduct, stock: 0 };
    const { container } = render(<ProductCard product={outOfStock} />);
    const plusIcon = container.querySelector('.fa-plus');
    expect(plusIcon).toBeNull();
  });

  it('renders product image', () => {
    render(<ProductCard product={baseProduct} />);
    const img = screen.getByTestId('optimized-image');
    expect(img).toBeDefined();
  });

  it('renders default rating when none provided', () => {
    const noRating = { ...baseProduct, rating: 0 };
    render(<ProductCard product={noRating} />);
    expect(screen.getByText('5.0')).toBeDefined();
  });

  it('shows review count', () => {
    render(<ProductCard product={baseProduct} />);
    expect(screen.getByText('(12)')).toBeDefined();
  });

  it('does not show review count when reviews is undefined', () => {
    const noReviews = { ...baseProduct, reviews: undefined };
    render(<ProductCard product={noReviews} />);
    expect(screen.queryByText(/\(\d+\)/)).toBeNull();
  });
});
