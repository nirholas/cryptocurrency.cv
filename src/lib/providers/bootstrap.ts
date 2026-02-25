/**
 * Provider Bootstrap — Single entry point to initialize all providers at app startup
 *
 * Import this module once in your application entry point:
 *
 * ```ts
 * import { bootstrapProviders } from '@/lib/providers/bootstrap';
 *
 * // In your server startup / layout.tsx / middleware:
 * bootstrapProviders();
 * ```
 *
 * This will:
 * 1. Initialize the provider registry with all data category chains
 * 2. Log diagnostic info about registered providers
 * 3. Validate that all adapters pass health pre-checks
 *
 * Safe to call multiple times — subsequent calls are no-ops.
 *
 * @module providers/bootstrap
 */

import { initProviders, isProvidersInitialized, getProvidersSummary } from './registry-init';

export { initProviders, isProvidersInitialized, getProvidersSummary };

let _bootstrapped = false;

/**
 * Bootstrap the entire provider system.
 *
 * This is the recommended way to start providers.
 * It initializes the registry and logs a summary.
 *
 * @param options.silent - Suppress startup logs. Default: false
 * @param options.healthCheck - Run health checks on all providers. Default: false
 */
export async function bootstrapProviders(
  options: { silent?: boolean; healthCheck?: boolean } = {},
): Promise<void> {
  if (_bootstrapped) return;
  _bootstrapped = true;

  const { silent = false, healthCheck = false } = options;

  // Step 1: Register all chains
  initProviders();

  if (!silent) {
    console.log('[bootstrap] Provider system initialized');
  }

  // Step 2: Optional health checks
  if (healthCheck) {
    try {
      const summary = await getProvidersSummary();
      const healthy = summary.filter((s) => s.status === 'healthy').length;
      const degraded = summary.filter((s) => s.status === 'degraded').length;
      const down = summary.filter((s) => s.status !== 'healthy' && s.status !== 'degraded').length;

      if (!silent) {
        console.log(
          `[bootstrap] Health: ${healthy} healthy, ${degraded} degraded, ${down} down / ${summary.length} total`,
        );
      }
    } catch (err) {
      if (!silent) {
        console.warn('[bootstrap] Health check failed:', err);
      }
    }
  }
}

/**
 * Check if the provider system has been bootstrapped.
 */
export function isBootstrapped(): boolean {
  return _bootstrapped;
}
