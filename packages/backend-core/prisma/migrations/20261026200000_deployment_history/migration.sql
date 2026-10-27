-- CreateTable
CREATE TABLE "DeploymentHistory" (
    "id" SERIAL NOT NULL,
    "componentSlug" TEXT NOT NULL,
    "targetSlug" TEXT NOT NULL,
    "appSlug" TEXT,
    "envSlug" TEXT,
    "kind" TEXT NOT NULL,
    "version" TEXT,
    "previous" TEXT,
    "status" TEXT,
    "deployedAt" TIMESTAMP(3),
    "deployedBy" TEXT,
    "source" TEXT,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeploymentHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeploymentHistory_appSlug_envSlug_observedAt_idx" ON "DeploymentHistory"("appSlug", "envSlug", "observedAt");

-- CreateIndex
CREATE INDEX "DeploymentHistory_componentSlug_observedAt_idx" ON "DeploymentHistory"("componentSlug", "observedAt");
