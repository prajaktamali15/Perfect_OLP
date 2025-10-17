import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class LoginResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  access_token: string;

  @ApiProperty({
    example: { id: 1, email: 'student@example.com', role: 'STUDENT' },
    description: 'Basic user information',
  })
  user: {
    id: number;
    email: string;
    role: Role;
  };
}
