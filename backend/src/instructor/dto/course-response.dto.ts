// src/instructor/dto/course-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Difficulty, LessonDTO } from './create-course.dto';

export class LessonResponseDto {
  @ApiProperty({ example: 'Introduction to React', description: 'Lesson title' })
  title: string;

  @ApiPropertyOptional({ example: 'Lesson content goes here', description: 'Text content of the lesson' })
  content?: string;

  @ApiPropertyOptional({ example: 'https://video-url.com', description: 'Video URL for the lesson' })
  videoUrl?: string;

  @ApiPropertyOptional({ example: 'https://attachment-url.com/file.pdf', description: 'Attachment URL' })
  attachmentUrl?: string;

  @ApiPropertyOptional({ example: '15 min', description: 'Duration of the lesson' })
  duration?: string;

  @ApiPropertyOptional({ example: 1, description: 'Order of the lesson in the course' })
  order?: number;
}

export class CourseResponseDto {
  @ApiProperty({ example: 1, description: 'Course ID' })
  id: number;

  @ApiProperty({ example: 'React for Beginners', description: 'Course title' })
  title: string;

  @ApiPropertyOptional({ example: 'Learn React from scratch', description: 'Course description' })
  description?: string;

  @ApiPropertyOptional({ example: 3, description: 'Category ID for the course' })
  categoryId?: number;

  @ApiPropertyOptional({ enum: Difficulty, example: Difficulty.BEGINNER, description: 'Difficulty level' })
  difficulty?: Difficulty;

  @ApiPropertyOptional({ example: '5h 30m', description: 'Total duration of the course' })
  duration?: string;

  @ApiPropertyOptional({ example: 'https://image-url.com/thumbnail.jpg', description: 'Course thumbnail image URL' })
  thumbnailUrl?: string;

  @ApiPropertyOptional({ example: ['Basic HTML', 'CSS'], description: 'Prerequisites for the course', type: [String] })
  prerequisites?: string[];

  @ApiProperty({ type: [LessonResponseDto], description: 'List of lessons in the course' })
  lessons: LessonResponseDto[];

  @ApiProperty({ example: 1, description: 'ID of the instructor who created the course' })
  instructorId: number;

  @ApiProperty({ example: '2025-10-14T10:00:00.000Z', description: 'Course creation date' })
  createdAt: Date;

  @ApiProperty({ example: '2025-10-14T10:30:00.000Z', description: 'Course last updated date' })
  updatedAt: Date;
}
