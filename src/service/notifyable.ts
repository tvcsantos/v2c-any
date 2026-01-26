/**
 * Interface for services that can be notified of external events.
 * Extends ExecutableService with a notify method that allows external components
 * to signal events, typically used to reset timers or trigger specific actions.
 */
export interface Notifyable {
  /**
   * Notifies the service of an external event.
   * Implementations typically use this to reset keep-alive timers or trigger specific actions.
   * @returns A promise that resolves when the notification has been processed
   */
  notify(): Promise<void>;
}
