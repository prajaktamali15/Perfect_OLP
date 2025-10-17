// src/instructor/dto/create-lesson.dto.ts
import { IsOptional, IsString, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLessonDto {
  @ApiProperty({ example: 'Introduction to React', description: 'Title of the lesson' })
  @IsString()
  title!: string;

  @ApiPropertyOptional({ example: 'Lesson content goes here', description: 'Text content of the lesson' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ example: 'https://video-url.com', description: 'Video URL for the lesson' })
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiPropertyOptional({ example: 'https://attachment-url.com/file.pdf', description: 'Attachment URL for the lesson' })
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
