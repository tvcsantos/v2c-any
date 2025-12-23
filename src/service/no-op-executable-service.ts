import { AbstractExecutableService } from './abstract-executable-service.js';

/**
 * A no-operation implementation of ExecutableService.
 * Used as a null-object pattern implementation when no actual service execution is needed.
 */
class NoOpExecutableService extends AbstractExecutableService {
  /**
   * Starts the service (no-op implementation).
   * @returns An immediately resolved promise
   */
  async doStart() {
    // no-op
  }

  /**
   * Stops the service (no-op implementation).
   * @returns An immediately resolved promise
   */
  async doStop() {
    // no-op
  }
}

/**
 * Singleton instance of the no-operation executable service.
 * Use this when a service instance is required but no actual execution is needed.
 */
export const noOpExecutableService = new NoOpExecutableService();
