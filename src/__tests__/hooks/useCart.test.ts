import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCart } from '../../../hooks/useCart';
import type { Product } from '../../../types';

vi.mock('../../../utils/api', () => ({
  cartAPI: {
    get: vi.fn().mockResolvedValue({ items: [] }),
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

describe('useCart', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes with empty cart', () => {
    const { result } = renderHook(() => useCart(null, false, []));
    expect(result.current.cart).toEqual([]);
  });

  it('initializes from localStorage', () => {
    localStorage.setItem('alpha_cart', JSON.stringify([{ ...mockProduct, quantity: 2 }]));
    const { result } = renderHook(() => useCart(null, false, []));
    expect(result.current.cart).toHaveLength(1);
    expect(result.current.cart[0].quantity).toBe(2);
  });

  it('adds product to cart', () => {
    const { result } = renderHook(() => useCart(null, false, []));
    act(() => {
      result.current.addToCart(mockProduct);
    });
    expect(result.current.cart).toHaveLength(1);
    expect(result.current.cart[0].id).toBe(1);
    expect(result.current.cart[0].quantity).toBe(1);
  });

  it('increments quantity when adding same product', () => {
    const { result } = renderHook(() => useCart(null, false, []));
    act(() => {
      result.current.addToCart(mockProduct);
    });
    act(() => {
      result.current.addToCart(mockProduct);
    });
    expect(result.current.cart).toHaveLength(1);
    expect(result.current.cart[0].quantity).toBe(2);
  });

  it('creates separate cart items for different products', () => {
    const { result } = renderHook(() => useCart(null, false, []));
    act(() => {
      result.current.addToCart(mockProduct);
    });
    act(() => {
      result.current.addToCart(mockProduct2);
    });
    expect(result.current.cart).toHaveLength(2);
  });

  it('removes product from cart by cartItemId', () => {
    const { result } = renderHook(() => useCart(null, false, []));
    act(() => {
      result.current.addToCart(mockProduct);
    });
    const cartItemId = result.current.cart[0].cartItemId;
    act(() => {
      result.current.removeFromCart(cartItemId);
    });
    expect(result.current.cart).toHaveLength(0);
  });

  it('updates cart quantity by delta', () => {
    const { result } = renderHook(() => useCart(null, false, []));
    act(() => {
      result.current.addToCart(mockProduct);
    });
    const cartItemId = result.current.cart[0].cartItemId;
    act(() => {
      result.current.updateCartQuantity(cartItemId, 2);
    });
    expect(result.current.cart[0].quantity).toBe(3);
  });

  it('minimum quantity is 1', () => {
    const { result } = renderHook(() => useCart(null, false, []));
    act(() => {
      result.current.addToCart(mockProduct);
    });
    const cartItemId = result.current.cart[0].cartItemId;
    act(() => {
      result.current.updateCartQuantity(cartItemId, -5);
    });
    expect(result.current.cart[0].quantity).toBe(1);
  });

  it('clears cart', () => {
    const { result } = renderHook(() => useCart(null, false, []));
    act(() => {
      result.current.addToCart(mockProduct);
      result.current.addToCart(mockProduct2);
    });
    act(() => {
      result.current.clearCart();
    });
    expect(result.current.cart).toEqual([]);
  });

  it('persists to localStorage', () => {
    const { result } = renderHook(() => useCart(null, false, []));
    act(() => {
      result.current.addToCart(mockProduct);
    });
    const saved = JSON.parse(localStorage.getItem('alpha_cart')!);
    expect(saved).toHaveLength(1);
  });

  it('generates cartItemId with attributes', () => {
    const { result } = renderHook(() => useCart(null, false, []));
    act(() => {
      result.current.addToCart(mockProduct, { Color: 'Blue', Size: 'M' });
    });
    expect(result.current.cart[0].cartItemId).toContain('1-');
    expect(result.current.cart[0].cartItemId).toContain('Color:Blue');
    expect(result.current.cart[0].cartItemId).toContain('Size:M');
  });

  it('toggles cart open state', () => {
    const { result } = renderHook(() => useCart(null, false, []));
    expect(result.current.isCartOpen).toBe(false);
    act(() => {
      result.current.setIsCartOpen(true);
    });
    expect(result.current.isCartOpen).toBe(true);
  });
});
