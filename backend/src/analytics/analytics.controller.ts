// src/analytics/analytics.controller.ts
import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

interface RequestWithUser extends Request {
  user: { userId: number; role: Role };
}

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // -----------------------------
  // Instructor: Courses analytics (only their courses)
  // -----------------------------
  @Get('instructor/courses')
  @Roles(Role.INSTRUCTOR)
  async instructorCoursesAnalytics(@Req() req: RequestWithUser) {
    return this.analyticsService.getInstructorCoursesProgress(req.user.userId);
  }


  // -----------------------------
  // Total students in a specific course
  // -----------------------------
  @Get('course/:courseId/students')
  @Roles(Role.INSTRUCTOR)
  async totalStudents(@Param('courseId') courseId: string) {
    return this.analyticsService.getTotalStudentsPerCourse(Number(courseId));
  }

  // -----------------------------
  // Completion rate for a specific course
  // -----------------------------
  @Get('course/:courseId/completion')
  @Roles(Role.INSTRUCTOR)
  async completionRate(@Param('courseId') courseId: string) {
    return this.analyticsService.getCourseCompletionRate(Number(courseId));
  }

  // -----------------------------
  // Analytics for instructor courses (alternative endpoint)
  // -----------------------------
  @Get('courses')
  @Roles(Role.INSTRUCTOR)
  async allCoursesAnalytics(@Req() req: RequestWithUser) {
    return this.analyticsService.getInstructorCoursesProgress(req.user.userId);
  }
}
