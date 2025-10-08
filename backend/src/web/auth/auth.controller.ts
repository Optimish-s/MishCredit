// Handles authentication requests for swagger and demo purposes
import { Body, Controller, HttpStatus, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBadGatewayResponse,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AppHttpException } from 'src/infra/errors/app-error';
import { mapUcnErrorToHttpException } from 'src/infra/errors/ucn-error.mapper';
import { ErrorResponseDto } from '../dto/error-response.dto';
import { LoginRequestDto, LoginResponseDto } from './dto/login.dto';
 

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly configService: ConfigService) {}

  @Post('login')
  @ApiOperation({ summary: 'Inicia sesion contra portales UCN' })
  @ApiBody({ type: LoginRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Sesion creada correctamente',
    type: LoginResponseDto,
    examples: {
      success: {
        summary: 'Respuesta exitosa',
        value: {
          token: 'stub-token',
          expiresAt: '2025-09-28T04:21:00.000Z',
          student: {
            rut: '12345678-9',
            name: 'Estudiante Demo',
            career: 'Ingenieria Civil en Computacion e Informatica',
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Credenciales invalidas',
    type: ErrorResponseDto,
    examples: {
      invalidCredentials: {
        summary: 'Error de autenticacion',
        value: {
          code: 'AUTH_INVALID_CREDENTIALS',
          message: 'Credenciales invalidas',
          details: { attempt: 1 },
        },
      },
    },
  })
  @ApiBadGatewayResponse({
    description: 'Portal UCN no disponible',
    type: ErrorResponseDto,
    examples: {
      remoteFailure: {
        summary: 'Error remoto',
        value: {
          code: 'UCN_SERVICE_UNAVAILABLE',
          message: 'Servicio UCN no disponible',
        },
      },
    },
  })
  async login(@Body() body: LoginRequestDto): Promise<LoginResponseDto> {
    const useStubs = this.configService.get<boolean>('app.useStubs', true);

    if (!useStubs) {
      // TODO Integrar con login real de UCN y reemplazar por mapUcnErrorToHttpException(respuesta)
      throw new AppHttpException({
        code: 'AUTH_NOT_IMPLEMENTED',
        message: 'Login real pendiente de integracion con UCN',
        status: HttpStatus.NOT_IMPLEMENTED,
        details: { email: body.email },
      });
    }

    try {
      return {
        token: 'stub-token',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        student: {
          rut: '12345678-9',
          name: 'Estudiante Demo',
          career: 'Ingenieria Civil en Computacion e Informatica',
        },
      } satisfies LoginResponseDto;
    } catch (error) {
      if (error instanceof AppHttpException) {
        throw error;
      }

      throw mapUcnErrorToHttpException(error);
    }
  }
}
