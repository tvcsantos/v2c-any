import Fastify from 'fastify';
import { ILLEGAL_MODE_RESPONSE_TEMPLATE, UNKNOWN_ID_RESPONSE_TEMPLATE, } from '../template/response.js';
import { expectationBodySchema } from '../schema/expectation-body.js';
import { statusQuerySchema } from '../schema/status-query.js';
import { logger } from '../utils/logger.js';
import { FixedValueProvider } from '../provider/fixed-value-provider.js';
/**
 * REST service that exposes Shelly EM1-like endpoints for energy status.
 * Provides health checks, mock expectation updates, and status queries for grid and solar.
 * Implements the executable service lifecycle to start and stop the HTTP server.
 */
export class RestService {
    constructor(gridEnergyProvider, solarEnergyProvider, properties) {
        this.gridEnergyProvider = gridEnergyProvider;
        this.solarEnergyProvider = solarEnergyProvider;
        this.properties = properties;
        this.app = null;
    }
    /**
     * Resolves the energy provider by numeric identifier.
     * 0 → grid, 1 → solar.
     * @param id - Provider identifier (0 for grid, 1 for solar)
     * @returns The matching provider or null if unknown
     */
    getEnergyProviderById(id) {
        let targetEmulator = null;
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
    async start() {
        const app = Fastify({ loggerInstance: logger });
        this.app = app;
        // Simple health
        app.get('/health', () => ({ ok: true }));
        app.post('/expectaction', { schema: { body: expectationBodySchema } }, async (request, reply) => {
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
            const mockedEmulator = targetEmulator;
            mockedEmulator.value = body;
            reply.status(200);
        });
        // Shelly EM1-like endpoint
        app.get('/rpc/EM1.GetStatus', { schema: { querystring: statusQuerySchema } }, async (request, reply) => {
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
            }
            catch (err) {
                reply.status(500);
                return reply.send({ code: -1, message: err.message });
            }
        });
        // Alias for JSON-RPC style (POST)
        //app.post('/rpc/EM1.GetStatus', async () => app.inject({ method: 'GET', url: '/rpc/EM1.GetStatus' }).then(r => r.json()));
        await app.listen({ port: this.properties.port, host: '0.0.0.0' });
        logger.info(`Listening on :${this.properties.port}`);
    }
    /**
     * Stops the REST server if running.
     * @returns A promise that resolves when the server has closed
     */
    async stop() {
        logger.info('Stopping emulator...');
        if (this.app) {
            await this.app.close();
        }
        return Promise.resolve();
    }
}
