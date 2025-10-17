-- CreateEnum
CREATE TYPE "public"."Difficulty" AS ENUM ('Beginner', 'Intermediate', 'Advanced');

-- AlterTable
ALTER TABLE "public"."Course" ADD COLUMN     "difficulty" "public"."Difficulty" NOT NULL DEFAULT 'Beginner',
ADD COLUMN     "duration" TEXT,
ADD COLUMN     "thumbnailUrl" TEXT;
