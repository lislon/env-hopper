-- AlterTable: the change request becomes a ChangeRequestRef; the next sync writes it again.
ALTER TABLE "CatalogArtifact" DROP COLUMN "changeRequest",
ADD COLUMN     "changeRequest" JSONB;
