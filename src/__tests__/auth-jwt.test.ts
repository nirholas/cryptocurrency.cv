import { describe, it, expect, vi, beforeEach } from 'vitest';

// jose v6 requires Web Crypto APIs not fully available in jsdom
// Mock jose to test our wrapper logic
const { mockJwtVerify } = vi.hoisted(() => ({
  mockJwtVerify: vi.fn(),
}));

vi.mock('jose', () => {
  class MockSignJWT {
    private payload: Record<string, unknown>;
    constructor(payload: Record<string, unknown>) {
      this.payload = payload;
    }
    setProtectedHeader() {
      return this;
    }
    setIssuedAt() {
      return this;
    }
    setIssuer() {
      return this;
    }
    setAudience() {
      return this;
    }
    setExpirationTime() {
      return this;
    }
    async sign() {
      return `header.${btoa(JSON.stringify(this.payload))}.signature`;
    }
  }
  return {
    SignJWT: MockSignJWT,
    jwtVerify: mockJwtVerify,
  };
});

import { signJwt, verifyJwt, createAccessToken, createRefreshToken } from '@/lib/auth/jwt';


describe('JWT auth', () => {
  const testUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockJwtVerify.mockReset();
  });

  describe('signJwt', () => {
    it('should return a string token', async () => {
      const token = await signJwt({
        sub: 'user-123',
        email: 'test@example.com',
        role: 'user',
        type: 'access',
      });
      expect(typeof token).toBe('string');
      expect(token).toContain('.');
    });

    it('should create tokens with different payloads', async () => {
      const token1 = await signJwt({
        sub: 'u1',
        email: 'a@b.com',
        role: 'user',
        type: 'access',
      });
      const token2 = await signJwt({
        sub: 'u2',
        email: 'c@d.com',
        role: 'admin',
        type: 'refresh',
      });
      expect(token1).toBeTruthy();
      expect(token2).toBeTruthy();
      // Different payloads produce different tokens
      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyJwt', () => {
    it('should return payload for valid token', async () => {
      mockJwtVerify.mockResolvedValue({
        payload: {
          sub: 'user-123',
          email: 'test@example.com',
          role: 'admin',
          type: 'access',
        },
      });
      const payload = await verifyJwt('valid.token.here');
      expect(payload).not.toBeNull();
      expect(payload?.sub).toBe('user-123');
      expect(payload?.email).toBe('test@example.com');
      expect(payload?.role).toBe('admin');
      expect(payload?.type).toBe('access');
    });

    it('should return null for invalid token', async () => {
      mockJwtVerify.mockRejectedValue(new Error('Invalid token'));
      const payload = await verifyJwt('invalid-token-string');
      expect(payload).toBeNull();
    });

    it('should return null for tampered token', async () => {
      mockJwtVerify.mockRejectedValue(new Error('signature verification failed'));
      const payload = await verifyJwt('tampered.jwt.token');
      expect(payload).toBeNull();
    });

    it('should return null for empty string', async () => {
      mockJwtVerify.mockRejectedValue(new Error('Invalid Compact JWS'));
      const payload = await verifyJwt('');
      expect(payload).toBeNull();
    });
  });

  describe('createAccessToken', () => {
    it('should create an access token with correct payload', async () => {
      const token = await createAccessToken(testUser);
      expect(token).toBeTruthy();
      // The token should contain our user info encoded in the payload segment
      const payloadPart = token.split('.')[1];
      const decoded = JSON.parse(atob(payloadPart));
      expect(decoded.sub).toBe('user-123');
      expect(decoded.email).toBe('test@example.com');
      expect(decoded.type).toBe('access');
    });

    it('should handle null name', async () => {
      const user = { ...testUser, name: null };
      const token = await createAccessToken(user);
      expect(token).toBeTruthy();
      const payloadPart = token.split('.')[1];
      const decoded = JSON.parse(atob(payloadPart));
      expect(decoded.name).toBeUndefined();
    });
  });

  describe('createRefreshToken', () => {
    it('should create a refresh token', async () => {
      const token = await createRefreshToken(testUser);
      expect(token).toBeTruthy();
      const payloadPart = token.split('.')[1];
      const decoded = JSON.parse(atob(payloadPart));
      expect(decoded.type).toBe('refresh');
    });

    it('should produce a different token from access token', async () => {
      const access = await createAccessToken(testUser);
      const refresh = await createRefreshToken(testUser);
      expect(access).not.toBe(refresh);
    });
  });
});
