// Formats http exceptions with unified payload
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppHttpException, createUnexpectedError } from '../../errors/app-error';
import { AppLoggerService } from '../../logging/app-logger.service';

interface ErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    const { status, body } = this.resolve(exception);

    this.logger.failure(
      body.message,
      exception instanceof Error ? exception.stack ?? '' : 'No stack trace',
      HttpExceptionFilter.name,
      {
        path: request.originalUrl,
        method: request.method,
        statusCode: status,
        errorCode: body.code,
      },
    );

    const payload = body.details === undefined || body.details === null ? { code: body.code, message: body.message } : body;

    response.status(status).json(payload);
  }

  private resolve(exception: unknown): { status: number; body: ErrorBody } {
    if (exception instanceof AppHttpException) {
      return {
        status: exception.getStatus(),
        body: this.ensureBody(exception.getResponse()),
      };
    }

    if (exception instanceof HttpException) {
      return {
        status: exception.getStatus(),
        body: this.extractFromHttpException(exception),
      };
    }

    const fallback = createUnexpectedError(
      exception instanceof Error ? exception.message : { error: exception },
    );

    return {
      status: fallback.getStatus(),
      body: this.ensureBody(fallback.getResponse()),
    };
  }

  private extractFromHttpException(exception: HttpException): ErrorBody {
    const response = exception.getResponse();

    if (typeof response === 'string') {
      return {
        code: `HTTP_${exception.getStatus()}`,
        message: response,
      };
    }

    if (typeof response === 'object' && response !== null) {
      const data = response as Record<string, unknown>;
      const message = data.message;

      const normalizedMessage = Array.isArray(message)
        ? message.join(', ')
        : typeof message === 'string'
        ? message
        : exception.message;

      const code = typeof data.code === 'string' && data.code.length > 0
        ? data.code
        : `HTTP_${exception.getStatus()}`;

      const details = data.details;

      return {
        code,
        message: normalizedMessage,
        details,
      };
    }

    return {
      code: 'HTTP_ERROR',
      message: exception.message,
    };
  }

  private ensureBody(payload: unknown): ErrorBody {
    if (typeof payload === 'object' && payload !== null) {
      const data = payload as Record<string, unknown>;
      return {
        code: String(data.code ?? 'UNEXPECTED_ERROR'),
        message: String(data.message ?? 'Ha ocurrido un error no controlado'),
        details: data.details,
      };
    }

    return {
      code: 'UNEXPECTED_ERROR',
      message: 'Ha ocurrido un error no controlado',
    };
  }
}
