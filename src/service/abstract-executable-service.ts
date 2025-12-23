import { logger } from '../utils/logger.js';
import { ExecutableService } from './executable-service.js';

export abstract class AbstractExecutableService implements ExecutableService {
  protected _started: boolean = false;

  get started(): boolean {
    return this._started;
  }

  protected abstract doStart(): Promise<void>;
  protected abstract doStop(): Promise<void>;

  async start(): Promise<void> {
    if (this._started) {
      logger.warn(`Service is already started`);
      return;
    }
    await this.doStart();
    this._started = true;
  }

  async stop(): Promise<void> {
    if (!this._started) {
      logger.warn(`Service is not started`);
      return;
    }
    await this.doStop();
    this._started = false;
  }
}
