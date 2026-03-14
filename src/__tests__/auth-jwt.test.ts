import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signJwt, verifyJwt, createAccessToken, createRefreshToken } from '@/lib/auth/jwt';
import type { JwtPayload } from '@/lib/auth/jwt';

describe('JWT auth', () => {
  const testUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
  };

  describe('signJwt', () => {
    it('should return a string token', async () => {
      const token = await signJwt({
        sub: 'user-123',
        email: 'test@example.com',
        role: 'user',
        type: 'access',
      });
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    it('should create tokens with different expiry', async () => {
      const short = await signJwt(
        {
          sub: 'u1',
          email: 'a@b.com',
          role: 'user',
          type: 'access',
        },
        '1m',
      );
      const long = await signJwt(
        {
          sub: 'u1',
          email: 'a@b.com',
          role: 'user',
          type: 'refresh',
        },
        '7d',
      );
      // Both should be valid tokens
      expect(short).toBeTruthy();
      expect(long).toBeTruthy();
      expect(short).not.toBe(long);
    });
  });

  describe('verifyJwt', () => {
    it('should verify a valid token', async () => {
      const token = await signJwt({
        sub: 'user-123',
        email: 'test@example.com',
        role: 'admin',
        type: 'access',
      });
      const payload = await verifyJwt(token);
      expect(payload).not.toBeNull();
      expect(payload!.sub).toBe('user-123');
      expect(payload!.email).toBe('test@example.com');
      expect(payload!.role).toBe('admin');
      expect(payload!.type).toBe('access');
    });

    it('should return null for invalid token', async () => {
      const payload = await verifyJwt('invalid-token-string');
      expect(payload).toBeNull();
    });

    it('should return null for tampered token', async () => {
      const token = await signJwt({
        sub: 'user-123',
        email: 'test@example.com',
        role: 'user',
        type: 'access',
      });
      // Tamper with the token
      const tampered = token.slice(0, -5) + 'XXXXX';
      const payload = await verifyJwt(tampered);
      expect(payload).toBeNull();
    });

    it('should return null for empty string', async () => {
      const payload = await verifyJwt('');
      expect(payload).toBeNull();
    });
  });

  describe('createAccessToken', () => {
    it('should create a verifiable access token', async () => {
      const token = await createAccessToken(testUser);
      expect(token).toBeTruthy();
      const payload = await verifyJwt(token);
      expect(payload).not.toBeNull();
      expect(payload!.type).toBe('access');
      expect(payload!.sub).toBe('user-123');
      expect(payload!.email).toBe('test@example.com');
    });

    it('should handle null name', async () => {
      const user = { ...testUser, name: null };
      const token = await createAccessToken(user);
      const payload = await verifyJwt(token);
      expect(payload).not.toBeNull();
      expect(payload!.name).toBeUndefined();
    });
  });

  describe('createRefreshToken', () => {
    it('should create a verifiable refresh token', async () => {
      const token = await createRefreshToken(testUser);
      expect(token).toBeTruthy();
      const payload = await verifyJwt(token);
      expect(payload).not.toBeNull();
      expect(payload!.type).toBe('refresh');
    });

    it('should be different from access token', async () => {
      const access = await createAccessToken(testUser);
      const refresh = await createRefreshToken(testUser);
      expect(access).not.toBe(refresh);
    });
  });
});
