// src/courses/course.entity.ts
import type {
  Course as PrismaCourse,
  Enrollment as PrismaEnrollment,
  User as PrismaUser,
} from '@prisma/client';

export type Course = PrismaCourse & {
  enrollments?: PrismaEnrollment[];
  instructor?: PrismaUser; // in case you include instructor relation in schema
};
