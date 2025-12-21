import z from 'zod';
export const energyInformationSchema = z.object({
    power: z.number(),
});
export const mqttPushBridgeFeedSchema = z
    .object({
    url: z.string(),
    topic: z.string(),
})
    .loose();
export const mqttPushFeedSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal('bridge'),
        properties: mqttPushBridgeFeedSchema,
    }),
    z.object({ type: z.literal('off') }),
]);
export const mqttPullMockFeedSchema = z
    .object({
    interval: z.number().int().nonnegative(),
    value: energyInformationSchema.optional(),
})
    .loose();
export const mqttPullAdapterFeedSchema = z
    .object({
    interval: z.number().int().nonnegative(),
    ip: z.string(),
})
    .loose();
export const mqttPullFeedSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal('adapter'),
        properties: mqttPullAdapterFeedSchema,
    }),
    z.object({
        type: z.literal('mock'),
        properties: mqttPullMockFeedSchema,
    }),
    z.object({ type: z.literal('off') }),
]);
export const mqttFeedModeSchema = z.discriminatedUnion('mode', [
    z.object({
        mode: z.literal('pull'),
        feed: mqttPullFeedSchema,
    }),
    z.object({
        mode: z.literal('push'),
        feed: mqttPushFeedSchema,
    }),
]);
export const mqttMetersSchema = z.object({
    grid: mqttFeedModeSchema,
    solar: mqttFeedModeSchema,
});
export const mqttProviderSchema = z.object({
    provider: z.literal('mqtt'),
    properties: z.object({
        url: z.string(),
        device: z.string(),
        meters: mqttMetersSchema,
    }),
});
