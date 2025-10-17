// src/instructor/dto/update-lesson.dto.ts
import { IsOptional, IsString, IsInt } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateLessonDto {
  @ApiPropertyOptional({ example: 'Updated Lesson Title', description: 'Title of the lesson' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Updated content', description: 'Text content of the lesson' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ type: 'string', format: 'binary', description: 'Video file upload (optional)' })
  @IsOptional()
  videoFile?: any;

  @ApiPropertyOptional({ type: 'string', format: 'binary', description: 'Attachment file upload (optional)' })
  @IsOptional()
  attachmentFile?: any;

  @ApiPropertyOptional({ example: 'https://video-url.com', description: 'URL of existing video if no new upload' })
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiPropertyOptional({ example: 'https://attachment-url.com/file.pdf', description: 'URL of existing attachment if no new upload' })
  @IsOptional()
  @IsString()
  attachmentUrl?: string;

  @ApiPropertyOptional({ example: '20 min', description: 'Duration of the lesson' })
  @IsOptional()
  @IsString()
  duration?: string;

  @ApiPropertyOptional({ example: 1, description: 'Order of the lesson in the course' })
  @IsOptional()
  @IsInt()
  order?: number;
}
