/**
 * Generic notification frame structure from Shelly devices.
 * Encapsulates the RPC notification message format with source, destination, method, and parameters.
 *
 * @template T - The type of the notification parameters
 */
export type RpcNotificationFrame<T> = {
  /** Source identifier of the notification */
  src: string;
  /** Destination identifier of the notification */
  dst: string;
  /** RPC method name being notified */
  method: string;
  /** Notification parameters of type T */
  params: T;
};

/**
 * Generic RPC response frame structure from Shelly devices.
 * Encapsulates the RPC response message format with correlation ID, source, destination, and result.
 *
 * @template T - The type of the response result
 */
export type RpcResponseFrame<T> = {
  /** Request correlation ID matching the original request */
  id: number;
  /** Source identifier of the response */
  src: string;
  /** Destination identifier of the response */
  dst: string;
  /** Response result data of type T */
  result: T;
};
