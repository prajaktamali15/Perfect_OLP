/*
  Warnings:

  - You are about to drop the `CoursePrerequisite` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."CoursePrerequisite" DROP CONSTRAINT "CoursePrerequisite_courseId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CoursePrerequisite" DROP CONSTRAINT "CoursePrerequisite_prerequisiteId_fkey";

-- AlterTable
ALTER TABLE "public"."Course" ADD COLUMN     "prerequisites" JSONB;

-- DropTable
DROP TABLE "public"."CoursePrerequisite";
