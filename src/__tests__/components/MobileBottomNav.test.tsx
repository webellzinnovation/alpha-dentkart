import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MobileBottomNav } from '../../../components/MobileBottomNav';

describe('MobileBottomNav', () => {
  const defaultProps = {
    currentView: 'home',
    onNavigate: vi.fn(),
    onOpenCart: vi.fn(),
    cartCount: 3,
    wishlistCount: 2,
    isLoggedIn: true,
  };

  it('renders all nav items', () => {
    render(<MobileBottomNav {...defaultProps} />);
    expect(screen.getByText('Home')).toBeDefined();
    expect(screen.getByText('Category')).toBeDefined();
    expect(screen.getByText('Brand')).toBeDefined();
    expect(screen.getByText('Search')).toBeDefined();
    expect(screen.getByText('Wishlist')).toBeDefined();
    expect(screen.getByText('Cart')).toBeDefined();
  });

  it('calls onNavigate for Home', () => {
    const onNavigate = vi.fn();
    render(<MobileBottomNav {...defaultProps} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByText('Home'));
    expect(onNavigate).toHaveBeenCalledWith('home');
  });

  it('calls onNavigate for Category', () => {
    const onNavigate = vi.fn();
    render(<MobileBottomNav {...defaultProps} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByText('Category'));
    expect(onNavigate).toHaveBeenCalledWith('categories');
  });

  it('calls onOpenCart for Cart', () => {
    const onOpenCart = vi.fn();
    render(<MobileBottomNav {...defaultProps} onOpenCart={onOpenCart} />);
    fireEvent.click(screen.getByText('Cart'));
    expect(onOpenCart).toHaveBeenCalledOnce();
  });

  it('calls onNavigate for Search with shop view', () => {
    const onNavigate = vi.fn();
    render(<MobileBottomNav {...defaultProps} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByText('Search'));
    expect(onNavigate).toHaveBeenCalledWith('shop');
  });

  it('shows cart badge count', () => {
    render(<MobileBottomNav {...defaultProps} cartCount={5} />);
    expect(screen.getByText('5')).toBeDefined();
  });

  it('shows wishlist badge count', () => {
    render(<MobileBottomNav {...defaultProps} wishlistCount={10} />);
    expect(screen.getByText('10')).toBeDefined();
  });

  it('hides badge when count is 0', () => {
    const { container } = render(<MobileBottomNav {...defaultProps} cartCount={0} wishlistCount={0} />);
    const badges = container.querySelectorAll('.min-w-\\[14px\\]');
    expect(badges.length).toBe(0);
  });

  it('highlights active item', () => {
    const { container } = render(<MobileBottomNav {...defaultProps} currentView="categories" />);
    const buttons = container.querySelectorAll('button');
    const categoryBtn = Array.from(buttons).find(btn => btn.textContent?.includes('Category'));
    expect(categoryBtn?.className).toContain('bg-pink-50');
  });

  it('does not highlight cart as active', () => {
    const { container } = render(<MobileBottomNav {...defaultProps} currentView="cart" />);
    const buttons = container.querySelectorAll('button');
    const cartBtn = Array.from(buttons).find(btn => btn.textContent?.includes('Cart'));
    expect(cartBtn?.className).not.toContain('bg-pink-50');
  });
});
