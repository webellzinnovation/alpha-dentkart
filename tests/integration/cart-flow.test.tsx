import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CartSidebar } from '../../components/CartSidebar';
import { CartItem, User, Coupon } from '../../types';

vi.mock('../../utils/api', () => ({
  couponsAPI: {
    validate: vi.fn().mockResolvedValue({
      code: 'SAVE10',
      type: 'percentage',
      value: 10,
    }),
  },
  cartAPI: {
    get: vi.fn().mockResolvedValue({ items: [] }),
    sync: vi.fn().mockResolvedValue({}),
    clear: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
}));
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
}));
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
}));

const mockUser: User = {
  id: 'user_123',
  email: 'test@example.com',
  name: 'Test User',
  phone: '9876543210',
  userType: 'dental-doctor',
  registrationDate: new Date().toISOString(),
  isVerified: true,
  verificationStatus: 'approved',
  orders: [],
  cart: [],
  wishlist: [],
  addresses: [],
};

const mockProduct: CartItem = {
  id: 1,
  cartItemId: 'cart_1',
  name: 'Dental Kit',
  price: 3000,
  quantity: 2,
  rating: 5,
  image: 'test.jpg',
  category: 'Surgical',
  brand: 'BrandA',
};

const mockProduct2: CartItem = {
  id: 2,
  cartItemId: 'cart_2',
  name: 'Toothpaste',
  price: 200,
  quantity: 1,
  rating: 4,
  image: 'paste.jpg',
  category: 'Oral Care',
  brand: 'BrandB',
};

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  cartItems: [] as CartItem[],
  onUpdateQuantity: vi.fn(),
  onRemoveItem: vi.fn(),
  onStartShopping: vi.fn(),
  onCheckout: vi.fn(),
  onGuestCheckout: vi.fn(),
  onLogin: vi.fn(),
  onApplyCoupon: vi.fn(),
  appliedCoupon: null as Coupon | null,
};

describe('Cart Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty cart state', () => {
    render(<CartSidebar {...defaultProps} />);

    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    expect(screen.getByText('Start Shopping')).toBeInTheDocument();
  });

  it('calls onStartShopping when Start Shopping button clicked', () => {
    const onStartShopping = vi.fn();
    render(<CartSidebar {...defaultProps} onStartShopping={onStartShopping} />);

    fireEvent.click(screen.getByText('Start Shopping'));
    expect(onStartShopping).toHaveBeenCalledTimes(1);
  });

  it('displays correct item count in header', () => {
    render(<CartSidebar {...defaultProps} cartItems={[mockProduct]} />);
    expect(screen.getByText('Your Cart (1)')).toBeInTheDocument();
  });

  it('displays multiple items with correct count', () => {
    render(<CartSidebar {...defaultProps} cartItems={[mockProduct, mockProduct2]} />);
    expect(screen.getByText('Your Cart (2)')).toBeInTheDocument();
  });

  it('calculates and displays correct subtotal', () => {
    render(<CartSidebar {...defaultProps} cartItems={[mockProduct, mockProduct2]} />);
    // 2 * 3000 + 1 * 200 = 6200
    expect(screen.getAllByText(/6,200/).length).toBeGreaterThan(0);
  });

  it('calculates single item subtotal', () => {
    render(<CartSidebar {...defaultProps} cartItems={[mockProduct]} />);
    // 2 * 3000 = 6000
    expect(screen.getAllByText(/6,000/).length).toBeGreaterThan(0);
  });

  it('calls onUpdateQuantity with correct delta on plus click', () => {
    const onUpdateQuantity = vi.fn();
    render(
      <CartSidebar
        {...defaultProps}
        cartItems={[mockProduct]}
        onUpdateQuantity={onUpdateQuantity}
      />
    );

    const plusButtons = screen.getAllByRole('button').filter(
      (btn) => btn.querySelector('.fa-plus')
    );
    fireEvent.click(plusButtons[0]);
    expect(onUpdateQuantity).toHaveBeenCalledWith('cart_1', 1);
  });

  it('calls onUpdateQuantity with negative delta on minus click', () => {
    const onUpdateQuantity = vi.fn();
    render(
      <CartSidebar
        {...defaultProps}
        cartItems={[mockProduct]}
        onUpdateQuantity={onUpdateQuantity}
      />
    );

    const minusButtons = screen.getAllByRole('button').filter(
      (btn) => btn.querySelector('.fa-minus')
    );
    fireEvent.click(minusButtons[0]);
    expect(onUpdateQuantity).toHaveBeenCalledWith('cart_1', -1);
  });

  it('calls onRemoveItem when trash button clicked', () => {
    const onRemoveItem = vi.fn();
    render(
      <CartSidebar
        {...defaultProps}
        cartItems={[mockProduct]}
        onRemoveItem={onRemoveItem}
      />
    );

    const trashButtons = screen.getAllByRole('button').filter(
      (btn) => btn.querySelector('.fa-trash-alt')
    );
    fireEvent.click(trashButtons[0]);
    expect(onRemoveItem).toHaveBeenCalledWith('cart_1');
  });

  it('displays correct quantity per item', () => {
    render(<CartSidebar {...defaultProps} cartItems={[mockProduct]} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows discount and updated total when coupon applied', () => {
    const coupon: Coupon = {
      id: '1',
      code: 'SAVE10',
      type: 'percentage',
      value: 10,
      isActive: true,
    };
    render(
      <CartSidebar
        {...defaultProps}
        cartItems={[mockProduct]}
        appliedCoupon={coupon}
      />
    );

    // Subtotal: 6000, Discount: 10% = 600, Total: 5400
    expect(screen.getAllByText(/6,000/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/-₹600/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/5,400/).length).toBeGreaterThan(0);
  });

  it('shows fixed discount for fixed-type coupon', () => {
    const coupon: Coupon = {
      id: '2',
      code: 'FLAT500',
      type: 'fixed',
      value: 500,
      isActive: true,
    };
    render(
      <CartSidebar
        {...defaultProps}
        cartItems={[mockProduct]}
        appliedCoupon={coupon}
      />
    );

    // Subtotal: 6000, Discount: 500, Total: 5500
    expect(screen.getAllByText(/-₹500/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/5,500/).length).toBeGreaterThan(0);
  });

  it('caps percentage discount at maxDiscount', () => {
    const coupon: Coupon = {
      id: '3',
      code: 'CAPPED',
      type: 'percentage',
      value: 50,
      maxDiscount: 1000,
      isActive: true,
    };
    render(
      <CartSidebar
        {...defaultProps}
        cartItems={[mockProduct]}
        appliedCoupon={coupon}
      />
    );

    // Subtotal: 6000, 50% = 3000, capped at 1000, Total: 5000
    expect(screen.getAllByText(/-₹1,000/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/5,000/).length).toBeGreaterThan(0);
  });

  it('does not allow total below zero', () => {
    const coupon: Coupon = {
      id: '4',
      code: 'BIGDISCOUNT',
      type: 'fixed',
      value: 99999,
      isActive: true,
    };
    render(
      <CartSidebar
        {...defaultProps}
        cartItems={[mockProduct2]}
        appliedCoupon={coupon}
      />
    );

    // Subtotal: 200, discount: 99999 -> total should be 0
    expect(screen.getAllByText(/₹0/).length).toBeGreaterThan(0);
  });

  it('shows applied coupon badge and remove button', () => {
    const coupon: Coupon = {
      id: '5',
      code: 'SAVE10',
      type: 'percentage',
      value: 10,
      isActive: true,
    };
    render(
      <CartSidebar
        {...defaultProps}
        cartItems={[mockProduct]}
        appliedCoupon={coupon}
      />
    );

    expect(screen.getByText('SAVE10 Applied')).toBeInTheDocument();
  });

  it('calls onApplyCoupon(null) when removing applied coupon', () => {
    const onApplyCoupon = vi.fn();
    const coupon: Coupon = {
      id: '6',
      code: 'SAVE10',
      type: 'percentage',
      value: 10,
      isActive: true,
    };
    render(
      <CartSidebar
        {...defaultProps}
        cartItems={[mockProduct]}
        appliedCoupon={coupon}
        onApplyCoupon={onApplyCoupon}
      />
    );

    const allButtons = screen.getAllByRole('button');
    const removeButton = allButtons.find(
      (btn) => btn.querySelector('.fa-times-circle')
    )!;
    fireEvent.click(removeButton);
    expect(onApplyCoupon).toHaveBeenCalledWith(null);
  });

  it('enables Apply button only when coupon code is entered', () => {
    render(<CartSidebar {...defaultProps} cartItems={[mockProduct]} />);

    const applyBtn = screen.getByText('Apply').closest('button')!;
    expect(applyBtn).toBeDisabled();

    const input = screen.getByPlaceholderText('Coupon Code');
    fireEvent.change(input, { target: { value: 'SAVE10' } });
    expect(applyBtn).not.toBeDisabled();
  });

  it('validates coupon and calls onApplyCoupon on success', async () => {
    const onApplyCoupon = vi.fn();
    const { couponsAPI } = await import('../../utils/api');

    render(
      <CartSidebar
        {...defaultProps}
        cartItems={[mockProduct]}
        onApplyCoupon={onApplyCoupon}
      />
    );

    const input = screen.getByPlaceholderText('Coupon Code');
    fireEvent.change(input, { target: { value: 'SAVE10' } });
    fireEvent.click(screen.getByText('Apply'));

    await waitFor(() => {
      expect(couponsAPI.validate).toHaveBeenCalledWith('SAVE10', 6000);
      expect(onApplyCoupon).toHaveBeenCalledWith({
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
      });
    });
  });

  it('shows error message for invalid coupon', async () => {
    const { couponsAPI } = await import('../../utils/api');
    (couponsAPI.validate as any).mockRejectedValueOnce({
      response: { data: { error: 'Coupon not found' } },
    });

    render(<CartSidebar {...defaultProps} cartItems={[mockProduct]} />);

    const input = screen.getByPlaceholderText('Coupon Code');
    fireEvent.change(input, { target: { value: 'INVALID' } });
    fireEvent.click(screen.getByText('Apply'));

    await waitFor(() => {
      expect(screen.getByText('Coupon not found')).toBeInTheDocument();
    });
  });

  it('shows default error message when coupon validation fails without response data', async () => {
    const { couponsAPI } = await import('../../utils/api');
    (couponsAPI.validate as any).mockRejectedValueOnce(new Error('Network error'));

    render(<CartSidebar {...defaultProps} cartItems={[mockProduct]} />);

    const input = screen.getByPlaceholderText('Coupon Code');
    fireEvent.change(input, { target: { value: 'FAIL' } });
    fireEvent.click(screen.getByText('Apply'));

    await waitFor(() => {
      expect(screen.getByText('Invalid coupon code')).toBeInTheDocument();
    });
  });

  it('calls onCheckout when checkout button clicked with user', () => {
    const onCheckout = vi.fn();
    const onClose = vi.fn();
    render(
      <CartSidebar
        {...defaultProps}
        cartItems={[mockProduct]}
        user={mockUser}
        onCheckout={onCheckout}
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByText('Checkout'));
    expect(onClose).toHaveBeenCalled();
    expect(onCheckout).toHaveBeenCalled();
  });

  it('calls onLogin when checkout clicked without user', () => {
    const onLogin = vi.fn();
    const onClose = vi.fn();
    render(
      <CartSidebar
        {...defaultProps}
        cartItems={[mockProduct]}
        onLogin={onLogin}
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByText('Checkout'));
    expect(onClose).toHaveBeenCalled();
    expect(onLogin).toHaveBeenCalled();
  });

  it('shows guest checkout button when no user', () => {
    const onGuestCheckout = vi.fn();
    render(
      <CartSidebar
        {...defaultProps}
        cartItems={[mockProduct]}
        onGuestCheckout={onGuestCheckout}
      />
    );

    expect(screen.getByText('Continue as Guest')).toBeInTheDocument();
  });

  it('hides guest checkout button when user is logged in', () => {
    render(
      <CartSidebar
        {...defaultProps}
        cartItems={[mockProduct]}
        user={mockUser}
        onGuestCheckout={vi.fn()}
      />
    );

    expect(screen.queryByText('Continue as Guest')).not.toBeInTheDocument();
  });

  it('hides checkout and coupon section when cart is empty', () => {
    render(<CartSidebar {...defaultProps} cartItems={[]} />);

    expect(screen.queryByText('Checkout')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Coupon Code')).not.toBeInTheDocument();
  });

  it('closes sidebar when overlay clicked', () => {
    const onClose = vi.fn();
    render(
      <CartSidebar
        {...defaultProps}
        cartItems={[mockProduct]}
        onClose={onClose}
      />
    );

    const overlay = document.querySelector('.fixed.inset-0.bg-black\\/50') as HTMLElement;
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalled();
  });

  it('closes sidebar when close button clicked', () => {
    const onClose = vi.fn();
    render(
      <CartSidebar
        {...defaultProps}
        cartItems={[mockProduct]}
        onClose={onClose}
      />
    );

    const allButtons = screen.getAllByRole('button');
    const closeButton = allButtons.find(
      (btn) => btn.querySelector('.fa-times')
    )!;
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalled();
  });

  it('renders each item with its name and price', () => {
    render(
      <CartSidebar {...defaultProps} cartItems={[mockProduct, mockProduct2]} />
    );

    expect(screen.getByText('Dental Kit')).toBeInTheDocument();
    expect(screen.getByText('Toothpaste')).toBeInTheDocument();
    expect(screen.getAllByText(/3,000/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/200/).length).toBeGreaterThan(0);
  });

  it('uppercase coupon input on change', () => {
    render(<CartSidebar {...defaultProps} cartItems={[mockProduct]} />);

    const input = screen.getByPlaceholderText('Coupon Code') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'save10' } });
    expect(input.value).toBe('SAVE10');
  });
});
