import { Notifyable } from './notifyable.js';

/**
 * No-operation implementation of the Notifyable interface.
 * Does nothing when notified, and delegates start/stop lifecycle to NoOpExecutableService.
 * Used as a placeholder when no keep-alive functionality is needed.
 */
export class NoOpNotifyable implements Notifyable {
  /**
   * Handles notification (does nothing).
   * @returns A promise that resolves immediately without performing any action
   */
  async notify(): Promise<void> {
    return Promise.resolve();
  }
}
