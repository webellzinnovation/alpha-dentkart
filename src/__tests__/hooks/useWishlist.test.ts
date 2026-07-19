import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWishlist } from '../../../hooks/useWishlist';
import type { Product } from '../../../types';

vi.mock('../../../utils/api', () => ({
  wishlistAPI: {
    get: vi.fn().mockResolvedValue({ items: [] }),
    add: vi.fn().mockResolvedValue({}),
    remove: vi.fn().mockResolvedValue({}),
    sync: vi.fn().mockResolvedValue({}),
  },
}));

const mockProduct: Product = {
  id: 1,
  name: 'Dental Kit',
  category: 'Surgical',
  price: 3000,
  rating: 5,
  image: 'test.jpg',
  brand: 'BrandA',
};

const mockProduct2: Product = {
  id: 2,
  name: 'Toothpaste',
  category: 'Oral Care',
  price: 150,
  rating: 4,
  image: 'test2.jpg',
  brand: 'Colgate',
};

describe('useWishlist', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes with empty wishlist', () => {
    const { result } = renderHook(() => useWishlist(null, false, []));
    expect(result.current.wishlist).toEqual([]);
  });

  it('initializes from localStorage', () => {
    localStorage.setItem('alpha_wishlist', JSON.stringify([mockProduct]));
    const { result } = renderHook(() => useWishlist(null, false, []));
    expect(result.current.wishlist).toHaveLength(1);
  });

  it('toggles product into wishlist', () => {
    const { result } = renderHook(() => useWishlist(null, false, []));
    act(() => {
      result.current.toggleWishlist(mockProduct);
    });
    expect(result.current.wishlist).toHaveLength(1);
    expect(result.current.wishlist[0].id).toBe(1);
  });

  it('toggles product out of wishlist', () => {
    const { result } = renderHook(() => useWishlist(null, false, [mockProduct]));
    // Add first
    act(() => {
      result.current.toggleWishlist(mockProduct);
    });
    expect(result.current.wishlist).toHaveLength(1);
    // Remove
    act(() => {
      result.current.toggleWishlist(mockProduct);
    });
    expect(result.current.wishlist).toHaveLength(0);
  });

  it('isInWishlist checks product presence', () => {
    const { result } = renderHook(() => useWishlist(null, false, []));
    act(() => {
      result.current.toggleWishlist(mockProduct);
    });
    expect(result.current.isInWishlist(1)).toBe(true);
    expect(result.current.isInWishlist(999)).toBe(false);
  });

  it('does not add duplicate products', () => {
    const { result } = renderHook(() => useWishlist(null, false, []));
    act(() => {
      result.current.toggleWishlist(mockProduct);
    });
    act(() => {
      result.current.toggleWishlist(mockProduct);
    });
    expect(result.current.wishlist).toHaveLength(0);
  });

  it('persists to localStorage', () => {
    const { result } = renderHook(() => useWishlist(null, false, []));
    act(() => {
      result.current.toggleWishlist(mockProduct);
    });
    const saved = JSON.parse(localStorage.getItem('alpha_wishlist')!);
    expect(saved).toHaveLength(1);
  });

  it('handles multiple products', () => {
    const { result } = renderHook(() => useWishlist(null, false, []));
    act(() => {
      result.current.toggleWishlist(mockProduct);
    });
    act(() => {
      result.current.toggleWishlist(mockProduct2);
    });
    expect(result.current.wishlist).toHaveLength(2);
  });
});
