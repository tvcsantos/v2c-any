import Fastify, {
  type FastifyInstance,
  type FastifyTypeProviderDefault,
  type RawServerDefault,
} from 'fastify';
import {
  ILLEGAL_MODE_RESPONSE_TEMPLATE,
  UNKNOWN_ID_RESPONSE_TEMPLATE,
} from '../template/response.js';
import { expectationBodySchema } from '../schema/expectation-body.js';
import { statusQuerySchema } from '../schema/status-query.js';
import { logger } from '../utils/logger.js';
import type { IncomingMessage, ServerResponse } from 'http';
import type { Logger } from 'pino';
import type { Provider } from '../provider/provider.js';
import type { ExecutableService } from './executable-service.js';
import { FixedValueProvider } from '../provider/fixed-value-provider.js';
import type { EM1Status } from '../schema/rest-configuration.js';

/**
 * Configuration properties for `RestService`.
 */
export type RestServiceProperties = {
  port: number;
};

/**
 * REST service that exposes Shelly EM1-like endpoints for energy status.
 * Provides health checks, mock expectation updates, and status queries for grid and solar.
 * Implements the executable service lifecycle to start and stop the HTTP server.
 */
export class RestService implements ExecutableService {
  private app: FastifyInstance<
    RawServerDefault,
    IncomingMessage,
    ServerResponse<IncomingMessage>,
    Logger,
    FastifyTypeProviderDefault
  > | null = null;

  constructor(
    private readonly gridEnergyProvider: Provider<EM1Status | undefined>,
    private readonly solarEnergyProvider: Provider<EM1Status | undefined>,
    private readonly properties: RestServiceProperties
  ) {}

  /**
   * Resolves the energy provider by numeric identifier.
   * 0 → grid, 1 → solar.
   * @param id - Provider identifier (0 for grid, 1 for solar)
   * @returns The matching provider or null if unknown
   */
  private getEnergyProviderById(
    id: number
  ): Provider<EM1Status | undefined> | null {
    let targetEmulator: Provider<EM1Status | undefined> | null = null;
    switch (id) {
      case 0: // Grid
        targetEmulator = this.gridEnergyProvider;
        break;
      case 1: // Solar
        targetEmulator = this.solarEnergyProvider;
        break;
    }
    return targetEmulator;
  }

  /**
   * Starts the REST server and registers endpoints.
   * - `GET /health` simple OK
   * - `POST /expectaction` set mocked status (mock mode only)
   * - `GET /rpc/EM1.GetStatus` fetch status for a given id
   * @returns A promise that resolves when the server is listening
   */
  async start(): Promise<void> {
    const app = Fastify({ loggerInstance: logger });

    this.app = app;

    // Simple health
    app.get('/health', () => ({ ok: true }));

    app.post<{ Body: EM1Status }>(
      '/expectaction',
      { schema: { body: expectationBodySchema } },
      async (request, reply) => {
        const body = request.body;
        const id = body.id;
        const targetEmulator = this.getEnergyProviderById(id);
        if (!targetEmulator) {
          reply.status(400);
          return reply.send(UNKNOWN_ID_RESPONSE_TEMPLATE(id));
        }
        if (!(targetEmulator instanceof FixedValueProvider)) {
          reply.status(400);
          return reply.send(ILLEGAL_MODE_RESPONSE_TEMPLATE(id, 'mock'));
        }
        const mockedEmulator = targetEmulator as FixedValueProvider<
          EM1Status | undefined
        >;
        mockedEmulator.value = body;
        reply.status(200);
      }
    );

    // Shelly EM1-like endpoint
    app.get<{ Querystring: { id: number } }>(
      '/rpc/EM1.GetStatus',
      { schema: { querystring: statusQuerySchema } },
      async (request, reply) => {
        app.log.info(`Received request: ${JSON.stringify(request.query)}`);
        const { id } = request.query;
        const energyProvider = this.getEnergyProviderById(id);
        if (!energyProvider) {
          reply.status(400);
          return reply.send(UNKNOWN_ID_RESPONSE_TEMPLATE(id));
        }
        try {
          const result = await energyProvider.get();
          if (result == undefined) {
            reply.status(404);
            return reply.send(UNKNOWN_ID_RESPONSE_TEMPLATE(id));
          }
          reply.status(200);
          return reply.send(result);
        } catch (err) {
          reply.status(500);
          return reply.send({ code: -1, message: (err as Error).message });
        }
      }
    );

    // Alias for JSON-RPC style (POST)
    //app.post('/rpc/EM1.GetStatus', async () => app.inject({ method: 'GET', url: '/rpc/EM1.GetStatus' }).then(r => r.json()));

    await app.listen({ port: this.properties.port, host: '0.0.0.0' });
    logger.info(`Listening on :${this.properties.port}`);
  }

  /**
   * Stops the REST server if running.
   * @returns A promise that resolves when the server has closed
   */
  async stop(): Promise<void> {
    logger.info('Stopping emulator...');
    if (this.app) {
      await this.app.close();
    }
    return Promise.resolve();
  }
}
