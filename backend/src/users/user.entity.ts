import type {
  User as PrismaUser,
  Enrollment as PrismaEnrollment,
} from '@prisma/client';

export enum UserRole {
  STUDENT = 'student',
  INSTRUCTOR = 'instructor',
  ADMIN = 'admin',
}

export type User = PrismaUser & {
  enrollments?: PrismaEnrollment[];
  isVerified?: boolean; // new field
  verificationToken?: string | null; // new field
  verificationTokenExpiry?: Date | null; // optional
};
