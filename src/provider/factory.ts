/**
 * Generic factory interface for creating instances of a specific type.
 * Provides a standardized way to instantiate objects with configuration options.
 *
 * @template Options - The configuration options type required to create an instance
 * @template T - The type of object this factory creates
 */
export interface Factory<Options, T> {
  /**
   * Creates an instance of type T using the provided options.
   * @param options - Configuration options needed to create the instance
   * @returns An instance of type T configured with the provided options
   */
  create(options: Options): T;
}
