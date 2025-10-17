// src/students/students.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StudentsService, EnrolledCourseWithProgress } from './students.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import { Request } from 'express'; // ✅ import from express

// Extend Express Request with JWT user object
interface AuthenticatedRequest extends Request {
  user: { id: number };
}

@Controller('students')
@UseGuards(JwtAuthGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  /**
   * 🔹 Fetch all courses the logged-in student is enrolled in
   * GET /students/my-courses
   */
  @Get('my-courses')
  async getMyCourses(
    @Req() req: AuthenticatedRequest,
  ): Promise<EnrolledCourseWithProgress[]> {
    return this.studentsService.getEnrolledCourses(req.user.id);
  }

  /**
   * 🔹 Enroll the logged-in student in a course
   * POST /students/enroll/:courseId
   */
  @Post('enroll/:courseId')
  async enrollInCourse(
    @Req() req: AuthenticatedRequest,
    @Param('courseId') courseId: string,
  ) {
    return this.studentsService.enrollInCourse(req.user.id, +courseId);
  }

  /**
   * 🔹 Mark a course as completed (auto-generates certificate)
   * POST /students/complete/:courseId
   */
  @Post('complete/:courseId')
  async completeCourse(
    @Req() req: AuthenticatedRequest,
    @Param('courseId') courseId: string,
  ) {
    return this.studentsService.markCourseCompleted(req.user.id, +courseId);
  }

  /**
   * 🔹 Upload/Update student's profile photo
   * PUT /students/profile/photo
   */
  @Put('profile/photo')
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(__dirname, '../../uploads/profile-pictures');
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const userId = (req as AuthenticatedRequest).user.id;
          const uniqueSuffix = `${userId}_${uuidv4()}${extname(file.originalname)}`;
          cb(null, uniqueSuffix);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
    }),
  )
  async uploadProfilePhoto(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');

    const filePath = `/uploads/profile-pictures/${file.filename}`;

    // Save path in the database
    await this.studentsService.updateProfilePhoto(req.user.id, filePath);

    return { message: 'Profile photo updated successfully!', path: filePath };
  }
}
