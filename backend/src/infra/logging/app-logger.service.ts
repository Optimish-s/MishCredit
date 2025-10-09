// Custom logger forwarding to Nest core logger
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AppLoggerService extends Logger {
  constructor() {
    super('AppLogger', { timestamp: true });
  }

  info(message: string, context?: string, meta?: Record<string, unknown>) {
    super.log(this.format(message, meta), context);
  }

  warning(message: string, context?: string, meta?: Record<string, unknown>) {
    super.warn(this.format(message, meta), context);
  }

  failure(message: string, trace: string, context?: string, meta?: Record<string, unknown>) {
    super.error(this.format(message, meta), trace, context);
  }

  private format(message: string, meta?: Record<string, unknown>) {
    return meta ? `${message} ${JSON.stringify(meta)}` : message;
  }
}
