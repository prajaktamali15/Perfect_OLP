// src/courses/courses.service.ts

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Difficulty } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  // -----------------------------
  // Course Management
  // -----------------------------
  async create(data: {
    title: string;
    description?: string;
    instructorId: number;
    categoryId?: number;
    difficulty?: Difficulty;
    duration?: string;
    thumbnailUrl?: string;
    prerequisites?: string[];
    lessons?: {
      title: string;
      content?: string;
      videoUrl?: string;
      attachmentUrl?: string;
      duration?: string;
      order?: number;
    }[];
  }) {
    // Step 1: Create the course
    const course = await this.prisma.course.create({
      data: {
        title: data.title,
        description: data.description,
        instructorId: data.instructorId,
        categoryId: data.categoryId,
        difficulty: data.difficulty || Difficulty.Beginner,
        duration: data.duration || '', // initial duration empty
        thumbnailUrl: data.thumbnailUrl,
        prerequisites: data.prerequisites || [],
      },
    });

    // Step 2: Add lessons if provided
    if (data.lessons && data.lessons.length > 0) {
      for (let i = 0; i < data.lessons.length; i++) {
        const lesson = data.lessons[i];
        await this.prisma.lesson.create({
          data: {
            title: lesson.title,
            content: lesson.content,
            videoUrl: lesson.videoUrl,
            attachmentUrl: lesson.attachmentUrl,
            duration: lesson.duration,
            order: lesson.order ?? i + 1,
            courseId: course.id,
          },
        });
      }

      // Update total course duration
      await this.updateCourseDuration(course.id);
    }

    return course;
  }

  // -----------------------------
  // Thumbnail upload (file handling)
  // -----------------------------
  async uploadThumbnail(file: Express.Multer.File) {
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Invalid file type. Only image files are allowed.');
    }
    const uploadPath = path.join(__dirname, '../../uploads/thumbnails');
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

    const filename = `${Date.now()}_${file.originalname}`;
    const filePath = path.join(uploadPath, filename);

    try {
      await sharp(file.buffer).resize(400, 300).toFile(filePath);
      return `/uploads/thumbnails/${filename}`;
    } catch (error) {
      throw new BadRequestException('Failed to process image');
    }
  }

  // -----------------------------
  // Course Retrieval
  // -----------------------------
  async findAll(studentId?: number) {
    const courses = await this.prisma.course.findMany({
      include: {
        instructor: { select: { id: true, name: true, email: true } },
        enrollments: true,
        lessons: true,
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (studentId) {
      const studentEnrollments = await this.prisma.enrollment.findMany({
        where: { studentId },
        select: { courseId: true },
      });
      const enrolledCourseIds = new Set(studentEnrollments.map((e) => e.courseId));

      return courses.map((c) => ({
        ...c,
        enrolled: enrolledCourseIds.has(c.id),
      }));
    }

    return courses;
  }

  async deleteCourse(courseId: number, instructorId: number) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');
    if (course.instructorId !== instructorId)
      throw new BadRequestException('You do not have permission to delete this course');
    return this.prisma.course.delete({ where: { id: courseId } });
  }

  async findById(id: number) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        instructor: { select: { id: true, name: true, email: true } },
        enrollments: true,
        lessons: { orderBy: { order: 'asc' } },
        category: true,
      },
    });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  async findByInstructor(instructorId: number) {
    return this.prisma.course.findMany({
      where: { instructorId },
      include: {
        enrollments: true,
        lessons: { orderBy: { order: 'asc' } },
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // -----------------------------
  // Lesson Management
  // -----------------------------
  async addLesson(
    courseId: number,
    data: {
      title: string;
      content?: string;
      videoUrl?: string;
      attachmentUrl?: string;
      duration?: string;
      order?: number;
    },
  ) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    let order = data.order;
    if (!order) {
      const lastLesson = await this.prisma.lesson.findFirst({
        where: { courseId },
        orderBy: { order: 'desc' },
      });
      order = (lastLesson?.order ?? 0) + 1;
    }

    const lesson = await this.prisma.lesson.create({
      data: {
        title: data.title,
        content: data.content,
        videoUrl: data.videoUrl,
        attachmentUrl: data.attachmentUrl,
        duration: data.duration,
        order,
        courseId,
      },
    });

    await this.updateCourseDuration(courseId);

    return lesson;
  }

  // -----------------------------
  // Update total course duration (sum of lesson durations as string)
  // -----------------------------
  private async updateCourseDuration(courseId: number) {
    const lessons = await this.prisma.lesson.findMany({
      where: { courseId },
      select: { duration: true },
    });

    // Concatenate durations as a simple string (e.g., "10m + 15m + 1h")
    const totalDuration = lessons.map((l) => l.duration || '').filter(Boolean).join(' + ');

    await this.prisma.course.update({
      where: { id: courseId },
      data: { duration: totalDuration },
    });
  }

  async getCourseAnalytics(instructorId: number) {
    const courses = await this.prisma.course.findMany({
      where: { instructorId },
      include: { enrollments: true, lessons: true },
    });

    return courses.map((course) => {
      const totalEnrollments = course.enrollments?.length || 0;
      const completedEnrollments =
        course.enrollments?.filter((e) => e.completedAt !== null).length || 0;
      const completionRate = totalEnrollments ? (completedEnrollments / totalEnrollments) * 100 : 0;

      return {
        id: course.id,
        title: course.title,
        totalEnrollments,
        completionRate: Number(completionRate.toFixed(2)),
        lessonsCount: course.lessons?.length || 0,
      };
    });
  }

  // -----------------------------
  // Lesson Reordering
  // -----------------------------
  async reorderLessons(courseId: number, lessonOrders: { lessonId: number; order: number }[]) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    const updatePromises = lessonOrders.map(({ lessonId, order }) =>
      this.prisma.lesson.update({
        where: { id: lessonId },
        data: { order },
      }),
    );

    await Promise.all(updatePromises);
    await this.updateCourseDuration(courseId); // update duration after reordering

    return { success: true, message: 'Lessons reordered successfully' };
  }

  // -----------------------------
  // Prerequisite Management (JSON array of strings)
  // -----------------------------
  async addPrerequisite(courseId: number, prerequisiteName: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { prerequisites: true },
    });
    if (!course) throw new NotFoundException('Course not found');

    let currentPrereqs: string[] = [];
    if (Array.isArray(course.prerequisites)) {
      currentPrereqs = course.prerequisites.filter((p): p is string => typeof p === 'string');
    }

    if (!currentPrereqs.includes(prerequisiteName)) {
      currentPrereqs.push(prerequisiteName);
    }

    return this.prisma.course.update({
      where: { id: courseId },
      data: { prerequisites: currentPrereqs as Prisma.InputJsonValue },
    });
  }
}
