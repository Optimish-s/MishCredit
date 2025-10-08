// Logs incoming http requests with duration
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AppLoggerService } from './app-logger.service';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const now = Date.now();
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    this.logger.info(
      'Incoming request',
      RequestLoggingInterceptor.name,
      {
        method: request.method,
        url: request.originalUrl,
        ip: request.ip,
      },
    );

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.info(
            'Request completed',
            RequestLoggingInterceptor.name,
            {
              method: request.method,
              url: request.originalUrl,
              statusCode: response.statusCode,
              durationMs: Date.now() - now,
            },
          );
        },
        error: (error: unknown) => {
          this.logger.warning(
            'Request failed',
            RequestLoggingInterceptor.name,
            {
              method: request.method,
              url: request.originalUrl,
              statusCode: response.statusCode,
              durationMs: Date.now() - now,
              errorName: error instanceof Error ? error.name : 'UnknownError',
            },
          );
        },
      }),
    );
  }
}
