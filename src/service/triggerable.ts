/**
 * Interface for services that can be triggered on demand.
 * Extends ExecutableService with a trigger method that allows external components
 * to initiate a specific action, such as fetching data or sending a request.
 */
export interface Triggerable {
  /**
   * Triggers the service to perform its primary action.
   * Implementations typically use this to fetch data, send requests, or execute a specific operation.
   * @returns A promise that resolves when the trigger action has completed
   */
  trigger(): Promise<void>;
}
