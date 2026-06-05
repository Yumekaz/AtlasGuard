// apps/api/src/tourist/dto/create-trip.dto.ts
import { IsString, IsNotEmpty, IsISO8601 } from 'class-validator';
import { CreateTripDto } from '@atlasguard/shared';

export class CreateTripDtoImpl implements CreateTripDto {
  @IsString()
  @IsNotEmpty()
  destinationName: string;

  @IsISO8601()
  @IsNotEmpty()
  startDate: string;

  @IsISO8601()
  @IsNotEmpty()
  endDate: string;
}
