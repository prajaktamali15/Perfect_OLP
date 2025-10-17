// src/progress/progress.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProgressService {
  constructor(private prisma: PrismaService) {}

  // Create or update progress for a student in a course
  async upsertProgress(
    studentId: number,
    courseId: number,
    data: { completed?: boolean; score?: number }
  ) {
    return this.prisma.progress.upsert({
      where: { studentId_courseId: { studentId, courseId } },
      update: {
        ...(data.completed !== undefined && { completed: data.completed }),
        ...(data.score !== undefined && { score: data.score }),
      },
      create: {
        studentId,
        courseId,
        completed: data.completed ?? false,
        ...(data.score !== undefined && { score: data.score }),
      },
    });
  }

  // Get progress for a specific student in a course
  async getProgress(studentId: number, courseId: number) {
    return this.prisma.progress.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });
  }

  // Get all students’ progress for a course (Instructor/Admin)
  async getCourseProgress(courseId: number) {
    return this.prisma.progress.findMany({
      where: { courseId },
      include: { student: true },
    });
  }

  // Get all courses progress for a student
  async getStudentProgress(studentId: number) {
    return this.prisma.progress.findMany({
      where: { studentId },
      include: { course: true },
    });
  }
}
