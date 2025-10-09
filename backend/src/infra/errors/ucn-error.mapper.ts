// Normalizes remote UCN error responses into application payloads
import { HttpStatus } from '@nestjs/common';
import { AppErrorPayload, AppHttpException } from './app-error';

type RemoteErrorShape = {
  code?: string;
  message?: string;
  detail?: unknown;
  status?: number;
};

const UCN_ERROR_MAP: Record<string, Omit<AppErrorPayload, 'details'>> = {
  AUTH_INVALID_CREDENTIALS: {
    code: 'AUTH_INVALID_CREDENTIALS',
    message: 'Credenciales invalidas',
    status: HttpStatus.UNAUTHORIZED,
  },
  AUTH_ACCOUNT_LOCKED: {
    code: 'AUTH_ACCOUNT_LOCKED',
    message: 'Cuenta bloqueada temporalmente',
    status: HttpStatus.FORBIDDEN,
  },
  AUTH_CAPTCHA_REQUIRED: {
    code: 'AUTH_CAPTCHA_REQUIRED',
    message: 'El portal solicito verificacion adicional',
    status: HttpStatus.BAD_REQUEST,
  },
  DATA_NOT_FOUND: {
    code: 'DATA_NOT_FOUND',
    message: 'No se encontraron datos para la consulta',
    status: HttpStatus.NOT_FOUND,
  },
  SERVICE_UNAVAILABLE: {
    code: 'UCN_SERVICE_UNAVAILABLE',
    message: 'Servicio UCN no disponible',
    status: HttpStatus.BAD_GATEWAY,
  },
  TIMEOUT: {
    code: 'UCN_TIMEOUT',
    message: 'Timeout comunicandose con servicios UCN',
    status: HttpStatus.GATEWAY_TIMEOUT,
  },
};

const DEFAULT_REMOTE_ERROR: Omit<AppErrorPayload, 'details'> = {
  code: 'UCN_REMOTE_ERROR',
  message: 'Error inesperado desde los servicios UCN',
  status: HttpStatus.BAD_GATEWAY,
};

export const mapUcnErrorToHttpException = (error: unknown): AppHttpException => {
  const normalized: RemoteErrorShape = typeof error === 'string' ? { code: error } : (error as RemoteErrorShape);
  const remoteCode = normalized.code?.toUpperCase?.();

  const mapped = remoteCode ? UCN_ERROR_MAP[remoteCode] : undefined;

  const payload: AppErrorPayload = {
    ...(mapped ?? DEFAULT_REMOTE_ERROR),
    details: normalized.detail ?? normalized.message ?? error,
  };

  return new AppHttpException(payload);
};

export const mapToAppErrorPayload = (error: unknown): AppErrorPayload =>
  mapUcnErrorToHttpException(error).payload;
