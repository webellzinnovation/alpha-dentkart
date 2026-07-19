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
  };
  firestoreMock.collection.mockReturnValue(firestoreMock);
  firestoreMock.doc.mockReturnValue(firestoreMock);
  firestoreMock.where.mockReturnValue(firestoreMock);
  firestoreMock.orderBy.mockReturnValue(firestoreMock);
  firestoreMock.limit.mockReturnValue(firestoreMock);

  return {
    db: firestoreMock,
    withTimeout: vi.fn((p: any) => p),
  };
});

vi.mock('../../services/EmailService', () => ({
  emailService: {
    sendEmail: vi.fn().mockResolvedValue({ messageId: 'mock-id' }),
    getHtmlWrapper: vi.fn().mockReturnValue('<html>test</html>'),
  },
}));

vi.mock('../../utils/logger', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

function mockReqRes(body: any = {}, query: any = {}) {
  const req: any = { body, query };
  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return { req, res };
}

describe('settingsController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('getSettings', () => {
    it('returns null settings when none exist', async () => {
      const { getSettings } = await import('../../controllers/settingsController');
      const { db } = await import('../../config/firebase');
      const { req, res } = mockReqRes();

      const mockDoc = { exists: false };
      (db.doc as any).mockReturnValue({
        get: vi.fn().mockResolvedValue(mockDoc),
      });

      await getSettings(req, res);

      expect(res.json).toHaveBeenCalledWith({ settings: null });
    });

    it('returns store settings', async () => {
      const { getSettings } = await import('../../controllers/settingsController');
      const { db } = await import('../../config/firebase');
      const { req, res } = mockReqRes();

      const mockDoc = {
        exists: true,
        data: () => ({
          general: { storeName: 'Alpha Dentkart' },
          email: { smtp: { host: 'smtp.test.com' } },
          payment: { razorpay: { keyId: 'rzp_test', keySecret: 'secret' } },
        }),
      };
      (db.doc as any).mockReturnValue({
        get: vi.fn().mockResolvedValue(mockDoc),
      });

      await getSettings(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: expect.objectContaining({
            general: expect.objectContaining({ storeName: 'Alpha Dentkart' }),
          }),
        })
      );
    });

    it('sanitizes sensitive payment fields', async () => {
      const { getSettings } = await import('../../controllers/settingsController');
      const { db } = await import('../../config/firebase');
      const { req, res } = mockReqRes();

      const mockDoc = {
        exists: true,
        data: () => ({
          payment: {
            razorpay: { keyId: 'rzp_test', keySecret: 'super-secret' },
            phonepe: { merchantId: 'merchant', saltKey: 'salt-secret' },
          },
          email: { smtp: { host: 'smtp.test.com', password: 'email-pass' } },
        }),
      };
      (db.doc as any).mockReturnValue({
        get: vi.fn().mockResolvedValue(mockDoc),
      });

      await getSettings(req, res);

      const callArgs = (res.json as any).mock.calls[0][0];
      expect(callArgs.settings.payment.razorpay.keySecret).toBeUndefined();
      expect(callArgs.settings.payment.phonepe).toBeDefined();
      expect(callArgs.settings.payment.phonepe.saltKey).toBeUndefined();
      expect(callArgs.settings.payment.phonepe.merchantId).toBe('merchant');
      expect(callArgs.settings.email.smtp.password).toBeUndefined();
      expect(callArgs.settings.email.smtp.host).toBe('smtp.test.com');
    });
  });

  describe('updateSettings', () => {
    it('updates store settings', async () => {
      const { updateSettings } = await import('../../controllers/settingsController');
      const { db } = await import('../../config/firebase');
      const { req, res } = mockReqRes({ general: { storeName: 'New Store' } });

      const mockSet = vi.fn().mockResolvedValue(undefined);
      const mockUpdatedDoc = {
        exists: true,
        data: () => ({ general: { storeName: 'New Store' } }),
      };
      (db.doc as any).mockReturnValue({
        set: mockSet,
        get: vi.fn().mockResolvedValue(mockUpdatedDoc),
      });

      await updateSettings(req, res);

      expect(mockSet).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Settings saved successfully' })
      );
    });
  });
});
