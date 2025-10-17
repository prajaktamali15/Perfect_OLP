// src/instructor/dto/create-course.dto.ts
import { IsString, IsOptional, IsArray, ValidateNested, IsEnum, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Match the Prisma enum Difficulty exactly
export enum Difficulty {
  BEGINNER = 'Beginner',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced',
}

export class LessonDTO {
  @ApiProperty({ example: 'Introduction to React', description: 'Lesson title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Lesson content goes here', description: 'Text content of the lesson' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ example: 'https://video-url.com', description: 'Video URL for the lesson' })
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiPropertyOptional({ example: 'https://attachment-url.com/file.pdf', description: 'Attachment URL' })
  @IsOptional()
  @IsString()
  attachmentUrl?: string;

  @ApiPropertyOptional({ example: '15 min', description: 'Duration of the lesson' })
  @IsOptional()
  @IsString()
  duration?: string;

  @ApiPropertyOptional({ example: 1, description: 'Order of the lesson in the course' })
  @IsOptional()
  @IsInt()
  order?: number;
}

export class CreateCourseDto {
  @ApiProperty({ example: 'React for Beginners', description: 'Course title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Learn React from scratch', description: 'Course description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 3, description: 'Category ID for the course' })
  @IsOptional()
  @IsInt()
  categoryId?: number;

  @ApiPropertyOptional({ enum: Difficulty, example: Difficulty.BEGINNER, description: 'Course difficulty level' })
  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @ApiPropertyOptional({ example: '5h 30m', description: 'Total duration of the course' })
  @IsOptional()
  @IsString()
  duration?: string;

  @ApiPropertyOptional({ example: 'https://image-url.com/thumbnail.jpg', description: 'Course thumbnail image URL' })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ example: ['Basic HTML', 'CSS'], description: 'Prerequisites for the course', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  prerequisites?: string[];

  @ApiPropertyOptional({ type: [LessonDTO], description: 'List of lessons in the course' })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => LessonDTO)
  lessons?: LessonDTO[];

  @ApiProperty({ example: 1, description: 'ID of the instructor creating the course' })
  @IsInt()
  instructorId: number;
}
