/**
 * Generic provider interface for asynchronously supplying data of a specific type.
 * Establishes a contract for any component that needs to fetch or retrieve data.
 *
 * @template Response - The type of data this provider supplies
 */
export interface Provider<Response> {
  /**
   * Retrieves data from this provider.
   * @returns A promise that resolves to the provided data of type Response
   */
  get(): Promise<Response>;
}
