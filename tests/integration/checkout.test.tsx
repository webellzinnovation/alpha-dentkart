import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Checkout } from '../../components/Checkout';
import { User, CartItem } from '../../types';

// Mock Razorpay Service
vi.mock('../../utils/razorpayService', () => ({
  initializeRazorpay: vi.fn().mockResolvedValue(true),
  createRazorpayOrder: vi.fn().mockReturnValue('order_123'),
  formatAmountForRazorpay: vi.fn((amount) => amount * 100),
  getRazorpayKey: vi.fn().mockReturnValue('rzp_test_123'),
}));

// Mock API
vi.mock('../../utils/api', () => ({
  couponsAPI: {
    validate: vi.fn().mockResolvedValue({
      code: 'SAVE10',
      type: 'percentage',
      value: 10,
    }),
  },
}));

const mockUser: User = {
  uid: 'user_123',
  email: 'test@example.com',
  name: 'Test User',
  phone: '9876543210',
  userType: 'regular',
  registrationDate: new Date().toISOString(),
  isVerified: true,
  verificationStatus: 'approved',
  orders: [],
  cart: [],
  wishlist: [],
  addresses: [
    {
      id: 1,
      type: 'Home',
      name: 'My Home',
      street: '123 Main St',
      city: 'Mumbai',
      state: 'Maharashtra',
      zip: '400001',
      phone: '9876543210',
      isDefault: true,
    },
  ],
};

const mockCart: CartItem[] = [
  {
    id: 1,
    cartItemId: 'cart_1',
    name: 'Dental Kit',
    price: 3000,
    quantity: 2,
    rating: 5,
    image: 'test.jpg',
    category: 'Surgical',
    brand: 'BrandA',
  },
];

describe('Checkout Component Integration', () => {
  it('calculates totals correctly without coupon', () => {
    render(
      <Checkout
        cart={mockCart}
        user={mockUser}
        onUpdateUser={vi.fn()}
        onPlaceOrder={vi.fn()}
        onNavigateBack={vi.fn()}
      />
    );

    // Subtotal: 2 * 3000 = 6000
    // Shipping: subtotal > 5000 ? 0 : 150 -> 0
    expect(screen.getAllByText(/6,000/).length).toBeGreaterThan(0);
    expect(screen.getByText('FREE')).toBeInTheDocument();
    expect(screen.getByText(/Pay ₹6,000/)).toBeInTheDocument();
  });

  it('applies coupon correctly', async () => {
    const onApplyCoupon = vi.fn();
    render(
      <Checkout
        cart={mockCart}
        user={mockUser}
        onUpdateUser={vi.fn()}
        onPlaceOrder={vi.fn()}
        onNavigateBack={vi.fn()}
        onApplyCoupon={onApplyCoupon}
      />
    );

    const input = screen.getByPlaceholderText('Coupon Code');
    const applyBtn = screen.getByText('Apply');

    fireEvent.change(input, { target: { value: 'SAVE10' } });
    fireEvent.click(applyBtn);

    await waitFor(() => {
      expect(onApplyCoupon).toHaveBeenCalledWith({
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
      });
    });
  });

  it('shows error for invalid coupon', async () => {
    const { couponsAPI } = await import('../../utils/api');
    (couponsAPI.validate as any).mockRejectedValueOnce({
      response: { data: { error: 'Coupon not found' } },
    });

    render(
      <Checkout
        cart={mockCart}
        user={mockUser}
        onUpdateUser={vi.fn()}
        onPlaceOrder={vi.fn()}
        onNavigateBack={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText('Coupon Code');
    const applyBtn = screen.getByText('Apply');

    fireEvent.change(input, { target: { value: 'INVALID' } });
    fireEvent.click(applyBtn);

    await waitFor(() => {
      expect(screen.getByText('Coupon not found')).toBeInTheDocument();
    });
  });

  it('selects address and proceeds to payment', async () => {
    const onPlaceOrder = vi.fn();
    const { initializeRazorpay } = await import('../../utils/razorpayService');

    render(
      <Checkout
        cart={mockCart}
        user={mockUser}
        onUpdateUser={vi.fn()}
        onPlaceOrder={onPlaceOrder}
        onNavigateBack={vi.fn()}
        razorpayKey="rzp_test_123"
      />
    );

    const payBtn = screen.getByText('Pay ₹6,000');
    fireEvent.click(payBtn);

    await waitFor(() => {
      expect(initializeRazorpay).toHaveBeenCalled();
    });
  });
});
