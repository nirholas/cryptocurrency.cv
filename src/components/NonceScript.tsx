/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import { headers } from 'next/headers';

/**
 * Server component that renders a `<script>` tag with the per-request CSP nonce
 * automatically injected. Use this instead of raw `<script>` in any server
 * component that needs to satisfy nonce-based Content-Security-Policy.
 *
 * The nonce is read from the `x-nonce` request header set by the middleware.
 */
export async function NonceScript(props: React.ScriptHTMLAttributes<HTMLScriptElement>) {
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  return <script {...props} nonce={nonce} />;
}
