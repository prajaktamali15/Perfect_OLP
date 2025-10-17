// src/progress/progress.controller.ts
import { Controller, Post, Get, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

interface RequestWithUser extends Request {
  user: { userId: number; role: Role };
}

@Controller('progress')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  // -----------------------------
  // Student: update own progress
  // -----------------------------
  @Post('course/:courseId')
  @Roles(Role.STUDENT)
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
  async getStudentProgress(@Req() req: RequestWithUser) {
    const studentId = req.user.userId;
    return this.progressService.getStudentProgress(studentId);
  }

  // -----------------------------
  // Instructor: get progress for all students in a course
  // -----------------------------
  @Get('course/:courseId')
  @Roles(Role.INSTRUCTOR)
  async getCourseProgress(@Param('courseId') courseId: string) {
    return this.progressService.getCourseProgress(Number(courseId));
  }
}
