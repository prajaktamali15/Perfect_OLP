// src/students/students.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface EnrolledCourseWithProgress {
  id: number;
  title: string;
  description?: string;
  completionPercentage: number;
  completed: boolean;
  certificateUrl?: string;
}

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  // 🔹 Get all courses a student is enrolled in
  async getEnrolledCourses(studentId: number): Promise<EnrolledCourseWithProgress[]> {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { studentId },
      include: {
        course: {
          include: {
            progress: {
              where: { studentId },
              select: { score: true, completed: true },
            },
          },
        },
      },
    });

    return enrollments.map((e) => {
      const progress = e.course.progress[0];
      return {
        id: e.course.id,
        title: e.course.title,
        description: e.course.description ?? undefined,
        completionPercentage: progress?.score ?? 0,
        completed: progress?.completed ?? false,
        certificateUrl: e.certificateUrl ?? undefined,
      };
    });
  }

  // 🔹 Enroll a student in a course
  async enrollInCourse(studentId: number, courseId: number) {
    const existing = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });

    if (existing) {
      throw new NotFoundException('Student already enrolled in this course.');
    }

    return this.prisma.enrollment.create({
      data: { studentId, courseId },
    });
  }

  // 🔹 Mark a course as completed & generate certificate
  async markCourseCompleted(studentId: number, courseId: number) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });

    if (!enrollment) {
      throw new NotFoundException('Student is not enrolled in this course.');
    }

    // Update progress
    await this.prisma.progress.updateMany({
      where: { studentId, courseId },
      data: { completed: true, score: 100 },
    });

    // Generate certificate URL
    const certificateUrl = `/certificates/${studentId}_${courseId}.pdf`;

    return this.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { certificateUrl },
    });
  }

  // 🔹 Update student's profile photo
  async updateProfilePhoto(studentId: number, filePath: string) {
    const user = await this.prisma.user.findUnique({ where: { id: studentId } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id: studentId },
      data: { profile: filePath }, // ✅ profile field now valid
      select: { id: true, email: true, name: true, profile: true }, // ✅ profile selectable
    });
  }
}
