/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 *
 * Auth System — Custom JWT-based authentication with magic link emails.
 * Edge-compatible. No next-auth dependency.
 */

export { signJwt, verifyJwt, type JwtPayload } from './jwt';
export {
  generateMagicLinkToken,
  hashToken,
  createMagicLink,
  verifyMagicLinkToken,
} from './tokens';
export {
  createUser,
  getUserByEmail,
  getUserById,
  updateUserLastLogin,
} from './users';
export {
  getSession,
  createSession,
  clearSession,
  withAuth,
  type Session,
} from './session';
