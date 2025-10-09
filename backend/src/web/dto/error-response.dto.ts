// Shared error schema exposed in swagger
import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 'AUTH_INVALID_CREDENTIALS' })
  code!: string;

  @ApiProperty({ example: 'Credenciales invalidas' })
  message!: string;

  @ApiProperty({ example: { attempt: 1 }, required: false })
  details?: unknown;
}
