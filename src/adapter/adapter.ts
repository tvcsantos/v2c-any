/**
 * Generic adapter interface for transforming data from one format to another.
 * Provides type-safe conversion between different data structures or representations.
 *
 * @template T - The input type to be adapted
 * @template K - The output type after adaptation
 */
export interface Adapter<T, K> {
  /**
   * Adapts the input data from type T to type K.
   * @param input - The input data to be transformed
   * @returns A promise that resolves to the adapted data of type K
   */
  adapt(input: T): Promise<K>;
}
