import { IsNotEmpty, IsString } from 'class-validator';

export class AssignResponderDto {
  @IsString()
  @IsNotEmpty()
  responderId: string;
}