/**
 * Provider that returns a fixed, pre-configured value.
 * Useful for testing, default fallbacks, or static data scenarios.
 * The value can be updated at runtime through the setter.
 *
 * @template T - The type of value this provider supplies
 */
export class FixedValueProvider {
    /**
     * Gets the current fixed value.
     * @returns The stored value, or undefined if not set
     */
    get value() {
        return this._value;
    }
    /**
     * Sets the fixed value to be returned by this provider.
     * @param value - The value to store and return on subsequent calls
     */
    set value(value) {
        this._value = value;
    }
    /**
     * Gets the fixed value asynchronously.
     * @returns A promise that resolves to the stored value
     */
    get() {
        return Promise.resolve(this._value);
    }
}
/**
 * Factory for creating FixedValueProvider instances.
 * Simplifies instantiation of providers with pre-configured static values.
 *
 * @template T - The type of value the created providers will supply
 */
export class FixedValueProviderFactory {
    /**
     * Creates a new fixed value provider factory.
     * @param properties - Configuration containing the fixed value to provide
     */
    constructor(properties) {
        this.properties = properties;
    }
    /**
     * Creates a FixedValueProvider with the configured value.
     * @returns A FixedValueProvider initialized with the configured value
     */
    create() {
        const provider = new FixedValueProvider();
        provider.value = this.properties.value;
        return provider;
    }
}
