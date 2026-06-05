// apps/api/src/tourist/dto/create-profile.dto.ts
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { CreateTouristProfileDto } from '@atlasguard/shared';

export class CreateProfileDto implements CreateTouristProfileDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsOptional()
  emergencyContactName?: string;

  @IsString()
  @IsOptional()
  emergencyContactPhone?: string;

  @IsString()
  @IsOptional()
  medicalNotes?: string;

  @IsString()
  @IsOptional()
  mobilityNeeds?: string;

  @IsString()
  @IsOptional()
  languagePreference?: string;
}
