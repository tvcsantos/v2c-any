import pino from 'pino';

export const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname',
      messageFormat: '{msg}',
      singleLine: true,
      hideObject: false,
    },
  },
  level: process.env.LOG_LEVEL || 'info',
});
