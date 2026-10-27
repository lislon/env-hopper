-- AlterTable
ALTER TABLE "CatalogArtifact" ADD COLUMN     "buildId" TEXT,
ADD COLUMN     "buildRepositoryKey" TEXT;

-- CreateTable
CREATE TABLE "CatalogRepository" (
    "key" TEXT NOT NULL,
    "name" TEXT,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatalogRepository_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "CatalogCommit" (
    "repositoryKey" TEXT NOT NULL,
    "sha" TEXT NOT NULL,
    "committedAt" TIMESTAMP(3),
    "author" TEXT,
    "changeRequestNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatalogCommit_pkey" PRIMARY KEY ("repositoryKey","sha")
);

-- CreateTable
CREATE TABLE "CatalogBuild" (
    "repositoryKey" TEXT NOT NULL,
    "buildId" TEXT NOT NULL,
    "sha" TEXT NOT NULL,
    "ref" TEXT,
    "refType" TEXT,
    "trigger" TEXT,
    "parentBuildId" TEXT,
    "outcome" TEXT,
    "finishedAt" TIMESTAMP(3),
    "url" TEXT,
    "triggeredBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatalogBuild_pkey" PRIMARY KEY ("repositoryKey","buildId")
);

-- CreateTable
CREATE TABLE "CatalogTag" (
    "repositoryKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sha" TEXT NOT NULL,
    "releaseTitle" TEXT,
    "createdAt" TIMESTAMP(3),
    "createdBy" TEXT,

    CONSTRAINT "CatalogTag_pkey" PRIMARY KEY ("repositoryKey","name")
);

-- CreateTable
CREATE TABLE "CatalogChangeRequest" (
    "repositoryKey" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "sourceBranch" TEXT,
    "targetBranch" TEXT,
    "mergeSha" TEXT,
    "mergedAt" TIMESTAMP(3),
    "author" TEXT,
    "mergedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatalogChangeRequest_pkey" PRIMARY KEY ("repositoryKey","number")
);

-- CreateTable
CREATE TABLE "CatalogChangeRequestWorkItem" (
    "repositoryKey" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "workItemKey" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "CatalogChangeRequestWorkItem_pkey" PRIMARY KEY ("repositoryKey","number","workItemKey")
);

-- CreateTable
CREATE TABLE "CatalogWorkItem" (
    "key" TEXT NOT NULL,
    "title" TEXT,
    "type" TEXT,
    "url" TEXT,
    "readAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogWorkItem_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "CatalogDeclaredVersion" (
    "repositoryKey" TEXT NOT NULL,
    "sha" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatalogDeclaredVersion_pkey" PRIMARY KEY ("repositoryKey","sha","type")
);

-- CreateIndex
CREATE INDEX "CatalogBuild_repositoryKey_sha_idx" ON "CatalogBuild"("repositoryKey", "sha");

-- CreateIndex
CREATE INDEX "CatalogTag_repositoryKey_sha_idx" ON "CatalogTag"("repositoryKey", "sha");

-- CreateIndex
CREATE INDEX "CatalogTag_repositoryKey_createdAt_idx" ON "CatalogTag"("repositoryKey", "createdAt");
