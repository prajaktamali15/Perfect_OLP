-- AlterTable
ALTER TABLE "public"."Enrollment" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "completedLessonIds" JSONB,
ADD COLUMN     "progress" INTEGER NOT NULL DEFAULT 0;
