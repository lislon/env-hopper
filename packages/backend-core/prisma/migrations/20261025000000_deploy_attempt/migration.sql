-- CreateTable
CREATE TABLE "CatalogDeployAttempt" (
    "componentSlug" TEXT NOT NULL,
    "targetSlug" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "startedBy" TEXT,
    "deployUrl" TEXT,
    "jobUrl" TEXT,
    "ref" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogDeployAttempt_pkey" PRIMARY KEY ("componentSlug","targetSlug")
);

-- CreateIndex
CREATE INDEX "CatalogDeployAttempt_scope_idx" ON "CatalogDeployAttempt"("scope");

-- AddForeignKey
ALTER TABLE "CatalogDeployAttempt" ADD CONSTRAINT "CatalogDeployAttempt_startedBy_fkey" FOREIGN KEY ("startedBy") REFERENCES "CatalogUser"("username") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogDeployAttempt" ADD CONSTRAINT "CatalogDeployAttempt_componentSlug_fkey" FOREIGN KEY ("componentSlug") REFERENCES "CatalogComponent"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogDeployAttempt" ADD CONSTRAINT "CatalogDeployAttempt_targetSlug_fkey" FOREIGN KEY ("targetSlug") REFERENCES "CatalogDeploymentTarget"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogDeployAttempt" ADD CONSTRAINT "CatalogDeployAttempt_componentSlug_version_fkey" FOREIGN KEY ("componentSlug", "version") REFERENCES "CatalogArtifact"("componentSlug", "version") ON DELETE CASCADE ON UPDATE CASCADE;

