/*
  Warnings:

  - The values [INACTIF,NOUVEAU,BAPTISE,DECEDE,DEMISSIONNE,REPENTANT,BRISER] on the enum `StatutMembre` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `adresse` on the `membres` table. All the data in the column will be lost.
  - You are about to drop the column `date_adhesion` on the `membres` table. All the data in the column will be lost.
  - You are about to drop the column `date_bapteme` on the `membres` table. All the data in the column will be lost.
  - You are about to drop the column `date_brisement` on the `membres` table. All the data in the column will be lost.
  - You are about to drop the column `date_repentance` on the `membres` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `membres` table. All the data in the column will be lost.
  - You are about to drop the column `lieu_naissance` on the `membres` table. All the data in the column will be lost.
  - You are about to drop the column `profession` on the `membres` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "StatutMembre_new" AS ENUM ('ACTIF', 'RETROGRADE');
ALTER TABLE "membres" ALTER COLUMN "statut" DROP DEFAULT;
ALTER TABLE "membres" ALTER COLUMN "statut" TYPE "StatutMembre_new" USING ("statut"::text::"StatutMembre_new");
ALTER TYPE "StatutMembre" RENAME TO "StatutMembre_old";
ALTER TYPE "StatutMembre_new" RENAME TO "StatutMembre";
DROP TYPE "StatutMembre_old";
ALTER TABLE "membres" ALTER COLUMN "statut" SET DEFAULT 'ACTIF';
COMMIT;

-- AlterTable
ALTER TABLE "membres" DROP COLUMN "adresse",
DROP COLUMN "date_adhesion",
DROP COLUMN "date_bapteme",
DROP COLUMN "date_brisement",
DROP COLUMN "date_repentance",
DROP COLUMN "email",
DROP COLUMN "lieu_naissance",
DROP COLUMN "profession",
ALTER COLUMN "statut" SET DEFAULT 'ACTIF';
