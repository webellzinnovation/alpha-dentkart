import { afterEach, vi } from 'vitest';

// Set required env vars before any imports
process.env.JWT_SECRET = 'test-secret-key-for-testing-only-minimum-32-chars!!';
process.env.JWT_EXPIRES_IN = '1d';
process.env.RAZORPAY_KEY_SECRET = 'test_razorpay_secret_key_1234567890';
process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify({
  projectId: 'test-project-id',
  clientEmail: 'test@test-project.iam.gserviceaccount.com',
  privateKey: '-----BEGIN RSA PRIVATE KEY-----\ntest\n-----END RSA PRIVATE KEY-----',
});

// Mock firebase-admin to prevent real Firebase initialization
vi.mock('firebase-admin', () => {
  const firestoreMock = {
    collection: vi.fn().mockReturnThis(),
    doc: vi.fn().mockReturnThis(),
    get: vi.fn().mockResolvedValue({ docs: [], empty: true, size: 0 }),
    add: vi.fn().mockResolvedValue({ id: 'mock-doc-id' }),
    set: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    count: vi.fn().mockReturnThis(),
    batch: vi.fn().mockReturnValue({
      update: vi.fn(),
      delete: vi.fn(),
      commit: vi.fn().mockResolvedValue(undefined),
    }),
  };

  return {
    default: {
      apps: [],
      initializeApp: vi.fn(),
      credential: {
        cert: vi.fn(),
      },
      firestore: vi.fn().mockReturnValue(firestoreMock),
      auth: vi.fn().mockReturnValue({
        verifyIdToken: vi.fn(),
        createUser: vi.fn(),
        getUserByEmail: vi.fn(),
      }),
    },
    firestore: {
      FieldValue: {
        increment: vi.fn(),
        serverTimestamp: vi.fn(),
        arrayUnion: vi.fn(),
        arrayRemove: vi.fn(),
      },
    },
  };
});

// Mock nodemailer
vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn().mockReturnValue({
      sendMail: vi.fn().mockResolvedValue({ messageId: 'mock-message-id' }),
      verify: vi.fn().mockResolvedValue(true),
    }),
  },
}));

// Mock ioredis
vi.mock('ioredis', () => ({
  default: vi.fn().mockImplementation(() => ({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
    disconnect: vi.fn(),
  })),
}));

// Mock winston logger
vi.mock('../utils/logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock errorTracker
vi.mock('../utils/errorTracker', () => ({
  errorTracker: {
    captureException: vi.fn(),
    captureMessage: vi.fn(),
  },
}));

afterEach(() => {
  vi.clearAllMocks();
});
