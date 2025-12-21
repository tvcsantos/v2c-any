/**
 * Container for callback properties with a specific payload type.
 * Used to pass asynchronous callbacks that process data updates.
 *
 * @template Payload - The type of data the callback will receive
 */
export type CallbackProperties<Payload> = {
  /** Asynchronous callback function that processes the payload */
  callback: (data: Payload) => Promise<void>;
};
