export type ServiceState =
  'stopped' | 'starting' | 'started' | 'stopping' | 'failed';

/**
 * Interface for services that have executable lifecycle methods.
 *
 * Defines the contract for starting and stopping service operations.
 */
export interface ExecutableService {
  /**
   * Indicates the current state of the service.
   */
  readonly state: ServiceState;

  /**
   * Starts the service.
   *
   * @returns A promise that resolves when the service has successfully started
   */
  start(signal?: AbortSignal): Promise<void>;

  /**
   * Stops the service.
   *
   * @returns A promise that resolves when the service has successfully stopped
   */
  stop(): Promise<void>;
}
