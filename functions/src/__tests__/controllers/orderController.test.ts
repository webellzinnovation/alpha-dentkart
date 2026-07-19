import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../config/firebase', () => {
  const firestoreMock: any = {
    collection: vi.fn(),
    doc: vi.fn(),
    get: vi.fn(),
    add: vi.fn(),
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    offset: vi.fn(),
    count: vi.fn(),
    batch: vi.fn().mockReturnValue({
      update: vi.fn(),
      commit: vi.fn().mockResolvedValue(undefined),
    }),
  };
  firestoreMock.collection.mockReturnValue(firestoreMock);
  firestoreMock.doc.mockReturnValue(firestoreMock);
  firestoreMock.where.mockReturnValue(firestoreMock);
  firestoreMock.orderBy.mockReturnValue(firestoreMock);
  firestoreMock.limit.mockReturnValue(firestoreMock);
  firestoreMock.offset.mockReturnValue(firestoreMock);
  firestoreMock.count.mockReturnValue(firestoreMock);

  return {
    db: firestoreMock,
    auth: { verifyIdToken: vi.fn() },
    withTimeout: vi.fn((p: any) => p),
    admin: {
      firestore: {
        FieldValue: {
          increment: vi.fn((v: number) => v),
          serverTimestamp: vi.fn(() => 'mock-timestamp'),
          arrayUnion: vi.fn((v: any) => v),
        },
      },
    },
  };
});

vi.mock('../../utils/validation', () => ({
  createOrderSchema: {
    parse: vi.fn((d: any) => d),
    shape: {},
  },
}));

vi.mock('../../utils/payment', () => ({
  verifyRazorpaySignature: vi.fn().mockReturnValue(true),
}));

vi.mock('../../services/EmailService', () => ({
  emailService: {
    sendOrderConfirmationEmail: vi.fn().mockResolvedValue(undefined),
    sendOrderShippedEmail: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../services/NotificationService', () => ({
  NotificationService: {
    sendToUser: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../utils/logger', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { createOrder, getMyOrders, getAllOrders, updateOrderStatus, deleteOrder } from '../../controllers/orderController';
import { db } from '../../config/firebase';

function mockReqRes(body: any = {}, params: any = {}, query: any = {}, user: any = { id: 'user-1', email: 'test@test.com', role: 'user' }) {
  const req: any = { body, params, query, user, cookies: {} };
  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return { req, res };
}

describe('orderController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createOrder', () => {
    it('creates a COD order successfully', async () => {
      const { req, res } = mockReqRes({
        items: [{ productId: 'p1', quantity: 1, price: 500 }],
        total: 500,
        shippingAddress: { name: 'Test User', address: '123 Test St', city: 'Mumbai', state: 'MH', pincode: '400001', phone: '9876543210' },
        paymentMethod: 'cod',
      });

      const mockSet = vi.fn().mockResolvedValue(undefined);
      const mockDocRef = { set: mockSet };
      (db.collection as any).mockImplementation((col: string) => {
        if (col === 'orders') {
          return {
            doc: vi.fn().mockReturnValue(mockDocRef),
          };
        }
        return {
          where: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue({ empty: true, docs: [] }) }) }),
          doc: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue({ exists: false }), set: vi.fn(), update: vi.fn() }),
          add: vi.fn().mockResolvedValue({ id: 'order-id' }),
        };
      });

      await createOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ order: expect.any(Object) }));
    });

    it('creates a Razorpay order with valid payment', async () => {
      const { req, res } = mockReqRes({
        items: [{ productId: 'p1', quantity: 1, price: 500 }],
        total: 500,
        shippingAddress: { name: 'Test User' },
        paymentMethod: 'razorpay',
        paymentId: 'pay_123',
        razorpay_order_id: 'order_456',
        signature: 'valid-sig',
      });

      (db.collection as any).mockImplementation((col: string) => {
        if (col === 'orders') {
          return { doc: vi.fn().mockReturnValue({ set: vi.fn().mockResolvedValue(undefined) }) };
        }
        return {
          where: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue({ empty: true, docs: [] }) }) }),
          doc: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue({ exists: false }) }),
          add: vi.fn().mockResolvedValue({ id: 'coupon-id' }),
        };
      });

      await createOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('returns 400 for Razorpay order without payment details', async () => {
      const { req, res } = mockReqRes({
        items: [{ productId: 'p1', quantity: 1, price: 500 }],
        total: 500,
        shippingAddress: { name: 'Test User' },
        paymentMethod: 'razorpay',
      });

      await createOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getMyOrders', () => {
    it('returns orders for authenticated user', async () => {
      const { req, res } = mockReqRes();

      const mockDoc = {
        id: 'order-1',
        data: () => ({
          userId: 'user-1',
          total: 500,
          status: 'Processing',
          createdAt: new Date().toISOString(),
        }),
      };
      (db.collection as any).mockReturnValue({
        where: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({ docs: [mockDoc] }),
        }),
      });

      await getMyOrders(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          orders: expect.arrayContaining([expect.objectContaining({ id: 'order-1' })]),
        })
      );
    });

    it('returns 401 for unauthenticated user', async () => {
      const req: any = { body: {}, params: {}, query: {}, user: undefined, cookies: {} };
      const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };

      await getMyOrders(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('getAllOrders', () => {
    it('returns paginated orders for admin', async () => {
      const { req, res } = mockReqRes({}, {}, { page: '1', limit: '10' });

      const mockDoc = {
        id: 'order-1',
        data: () => ({
          userId: 'user-1',
          customerName: 'Test User',
          total: 500,
          status: 'Processing',
          createdAt: new Date().toISOString(),
        }),
      };
      (db.collection as any).mockReturnValue({
        orderBy: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({ docs: [mockDoc] }),
        }),
      });

      await getAllOrders(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          orders: expect.any(Array),
          pagination: expect.objectContaining({ total: 1 }),
        })
      );
    });

    it('filters orders by status', async () => {
      const { req, res } = mockReqRes({}, {}, { status: 'shipped' });

      const mockDoc1 = {
        id: 'order-1',
        data: () => ({ status: 'Shipped', createdAt: new Date().toISOString() }),
      };
      const mockDoc2 = {
        id: 'order-2',
        data: () => ({ status: 'Processing', createdAt: new Date().toISOString() }),
      };
      (db.collection as any).mockReturnValue({
        orderBy: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({ docs: [mockDoc1, mockDoc2] }),
        }),
      });

      await getAllOrders(req, res);

      const callArgs = (res.json as any).mock.calls[0][0];
      expect(callArgs.orders).toHaveLength(1);
    });
  });

  describe('updateOrderStatus', () => {
    it('updates order status successfully', async () => {
      const { req, res } = mockReqRes({ status: 'Shipped' }, { id: 'order-1' });

      const mockDoc = { exists: true, data: () => ({ status: 'Processing' }) };
      const mockUpdatedDoc = { id: 'order-1', data: () => ({ status: 'Shipped' }) };

      (db.collection as any).mockReturnValue({
        doc: vi.fn().mockReturnValue({
          get: vi.fn()
            .mockResolvedValueOnce(mockDoc)
            .mockResolvedValueOnce(mockUpdatedDoc),
          update: vi.fn().mockResolvedValue(undefined),
        }),
      });

      await updateOrderStatus(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String),
          order: expect.any(Object),
        })
      );
    });

    it('returns 400 for invalid status', async () => {
      const { req, res } = mockReqRes({ status: 'InvalidStatus' }, { id: 'order-1' });

      await updateOrderStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 404 for non-existent order', async () => {
      const { req, res } = mockReqRes({ status: 'Shipped' }, { id: 'nonexistent' });

      const mockDoc = { exists: false };
      (db.collection as any).mockReturnValue({
        doc: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue(mockDoc) }),
      });

      await updateOrderStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteOrder', () => {
    it('deletes existing order', async () => {
      const { req, res } = mockReqRes({}, { id: 'order-1' });

      const mockDoc = { exists: true };
      const mockDelete = vi.fn().mockResolvedValue(undefined);
      (db.collection as any).mockReturnValue({
        doc: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue(mockDoc),
          delete: mockDelete,
        }),
      });

      await deleteOrder(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: 'Order deleted successfully' });
      expect(mockDelete).toHaveBeenCalled();
    });

    it('returns 404 for non-existent order', async () => {
      const { req, res } = mockReqRes({}, { id: 'nonexistent' });

      const mockDoc = { exists: false };
      (db.collection as any).mockReturnValue({
        doc: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue(mockDoc) }),
      });

      await deleteOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
