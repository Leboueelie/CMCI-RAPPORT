-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('DIRIGEANT_ASSEMBLEE', 'DIRIGEANT_ZONE', 'MISSIONNAIRE', 'RESPONSABLE_REGIONAL', 'RESPONSABLE_NATIONAL', 'ADMIN_SYSTEME');

-- CreateEnum
CREATE TYPE "NiveauTerritoire" AS ENUM ('SECTEUR', 'QUARTIER', 'VILLE', 'REGION', 'PAYS');

-- CreateEnum
CREATE TYPE "StatutRapport" AS ENUM ('BROUILLON', 'SOUMIS', 'REJETE', 'VALIDE');

-- CreateEnum
CREATE TYPE "StatutMembre" AS ENUM ('ACTIF', 'INACTIF', 'NOUVEAU', 'BAPTISE', 'DECEDE', 'DEMISSIONNE');

-- CreateEnum
CREATE TYPE "FonctionMembre" AS ENUM ('DIRIGEANT', 'SECRETAIRE', 'TRESORIER', 'ANIMATEUR', 'MEMBRE_SIMPLE');

-- CreateEnum
CREATE TYPE "TypeActionAudit" AS ENUM ('CONNEXION', 'DECONNEXION', 'CREATION', 'MODIFICATION', 'SUPPRESSION', 'VALIDATION', 'REJET', 'SOUMISSION');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "contact" TEXT,
    "prenom" TEXT,
    "nom" TEXT,
    "photo" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "must_change_password" BOOLEAN NOT NULL DEFAULT true,
    "date_joined" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login" TIMESTAMP(3),
    "territoire_id" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "territoires" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "niveau" "NiveauTerritoire" NOT NULL,
    "parent_id" TEXT,
    "contact" TEXT,
    "adresse" TEXT,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "territoires_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assemblees" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "territoire_id" TEXT NOT NULL,
    "dirigeant_id" TEXT,
    "contact" TEXT,
    "adresse" TEXT,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assemblees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membres" (
    "id" TEXT NOT NULL,
    "assemblee_id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "date_naissance" TIMESTAMP(3),
    "lieu_naissance" TEXT,
    "contact" TEXT,
    "email" TEXT,
    "adresse" TEXT,
    "profession" TEXT,
    "date_adhesion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_bapteme" TIMESTAMP(3),
    "statut" "StatutMembre" NOT NULL DEFAULT 'NOUVEAU',
    "fonction" "FonctionMembre" NOT NULL DEFAULT 'MEMBRE_SIMPLE',
    "photo" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "membres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rapports" (
    "id" TEXT NOT NULL,
    "assemblee_id" TEXT NOT NULL,
    "territoire_id" TEXT NOT NULL,
    "periode" TEXT NOT NULL,
    "date_debut" TIMESTAMP(3) NOT NULL,
    "date_fin" TIMESTAMP(3) NOT NULL,
    "activites" TEXT NOT NULL,
    "effectifs" INTEGER NOT NULL,
    "temoignages" TEXT,
    "problemes" TEXT,
    "besoins" TEXT,
    "recommandations" TEXT,
    "fichier_joint" TEXT,
    "statut" "StatutRapport" NOT NULL DEFAULT 'BROUILLON',
    "soumis_par_id" TEXT NOT NULL,
    "date_soumission" TIMESTAMP(3),
    "valide_par_id" TEXT,
    "date_validation" TIMESTAMP(3),
    "rejete_par_id" TEXT,
    "date_rejet" TIMESTAMP(3),
    "commentaire_rejet" TEXT,

    CONSTRAINT "rapports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "user_agent" TEXT,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" "TypeActionAudit" NOT NULL,
    "entite" TEXT NOT NULL,
    "entite_id" TEXT,
    "details" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "lien" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "territoires_niveau_idx" ON "territoires"("niveau");

-- CreateIndex
CREATE INDEX "territoires_parent_id_idx" ON "territoires"("parent_id");

-- CreateIndex
CREATE INDEX "membres_assemblee_id_idx" ON "membres"("assemblee_id");

-- CreateIndex
CREATE INDEX "membres_nom_prenom_idx" ON "membres"("nom", "prenom");

-- CreateIndex
CREATE INDEX "rapports_statut_idx" ON "rapports"("statut");

-- CreateIndex
CREATE INDEX "rapports_date_soumission_idx" ON "rapports"("date_soumission");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_hash_idx" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_territoire_id_fkey" FOREIGN KEY ("territoire_id") REFERENCES "territoires"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "territoires" ADD CONSTRAINT "territoires_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "territoires"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assemblees" ADD CONSTRAINT "assemblees_territoire_id_fkey" FOREIGN KEY ("territoire_id") REFERENCES "territoires"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assemblees" ADD CONSTRAINT "assemblees_dirigeant_id_fkey" FOREIGN KEY ("dirigeant_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membres" ADD CONSTRAINT "membres_assemblee_id_fkey" FOREIGN KEY ("assemblee_id") REFERENCES "assemblees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rapports" ADD CONSTRAINT "rapports_assemblee_id_fkey" FOREIGN KEY ("assemblee_id") REFERENCES "assemblees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rapports" ADD CONSTRAINT "rapports_territoire_id_fkey" FOREIGN KEY ("territoire_id") REFERENCES "territoires"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rapports" ADD CONSTRAINT "rapports_soumis_par_id_fkey" FOREIGN KEY ("soumis_par_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rapports" ADD CONSTRAINT "rapports_valide_par_id_fkey" FOREIGN KEY ("valide_par_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rapports" ADD CONSTRAINT "rapports_rejete_par_id_fkey" FOREIGN KEY ("rejete_par_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
