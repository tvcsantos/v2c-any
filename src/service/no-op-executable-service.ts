import { AbstractExecutableService } from './abstract-executable-service.js';

/**
 * A no-operation implementation of ExecutableService.
 * Used as a null-object pattern implementation when no actual service execution is needed.
 */
export class NoOpExecutableService extends AbstractExecutableService {
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
 * Wraps an object to make it an ExecutableService with no-op start/stop methods.
 * Uses a Proxy to combine the target object's methods with ExecutableService lifecycle methods.
 * The resulting object can be used anywhere an ExecutableService is expected while retaining
 * all original object functionality.
 *
 * @template T - The type of the target object to wrap
 * @param target - The object instance to wrap with ExecutableService functionality
 * @returns A proxy that implements both the target's interface and ExecutableService
 *
 * @example
 * ```typescript
 * const myObj = { doWork() { console.log('working'); } };
 * const wrapped = asNoOpExecutableService(myObj);
 * await wrapped.start();  // no-op
 * wrapped.doWork();        // calls original method
 * await wrapped.stop();    // no-op
 * ```
 */
export function asNoOpExecutableService<T extends object>(
  target: T
): T & NoOpExecutableService {
  const service = new NoOpExecutableService();

  return new Proxy(service, {
    get(_, prop) {
      // First check the service (start, stop, started)
      if (prop in service) {
        return (service as never)[prop];
      }
      // Then check the target
      return (target as never)[prop];
    },
  }) as unknown as T & NoOpExecutableService;
}
