/*
  Warnings:

  - You are about to drop the `App` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DeployableService` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UIPage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UIPageGroup` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "DeployableService" DROP CONSTRAINT "DeployableService_appId_fkey";

-- DropForeignKey
ALTER TABLE "UIPage" DROP CONSTRAINT "UIPage_uiPageGroupId_fkey";

-- DropForeignKey
ALTER TABLE "UIPageGroup" DROP CONSTRAINT "UIPageGroup_appId_fkey";

-- DropTable
DROP TABLE "App";

-- DropTable
DROP TABLE "DeployableService";

-- DropTable
DROP TABLE "UIPage";

-- DropTable
DROP TABLE "UIPageGroup";

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "refreshToken" TEXT,
    "accessToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "idToken" TEXT,
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogEnvironment" (
    "slug" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "meta" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogEnvironment_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "CatalogApp" (
    "slug" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "leadComponentSlug" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogApp_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "CatalogComponent" (
    "slug" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "appSlug" TEXT,
    "externalIds" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogComponent_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "CatalogDeploymentTarget" (
    "slug" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "environmentSlug" TEXT,
    "meta" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogDeploymentTarget_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "CatalogRelease" (
    "key" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "tag" TEXT,
    "commitSha" TEXT,
    "author" TEXT,
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogRelease_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "CatalogArtifact" (
    "componentSlug" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "releaseKey" TEXT,
    "builtAt" TIMESTAMP(3),
    "buildUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogArtifact_pkey" PRIMARY KEY ("componentSlug","version")
);

-- CreateTable
CREATE TABLE "CatalogDeployment" (
    "componentSlug" TEXT NOT NULL,
    "targetSlug" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "deployedAt" TIMESTAMP(3),
    "deployedBy" TEXT,
    "deployUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogDeployment_pkey" PRIMARY KEY ("componentSlug","targetSlug")
);

-- CreateTable
CREATE TABLE "CatalogUser" (
    "username" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "email" TEXT,
    "provider" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogUser_pkey" PRIMARY KEY ("username")
);

-- CreateTable
CREATE TABLE "CatalogEndpoint" (
    "id" SERIAL NOT NULL,
    "componentSlug" TEXT NOT NULL,
    "targetSlug" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "label" TEXT,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogEndpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogHealth" (
    "componentSlug" TEXT NOT NULL,
    "targetSlug" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL,
    "checker" TEXT NOT NULL,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogHealth_pkey" PRIMARY KEY ("componentSlug","targetSlug")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "account_providerId_accountId_key" ON "account"("providerId", "accountId");

-- CreateIndex
CREATE UNIQUE INDEX "verification_identifier_value_key" ON "verification"("identifier", "value");

-- CreateIndex
CREATE INDEX "CatalogEnvironment_scope_idx" ON "CatalogEnvironment"("scope");

-- CreateIndex
CREATE INDEX "CatalogApp_scope_idx" ON "CatalogApp"("scope");

-- CreateIndex
CREATE INDEX "CatalogComponent_scope_idx" ON "CatalogComponent"("scope");

-- CreateIndex
CREATE INDEX "CatalogDeploymentTarget_scope_idx" ON "CatalogDeploymentTarget"("scope");

-- CreateIndex
CREATE INDEX "CatalogRelease_scope_idx" ON "CatalogRelease"("scope");

-- CreateIndex
CREATE INDEX "CatalogArtifact_componentSlug_builtAt_idx" ON "CatalogArtifact"("componentSlug", "builtAt");

-- CreateIndex
CREATE INDEX "CatalogArtifact_scope_idx" ON "CatalogArtifact"("scope");

-- CreateIndex
CREATE INDEX "CatalogDeployment_scope_idx" ON "CatalogDeployment"("scope");

-- CreateIndex
CREATE INDEX "CatalogUser_scope_idx" ON "CatalogUser"("scope");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogEndpoint_componentSlug_targetSlug_kind_url_key" ON "CatalogEndpoint"("componentSlug", "targetSlug", "kind", "url");

-- CreateIndex
CREATE INDEX "CatalogHealth_scope_idx" ON "CatalogHealth"("scope");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogComponent" ADD CONSTRAINT "CatalogComponent_appSlug_fkey" FOREIGN KEY ("appSlug") REFERENCES "CatalogApp"("slug") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogDeploymentTarget" ADD CONSTRAINT "CatalogDeploymentTarget_environmentSlug_fkey" FOREIGN KEY ("environmentSlug") REFERENCES "CatalogEnvironment"("slug") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogArtifact" ADD CONSTRAINT "CatalogArtifact_componentSlug_fkey" FOREIGN KEY ("componentSlug") REFERENCES "CatalogComponent"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogArtifact" ADD CONSTRAINT "CatalogArtifact_releaseKey_fkey" FOREIGN KEY ("releaseKey") REFERENCES "CatalogRelease"("key") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogDeployment" ADD CONSTRAINT "CatalogDeployment_deployedBy_fkey" FOREIGN KEY ("deployedBy") REFERENCES "CatalogUser"("username") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogDeployment" ADD CONSTRAINT "CatalogDeployment_componentSlug_fkey" FOREIGN KEY ("componentSlug") REFERENCES "CatalogComponent"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogDeployment" ADD CONSTRAINT "CatalogDeployment_targetSlug_fkey" FOREIGN KEY ("targetSlug") REFERENCES "CatalogDeploymentTarget"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogDeployment" ADD CONSTRAINT "CatalogDeployment_componentSlug_version_fkey" FOREIGN KEY ("componentSlug", "version") REFERENCES "CatalogArtifact"("componentSlug", "version") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogEndpoint" ADD CONSTRAINT "CatalogEndpoint_componentSlug_targetSlug_fkey" FOREIGN KEY ("componentSlug", "targetSlug") REFERENCES "CatalogDeployment"("componentSlug", "targetSlug") ON DELETE CASCADE ON UPDATE CASCADE;
