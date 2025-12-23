/**
 * Interface for services that have executable lifecycle methods.
 * Defines the contract for starting and stopping service operations.
 */
export interface ExecutableService {
  /** Indicates whether the service has been started */
  readonly started: boolean;

  /**
   * Starts the service.
   * @returns A promise that resolves when the service has successfully started
   */
  start(): Promise<void>;

  /**
   * Stops the service.
   * @returns A promise that resolves when the service has successfully stopped
   */
  stop(): Promise<void>;
}
