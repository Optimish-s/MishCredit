// DTOs for the login endpoint swagger contracts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginRequestDto {
  @ApiProperty({ example: 'estudiante@alumnos.ucn.cl' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'claveSegura123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string;
}

class LoginStudentDto {
  @ApiProperty({ example: '12345678-9' })
  rut!: string;

  @ApiProperty({ example: 'Estudiante Demo' })
  name!: string;

  @ApiProperty({ example: 'Ingenieria Civil en Computacion e Informatica' })
  career!: string;
}

export class LoginResponseDto {
  @ApiProperty({ example: 'stub-token-123' })
  token!: string;

  @ApiProperty({ example: '2025-09-28T04:21:00.000Z' })
  expiresAt!: string;

  @ApiProperty({ type: LoginStudentDto })
  student!: LoginStudentDto;
}
