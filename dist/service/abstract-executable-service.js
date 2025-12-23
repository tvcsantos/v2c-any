import { logger } from '../utils/logger.js';
export class AbstractExecutableService {
    constructor() {
        this._started = false;
    }
    get started() {
        return this._started;
    }
    async start() {
        if (this._started) {
            logger.warn(`Service is already started`);
            return;
        }
        await this.doStart();
        this._started = true;
    }
    async stop() {
        if (!this._started) {
            logger.warn(`Service is not started`);
            return;
        }
        await this.doStop();
        this._started = false;
    }
}
