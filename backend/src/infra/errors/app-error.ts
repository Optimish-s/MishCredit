// Defines application level http exceptions with explicit codes
import { HttpException, HttpStatus } from '@nestjs/common';

export interface AppErrorPayload {
  code: string;
  message: string;
  status: number;
  details?: unknown;
}

export class AppHttpException extends HttpException {
  readonly code: string;
  readonly details?: unknown;
  readonly payload: AppErrorPayload;

  constructor(payload: AppErrorPayload) {
    super({ code: payload.code, message: payload.message, details: payload.details ?? null }, payload.status);
    this.code = payload.code;
    this.details = payload.details;
    this.payload = payload;
  }
}

export const createUnexpectedError = (details?: unknown) =>
  new AppHttpException({
    code: 'UNEXPECTED_ERROR',
    message: 'Ha ocurrido un error no controlado',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    details,
  });
