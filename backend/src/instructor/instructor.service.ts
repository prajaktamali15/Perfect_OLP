import {
  Injectable,
  BadRequestException,
  NotFoundException,  ForbiddenException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateCourseDto, Difficulty as CreateDifficulty } from './dto/create-course.dto';
import { UpdateCourseDto, Difficulty as UpdateDifficulty } from './dto/update-course.dto';
import * as bcrypt from 'bcrypt';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';

@Injectable()
export class InstructorService {
  private prisma = new PrismaClient();

  // ----------------------
  // Helpers
  // ----------------------
  private normalize(value: string | null | undefined): string | undefined {
    return value ?? undefined;
  }

  private getPublicUrl(filePath?: string | null): string | null {
    if (!filePath) return null;
    const filename = filePath.split('/').pop();
    return filename ? `/uploads/lessons/${filename}` : null;
  }

  // ----------------------
  // Profile Methods
  // ----------------------
  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  }

  async updateProfile(
    userId: number,
    body: { name?: string; email?: string; currentPassword?: string; newPassword?: string }
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    if (body.newPassword) {
      if (!body.currentPassword) throw new BadRequestException('Current password required');
      const isMatch = await bcrypt.compare(body.currentPassword, user.password);
      if (!isMatch) throw new BadRequestException('Current password is incorrect');
      user.password = await bcrypt.hash(body.newPassword, 10);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: body.name ?? user.name,
        email: body.email ?? user.email,
        password: body.newPassword ? user.password : undefined,
      },
    });

    return { id: updatedUser.id, name: updatedUser.name, email: updatedUser.email, role: updatedUser.role };
  }

  // ----------------------
  // Course Categories
  // ----------------------
  async getCourseCategories() {
    return this.prisma.courseCategory.findMany(); // Returns all categories
  }

  // ----------------------
  // Delete course
  // ----------------------
  async deleteCourse(userId: number, courseId: number) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: { lessons: true, enrollments: true },
    });

    if (!course || course.instructorId !== userId)
      throw new NotFoundException('Course not found or not owned by you');

    // Course can be deleted by instructor

    for (const lesson of course.lessons) {
      if (lesson.videoUrl && existsSync(join(process.cwd(), lesson.videoUrl))) unlinkSync(join(process.cwd(), lesson.videoUrl));
      if (lesson.attachmentUrl && existsSync(join(process.cwd(), lesson.attachmentUrl))) unlinkSync(join(process.cwd(), lesson.attachmentUrl));
    }

    await this.prisma.lesson.deleteMany({ where: { courseId } });
    await this.prisma.enrollment.deleteMany({ where: { courseId } });
    return this.prisma.course.delete({ where: { id: courseId } });
  }

  async getMyCourses(userId: number) {
    return this.prisma.course.findMany({
      where: { instructorId: userId },
      include: { lessons: true, category: true as any },
    });
  }

  // ----------------------
  // Course Methods
  // ----------------------
 async createCourse(userId: number, dto: CreateCourseDto) {
  // Validate lessons
  if (dto.lessons?.some((l) => !l.title))
    throw new BadRequestException('Each lesson must have a title');

  // Defensive normalization to avoid Prisma validation errors from Swagger string inputs
  const anyDto: any = dto as any;
  let normalizedCategoryId: number | null | undefined = dto.categoryId;
  if (typeof anyDto.categoryId === 'string') {
    const trimmed = anyDto.categoryId.trim();
    if (trimmed === '') {
      normalizedCategoryId = null;
    } else {
      const parsed = Number(trimmed);
      normalizedCategoryId = isNaN(parsed) ? null : parsed;
    }
  }

  let normalizedPrerequisites: string[] | undefined = dto.prerequisites;
  if (typeof anyDto.prerequisites === 'string') {
    normalizedPrerequisites = (anyDto.prerequisites as string)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  // Create course
  const course = await this.prisma.course.create({
    data: {
      title: dto.title,
      description: this.normalize(dto.description),
      instructorId: userId,
      categoryId: normalizedCategoryId ?? null,
      difficulty: dto.difficulty ?? undefined,
      duration: dto.duration ?? undefined,        // ensure optional
      thumbnailUrl: dto.thumbnailUrl ?? undefined, // ensure optional
      prerequisites: normalizedPrerequisites ?? [],
    },
  });

  // Create lessons if any
  if (dto.lessons?.length) {
    const lessonsData = dto.lessons.map((lesson, index) => ({
      title: lesson.title!,
      content: this.normalize(lesson.content),
      videoUrl: this.getPublicUrl(lesson.videoUrl),
      attachmentUrl: this.getPublicUrl(lesson.attachmentUrl),
      duration: lesson.duration,
      order: lesson.order ?? index + 1,
      courseId: course.id,
    }));
    await this.prisma.lesson.createMany({ data: lessonsData });
  }
console.log(dto)
  // Return course with lessons and category
  return this.prisma.course.findUnique({
    where: { id: course.id },
    include: { lessons: true, category: true as any },
  });
}






  async updateCourse(courseId: number, userId: number, dto: UpdateCourseDto) {
    const existingCourse = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!existingCourse || existingCourse.instructorId !== userId)
      throw new NotFoundException('Course not found or not owned by instructor');

    await this.prisma.course.update({
      where: { id: courseId },
      data: {
        title: dto.title ?? existingCourse.title,
        description: this.normalize(dto.description ?? existingCourse.description),
        categoryId: dto.categoryId ?? existingCourse.categoryId,
        prerequisites: dto.prerequisites ?? existingCourse.prerequisites ?? [],
      },
    });

    if (dto.lessons?.length) {
      for (const lesson of dto.lessons) {
        if (lesson.id) {
          const existingLesson = await this.prisma.lesson.findUnique({ where: { id: lesson.id } });
          if (!existingLesson) throw new NotFoundException('Lesson not found');

          let videoUrl = lesson.videoUrl !== undefined ? this.getPublicUrl(lesson.videoUrl) : existingLesson.videoUrl;
          let attachmentUrl = lesson.attachmentUrl !== undefined ? this.getPublicUrl(lesson.attachmentUrl) : existingLesson.attachmentUrl;

          if (lesson.videoUrl && existingLesson.videoUrl && existsSync(join(process.cwd(), existingLesson.videoUrl))) unlinkSync(join(process.cwd(), existingLesson.videoUrl));
          if (lesson.attachmentUrl && existingLesson.attachmentUrl && existsSync(join(process.cwd(), existingLesson.attachmentUrl))) unlinkSync(join(process.cwd(), existingLesson.attachmentUrl));

          await this.prisma.lesson.update({
            where: { id: lesson.id },
            data: { title: lesson.title ?? existingLesson.title, content: this.normalize(lesson.content ?? existingLesson.content), videoUrl, attachmentUrl },
          });
        } else {
          if (!lesson.title) throw new BadRequestException('New lesson must have a title');
          // Get the next order number
          const lastLesson = await this.prisma.lesson.findFirst({
            where: { courseId },
            orderBy: { order: 'desc' },
          });
          const order = (lastLesson?.order ?? 0) + 1;

          await this.prisma.lesson.create({
            data: {
              title: lesson.title,
              content: this.normalize(lesson.content),
              videoUrl: this.getPublicUrl(lesson.videoUrl),
              attachmentUrl: this.getPublicUrl(lesson.attachmentUrl),
              duration: lesson.duration,
              order,
              courseId,
            },
          });
        }
      }
    }

    return this.prisma.course.findUnique({
      where: { id: courseId },
      include: { lessons: true, category: true as any },
    });
  }


async getCourseById(courseId: number, userId?: number) {
  const course = await this.prisma.course.findUnique({
    where: { id: courseId },
    include: { lessons: { orderBy: { order: 'asc' } }, category: true as any },
  });
  if (!course) throw new NotFoundException('Course not found');

  if (userId && course.instructorId !== userId) {
    throw new BadRequestException('Not authorized to access this course');
  }

  return course;
}


  // ----------------------
  // Lesson Methods
  // ----------------------
  async addLesson(userId: number, courseId: number, lesson: { title: string; content?: string; videoUrl?: string; attachmentUrl?: string; duration?: string; order?: number }) {
    if (!lesson.title) throw new BadRequestException('Lesson must have a title');
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course || course.instructorId !== userId) throw new NotFoundException('Course not found or not owned by instructor');

    // Get the next order number if not provided
    let order = lesson.order;
    if (!order) {
      const lastLesson = await this.prisma.lesson.findFirst({
        where: { courseId },
        orderBy: { order: 'desc' },
      });
      order = (lastLesson?.order ?? 0) + 1;
    }

    return this.prisma.lesson.create({
      data: { 
        title: lesson.title, 
        content: this.normalize(lesson.content), 
        videoUrl: this.getPublicUrl(lesson.videoUrl), 
        attachmentUrl: this.getPublicUrl(lesson.attachmentUrl),
        duration: lesson.duration,
        order,
        courseId 
      },
    });
  }

 async updateLesson(
  userId: number,
  lessonId: number,
  data: { title?: string; content?: string; videoUrl?: string | null; attachmentUrl?: string | null }
) {
  const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) throw new NotFoundException('Lesson not found');

  const course = await this.prisma.course.findUnique({ where: { id: lesson.courseId } });
  if (!course || course.instructorId !== userId)
    throw new BadRequestException('You do not have permission to update this lesson');

  // Handle video
  let video = lesson.videoUrl; // default: keep existing
  if (data.videoUrl !== undefined) {
    // New file uploaded
    if (data.videoUrl && existsSync(join(process.cwd(), lesson.videoUrl || ''))) {
      // remove old file if exists
      unlinkSync(join(process.cwd(), lesson.videoUrl || ''));
    }
    // use new file URL or keep existing if null
    video = data.videoUrl ? this.getPublicUrl(data.videoUrl) : lesson.videoUrl;
  }

  // Handle attachment
  let attachment = lesson.attachmentUrl; // default: keep existing
  if (data.attachmentUrl !== undefined) {
    if (data.attachmentUrl && existsSync(join(process.cwd(), lesson.attachmentUrl || ''))) {
      unlinkSync(join(process.cwd(), lesson.attachmentUrl || ''));
    }
    attachment = data.attachmentUrl ? this.getPublicUrl(data.attachmentUrl) : lesson.attachmentUrl;
  }

  return this.prisma.lesson.update({
    where: { id: lessonId },
    data: {
      title: data.title ?? lesson.title,
      content: data.content ?? lesson.content,
      videoUrl: video,
      attachmentUrl: attachment,
    },
  });
}

  async deleteLesson(userId: number, lessonId: number) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException('Lesson not found');
    const course = await this.prisma.course.findUnique({ where: { id: lesson.courseId } });
    if (!course || course.instructorId !== userId) throw new BadRequestException('You do not have permission to delete this lesson');

    if (lesson.videoUrl && existsSync(join(process.cwd(), lesson.videoUrl))) unlinkSync(join(process.cwd(), lesson.videoUrl));
    if (lesson.attachmentUrl && existsSync(join(process.cwd(), lesson.attachmentUrl))) unlinkSync(join(process.cwd(), lesson.attachmentUrl));

    return this.prisma.lesson.delete({ where: { id: lessonId } });
  }

  // ----------------------
  // Course Status Methods
  // ----------------------

async getCoursesByInstructor(userId: number) {
  return this.prisma.course.findMany({
    where: { instructorId: userId },
    include: { lessons: true, category: true }, // include category
  });
}




  // ----------------------
  // Search courses
  // ----------------------
  async searchCourses(instructorId: number, query: string) {
    if (!query) return [];
    return this.prisma.course.findMany({
      where: { instructorId, OR: [{ title: { contains: query, mode: 'insensitive' } }, { description: { contains: query, mode: 'insensitive' } }] },
      include: { lessons: true, enrollments: true, category: true as any },
    });
  }

// ----------------------
  // Reorder Lessons Method (NEW)
  // ----------------------
  async reorderLessons(userId: number, courseId: number, lessonIds: number[]) {
  const course = await this.prisma.course.findUnique({
    where: { id: courseId },
    include: { lessons: true },
  });
  if (!course || course.instructorId !== userId)
    throw new ForbiddenException('You do not have permission to reorder lessons');

  // Ensure all IDs belong to this course
  const courseLessonIds = course.lessons.map(l => l.id);
  if (!lessonIds.every(id => courseLessonIds.includes(id)))
    throw new BadRequestException('Invalid lesson IDs');

  // Update lessons with new order
  for (let index = 0; index < lessonIds.length; index++) {
    await this.prisma.lesson.update({
      where: { id: lessonIds[index] },
      data: { order: index + 1 },
    });
  }

  // Return updated lessons
  return this.prisma.lesson.findMany({
    where: { courseId },
    orderBy: { order: 'asc' },
  });
}
}