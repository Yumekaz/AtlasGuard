import { IsEmail, IsIn, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { UserRole } from '@atlasguard/shared';

export class RegisterDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @IsString()
  @IsIn(['TOURIST', 'OPERATOR', 'RESPONDER', 'ADMIN'], {
    message: 'Role must be one of: TOURIST, OPERATOR, RESPONDER, ADMIN',
  })
  role: UserRole;
}
