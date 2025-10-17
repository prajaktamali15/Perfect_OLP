// src/instructor/dto/update-course.dto.ts
import { IsString, IsOptional, IsArray, ValidateNested, IsEnum, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Prisma enum strings must match exactly
export enum Difficulty {
  Beginner = 'Beginner',
  Intermediate = 'Intermediate',
  Advanced = 'Advanced',
}

export class LessonUpdateDTO {
  @ApiProperty({ example: 1, description: 'ID of the lesson to update' })
  @IsInt()
  id: number;

  @ApiPropertyOptional({ example: 'Updated Lesson Title', description: 'Title of the lesson' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Updated content', description: 'Lesson content' })
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

  @ApiPropertyOptional({ example: '20 min', description: 'Lesson duration' })
  @IsOptional()
  @IsString()
  duration?: string;

  @ApiPropertyOptional({ example: 1, description: 'Order of the lesson in the course' })
  @IsOptional()
  @IsInt()
  order?: number;
}

export class UpdateCourseDto {
  @ApiPropertyOptional({ example: 'Advanced React', description: 'Course title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Updated course description', description: 'Course description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 2, description: 'Category ID of the course' })
  @IsOptional()
  @IsInt()
  categoryId?: number;

  @ApiPropertyOptional({ enum: Difficulty, example: Difficulty.Intermediate, description: 'Difficulty level of the course' })
  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @ApiPropertyOptional({ example: '6h', description: 'Total duration of the course' })
  @IsOptional()
  @IsString()
  duration?: string;

  @ApiPropertyOptional({ example: 'https://image-url.com/thumbnail.jpg', description: 'Thumbnail URL for the course' })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ example: ['HTML', 'CSS'], description: 'Prerequisites for the course', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  prerequisites?: string[];

  @ApiPropertyOptional({ type: [LessonUpdateDTO], description: 'List of lessons to update' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LessonUpdateDTO)
  lessons?: LessonUpdateDTO[];
}
