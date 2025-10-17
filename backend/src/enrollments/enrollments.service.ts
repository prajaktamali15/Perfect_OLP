// src/enrollments/enrollments.service.ts
import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import * as fs from 'fs/promises';
import { join,resolve } from 'path';
import { PDFDocument, StandardFonts } from 'pdf-lib';

@Injectable()
export class EnrollmentsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 📌 Enroll a student in a course
   */
  async enroll(studentId: number, courseId: number) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    const existing = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });
    if (existing) throw new ForbiddenException('Already enrolled in this course');

    return this.prisma.enrollment.create({
      data: { studentId, courseId },
      include: {
        course: {
          include: { instructor: { select: { id: true, name: true, email: true } } },
        },
      },
    });
  }

  /**
   * 📌 Get all students enrolled in a course
   */
  async getEnrolledStudents(courseId: number) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    return this.prisma.enrollment.findMany({
      where: { courseId },
      include: {
        student: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true, description: true } },
      },
    });
  }

  /**
   * 📌 Get all courses a student is enrolled in
   */
  async getStudentEnrollments(studentId: number) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { studentId },
      include: {
        course: {
          include: { instructor: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    if (!enrollments.length) return [];

    return enrollments.map((e) => {
      const enrollmentAny = e as any;
      return {
        id: e.course.id,
        title: e.course.title,
        description: e.course.description,
        instructor: e.course.instructor,
        progress: enrollmentAny.progress ?? 0,
        certificateUrl:
          enrollmentAny.progress >= 100
            ? `/certificates/${e.studentId}-${e.courseId}.pdf`
            : null,
      };
    });
  }

  /**
   * 📌 Update progress of a student in a course
   */
  async updateProgress(studentId: number, courseId: number, progress: number) {
    if (progress < 0 || progress > 100)
      throw new BadRequestException('Progress must be between 0 and 100');

    const enrollment = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    return this.prisma.enrollment.update({
      where: { studentId_courseId: { studentId, courseId } },
      data: {
        progress,
        completedAt: progress >= 100 ? new Date() : null,
      } as Prisma.EnrollmentUncheckedUpdateInput,
    });
  }

  /**
   * 📌 Student completes a lesson
   */
  async completeLesson(studentId: number, courseId: number, lessonId: number) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    const completedLessons: number[] = Array.isArray((enrollment as any).completedLessonIds)
      ? (enrollment as any).completedLessonIds
      : [];

    if (!completedLessons.includes(lessonId)) completedLessons.push(lessonId);

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { lessons: true },
    });
    if (!course) throw new NotFoundException('Course not found');

    const totalLessons = Array.isArray(course.lessons) ? course.lessons.length : 1;
    const progress = Math.min(Math.round((completedLessons.length / totalLessons) * 100), 100);

    return this.prisma.enrollment.update({
      where: { studentId_courseId: { studentId, courseId } },
      data: {
        completedLessonIds: completedLessons as Prisma.JsonValue,
        progress,
        completedAt: progress >= 100 ? new Date() : null,
      } as Prisma.EnrollmentUncheckedUpdateInput,
    });
  }

  async getCourseDetails(studentId: number, courseId: number) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: true,
        lessons: true,
        enrollments: {
          where: { studentId },
        },
      },
    });

    if (!course) return null;

    const enrollment = course.enrollments[0];
    if (!enrollment) return null;

    const completedLessonIdsArray: number[] = Array.isArray(enrollment.completedLessonIds)
      ? (enrollment.completedLessonIds as number[])
      : [];

    const lessons = course.lessons.map((l) => ({
      id: l.id,
      title: l.title,
      content: l.content,
      videoUrl: l.videoUrl ?? null,
      attachmentUrl: l.attachmentUrl ?? null,
      completed: completedLessonIdsArray.includes(l.id),
    }));

    const progress = lessons.length
      ? Math.round((completedLessonIdsArray.length / lessons.length) * 100)
      : 0;

    return {
      id: course.id,
      title: course.title || 'Untitled Course',
      description: course.description || 'No description available',
      instructor: course.instructor
        ? { id: course.instructor.id, name: course.instructor.name, email: course.instructor.email }
        : null,
      lessons,
      progress,
      certificateUrl: enrollment.certificateUrl || null,
    };
  }




async generateCertificate(studentId: number, courseId: number): Promise<string> {
    console.log('🟢 Starting certificate generation for student', studentId, 'course', courseId);

    // 1️⃣ Fetch enrollment
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    if (enrollment.progress < 100) throw new BadRequestException('Course not completed yet');

    // 2️⃣ Return existing certificate if already generated
    if (enrollment.certificateUrl) {
      console.log('✅ Certificate already exists:', enrollment.certificateUrl);
      return enrollment.certificateUrl!;
    }

    // 3️⃣ Fetch student and course info
    const student = await this.prisma.user.findUnique({ where: { id: studentId }, select: { name: true } });
    const course = await this.prisma.course.findUnique({ where: { id: courseId }, select: { title: true } });
    if (!student || !course) throw new NotFoundException('Student or Course not found');

    // 4️⃣ Save PDFs in persistent folder outside dist
    const certificatesDir = join(process.cwd(), 'public', 'certificates');
    await fs.mkdir(certificatesDir, { recursive: true });

    const fileName = `${studentId}-${courseId}.pdf`;
    const filePath = join(certificatesDir, fileName);

    // 5️⃣ Generate PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 400]);
    const { height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    page.drawText('Certificate of Completion', { x: 50, y: height - 100, size: 30, font });
    page.drawText(`This certifies that ${student?.name || 'Student'}`, { x: 50, y: height - 160, size: 18, font });
    page.drawText(`has successfully completed the course: "${course?.title || 'Untitled Course'}"`, { x: 50, y: height - 190, size: 18, font });
    page.drawText(`Date: ${new Date().toLocaleDateString()}`, { x: 50, y: height - 220, size: 14, font });

    await fs.writeFile(filePath, await pdfDoc.save());
    console.log('✅ PDF saved successfully at', filePath);

    // 6️⃣ Update enrollment with certificate URL
    const updatedEnrollment = await this.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { certificateUrl: `/certificates/${fileName}` },
    });

    console.log('🟢 Certificate URL updated in DB:', updatedEnrollment.certificateUrl);

    return updatedEnrollment.certificateUrl!;
  }


}
