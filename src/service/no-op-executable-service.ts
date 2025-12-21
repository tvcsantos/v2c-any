import type { ExecutableService } from './executable-service.js';

/**
 * A no-operation implementation of ExecutableService.
 * Used as a null-object pattern implementation when no actual service execution is needed.
 */
class NoOpExecutableService implements ExecutableService {
  /**
   * Starts the service (no-op implementation).
   * @returns An immediately resolved promise
   */
  async start() {
    // no-op
  }

  /**
   * Stops the service (no-op implementation).
   * @returns An immediately resolved promise
   */
  async stop() {
    // no-op
  }
}

/**
 * Singleton instance of the no-operation executable service.
 * Use this when a service instance is required but no actual execution is needed.
 */
export const noOpExecutableService = new NoOpExecutableService();
