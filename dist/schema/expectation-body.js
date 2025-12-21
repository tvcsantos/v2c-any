export const expectationBodySchema = {
    type: 'object',
    properties: {
        voltage: { type: 'number' },
        current: { type: 'number' },
        act_power: { type: 'number' },
        aprt_power: { type: 'number' },
        pf: { type: 'number' },
        freq: { type: 'number' },
        calibration: { type: 'string' },
        errors: { type: 'array', items: { type: 'string' } },
        flags: { type: 'array', items: { type: 'string' } },
    },
    required: ['calibration'],
};
