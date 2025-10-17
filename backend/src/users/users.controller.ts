// src/users/users.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Body,
  UseGuards,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '@prisma/client'; // Prisma Role enum
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BadRequestException } from '@nestjs/common';

// Custom request type including user
interface AuthRequest extends Request {
  user: { id: number; email: string; role: Role };
}

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // -----------------------------
  // Registration & User Management
  // -----------------------------

  // POST /users/register → Create new user (no email verification)
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string' },
        name: { type: 'string' },
        password: { type: 'string' },
        role: { type: 'string', enum: ['STUDENT', 'INSTRUCTOR'] },
      },
      required: ['email', 'password'],
    },
  })
  @ApiResponse({ status: 201, description: 'User registered' })
  async register(
    @Body() body: { email: string; name?: string; password: string; role?: string },
  ) {
    const roleEnum: Role = body.role
      ? (Role[body.role.toUpperCase() as keyof typeof Role] ?? Role.STUDENT)
      : Role.STUDENT;

    return this.usersService.createUser({
      email: body.email,
      name: body.name,
      password: body.password,
      role: roleEnum,
    });
  }

  // GET /users → Only INSTRUCTOR can list all users (admin functionality moved to instructor)
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @ApiOperation({ summary: 'List all users (instructor only)' })
  @ApiResponse({ status: 200, description: 'Users returned' })
  async findAll() {
    return this.usersService.findAll();
  }

  // -----------------------------
  // Profile Management Endpoints
  // -----------------------------

  // GET /users/me → Get current user's profile
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile returned' })
  async getProfile(@Req() req: AuthRequest) {
    return this.usersService.getMe(req.user.id);
  }

  // PATCH /users/me → Update current user's profile (name, bio, password)
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        bio: { type: 'string' },
        password: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  async updateProfile(
    @Req() req: AuthRequest,
    @Body() updateData: { name?: string; bio?: string; password?: string },
  ) {
    return this.usersService.updateProfile(req.user.id, updateData);
  }

  // PUT /users/me/change-password → Change current user's password
  @UseGuards(JwtAuthGuard)
  @Put('me/change-password')
  @ApiOperation({ summary: 'Change password for current user' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        currentPassword: { type: 'string' },
        newPassword: { type: 'string' },
      },
      required: ['currentPassword', 'newPassword'],
    },
  })
  @ApiResponse({ status: 200, description: 'Password changed' })
  async changePassword(
    @Req() req: AuthRequest,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    if (!body.currentPassword || !body.newPassword) {
      throw new BadRequestException('Both currentPassword and newPassword are required');
    }
    return this.usersService.changePassword(
      req.user.id,
      body.currentPassword,
      body.newPassword,
    );
  }

  // PUT /users/me/photo → Upload profile photo
  @UseGuards(JwtAuthGuard)
  @Put('me/photo')
  @UseInterceptors(FileInterceptor('photo'))
  @ApiOperation({ summary: 'Upload profile photo' })
  @ApiResponse({ status: 200, description: 'Photo uploaded' })
  async uploadProfilePhoto(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: AuthRequest,
  ) {
    return this.usersService.saveProfilePhoto(req.user.id, file);
  }

  // -----------------------------
  // Enrollment Endpoints
  // -----------------------------

  // GET /users/me/enrollments → Get current user's enrolled courses
  @UseGuards(JwtAuthGuard)
  @Get('me/enrollments')
  @ApiOperation({ summary: 'Get current user enrollments' })
  @ApiResponse({ status: 200, description: 'Enrollments returned' })
  async getMyEnrollments(@Req() req: AuthRequest) {
    return this.usersService.getMyEnrollments(req.user.id);
  }
}
