/**
 * Generic adapter interface for transforming data from one format to another.
 * Provides type-safe conversion between different data structures or
 * representations.
 *
 * @template Input - The input type to be adapted
 * @template Output - The output type after adaptation
 */
export interface Adapter<Input, Output> {
  /**
   * Adapts the input data from Input type to Output type.
   * @param input - The input data to be transformed
   * @returns A promise that resolves to the adapted data of Output type
   */
  adapt(input: Input): Promise<Output>;
}
