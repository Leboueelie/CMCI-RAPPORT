-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "StatutMembre" ADD VALUE 'REPENTANT';
ALTER TYPE "StatutMembre" ADD VALUE 'BRISER';

-- AlterTable
ALTER TABLE "membres" ADD COLUMN     "date_brisement" TIMESTAMP(3),
ADD COLUMN     "date_repentance" TIMESTAMP(3);
