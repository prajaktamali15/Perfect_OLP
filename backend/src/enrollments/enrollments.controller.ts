// src/enrollments/enrollments.controller.ts
import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

export enum Role {
  STUDENT = 'STUDENT',
  INSTRUCTOR = 'INSTRUCTOR',
  
}
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: { id: number; role: Role };
}

interface CompleteLessonDto {
  lessonId: number;
}

@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  // Student-only: Enroll in a course
  @Post('course/:courseId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  async enroll(@Req() req: RequestWithUser, @Param('courseId') courseId: string) {
    const studentId = req.user.id;
    const id = Number(courseId);
    if (isNaN(id)) throw new BadRequestException('Invalid course ID');

    const enrollment = await this.enrollmentsService.enroll(studentId, id);
    return {
      success: true,
      message: 'Enrolled successfully!',
      data: enrollment,
    };
  }

  // Instructor: View all students enrolled in a course
  @Get('course/:courseId/students')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR)
  async getEnrolledStudents(@Param('courseId') courseId: string) {
    const id = Number(courseId);
    if (isNaN(id)) throw new BadRequestException('Invalid course ID');

    const students = await this.enrollmentsService.getEnrolledStudents(id);
    if (!students.length) throw new NotFoundException('No students found for this course');

    return { success: true, data: students };
  }

  @Get('course-details/:courseId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  async getCourseDetails(
    @Req() req: RequestWithUser,
    @Param('courseId') courseId: string,
  ) {
    const studentId = req.user.id;
    const id = Number(courseId);

    if (isNaN(id)) throw new BadRequestException('Invalid course ID');

    const courseDetails = await this.enrollmentsService.getCourseDetails(studentId, id);

    if (!courseDetails) {
      throw new NotFoundException('Course not found or you are not enrolled.');
    }

    return { success: true, data: courseDetails };
  }

  // Student-only: View their own enrolled courses
  @Get('my-courses')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  async myCourses(@Req() req: RequestWithUser) {
    const studentId = req.user.id;
    const enrollments = await this.enrollmentsService.getStudentEnrollments(studentId);

    const courses = enrollments.map((e: any) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      instructor: e.instructor,
      progress: e.progress ?? 0,
      certificateUrl: e.progress >= 100 ? `/certificates/${studentId}-${e.id}.pdf` : null,
    }));

    return {
      success: true,
      count: courses.length,
      data: courses,
    };
  }

  // Student-only: Mark a lesson as completed
  @Patch('course/:courseId/complete-lesson')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  async completeLesson(
    @Req() req: RequestWithUser,
    @Param('courseId') courseId: string,
    @Body() body: CompleteLessonDto,
  ) {
    const studentId = req.user.id;
    const courseIdNum = Number(courseId);
    const { lessonId } = body;

    if (isNaN(courseIdNum)) throw new BadRequestException('Invalid course ID');
    if (!lessonId) throw new BadRequestException('Lesson ID is required');

    const updatedEnrollment = await this.enrollmentsService.completeLesson(
      studentId,
      courseIdNum,
      lessonId,
    );

    return {
      success: true,
      message: 'Lesson marked as completed',
      progress: (updatedEnrollment as any).progress ?? 0,
      completedAt: (updatedEnrollment as any).completedAt ?? null,
    };
  }

// In EnrollmentsController
@Patch('course/:courseId/generate-certificate')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.STUDENT)
async generateCertificate(
  @Req() req: RequestWithUser,
  @Param('courseId') courseId: string,
) {
  const studentId = req.user.id;
  const id = Number(courseId);

  if (isNaN(id)) throw new BadRequestException('Invalid course ID');

  try {
    const certificateUrl = await this.enrollmentsService.generateCertificate(studentId, id);

    return {
      success: true,
      certificateUrl,
    };
  } catch (err) {
    console.error('❌ Certificate generation failed:', err);
    throw new BadRequestException(err.message);
  }
}





  
}
