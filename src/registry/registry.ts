/**
 * Generic registry for storing and retrieving key-value pairs.
 * Provides a centralized store for managing instances of a specific type.
 *
 * @template T - The type of values stored in this registry
 */
export class Registry<T> {
  private readonly values: Map<string, T> = new Map();

  /**
   * Registers a value with the given key in the registry.
   * @param key - The unique identifier for the value
   * @param value - The value to store
   */
  register(key: string, value: T): void {
    this.values.set(key, value);
  }

  /**
   * Retrieves a value from the registry by its key.
   * @param key - The unique identifier of the value to retrieve
   * @returns The stored value, or undefined if the key is not found
   */
  get(key: string): T | undefined {
    return this.values.get(key);
  }
}
