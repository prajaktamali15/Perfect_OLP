-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "duration" TEXT,
ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 1;
