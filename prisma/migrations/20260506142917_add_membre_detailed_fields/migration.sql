-- AlterTable
ALTER TABLE "membres" ADD COLUMN     "baptise_eau" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "baptise_saint_esprit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "faiseur_disciple" TEXT,
ADD COLUMN     "liens_brises" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "niveau_academique" TEXT,
ADD COLUMN     "nombre_enfants" INTEGER,
ADD COLUMN     "situation_matrimoniale" TEXT;
