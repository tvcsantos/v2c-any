import Fastify, {
  type FastifyInstance,
  type FastifyTypeProviderDefault,
  type RawServerDefault,
} from 'fastify';
import basicAuth from '@fastify/basic-auth';
import { logger } from '../utils/logger.js';
import type { IncomingMessage, ServerResponse } from 'http';
import type { Logger } from 'pino';
import { AbstractExecutableService } from './abstract-executable-service.js';
import { RestServiceProperties } from './rest-service.js';
import { ServiceState } from './executable-service.js';

const logLevels = [
  'trace',
  'debug',
  'info',
  'warn',
  'error',
  'fatal',
  'silent',
] as const;

/**
 * Administrative REST service for health checks and runtime controls.
 *
 * Implements the executable service lifecycle to start and stop the HTTP
 * server.
 */
export class AdminRestService extends AbstractExecutableService {
  /**
   * The Fastify application instance, or null when the service is not running
   */
  private app: FastifyInstance<
    RawServerDefault,
    IncomingMessage,
    ServerResponse<IncomingMessage>,
    Logger,
    FastifyTypeProviderDefault
  > | null = null;

  constructor(
    private readonly properties: RestServiceProperties,
    private readonly hasMainServiceStarted: () => Promise<ServiceState>
  ) {
    super();
  }

  /**
   * Starts the REST server and registers endpoints.
   *
   * - `GET /actuator/health` reports main service availability
   * - `PUT /actuator/log-level` updates the runtime log level
   *
   * @returns A promise that resolves when the server is listening
   */
  protected async doStart(): Promise<void> {
    logger.info('Starting Admin REST service...');
    const username = process.env.V2CA_ADMIN_USERNAME;
    const password = process.env.V2CA_ADMIN_PASSWORD;
    if (!username || !password) {
      throw new Error(
        'V2CA_ADMIN_USERNAME and V2CA_ADMIN_PASSWORD must be set'
      );
    }

    const app = Fastify({
      loggerInstance: logger,
      disableRequestLogging: true,
    });

    this.app = app;

    await app.register(
      async (api) => {
        await api.register(basicAuth, {
          authenticate: { realm: 'v2ca' },
          validate: (
            candidateUsername,
            candidatePassword,
            _request,
            _reply,
            done
          ) => {
            if (
              candidateUsername !== username ||
              candidatePassword !== password
            ) {
              done(new Error('Invalid credentials'));
              return;
            }
            done();
          },
        });

        // Health remains public so external monitors can probe it.
        api.get('/health', async (request, reply) => {
          const status = await this.hasMainServiceStarted();
          if (status !== 'started') {
            return reply.status(503).send({ status: 'DOWN' });
          }
          return reply.send({ status: 'UP' });
        });

        api.put<{ Body: { level: (typeof logLevels)[number] } }>(
          '/log-level',
          {
            onRequest: api.basicAuth,
            schema: {
              body: {
                type: 'object',
                required: ['level'],
                additionalProperties: false,
                properties: {
                  level: {
                    type: 'string',
                    enum: [...logLevels],
                  },
                },
              },
            },
          },
          async (request, reply) => {
            logger.level = request.body.level;
            return reply.status(204).send();
          }
        );
      },
      { prefix: '/actuator' }
    );

    await app.listen({ port: this.properties.port, host: '0.0.0.0' });
    logger.info({ port: this.properties.port }, 'Listening');
    logger.info('Admin REST service started');
  }

  /**
   * Stops the REST server if running.
   *
   * @returns A promise that resolves when the server has closed
   */
  protected async doStop(): Promise<void> {
    logger.info('Stopping Admin REST service...');
    if (this.app) {
      await this.app.close();
    }
    logger.info('Admin REST service stopped');
  }
}
