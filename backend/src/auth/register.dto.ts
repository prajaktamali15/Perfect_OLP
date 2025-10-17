import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'student@example.com',
    description: 'Email address of the user',
  })
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'Password for the user account',
  })
  password: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Full name of the user',
    required: false,
  })
  name?: string;

  @ApiProperty({
    example: 'STUDENT',
    description: 'Role of the user',
    enum: ['STUDENT', 'INSTRUCTOR'],
    required: false,
  })
  role?: 'STUDENT' | 'INSTRUCTOR';
}
