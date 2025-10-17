import {
  Controller,
  Post,
  Body,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './login.dto';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { LoginResponseDto } from './dto/login-response.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import { RegisterDto } from './register.dto'; 

@ApiTags('Auth') 
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // -----------------------------
  // Login
  // -----------------------------
  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiBody({ type: LoginDto, description: 'User credentials' })
  @ApiResponse({ status: 200, type: LoginResponseDto, description: 'Successful login' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    if (!user) throw new UnauthorizedException('Invalid credentials');

    return this.authService.login(user);
  }

  // -----------------------------
  // Register
  // -----------------------------
  @Post('register')
  @ApiOperation({ summary: 'User registration' })
  @ApiBody({ type: RegisterDto, description: 'Registration details' }) // ✅ Updated for Swagger
  @ApiResponse({ status: 201, type: RegisterResponseDto, description: 'Registration successful' })
  @ApiResponse({ status: 400, description: 'Bad request or user already exists' })
  async register(@Body() registerDto: RegisterDto) {
    try {
      const roleEnum: Role =
        registerDto.role && ['STUDENT', 'INSTRUCTOR'].includes(registerDto.role)
          ? (registerDto.role as Role)
          : Role.STUDENT;

      const authResponse = await this.authService.register(
        registerDto.email,
        registerDto.password,
        registerDto.name,
        roleEnum,
      );

      return {
        message: 'Registration successful!',
        user: authResponse.user,
        authResponse,
      };
    } catch (error: any) {
      if (
        error instanceof ConflictException ||
        error.message.includes('already exists')
      ) {
        throw new BadRequestException('User already exists');
      }
      throw new BadRequestException(error.message || 'Registration failed');
    }
  }
}
