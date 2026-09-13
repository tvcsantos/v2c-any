import pino from 'pino';

export const logger = pino({
  transport:
    process.env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname',
            messageFormat: '{msg}',
            singleLine: true,
            hideObject: false,
          },
        }
      : undefined,
  level: process.env.V2CA_LOG_LEVEL || 'info',
});
