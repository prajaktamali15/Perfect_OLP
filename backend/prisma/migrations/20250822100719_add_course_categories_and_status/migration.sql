-- CreateEnum
CREATE TYPE "public"."CourseStatus" AS ENUM ('PENDING', 'PUBLISHED', 'REJECTED');

-- AlterTable
ALTER TABLE "public"."Course" ADD COLUMN     "categoryId" INTEGER,
ADD COLUMN     "status" "public"."CourseStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "public"."Lesson" ADD COLUMN     "attachmentUrl" TEXT;

-- CreateTable
CREATE TABLE "public"."CourseCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "CourseCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CourseCategory_name_key" ON "public"."CourseCategory"("name");

-- AddForeignKey
ALTER TABLE "public"."Course" ADD CONSTRAINT "Course_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."CourseCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
