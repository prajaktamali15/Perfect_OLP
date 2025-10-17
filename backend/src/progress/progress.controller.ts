// src/progress/progress.controller.ts
import { Controller, Post, Get, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

interface RequestWithUser extends Request {
  user: { userId: number; role: Role };
}

@ApiTags('Progress')
@ApiBearerAuth()
@Controller('progress')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  // -----------------------------
  // Student: update own progress
  // -----------------------------
  @Post('course/:courseId')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Upsert progress for current student' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { completed: { type: 'boolean' }, score: { type: 'number' } },
    },
  })
  @ApiResponse({ status: 200, description: 'Progress upserted' })
  async upsertProgress(
    @Req() req: RequestWithUser,
    @Param('courseId') courseId: string,
    @Body() body: { completed?: boolean; score?: number }
  ) {
    const studentId = req.user.userId;
    return this.progressService.upsertProgress(studentId, Number(courseId), {
      completed: body.completed,
      score: body.score,
    });
  }

  // -----------------------------
  // Student: get own progress
  // -----------------------------
  @Get('my-courses')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Get progress for current student' })
  @ApiResponse({ status: 200, description: 'Progress list returned' })
  async getStudentProgress(@Req() req: RequestWithUser) {
    const studentId = req.user.userId;
    return this.progressService.getStudentProgress(studentId);
  }

  // -----------------------------
  // Instructor: get progress for all students in a course
  // -----------------------------
  @Get('course/:courseId')
  @Roles(Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Get progress for a course (instructor)' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Course progress returned' })
  async getCourseProgress(@Param('courseId') courseId: string) {
    return this.progressService.getCourseProgress(Number(courseId));
  }
}
