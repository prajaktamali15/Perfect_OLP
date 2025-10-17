// src/courses/courses.module.ts
import { Module } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule], // Use PrismaModule to provide PrismaService
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService], // Export service for use in other modules if needed
})
export class CoursesModule {}
