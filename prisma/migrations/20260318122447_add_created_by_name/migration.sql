-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "createdByName" TEXT;

-- AlterTable
ALTER TABLE "Place" ADD COLUMN     "createdByName" TEXT;

-- AlterTable
ALTER TABLE "PlanItem" ADD COLUMN     "createdByName" TEXT;

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "createdByName" TEXT;
