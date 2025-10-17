import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Param,
  NotFoundException,
  BadRequestException,
  Patch,
  Delete,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { CreateCourseDto } from '../instructor/dto/create-course.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

interface RequestWithUser extends Request {
  user: { id: number; role: Role };
}

@ApiTags('Courses')
@ApiBearerAuth()
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  // -----------------------------
  // Public routes
  // -----------------------------
  @Get('public')
  @ApiOperation({ summary: 'List all public courses' })
  @ApiResponse({ status: 200, description: 'List of courses returned' })
  async findAllPublic() {
    try {
      return await this.coursesService.findAll();
    } catch (err) {
      throw new NotFoundException('Failed to fetch courses');
    }
  }

  // Move analytics route BEFORE dynamic ':id' route to prevent route conflicts
  @Get('analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Get analytics for instructor courses' })
  @ApiResponse({ status: 200, description: 'Analytics returned' })
  async getCourseAnalytics(@Req() req: RequestWithUser) {
    return this.coursesService.getCourseAnalytics(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get course by id' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Course returned' })
  async findById(@Param('id') id: string) {
    const courseId = Number(id);
    if (isNaN(courseId)) {
      throw new BadRequestException('Invalid course ID');
    }
    return this.coursesService.findById(courseId);
  }

  // -----------------------------
  // Authenticated routes (student dashboard)
  // -----------------------------
  @Get('auth/me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get courses visible to current user' })
  @ApiResponse({ status: 200, description: 'Courses returned for user' })
  async findAllForStudent(@Req() req: RequestWithUser) {
    return this.coursesService.findAll(req.user.id);
  }

  // -----------------------------
  // Instructor-only routes
  // -----------------------------
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @UseInterceptors(FileInterceptor('thumbnail'))
  @ApiOperation({ summary: 'Create a new course (instructor)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateCourseDto })
  @ApiResponse({ status: 201, description: 'Course created' })
  async createCourse(
    @Body() body: CreateCourseDto,
    @UploadedFile() thumbnail: Express.Multer.File,
    @Req() req: RequestWithUser,
  ) {
    // Coerce potential string inputs from Swagger UI to expected types
    const anyBody: any = body as any;
    if (typeof anyBody.categoryId === 'string') {
      const trimmed = anyBody.categoryId.trim();
      body.categoryId = trimmed === '' ? undefined : Number(trimmed);
    }
    if (typeof (anyBody.prerequisites) === 'string') {
      body.prerequisites = (anyBody.prerequisites as string)
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);
    }
    if (Array.isArray(anyBody.lessons)) {
      body.lessons = anyBody.lessons
        .map((item: any, index: number) => {
          if (typeof item === 'string') {
            const t = item.trim();
            return t ? { title: t, order: index + 1 } : null;
          }
          const title = item?.title?.toString().trim();
          if (!title) return null;
          const normalized: any = { title };
          if (item.content != null) normalized.content = String(item.content);
          if (item.videoUrl != null) normalized.videoUrl = String(item.videoUrl);
          if (item.attachmentUrl != null) normalized.attachmentUrl = String(item.attachmentUrl);
          if (item.duration != null) normalized.duration = String(item.duration);
          if (item.order != null) {
            const parsedOrder = Number(item.order);
            normalized.order = isNaN(parsedOrder) ? index + 1 : parsedOrder;
          } else {
            normalized.order = index + 1;
          }
          return normalized;
        })
        .filter(Boolean) as any;
    }
    if (!body.title) throw new BadRequestException('Course title is required');
    body.instructorId = req.user.id;

    let thumbnailUrl: string | undefined = undefined;
    if (thumbnail) {
      try {
        thumbnailUrl = await this.coursesService.uploadThumbnail(thumbnail);
      } catch (err) {
        throw new BadRequestException('Failed to upload thumbnail');
      }
    } else if (body.thumbnailUrl) {
      thumbnailUrl = body.thumbnailUrl;
    }

    return this.coursesService.create({
      title: body.title,
      description: body.description,
      categoryId: body.categoryId,
      difficulty: body.difficulty,
      duration: body.duration,
      thumbnailUrl,
      prerequisites: body.prerequisites,
      lessons: body.lessons,
      instructorId: body.instructorId,
    });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Delete a course (instructor)' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Course deleted' })
  async deleteCourse(@Param('id') id: string, @Req() req: RequestWithUser) {
    const courseId = Number(id);
    if (isNaN(courseId)) throw new BadRequestException('Invalid course ID');
    return this.coursesService.deleteCourse(courseId, req.user.id);
  }


  // -----------------------------
  // Lesson Management
  // -----------------------------
  @Post(':id/lessons')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Add lesson to a course' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        content: { type: 'string' },
        videoUrl: { type: 'string' },
        attachmentUrl: { type: 'string' },
        duration: { type: 'string' },
        order: { type: 'number' },
      },
      required: ['title'],
    },
  })
  @ApiResponse({ status: 201, description: 'Lesson added' })
  async addLesson(
    @Param('id') id: string,
    @Body() body: {
      title: string;
      content?: string;
      videoUrl?: string;
      attachmentUrl?: string;
      duration?: string;
      order?: number;
    },
  ) {
    const courseId = Number(id);
    if (isNaN(courseId)) throw new BadRequestException('Invalid course ID');
    if (!body.title) throw new BadRequestException('Lesson title is required');
    return this.coursesService.addLesson(courseId, body);
  }

  @Patch(':id/lessons/reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Reorder lessons within a course' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        lessonOrders: {
          type: 'array',
          items: {
            type: 'object',
            properties: { lessonId: { type: 'number' }, order: { type: 'number' } },
          },
        },
      },
      required: ['lessonOrders'],
    },
  })
  @ApiResponse({ status: 200, description: 'Lessons reordered' })
  async reorderLessons(
    @Param('id') id: string,
    @Body() body: { lessonOrders: { lessonId: number; order: number }[] },
  ) {
    const courseId = Number(id);
    if (isNaN(courseId)) throw new BadRequestException('Invalid course ID');
    if (!body.lessonOrders || !Array.isArray(body.lessonOrders))
      throw new BadRequestException('Lesson orders array is required');
    return this.coursesService.reorderLessons(courseId, body.lessonOrders);
  }

  @Post(':id/prerequisites')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Add a prerequisite to a course' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { prerequisiteName: { type: 'string' } },
      required: ['prerequisiteName'],
    },
  })
  @ApiResponse({ status: 201, description: 'Prerequisite added' })
  async addPrerequisite(
    @Param('id') id: string,
    @Body() body: { prerequisiteName: string },
  ) {
    const courseId = Number(id);
    if (isNaN(courseId)) throw new BadRequestException('Invalid course ID');
    if (!body.prerequisiteName)
      throw new BadRequestException('Prerequisite name is required');
    return this.coursesService.addPrerequisite(courseId, body.prerequisiteName);
  }

  // -----------------------------
  // Instructor dashboard: get own courses
  // -----------------------------
  @Get('instructor/me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Get courses for current instructor' })
  @ApiResponse({ status: 200, description: 'Instructor courses returned' })
  async findCoursesForInstructor(@Req() req: RequestWithUser) {
    return this.coursesService.findByInstructor(req.user.id);
  }
}
