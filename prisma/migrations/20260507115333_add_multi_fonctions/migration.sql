/*
  Warnings:

  - You are about to drop the column `fonction` on the `membres` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "membres" DROP COLUMN "fonction";

-- DropEnum
DROP TYPE "FonctionMembre";

-- CreateTable
CREATE TABLE "Fonction" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,

    CONSTRAINT "Fonction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membre_fonctions" (
    "membreId" TEXT NOT NULL,
    "fonctionId" TEXT NOT NULL,

    CONSTRAINT "membre_fonctions_pkey" PRIMARY KEY ("membreId","fonctionId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Fonction_nom_key" ON "Fonction"("nom");

-- AddForeignKey
ALTER TABLE "membre_fonctions" ADD CONSTRAINT "membre_fonctions_membreId_fkey" FOREIGN KEY ("membreId") REFERENCES "membres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membre_fonctions" ADD CONSTRAINT "membre_fonctions_fonctionId_fkey" FOREIGN KEY ("fonctionId") REFERENCES "Fonction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
