-- AlterTable
ALTER TABLE "CatalogComponent" ADD COLUMN     "commitUrl" TEXT;

-- AlterTable
ALTER TABLE "CatalogArtifact" ADD COLUMN     "commitSha" TEXT;
