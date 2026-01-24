import z from 'zod';

export const breakerScehema = z.object({
  timeout: z.number().int().nonnegative().optional(),
  errorThresholdPercentage: z.number().min(0).max(100).optional(),
  resetTimeout: z.number().int().nonnegative().optional(),
  rollingCountTimeout: z.number().int().nonnegative().optional(),
  rollingCountBuckets: z.number().int().positive().optional(),
  volumeThreshold: z.number().int().nonnegative().optional(),
  allowWarmUp: z.boolean().optional(),
});

export const retrySchema = z.object({
  attempts: z.number().int().nonnegative().optional(),
  factor: z.number().positive().optional(),
  minTimeout: z.number().int().nonnegative().optional(),
  maxTimeout: z.number().int().nonnegative().optional(),
  randomize: z.boolean().optional(),
  maxRetryTime: z.number().int().nonnegative().optional(),
});

export const emaSchema = z.object({
  alphaRise: z.number().min(0).max(1),
  alphaFall: z.number().min(0).max(1),
  alphaMissing: z.number().min(0).max(1),
  freshnessThreshold: z.number().int().nonnegative().optional(),
});

export type BreakerOptions = z.infer<typeof breakerScehema>;
export type RetryOptions = z.infer<typeof retrySchema>;
export type EmaOptions = z.infer<typeof emaSchema>;
