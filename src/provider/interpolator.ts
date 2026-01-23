/**
 * Generic interpolator interface for blending values.
 * Provides a contract for implementing various interpolation strategies
 * between two values of the same type.
 *
 * @template T - The type of values to interpolate
 */
export interface Interpolator<T> {
  /**
   * Interpolates between two values using the given weight.
   * @param newValue - The new value
   * @param previousValue - The previous value
   * @param alpha - The weight/smoothing factor (0 to 1)
   * @returns The interpolated value
   */
  interpolate(newValue: T, previousValue: T, alpha: number): T;
}

/**
 * Collection of built-in interpolators for common data types.
 * Provides factory methods for creating interpolators for numbers, objects, arrays,
 * and identity transformations.
 */
export const Interpolators = {
  /**
   * Creates a linear interpolator for numbers.
   * Uses the formula: alpha * newValue + (1 - alpha) * previousValue
   * @returns An interpolator for numeric values
   */
  number: (): Interpolator<number> => ({
    interpolate: (newVal, prevVal, alpha) =>
      alpha * newVal + (1 - alpha) * prevVal,
  }),

  /**
   * Creates a composite interpolator for objects.
   * Applies property-specific interpolators to each field of the object.
   * @template T - The object type with string keys
   * @param interpolators - A record mapping property names to their interpolators
   * @returns An interpolator that applies the appropriate interpolator to each property
   */
  object: <T extends Record<string, unknown>>(interpolators: {
    [K in keyof T]: Interpolator<T[K]>;
  }): Interpolator<T> => ({
    interpolate: (newVal, prevVal, alpha) => {
      const result = { ...newVal };
      for (const key in interpolators) {
        if (Object.prototype.hasOwnProperty.call(interpolators, key)) {
          const interpolator = interpolators[key];
          result[key] = interpolator.interpolate(
            newVal[key],
            prevVal[key],
            alpha
          );
        }
      }
      return result;
    },
  }),

  /**
   * Creates an interpolator for arrays.
   * Applies element-wise interpolation using the provided element interpolator.
   * Assumes arrays have matching lengths.
   * @template T - The type of array elements
   * @param elementInterpolator - The interpolator to apply to each array element
   * @returns An interpolator that processes arrays element by element
   */
  array: <T>(elementInterpolator: Interpolator<T>): Interpolator<T[]> => ({
    interpolate: (newVal, prevVal, alpha) =>
      newVal.map((val, i) =>
        elementInterpolator.interpolate(val, prevVal[i], alpha)
      ),
  }),

  /**
   * Creates an identity interpolator that always returns the new value.
   * Useful when no interpolation is desired.
   * @template T - The type of values
   * @returns An interpolator that ignores the previous value and alpha
   */
  identity: <T>(): Interpolator<T> => ({
    interpolate: (newVal) => newVal,
  }),
};
