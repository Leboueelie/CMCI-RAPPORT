/*
  Warnings:

  - You are about to drop the column `dirigeant_id` on the `assemblees` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "assemblees" DROP CONSTRAINT "assemblees_dirigeant_id_fkey";

-- AlterTable
ALTER TABLE "assemblees" DROP COLUMN "dirigeant_id",
ADD COLUMN     "userId" TEXT;

-- CreateTable
CREATE TABLE "assemblee_dirigeants" (
    "assembleeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "assemblee_dirigeants_pkey" PRIMARY KEY ("assembleeId","userId")
);

-- AddForeignKey
ALTER TABLE "assemblees" ADD CONSTRAINT "assemblees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assemblee_dirigeants" ADD CONSTRAINT "assemblee_dirigeants_assembleeId_fkey" FOREIGN KEY ("assembleeId") REFERENCES "assemblees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assemblee_dirigeants" ADD CONSTRAINT "assemblee_dirigeants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
