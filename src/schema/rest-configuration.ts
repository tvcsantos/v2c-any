import z from 'zod';

// EM1 status (used by mock emulator response)
export const em1StatusSchema = z.object({
  /**
   * Id of the EM1 component instance
   */
  id: z.number(),
  /**
   * Current measurement value, [A]
   */
  current: z.number().optional(),
  /**
   * Voltage measurement value, [V]
   */
  voltage: z.number().optional(),
  /**
   * Active power measurement value, [W]
   */
  act_power: z.number().optional(),
  /**
   * Apparent power measurement value, [VA] (if applicable)
   */
  aprt_power: z.number().optional(),
  /**
   * Power factor measurement value (if applicable)
   */
  pf: z.number().optional(),
  /**
   * Network frequency measurement value (if applicable)
   */
  freq: z.number().optional(),
  /**
   * Indicates factory calibration or which EM1:id is the source for calibration
   */
  calibration: z.string(),
  /**
   * EM1 component error conditions. May contain power_meter_failure, out_of_range:act_power, out_of_range:aprt_power, out_of_range:voltage, out_of_range:current or ct_type_not_set. Present in status only if not empty.
   */
  errors: z.array(z.string()).optional(),
  /**
   * Communicates present conditions, shown if at least one flag is set. Depending on component capabilites may contain: count_disabled
   */
  flags: z.array(z.string()).optional(),
});

export const restAdapterFeedSchema = z.object({ ip: z.string() }).loose();

export const restMockFeedSchema = z
  .object({ value: em1StatusSchema.optional() })
  .loose();

export const restFeedSchema = z.object({
  feed: z.discriminatedUnion('type', [
    z.object({
      type: z.literal('adapter'),
      properties: restAdapterFeedSchema,
    }),
    z.object({
      type: z.literal('mock'),
      properties: restMockFeedSchema.optional(),
    }),
    z.object({ type: z.literal('off') }),
  ]),
});

export const restMetersSchema = z.object({
  grid: restFeedSchema,
  solar: restFeedSchema,
});

export const restProviderSchema = z.object({
  provider: z.literal('rest'),
  properties: z.object({
    port: z.number().int().positive(),
    device: z.string(),
    meters: restMetersSchema,
  }),
});

export type EM1Status = z.infer<typeof em1StatusSchema>;

export type RestProvider = z.infer<typeof restProviderSchema>;

export type RestMeters = z.infer<typeof restMetersSchema>;

export type RestFeed = z.infer<typeof restFeedSchema>;

export type RestAdapterFeed = z.infer<typeof restAdapterFeedSchema>;

export type RestMockFeed = z.infer<typeof restMockFeedSchema>;
