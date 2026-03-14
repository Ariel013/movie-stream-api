import { plainToInstance } from 'class-transformer';
import {
  IsEnum, IsInt, IsOptional, IsString, IsUrl, Min, validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production  = 'production',
  Test        = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsInt() @Min(1) @IsOptional()
  PORT: number = 3001;

  @IsString()
  DATABASE_URL: string;

  @IsString()
  JWT_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_ACCESS_EXPIRES: string = '15m';

  @IsString()
  @IsOptional()
  JWT_REFRESH_EXPIRES: string = '7d';

  @IsString()
  @IsOptional()
  FRONTEND_URL: string = 'http://localhost:3000';

  @IsInt() @Min(1) @IsOptional()
  RATE_LIMIT_MAX: number = 120;
}

export function validate(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(`Config validation error:\n${errors.toString()}`);
  }
  return validated;
}
