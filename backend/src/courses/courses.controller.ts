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

interface RequestWithUser extends Request {
  user: { id: number; role: Role };
}

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  // -----------------------------
  // Public routes
  // -----------------------------
  @Get('public')
  async findAllPublic() {
    try {
      return await this.coursesService.findAll();
    } catch (err) {
      throw new NotFoundException('Failed to fetch courses');
    }
  }

  @Get(':id')
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
  async createCourse(
    @Body() body: CreateCourseDto,
    @UploadedFile() thumbnail: Express.Multer.File,
    @Req() req: RequestWithUser,
  ) {
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
  async deleteCourse(@Param('id') id: string, @Req() req: RequestWithUser) {
    const courseId = Number(id);
    if (isNaN(courseId)) throw new BadRequestException('Invalid course ID');
    return this.coursesService.deleteCourse(courseId, req.user.id);
  }

  @Get('analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR)
  async getCourseAnalytics(@Req() req: RequestWithUser) {
    return this.coursesService.getCourseAnalytics(req.user.id);
  }

  // -----------------------------
  // Lesson Management
  // -----------------------------
  @Post(':id/lessons')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR)
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
  async findCoursesForInstructor(@Req() req: RequestWithUser) {
    return this.coursesService.findByInstructor(req.user.id);
  }
}
