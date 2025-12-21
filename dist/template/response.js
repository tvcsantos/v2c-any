export const UNKNOWN_ID_RESPONSE_TEMPLATE = (id) => ({
    code: -105,
    message: `Argument 'id', value ${id} not found!`,
});
export const ILLEGAL_MODE_RESPONSE_TEMPLATE = (id, mode) => ({
    code: -106,
    message: `Emulator for id ${id} is not in ${mode} mode!`,
});
