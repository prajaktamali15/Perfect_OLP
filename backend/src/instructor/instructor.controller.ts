// src/instructor/instructor.controller.ts
import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  BadRequestException,
  Patch,
  Get,
  Query,
  Param,
  UploadedFiles,
  UseInterceptors,
  Delete,
} from '@nestjs/common';
import { InstructorService } from './instructor.service';
import { CreateCourseDto, Difficulty as CreateDifficulty } from './dto/create-course.dto';
import { UpdateCourseDto, Difficulty as UpdateDifficulty } from './dto/update-course.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { UploadedFile } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { LessonDTO } from './dto/create-course.dto';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Instructor') // Swagger group
@ApiBearerAuth()
@Controller('instructor/courses')
export class InstructorController {
  constructor(private readonly instructorService: InstructorService) {}

  // ----------------------
  // Profile Endpoints
  // ----------------------
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @Get('me')
  @ApiOperation({ summary: 'Get instructor profile' })
  @ApiResponse({ status: 200, description: 'Instructor profile returned successfully' })
  async getProfile(@Req() req: any) {
    return this.instructorService.getProfile(req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @Patch('me')
  @ApiOperation({ summary: 'Update instructor profile' })
  @ApiBody({ description: 'Profile fields to update', type: Object })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(@Req() req: any, @Body() body: any) {
    return this.instructorService.updateProfile(req.user.id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @Get('me/courses')
  @ApiOperation({ summary: 'Get courses of logged-in instructor' })
  @ApiResponse({ status: 200, description: 'List of courses returned successfully' })
  async getMyCourses(@Req() req: any) {
    return this.instructorService.getCoursesByInstructor(req.user.id);
  }

  // ----------------------
  // Course Categories Endpoint
  // ----------------------
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @Get('categories')
  @ApiOperation({ summary: 'Get all course categories' })
  @ApiResponse({ status: 200, description: 'Course categories returned successfully' })
  async getCourseCategories() {
    return this.instructorService.getCourseCategories();
  }

  // ----------------------
  // Course Endpoints
  // ----------------------
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @Post()
  @UseInterceptors(InstructorController.thumbnailUploadInterceptor())
  @ApiOperation({ summary: 'Create a new course' })
  @ApiBody({ type: CreateCourseDto })
  @ApiResponse({ status: 201, description: 'Course created successfully' })
  async createCourse(
    @Req() req: any, 
    @Body() dto: CreateCourseDto,
    @UploadedFile() thumbnail?: Express.Multer.File
  ) {
    const duration = dto.duration ?? undefined;
    
    // Handle thumbnail upload
    let thumbnailUrl: string | undefined = undefined;
    if (thumbnail) {
      thumbnailUrl = `/uploads/thumbnails/${thumbnail.filename}`;
    } else if (dto.thumbnailUrl) {
      thumbnailUrl = dto.thumbnailUrl;
    }

    const course = await this.instructorService.createCourse(req.user.id, {
      ...dto,
      categoryId: dto.categoryId,
      difficulty: dto.difficulty as CreateDifficulty,
      thumbnailUrl,
      duration,
    });

    return { success: true, course };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a course' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiBody({ type: UpdateCourseDto })
  @ApiResponse({ status: 200, description: 'Course updated successfully' })
  async updateCourse(
    @Req() req: any,
    @Param('id') courseId: string,
    @Body() dto: UpdateCourseDto,
  ) {
    if (!courseId) throw new BadRequestException('Course ID is required');

    const thumbnailUrl = dto.thumbnailUrl ?? undefined;
    const duration = dto.duration ?? undefined;

    const updatedCourse = await this.instructorService.updateCourse(Number(courseId), req.user.id, {
      ...dto,
      categoryId: dto.categoryId,
      difficulty: dto.difficulty as UpdateDifficulty,
      thumbnailUrl,
      duration,
    });

    return updatedCourse;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @Get('search')
  @ApiOperation({ summary: 'Search courses by query' })
  @ApiQuery({ name: 'query', description: 'Search query string' })
  @ApiResponse({ status: 200, description: 'List of matching courses' })
  async searchCourses(@Req() req: any, @Query('query') query: string) {
    if (!query?.trim()) return [];
    return this.instructorService.searchCourses(req.user.id, query);
  }

  // ----------------------
  // Reorder Lessons Route
  // ----------------------
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @Patch(':courseId/lessons/reorder')
  @ApiOperation({ summary: 'Reorder lessons in a course' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        lessonIds: { type: 'array', items: { type: 'number' } },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Lessons reordered successfully' })
  async reorderLessons(
    @Req() req: any,
    @Param('courseId') courseId: string,
    @Body() body: { lessonIds: number[] },
  ) {
    if (!courseId) throw new BadRequestException('Course ID is required');
    return this.instructorService.reorderLessons(req.user.id, Number(courseId), body.lessonIds);
  }

  // ----------------------
  // Get Single Course
  // ----------------------
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @Get(':id')
  @ApiOperation({ summary: 'Get course by ID' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Course details returned successfully' })
  async getCourse(@Req() req: any, @Param('id') courseId: string) {
    if (!courseId) throw new BadRequestException('Course ID is required');
    return this.instructorService.getCourseById(Number(courseId), req.user.id);
  }

  // ----------------------
  // Thumbnail Upload Config
  // ----------------------
  private static thumbnailUploadInterceptor() {
    const uploadPath = join(process.cwd(), 'uploads', 'thumbnails');
    if (!existsSync(uploadPath)) mkdirSync(uploadPath, { recursive: true });

    return FileInterceptor('thumbnail', {
      storage: diskStorage({
        destination: uploadPath,
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Only image files are allowed for thumbnails'), false);
        }
        cb(null, true);
      },
    });
  }

  // ----------------------
  // File Upload Config
  // ----------------------
  private static uploadInterceptor() {
    const uploadPath = join(process.cwd(), 'uploads', 'lessons');
    if (!existsSync(uploadPath)) mkdirSync(uploadPath, { recursive: true });

    return FileFieldsInterceptor(
      [
        { name: 'videoFile', maxCount: 1 },
        { name: 'attachmentFile', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: uploadPath,
          filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            cb(null, uniqueSuffix + extname(file.originalname));
          },
        }),
        limits: { fileSize: 500 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
          if (!(file.mimetype === 'application/pdf' || file.mimetype.startsWith('video/'))) {
            return cb(new BadRequestException('Only PDF and video files are allowed'), false);
          }
          cb(null, true);
        },
      },
    );
  }

  // ----------------------
  // Add Lesson
  // ----------------------
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @Post(':courseId/lessons')
  @UseInterceptors(InstructorController.uploadInterceptor())
  @ApiOperation({ summary: 'Add lesson to a course' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiBody({ type: LessonDTO })
  @ApiResponse({ status: 201, description: 'Lesson added successfully' })
  async addLesson(
    @Param('courseId') courseId: string,
    @UploadedFiles()
    files: { videoFile?: Express.Multer.File[]; attachmentFile?: Express.Multer.File[] },
    @Body() body: { title: string; content?: string },
    @Req() req: any,
  ) {
    if (!courseId) throw new BadRequestException('Course ID is required');

    const videoUrl = files.videoFile?.[0]
      ? `/uploads/lessons/${files.videoFile[0].filename}`
      : undefined;
    const attachmentUrl = files.attachmentFile?.[0]
      ? `/uploads/lessons/${files.attachmentFile[0].filename}`
      : undefined;

    return this.instructorService.addLesson(req.user.id, Number(courseId), {
      title: body.title,
      content: body.content,
      videoUrl,
      attachmentUrl,
    });
  }

  // ----------------------
  // Update Lesson
  // ----------------------
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @Patch('lessons/:lessonId')
  @UseInterceptors(InstructorController.uploadInterceptor())
  @ApiOperation({ summary: 'Update a lesson' })
  @ApiParam({ name: 'lessonId', description: 'Lesson ID' })
  @ApiBody({ type: LessonDTO })
  @ApiResponse({ status: 200, description: 'Lesson updated successfully' })
  async updateLesson(
    @Req() req: any,
    @Param('lessonId') lessonId: string,
    @UploadedFiles()
    files: { videoFile?: Express.Multer.File[]; attachmentFile?: Express.Multer.File[] },
    @Body() body: { title?: string; content?: string },
  ) {
    if (!lessonId) throw new BadRequestException('Lesson ID is required');

    const videoUrl = files.videoFile?.[0]
      ? `/uploads/lessons/${files.videoFile[0].filename}`
      : undefined;
    const attachmentUrl = files.attachmentFile?.[0]
      ? `/uploads/lessons/${files.attachmentFile[0].filename}`
      : undefined;

    const updateData: any = {
      title: body.title,
      content: body.content,
    };
    
    // Handle video file - if no new file uploaded, keep existing or set to null
    if (videoUrl) {
      updateData.videoUrl = videoUrl;
    } else if (files.videoFile === undefined) {
      // No video file in request - keep existing
      updateData.videoUrl = undefined;
    }
    
    // Handle attachment file - if no new file uploaded, keep existing or set to null  
    if (attachmentUrl) {
      updateData.attachmentUrl = attachmentUrl;
    } else if (files.attachmentFile === undefined) {
      // No attachment file in request - keep existing
      updateData.attachmentUrl = undefined;
    }

    return this.instructorService.updateLesson(req.user.id, Number(lessonId), updateData);
  }

  // ----------------------
  // Delete Lesson
  // ----------------------
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @Delete('lessons/:lessonId')
  @ApiOperation({ summary: 'Delete a lesson' })
  @ApiParam({ name: 'lessonId', description: 'Lesson ID' })
  @ApiResponse({ status: 200, description: 'Lesson deleted successfully' })
  async deleteLesson(@Req() req: any, @Param('lessonId') lessonId: string) {
    if (!lessonId) throw new BadRequestException('Lesson ID is required');
    return this.instructorService.deleteLesson(req.user.id, Number(lessonId));
  }

  // ----------------------
  // Delete Course
  // ----------------------
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Delete a course' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Course deleted successfully' })
  async deleteCourse(@Req() req: any, @Param('id') id: string) {
    if (!id) throw new BadRequestException('Course ID is required');
    return this.instructorService.deleteCourse(req.user.id, Number(id));
  }
}
