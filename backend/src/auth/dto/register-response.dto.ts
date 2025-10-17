import { ApiProperty } from '@nestjs/swagger';
import { LoginResponseDto } from './login-response.dto';
import { Role } from '@prisma/client';

export class RegisterResponseDto {
  @ApiProperty({ example: 'Registration successful!' })
  message: string;

  @ApiProperty({
    example: { id: 1, email: 'student@example.com', role: 'STUDENT' },
  })
  user: {
    id: number;
    email: string;
    role: Role;
  };

  @ApiProperty({ type: LoginResponseDto })
  authResponse: LoginResponseDto;
}
