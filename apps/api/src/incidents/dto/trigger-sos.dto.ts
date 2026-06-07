import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

const INCIDENT_TYPES = [
  'SOS',
  'GEOFENCE_BREACH',
  'MEDICAL',
  'LOST',
  'HARASSMENT',
  'OTHER',
] as const;

export class TriggerSosDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(INCIDENT_TYPES)
  type?: (typeof INCIDENT_TYPES)[number];
}