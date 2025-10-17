// src/analytics/analytics.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  // -----------------------------
  // Total students per course
  // -----------------------------
  async getTotalStudentsPerCourse(courseId: number) {
    const totalStudents = await this.prisma.enrollment.count({
      where: { courseId },
    });

    return { courseId, totalStudents };
  }

  // -----------------------------
  // Completion rate per course
  // -----------------------------
  async getCourseCompletionRate(courseId: number) {
    const [totalEnrollments, completed] = await Promise.all([
      this.prisma.enrollment.count({ where: { courseId } }),
      this.prisma.progress.count({ where: { courseId, completed: true } }),
    ]);

    const completionRate = totalEnrollments
      ? (completed / totalEnrollments) * 100
      : 0;

    return {
      courseId,
      completionRate: Number(completionRate.toFixed(2)),
    };
  }

  // -----------------------------
  // Analytics for courses created by a specific instructor
  // -----------------------------
  async getInstructorCoursesProgress(instructorId: number) {
  const courses = await this.prisma.course.findMany({
    where: { instructorId }, // must match instructorId
    include: {
      enrollments: true,
      lessons: true,
    },
  });


    return Promise.all(
      courses.map(async (course) => {
        const totalStudents = course.enrollments.length;

        const completedCount = await this.prisma.progress.count({
          where: { courseId: course.id, completed: true }, // only count completed progress
        });

        const completionRate = totalStudents
          ? (completedCount / totalStudents) * 100
          : 0;

        return {
          courseId: course.id,
          title: course.title,
          totalStudents,
          completionRate: Number(completionRate.toFixed(2)),
          lessonsCount: course.lessons.length,
        };
      }),
    );
  }

  // -----------------------------
  // Analytics for all courses (Admin)
  // -----------------------------
  async getAllCoursesProgress() {
    const courses = await this.prisma.course.findMany({
      include: {
        enrollments: true,
        lessons: true,
        instructor: { select: { id: true, name: true } },
      },
    });

    return Promise.all(
      courses.map(async (course) => {
        const totalStudents = course.enrollments.length;

        const completedCount = await this.prisma.progress.count({
          where: { courseId: course.id, completed: true },
        });

        const completionRate = totalStudents
          ? (completedCount / totalStudents) * 100
          : 0;

        return {
          courseId: course.id,
          title: course.title,
          totalStudents,
          completionRate: Number(completionRate.toFixed(2)),
          lessonsCount: course.lessons.length,
          instructor: course.instructor?.name || 'N/A',
        };
      }),
    );
  }
}
