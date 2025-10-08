// Validates environment variables for the backend
import { plainToInstance, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

class EnvironmentVariables {
  @IsNumber()
  @Min(1)
  @Max(65535)
  @Transform(({ value }) => Number(value))
  PORT!: number;

  @IsString()
  @IsNotEmpty()
  MONGO_URI!: string;

  @IsString()
  @IsNotEmpty()
  ALLOWED_ORIGINS!: string;

  @IsBoolean()
  @Transform(({ value }) => String(value).toLowerCase() === 'true')
  USE_STUBS!: boolean;
}

export const validateEnv = (config: Record<string, unknown>) => {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: false,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
    whitelist: true,
    forbidUnknownValues: true,
  });

  if (errors.length > 0) {
    const errorMessages = errors
      .map((error) => Object.values(error.constraints ?? {}))
      .flat()
      .join(', ');

    throw new Error(`Invalid environment configuration: ${errorMessages}`);
  }

  return validatedConfig;
};
