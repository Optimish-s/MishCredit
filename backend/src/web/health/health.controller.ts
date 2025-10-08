// Exposes health check endpoints
import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiProperty, ApiServiceUnavailableResponse, ApiTags } from '@nestjs/swagger';
import { ErrorResponseDto } from '../dto/error-response.dto';
 

class HealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status!: string;

  @ApiProperty({ example: '2025-09-28T04:21:00.000Z' })
  timestamp!: string;

  @ApiProperty({ example: 123.45 })
  uptime!: number;
}

@Controller('health')
@ApiTags('Health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Verifica estado basico del servicio' })
  @ApiOkResponse({
    description: 'Servicio operativo',
    type: HealthResponseDto,
    examples: {
      healthy: {
        summary: 'Ejemplo exitoso',
        value: {
          status: 'ok',
          timestamp: '2025-09-28T04:21:00.000Z',
          uptime: 123.45,
        },
      },
    },
  })
  @ApiServiceUnavailableResponse({
    description: 'Servicio degradado',
    type: ErrorResponseDto,
    examples: {
      degraded: {
        summary: 'Error de disponibilidad',
        value: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Servicio en mantenimiento',
        },
      },
    },
  })
  check(): HealthResponseDto {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
