export const UNKNOWN_ID_RESPONSE_TEMPLATE = (id: string | number) => ({
  code: -105,
  message: `Argument 'id', value ${id} not found!`,
});

export const ILLEGAL_MODE_RESPONSE_TEMPLATE = (
  id: string | number,
  mode: string
) => ({
  code: -106,
  message: `Emulator for id ${id} is not in ${mode} mode!`,
});
