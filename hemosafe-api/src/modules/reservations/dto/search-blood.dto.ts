import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt, IsLatitude, IsLongitude, IsNumber,
  IsPositive, IsUUID, Max, Min,
} from 'class-validator';

export class SearchBloodDto {
  @ApiProperty({ description: 'Blood type to search for (UUID of blood_types row)' })
  @IsUUID()
  bloodTypeId: string;

  @ApiProperty({ minimum: 1, maximum: 50, description: 'Number of bags needed' })
  @IsInt()
  @Min(1)
  @Max(50)
  quantity: number;

  @ApiProperty({ description: 'Hospital latitude', example: 36.7372 })
  @IsNumber()
  @IsLatitude()
  lat: number;

  @ApiProperty({ description: 'Hospital longitude', example: 3.0865 })
  @IsNumber()
  @IsLongitude()
  lng: number;

  @ApiPropertyOptional({
    description: 'Search radius in km (default 50km)',
    minimum: 1,
    maximum: 500,
    default: 50,
  })
  @IsNumber()
  @IsPositive()
  @Max(500)
  radiusKm?: number = 50;
}
