import mqtt, { type MqttClient } from 'mqtt';
import { logger } from './logger.js';

export type PendingMqttClient = {
  client: MqttClient;
  connected: Promise<void>;
};

/**
 * Creates an MQTT client and tracks its initial connection.
 *
 * Returns the client immediately so callers can retain it for cleanup while
 * separately awaiting connection readiness. Aborting force-closes the client.
 *
 * @param url - MQTT broker URL (e.g., mqtt://localhost:1883)
 * @param options - Optional connection options including username and password
 * for authentication
 * @param signal - Signal that cancels the connection attempt
 * @returns The client and a promise that resolves on the initial connection
 * and rejects if the attempt fails, ends, or is aborted
 */
export function createMqttClient(
  url: string,
  options: { username?: string; password?: string } | undefined,
  signal: AbortSignal
): PendingMqttClient {
  const client = mqtt.connect(url, options);
  client.on('reconnect', () => logger.info('Reconnecting...'));

  const connected = new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      client.off('connect', onConnect);
      client.off('error', onError);
      client.off('end', onEnd);
      signal.removeEventListener('abort', onAbort);
    };
    const onConnect = () => {
      cleanup();
      resolve();
    };
    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };
    const onEnd = () => {
      cleanup();
      reject(new Error('MQTT connection ended before connecting'));
    };
    const onAbort = () => {
      cleanup();
      client.end(true);
      reject(
        signal.reason instanceof Error
          ? signal.reason
          : new DOMException('MQTT connection aborted', 'AbortError')
      );
    };

    client.once('connect', onConnect);
    client.once('error', onError);
    client.once('end', onEnd);
    signal.addEventListener('abort', onAbort, { once: true });

    if (signal.aborted) {
      onAbort();
    }
  });

  return { client, connected };
}
