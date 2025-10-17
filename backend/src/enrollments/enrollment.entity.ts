

// src/enrollments/enrollment.entity.ts
import type {
  Enrollment as PrismaEnrollment,
  User as PrismaUser,
  Course as PrismaCourse,
} from '@prisma/client';

export type Enrollment = PrismaEnrollment & {
  student?: PrismaUser | null;
  course?: PrismaCourse | null;
};

export type EnrollmentWithRelations = Enrollment;
